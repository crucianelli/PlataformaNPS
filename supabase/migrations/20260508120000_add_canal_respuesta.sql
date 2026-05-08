ALTER TABLE public.respuestas
  ADD COLUMN IF NOT EXISTS canal_respuesta TEXT NOT NULL DEFAULT 'mensaje'
  CHECK (canal_respuesta IN ('mensaje', 'llamado'));

CREATE INDEX IF NOT EXISTS idx_respuestas_canal_respuesta
  ON public.respuestas(canal_respuesta);
