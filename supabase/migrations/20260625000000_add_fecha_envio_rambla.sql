-- Agrega fecha_envio a respuestas: se guarda cuando regalo_estado cambia a 'enviado'.
-- Permite filtrar regalos facturados por Rambla por mes de despacho (distinto al mes de encuesta).
ALTER TABLE respuestas ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMPTZ;
