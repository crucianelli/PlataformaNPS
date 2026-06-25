-- Trigger: setea fecha_envio automáticamente cuando regalo_estado cambia,
-- sin importar el cliente que haga el UPDATE (dashboard, acción, migration, etc.)
CREATE OR REPLACE FUNCTION fn_set_fecha_envio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.regalo_estado = 'enviado' AND OLD.regalo_estado IS DISTINCT FROM 'enviado' THEN
    NEW.fecha_envio = NOW();
  END IF;
  IF NEW.regalo_estado = 'pendiente_envio' AND OLD.regalo_estado = 'enviado' THEN
    NEW.fecha_envio = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_respuestas_fecha_envio
BEFORE UPDATE ON respuestas
FOR EACH ROW
EXECUTE FUNCTION fn_set_fecha_envio();

-- Backfill: registros ya marcados como enviado usan fecha_seguimiento como aproximación
-- (es cuando ingresaron el tracking, que en la práctica coincide con el envío)
UPDATE respuestas
SET fecha_envio = fecha_seguimiento
WHERE regalo_estado = 'enviado'
  AND fecha_seguimiento IS NOT NULL
  AND fecha_envio IS NULL;
