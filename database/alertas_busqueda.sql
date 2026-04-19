-- Tabla para alertas de búsqueda (notificaciones cuando aparezcan artículos).
-- Ejecutar en PostgreSQL antes de usar POST /api/alertas-busqueda con DATABASE_URL.

CREATE TABLE IF NOT EXISTS alertas_busqueda (
  id BIGSERIAL PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  termino_busqueda TEXT NOT NULL,
  -- Cadena vacía = sin filtro de categoría en la alerta.
  categoria_id TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usuario_id, termino_busqueda, categoria_id)
);

CREATE INDEX IF NOT EXISTS alertas_busqueda_usuario_idx
  ON alertas_busqueda (usuario_id);
