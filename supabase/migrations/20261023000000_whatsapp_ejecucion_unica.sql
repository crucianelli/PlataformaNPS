-- =====================
-- WHATSAPP: un solo script por envío, y saber si sigue vivo
-- =====================
--
-- El problema: "Detener" solo marcaba el job como interrumpido, y el script se
-- enteraba recién al terminar el contacto en curso (con la pausa larga en el
-- medio, varios minutos). Mientras tanto la pantalla ya ofrecía "Reanudar". Si
-- se apretaba, arrancaba un segundo script, que volvía a poner el job en
-- progreso; el primero, al chequear, lo veía en progreso y seguía de largo. Dos
-- scripts manejando el mismo mouse y el mismo teclado.
--
-- La solución: el job tiene dueño. Cada corrida del script se presenta con un id
-- propio (`ejecucion_id`) y da señales de vida cada pocos segundos
-- (`ultima_senal_at`). Mientras el dueño esté vivo, nadie más puede tomar el job.
-- Si el script muere sin avisar (se cortó la luz, se mató el proceso), deja de
-- dar señales y al minuto el job se puede retomar.
--
-- La lógica vive acá y no en la app porque la usan dos clientes distintos: la
-- versión de `mensajes.py` de producción habla directo con Supabase, y la de la
-- migración self-hosted pasa por los endpoints de la plataforma. Además "¿está
-- vivo?" tiene que medirse con un solo reloj: el de la base. El de la VPS no
-- tiene NTP y el de la PC del operador es otro.
--
-- Re-ejecutable: se aplica en staging y después otra vez en el cutover.

ALTER TABLE envios_whatsapp_jobs
  ADD COLUMN IF NOT EXISTS ejecucion_id    UUID,
  ADD COLUMN IF NOT EXISTS ultima_senal_at TIMESTAMPTZ;

COMMENT ON COLUMN envios_whatsapp_jobs.ejecucion_id IS
  'Corrida de mensajes.py que tiene tomado el job. NULL = nadie.';
COMMENT ON COLUMN envios_whatsapp_jobs.ultima_senal_at IS
  'Última señal de vida del script que tiene tomado el job.';

-- ─── ¿Hay un script vivo con este job? ───────────────────────────────────────
--
-- Recibe la fila entera para que PostgREST lo exponga como columna calculada
-- (`select=*,script_activo`). El script da señales cada ~5s y como mucho pasa
-- ~20s sin darlas (mientras pega y manda un mensaje), así que 60s sin noticias
-- es que se murió.

CREATE OR REPLACE FUNCTION script_activo(j envios_whatsapp_jobs)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT j.ejecucion_id IS NOT NULL
     AND j.ultima_senal_at > now() - interval '60 seconds'
$$;

-- ─── El script toma el job al arrancar ───────────────────────────────────────
--
--   'ok'             → es suyo, puede mandar.
--   'ocupado'        → otra corrida viva lo tiene: no tiene que hacer nada.
--   'sin_pendientes' → no queda nadie a quien mandarle. El job queda completado.
--   'no_existe'

CREATE OR REPLACE FUNCTION whatsapp_tomar_job(p_job_id uuid, p_ejecucion_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  j envios_whatsapp_jobs;
BEGIN
  -- FOR UPDATE: dos clics seguidos en "Ejecutar" abren dos scripts casi a la
  -- vez. Sin el lock, los dos verían el job libre y lo tomarían.
  SELECT * INTO j FROM envios_whatsapp_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'no_existe';
  END IF;

  IF script_activo(j) AND j.ejecucion_id <> p_ejecucion_id THEN
    RETURN 'ocupado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM envios_whatsapp_detalle
     WHERE job_id = p_job_id AND estado = 'pendiente'
  ) THEN
    UPDATE envios_whatsapp_jobs
       SET estado       = 'completado',
           ejecucion_id = NULL,
           completed_at = coalesce(completed_at, now())
     WHERE id = p_job_id;
    RETURN 'sin_pendientes';
  END IF;

  UPDATE envios_whatsapp_jobs
     SET estado          = 'en_progreso',
         ejecucion_id    = p_ejecucion_id,
         ultima_senal_at = now(),
         -- coalesce: al retomar un job cortado se conserva el arranque original.
         started_at      = coalesce(started_at, now()),
         completed_at    = NULL
   WHERE id = p_job_id;
  RETURN 'ok';
END;
$$;

-- ─── Señal de vida ───────────────────────────────────────────────────────────
--
-- El script la manda cada pocos segundos, también durante las esperas. La
-- respuesta le dice si sigue:
--
--   'seguir'
--   'detenido'    → lo frenaron desde la plataforma.
--   'reemplazado' → otra corrida tomó el job porque dio a esta por muerta.
--                   Tiene que cortar sin tocar nada más.

CREATE OR REPLACE FUNCTION whatsapp_senal_job(p_job_id uuid, p_ejecucion_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_estado text;
BEGIN
  UPDATE envios_whatsapp_jobs
     SET ultima_senal_at = now()
   WHERE id = p_job_id AND ejecucion_id = p_ejecucion_id
  RETURNING estado INTO v_estado;

  IF NOT FOUND THEN
    RETURN 'reemplazado';
  END IF;
  IF v_estado = 'en_progreso' THEN
    RETURN 'seguir';
  END IF;
  RETURN 'detenido';
END;
$$;

-- ─── El script suelta el job al salir, por la razón que sea ─────────────────
--
-- El estado final sale de los datos, no de lo que el script cree: 'completado'
-- solo si no quedó ningún contacto pendiente. Así un envío detenido a la mitad
-- no puede figurar como completado, y uno detenido justo en el último mensaje
-- no queda como interrumpido para siempre.
--
-- De paso recuenta los contadores desde las filas, que es lo que valen.
-- Si el job ya es de otra corrida, no lo toca. Devuelve el estado que quedó.

CREATE OR REPLACE FUNCTION whatsapp_soltar_job(p_job_id uuid, p_ejecucion_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  j            envios_whatsapp_jobs;
  v_pendientes int;
  v_enviados   int;
  v_errores    int;
  v_estado     text;
BEGIN
  SELECT * INTO j FROM envios_whatsapp_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  IF j.ejecucion_id IS DISTINCT FROM p_ejecucion_id THEN
    RETURN j.estado;
  END IF;

  SELECT count(*) FILTER (WHERE estado = 'pendiente'),
         count(*) FILTER (WHERE estado = 'enviado'),
         count(*) FILTER (WHERE estado = 'error')
    INTO v_pendientes, v_enviados, v_errores
    FROM envios_whatsapp_detalle
   WHERE job_id = p_job_id;

  v_estado := CASE WHEN v_pendientes = 0 THEN 'completado' ELSE 'interrumpido' END;

  UPDATE envios_whatsapp_jobs
     SET estado       = v_estado,
         ejecucion_id = NULL,
         enviados     = v_enviados,
         errores      = v_errores,
         completed_at = now()
   WHERE id = p_job_id;
  RETURN v_estado;
END;
$$;

-- ─── Permisos (solo en Supabase) ─────────────────────────────────────────────
--
-- Supabase expone toda función de `public` por `/rest/v1/rpc/`, y por default
-- las puede ejecutar `anon` — o sea, cualquiera con la anon key, que es pública.
-- Tomar, señalar y soltar jobs es cosa del script, que usa `service_role`.
-- `script_activo` queda abierta: es de solo lectura y la pantalla del job la
-- pide con la sesión del usuario.
--
-- En el Postgres self-hosted esos roles no existen y no hace falta nada: la app
-- se conecta con su propio usuario.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    REVOKE EXECUTE ON FUNCTION whatsapp_tomar_job(uuid, uuid)  FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON FUNCTION whatsapp_senal_job(uuid, uuid)  FROM PUBLIC, anon, authenticated;
    REVOKE EXECUTE ON FUNCTION whatsapp_soltar_job(uuid, uuid) FROM PUBLIC, anon, authenticated;
    GRANT  EXECUTE ON FUNCTION whatsapp_tomar_job(uuid, uuid)  TO service_role;
    GRANT  EXECUTE ON FUNCTION whatsapp_senal_job(uuid, uuid)  TO service_role;
    GRANT  EXECUTE ON FUNCTION whatsapp_soltar_job(uuid, uuid) TO service_role;
  END IF;
END;
$$;

-- Que PostgREST (Supabase) vea ya la columna calculada `script_activo`. Sin
-- nadie escuchando, como en el Postgres self-hosted, no hace nada.
NOTIFY pgrst, 'reload schema';
