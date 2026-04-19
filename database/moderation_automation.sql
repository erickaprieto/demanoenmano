-- Moderación automática (Supabase / Postgres).
-- Ejecutar después de user_reports.sql en bases existentes.

ALTER TABLE user_reports
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE user_reports
  ADD COLUMN IF NOT EXISTS auto_scan_hit_count INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS user_moderation_state (
  user_id TEXT PRIMARY KEY,
  flagged BOOLEAN NOT NULL DEFAULT true,
  shadow_banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_moderation_state_flagged_idx
  ON user_moderation_state (flagged) WHERE flagged = true;

CREATE TABLE IF NOT EXISTS admin_moderation_alerts (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT NOT NULL,
  chat_log_url TEXT NOT NULL,
  reported_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  context_chat_id TEXT,
  auto_scan_hit_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS admin_moderation_alerts_created_idx
  ON admin_moderation_alerts (created_at DESC);

-- RPC opcional para Edge Functions / triggers en Supabase.
CREATE OR REPLACE FUNCTION public.shadow_ban_user(p_user_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_moderation_state (user_id, flagged)
  VALUES (p_user_id, true)
  ON CONFLICT (user_id) DO UPDATE
    SET flagged = true, shadow_banned_at = NOW();
END;
$$;

COMMENT ON FUNCTION public.shadow_ban_user(TEXT) IS
  'Marca usuario como flagged. Ocultar productos del feed: actualizar tu tabla de listados según seller_id = p_user_id.';
