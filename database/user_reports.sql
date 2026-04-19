-- Supabase: reportes de usuarios (moderación de comunidad).

CREATE TABLE IF NOT EXISTS user_reports (
  id BIGSERIAL PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  reported_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  comments TEXT,
  context_chat_id TEXT,
  severity TEXT NOT NULL DEFAULT 'standard',
  auto_scan_hit_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_reports_reported_idx ON user_reports (reported_id);
CREATE INDEX IF NOT EXISTS user_reports_reporter_idx ON user_reports (reporter_id);
CREATE INDEX IF NOT EXISTS user_reports_created_idx ON user_reports (created_at DESC);

COMMENT ON TABLE user_reports IS
  'Reportes desde chat, perfil u otras vistas; context_chat_id opcional.';
