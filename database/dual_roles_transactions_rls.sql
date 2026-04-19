-- Roles duales (un user_id compra y vende) + transacciones + guía RLS (Supabase/Postgres).
-- Requiere tabla `profiles` (ver profiles_legal.sql).

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cedula TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS iban_account TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS identity_photo_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified_seller BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shipping_address JSONB;

COMMENT ON COLUMN profiles.shipping_address IS
  'JSONB: provincia, canton, distrito, codigo_postal, direccion_exacta. Solo el vendedor asociado a una transacción PAGADO debe verlo (vista/RPC, no SELECT libre).';

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  buyer_id TEXT NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PENDIENTE_PAGO', 'PAGADO', 'ENVIADO', 'COMPLETADO', 'CANCELADO')),
  amount_colones BIGINT NOT NULL DEFAULT 0,
  title TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_seller_idx ON transactions (seller_id);
CREATE INDEX IF NOT EXISTS transactions_buyer_idx ON transactions (buyer_id);
CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions (status);

COMMENT ON TABLE transactions IS
  'Blindaje: el vendedor obtiene shipping_address / full_name / phone del comprador únicamente cuando status = PAGADO (implementar con RLS + vista o RPC get_buyer_logistics_for_seller).';

/*
-- Ejemplo RLS (ajustar auth.uid() a tu modelo JWT de Supabase):

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_own_read ON profiles FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY transactions_party_read ON transactions FOR SELECT
  USING (auth.uid()::text = seller_id OR auth.uid()::text = buyer_id);

-- Vista segura para vendedor post-pago:
CREATE OR REPLACE VIEW seller_visible_buyer_logistics AS
SELECT
  t.id AS transaction_id,
  t.seller_id,
  t.buyer_id,
  p.full_name,
  p.phone,
  p.shipping_address
FROM transactions t
JOIN profiles p ON p.id = t.buyer_id
WHERE t.status = 'PAGADO';

CREATE POLICY seller_reads_paid_buyer ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.buyer_id = profiles.id
        AND t.seller_id = auth.uid()::text
        AND t.status = 'PAGADO'
    )
  );
*/
