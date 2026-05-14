-- Corrige campañas activas que ya tienen todas sus encuestas cerradas
-- (respondida o sin_respuesta) y por lo tanto 0 pendientes.
UPDATE campanas
SET estado = 'completada'
WHERE estado = 'activa'
  AND id IN (
    SELECT campana_id
    FROM encuestas
    GROUP BY campana_id
    HAVING COUNT(*) > 0
      AND COUNT(*) = COUNT(*) FILTER (WHERE estado IN ('respondida', 'sin_respuesta'))
  );
