-- ── Enum ──────────────────────────────────────────────────────────
CREATE TYPE notificacion_tipo AS ENUM (
  'nps_critico',
  'nueva_respuesta',
  'regalo_pendiente',
  'campana_sin_actividad'
);

-- ── Tabla ─────────────────────────────────────────────────────────
CREATE TABLE notificaciones (
  id         UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo       notificacion_tipo NOT NULL,
  titulo     TEXT             NOT NULL,
  mensaje    TEXT             NOT NULL,
  leida      BOOLEAN          NOT NULL DEFAULT false,
  para_rol   TEXT             NOT NULL CHECK (para_rol IN ('admin', 'rambla')),
  metadata   JSONB,
  created_at TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE INDEX idx_notificaciones_para_rol_leida ON notificaciones(para_rol, leida);
CREATE INDEX idx_notificaciones_created_at     ON notificaciones(created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notificaciones_select_authenticated"
ON notificaciones FOR SELECT TO authenticated USING (true);

CREATE POLICY "notificaciones_insert_authenticated"
ON notificaciones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "notificaciones_update_authenticated"
ON notificaciones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ── Función: campaña sin actividad ────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_campanas_sin_actividad()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  dias_sin_actividad CONSTANT INT := 7;
  campana RECORD;
BEGIN
  FOR campana IN
    SELECT c.id, c.nombre
    FROM campanas c
    WHERE c.estado = 'activa'
      AND EXISTS (
        SELECT 1 FROM encuestas e
        WHERE e.campana_id = c.id
          AND e.estado NOT IN ('respondida', 'sin_respuesta')
      )
      AND NOT EXISTS (
        SELECT 1
        FROM respuestas r
        JOIN encuestas e ON r.encuesta_id = e.id
        WHERE e.campana_id = c.id
          AND r.fecha_respuesta > now() - (dias_sin_actividad || ' days')::interval
      )
      AND NOT EXISTS (
        SELECT 1 FROM notificaciones n
        WHERE n.tipo = 'campana_sin_actividad'
          AND (n.metadata->>'campana_id') = c.id::text
          AND n.created_at > now() - interval '24 hours'
      )
  LOOP
    INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, metadata)
    VALUES (
      'campana_sin_actividad',
      'Campaña sin actividad',
      'La campaña "' || campana.nombre || '" lleva más de ' || dias_sin_actividad || ' días sin nuevas respuestas.',
      'admin',
      jsonb_build_object('campana_id', campana.id::text, 'campana_nombre', campana.nombre)
    );
  END LOOP;
END;
$$;

-- ── Cron: revisión diaria a las 9 AM UTC ─────────────────────────
DO $outer$
DECLARE
  existing_job_id bigint;
BEGIN
  SELECT jobid INTO existing_job_id
  FROM cron.job
  WHERE jobname = 'check-campanas-sin-actividad'
  LIMIT 1;

  IF existing_job_id IS NOT NULL THEN
    PERFORM cron.unschedule(existing_job_id);
  END IF;

  PERFORM cron.schedule(
    'check-campanas-sin-actividad',
    '0 9 * * *',
    'SELECT public.check_campanas_sin_actividad();'
  );
END;
$outer$;
