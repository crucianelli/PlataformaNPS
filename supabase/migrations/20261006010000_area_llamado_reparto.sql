-- Cambia la regla de reparto de 20261006000000_area_llamado.sql.
--
-- Antes: cada OF iba al área con menos OF asignadas en total, contando todo el
-- historial. Después de un ajuste manual (se le sacaron OF a Posventa) eso hacía
-- que las siguientes OF fueran todas a Posventa hasta emparejar.
--
-- Ahora: el reparto cuenta solo desde que se aplica esta migración, con un
-- contador por área en `area_llamado_reparto`. Cada OF nueva va al área con el
-- contador más bajo (empate → al azar). Los ajustes manuales de `area_llamado` no
-- tocan el contador, así que no se "compensan" después.
--
-- Re-ejecutable: no resetea los contadores si ya existen.

BEGIN;

CREATE TABLE IF NOT EXISTS public.area_llamado_reparto (
  area       public.area_llamado PRIMARY KEY,
  asignadas  integer NOT NULL DEFAULT 0
);

-- Solo la toca el trigger (SECURITY DEFINER). Sin policies: nadie la lee por la API.
ALTER TABLE public.area_llamado_reparto ENABLE ROW LEVEL SECURITY;

INSERT INTO public.area_llamado_reparto (area)
SELECT unnest(enum_range(NULL::public.area_llamado))
ON CONFLICT (area) DO NOTHING;

CREATE OR REPLACE FUNCTION public.asignar_area_llamado()
RETURNS trigger
LANGUAGE plpgsql
-- SECURITY DEFINER para que funcione aunque el UPDATE lo haga un rol con RLS
-- (en Supabase).
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.estado = 'necesidad_de_llamado' AND NEW.area_llamado IS NULL THEN
    -- Serializa las asignaciones concurrentes para que dos transacciones no lean
    -- el mismo contador y elijan la misma área.
    PERFORM pg_advisory_xact_lock(hashtext('asignar_area_llamado'));

    SELECT area INTO NEW.area_llamado
    FROM public.area_llamado_reparto
    ORDER BY asignadas, random()
    LIMIT 1;

    UPDATE public.area_llamado_reparto
    SET asignadas = asignadas + 1
    WHERE area = NEW.area_llamado;
  END IF;

  RETURN NEW;
END;
$$;

COMMIT;
