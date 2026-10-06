-- Reparte las OF en necesidad de llamado entre tres áreas: MKT de Producto,
-- Comercial y Posventa. Cada área llama a las suyas desde el tablero de /llamados.
--
-- El reparto es aleatorio pero equitativo: cada OF va al área que menos OF tiene
-- asignadas en total (históricas incluidas, respondidas o no), y si hay empate se
-- elige al azar entre las empatadas. Así las tres áreas reciben la misma cantidad
-- de OF a lo largo del tiempo, con diferencia máxima de una.
--
-- Se asigna con un trigger y no desde la app porque hay más de un camino que pone
-- una encuesta en `necesidad_de_llamado` (la sync de la app, la función SQL del
-- cron y la reversión desde `sin_respuesta`). El trigger los cubre a todos.
--
-- Una vez asignada, el área no cambia: si la OF pasa a `sin_respuesta` y se la
-- revierte, vuelve a la misma columna. Al responderse, sale del tablero sola porque
-- el tablero solo muestra `necesidad_de_llamado`.
--
-- Re-ejecutable: guardas por existencia en el tipo, la columna, el índice y el
-- trigger, y el backfill solo toca filas sin área.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'area_llamado') THEN
    CREATE TYPE public.area_llamado AS ENUM ('mkt_producto', 'comercial', 'posventa');
  END IF;
END $$;

ALTER TABLE public.encuestas
  ADD COLUMN IF NOT EXISTS area_llamado public.area_llamado;

CREATE INDEX IF NOT EXISTS idx_encuestas_area_llamado
  ON public.encuestas (area_llamado)
  WHERE area_llamado IS NOT NULL;

CREATE OR REPLACE FUNCTION public.asignar_area_llamado()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY DEFINER para que el conteo vea todas las filas aunque el UPDATE lo
-- haga un rol con RLS (en Supabase).
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'necesidad_de_llamado' AND NEW.area_llamado IS NULL THEN
    -- Serializa las asignaciones concurrentes para que dos transacciones no lean
    -- el mismo conteo y elijan la misma área. Dentro de un mismo UPDATE masivo no
    -- hace falta: un trigger BEFORE ROW ya ve las filas que el UPDATE procesó antes.
    PERFORM pg_advisory_xact_lock(hashtext('asignar_area_llamado'));

    SELECT a.area INTO NEW.area_llamado
    FROM unnest(enum_range(NULL::public.area_llamado)) AS a(area)
    LEFT JOIN public.encuestas e ON e.area_llamado = a.area
    GROUP BY a.area
    ORDER BY count(e.id), random()
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_asignar_area_llamado ON public.encuestas;
CREATE TRIGGER trg_asignar_area_llamado
  BEFORE INSERT OR UPDATE OF estado ON public.encuestas
  FOR EACH ROW
  EXECUTE FUNCTION public.asignar_area_llamado();

-- Backfill: las OF que ya estaban en necesidad de llamado. `SET estado = estado`
-- no cambia el estado pero dispara el trigger (es UPDATE OF estado), que las
-- reparte con la misma regla. Dentro del mismo UPDATE cada fila ve las asignadas
-- antes, así que el reparto queda parejo.
UPDATE public.encuestas
SET estado = estado
WHERE estado = 'necesidad_de_llamado' AND area_llamado IS NULL;

COMMIT;
