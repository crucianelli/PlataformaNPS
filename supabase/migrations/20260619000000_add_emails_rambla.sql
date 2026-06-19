-- Agrega columna para emails de notificación de Rambla (despacho de regalos)
ALTER TABLE system_config ADD COLUMN IF NOT EXISTS emails_rambla text[] NOT NULL DEFAULT '{}';
