-- Supabase / PostgreSQL: columna JSONB para respuestas del cuestionario de publicación.
-- Ajustá el nombre de tabla si tu esquema difiere (p. ej. publicaciones).

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS ficha_tecnica jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN productos.ficha_tecnica IS
  'Respuestas Sí/No y tags del cuestionario de verificación del vendedor (por categoría).';
