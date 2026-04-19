-- Fragmento y snapshot de chat en reportes (ejecutar en Postgres / Supabase existente).

ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS chat_snippet TEXT;
ALTER TABLE user_reports ADD COLUMN IF NOT EXISTS chat_snapshot_json TEXT;

COMMENT ON COLUMN user_reports.chat_snippet IS
  'Resumen legible de los últimos mensajes al momento del reporte (perspectiva reportante/reportado).';
COMMENT ON COLUMN user_reports.chat_snapshot_json IS
  'JSON: array de { from: reportante|reportado, body, at } — uso exclusivo panel admin, tamaño acotado en app.';
