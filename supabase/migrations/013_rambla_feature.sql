-- Enum para estado del regalo (pendiente de envío o enviado)
CREATE TYPE regalo_estado AS ENUM ('pendiente_envio', 'enviado');

-- Columna regalo_estado en respuestas — default: pendiente_envio al registrarse
ALTER TABLE respuestas
  ADD COLUMN regalo_estado regalo_estado NOT NULL DEFAULT 'pendiente_envio';

-- Índice para filtrar/contar por estado rápidamente
CREATE INDEX idx_respuestas_regalo_estado ON respuestas(regalo_estado);

-- RLS: usuarios autenticados pueden actualizar respuestas (admin y rambla necesitan
-- poder cambiar regalo_estado; server actions con service_role igualmente bypass esto)
CREATE POLICY "respuestas_update_authenticated"
ON respuestas FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);
