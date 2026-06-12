-- Número de seguimiento del envío (ingresado manualmente por Rambla)
-- y timestamp de cuándo se cargó ese número
ALTER TABLE respuestas
  ADD COLUMN numero_seguimiento text,
  ADD COLUMN fecha_seguimiento timestamptz;
