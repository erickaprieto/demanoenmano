-- Perfiles legales / cumplimiento Términos (Supabase / Postgres).

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  strikes_envio INT NOT NULL DEFAULT 0,
  is_permanently_banned BOOLEAN NOT NULL DEFAULT false,
  temp_ban_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS profiles_banned_idx
  ON profiles (is_permanently_banned) WHERE is_permanently_banned = true;

COMMENT ON COLUMN profiles.strikes_envio IS
  'Incumplimientos de plazo de guía Correos (máx. 3 → baneo permanente).';
