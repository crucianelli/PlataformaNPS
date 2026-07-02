-- =====================
-- TABLA: tipos_encuesta
-- =====================

CREATE TABLE tipos_encuesta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  activo      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tipos_encuesta (nombre, slug) VALUES
  ('Inicio de Garantía', 'inicio_garantia'),
  ('Fin de Garantía',    'fin_garantia');

-- =====================
-- VINCULAR campanas → tipos_encuesta
-- =====================

ALTER TABLE campanas
  ADD COLUMN tipo_encuesta_id UUID REFERENCES tipos_encuesta(id);

-- Backfill: todas las campañas existentes son de inicio de garantía
UPDATE campanas
  SET tipo_encuesta_id = (SELECT id FROM tipos_encuesta WHERE slug = 'inicio_garantia');

ALTER TABLE campanas
  ALTER COLUMN tipo_encuesta_id SET NOT NULL;

CREATE INDEX idx_campanas_tipo_encuesta ON campanas(tipo_encuesta_id);

-- =====================
-- COLUMNAS fin de garantía en respuestas
-- =====================

ALTER TABLE respuestas
  ADD COLUMN calificacion_funcionamiento_anual  SMALLINT CHECK (calificacion_funcionamiento_anual BETWEEN 1 AND 10),
  ADD COLUMN tuvo_problemas_tecnicos            BOOLEAN,
  ADD COLUMN calificacion_resolucion_problemas  SMALLINT CHECK (calificacion_resolucion_problemas BETWEEN 1 AND 10),
  ADD COLUMN comentario_problemas               TEXT;

-- =====================
-- RLS: tipos_encuesta
-- =====================

ALTER TABLE tipos_encuesta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tipos_encuesta_select_authenticated"
ON tipos_encuesta FOR SELECT TO authenticated
USING (true);

-- Solo service_role puede insertar/modificar (via migrations)
