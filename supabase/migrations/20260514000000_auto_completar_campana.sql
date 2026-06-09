-- =====================
-- FUNCIÓN + TRIGGER: completar campaña cuando todas las encuestas están cerradas
-- Una encuesta está "cerrada" si su estado es 'respondida' o 'sin_respuesta'.
-- =====================

CREATE OR REPLACE FUNCTION fn_auto_completar_campana()
RETURNS TRIGGER AS $$
DECLARE
  v_total    INT;
  v_cerradas INT;
BEGIN
  -- Solo actuar cuando el estado nuevo es un estado "cerrado"
  IF NEW.estado NOT IN ('respondida', 'sin_respuesta') THEN
    RETURN NEW;
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE estado IN ('respondida', 'sin_respuesta'))
  INTO v_total, v_cerradas
  FROM encuestas
  WHERE campana_id = NEW.campana_id;

  -- Si todas las encuestas están cerradas, marcar la campaña como completada
  -- (solo si sigue activa, para no pisar 'archivada')
  IF v_total > 0 AND v_total = v_cerradas THEN
    UPDATE campanas
    SET estado = 'completada'
    WHERE id = NEW.campana_id
      AND estado = 'activa';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_auto_completar_campana
AFTER UPDATE OF estado ON encuestas
FOR EACH ROW
EXECUTE FUNCTION fn_auto_completar_campana();
