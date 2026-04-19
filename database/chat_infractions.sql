-- Supabase: infracciones de moderación de chat por conversación y usuario.
-- Ajustá tipos y FK según tu esquema (auth.users, conversaciones, etc.).

CREATE TABLE IF NOT EXISTS chat_infractions (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  intento_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  categoria_detectada TEXT NOT NULL,
  fragmento_redactado TEXT
);

CREATE INDEX IF NOT EXISTS chat_infractions_conv_user_idx
  ON chat_infractions (conversation_id, usuario_id, intento_en DESC);

COMMENT ON TABLE chat_infractions IS
  'Auditoría de intentos bloqueados; el cliente puede agregar un contador materializado o lógica en edge function.';
