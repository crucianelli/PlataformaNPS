-- ── Tabla: registro de fallos de envío de email ──────────────────
-- Cada vez que sendEmail() falla (SMTP caído, credenciales inválidas, etc.)
-- se registra acá para que quede visible en el dashboard en vez de perderse
-- en los logs del contenedor.
CREATE TABLE email_errores (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatarios TEXT[]      NOT NULL DEFAULT '{}',
  asunto        TEXT        NOT NULL,
  error_mensaje TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_errores_created_at ON email_errores(created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────
ALTER TABLE email_errores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_errores_select_authenticated"
ON email_errores FOR SELECT TO authenticated USING (true);
