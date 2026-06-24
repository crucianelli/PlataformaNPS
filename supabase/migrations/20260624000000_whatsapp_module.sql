-- =====================
-- MÓDULO WHATSAPP
-- Plantillas de mensaje, jobs de envío y tracking individual
-- =====================

-- ─── plantillas_whatsapp ────────────────────────────────────────────────────

CREATE TABLE plantillas_whatsapp (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       TEXT        NOT NULL,
  tipo         TEXT        NOT NULL CHECK (tipo IN ('inicial', 'recordatorio', 'personalizado')),
  lineas       TEXT[]      NOT NULL DEFAULT '{}',
  ruta_imagen  TEXT,
  activa       BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plantillas_whatsapp_tipo   ON plantillas_whatsapp(tipo);
CREATE INDEX idx_plantillas_whatsapp_activa ON plantillas_whatsapp(activa);

-- ─── envios_whatsapp_jobs ────────────────────────────────────────────────────

CREATE TABLE envios_whatsapp_jobs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  campana_id       UUID        NOT NULL REFERENCES campanas(id) ON DELETE RESTRICT,
  plantilla_id     UUID        NOT NULL REFERENCES plantillas_whatsapp(id) ON DELETE RESTRICT,
  estado           TEXT        NOT NULL DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente', 'en_progreso', 'completado', 'error', 'interrumpido')),
  total_contactos  INT         NOT NULL DEFAULT 0,
  enviados         INT         NOT NULL DEFAULT 0,
  errores          INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_whatsapp_jobs_campana ON envios_whatsapp_jobs(campana_id);
CREATE INDEX idx_whatsapp_jobs_estado  ON envios_whatsapp_jobs(estado);

-- ─── envios_whatsapp_detalle ─────────────────────────────────────────────────

CREATE TABLE envios_whatsapp_detalle (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID        NOT NULL REFERENCES envios_whatsapp_jobs(id) ON DELETE CASCADE,
  encuesta_id      UUID        NOT NULL REFERENCES encuestas(id) ON DELETE RESTRICT,
  celular          TEXT        NOT NULL,
  nombre           TEXT        NOT NULL,
  url_encuesta     TEXT        NOT NULL,
  estado           TEXT        NOT NULL DEFAULT 'pendiente'
                               CHECK (estado IN ('pendiente', 'enviado', 'error')),
  enviado_at       TIMESTAMPTZ,
  error_mensaje    TEXT
);

CREATE INDEX idx_whatsapp_detalle_job    ON envios_whatsapp_detalle(job_id);
CREATE INDEX idx_whatsapp_detalle_estado ON envios_whatsapp_detalle(estado);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE plantillas_whatsapp    ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios_whatsapp_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios_whatsapp_detalle ENABLE ROW LEVEL SECURITY;

-- plantillas_whatsapp: solo admin autenticado
CREATE POLICY "plantillas_wa_select" ON plantillas_whatsapp FOR SELECT TO authenticated USING (true);
CREATE POLICY "plantillas_wa_insert" ON plantillas_whatsapp FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "plantillas_wa_update" ON plantillas_whatsapp FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "plantillas_wa_delete" ON plantillas_whatsapp FOR DELETE TO authenticated USING (true);

-- envios_whatsapp_jobs: solo admin autenticado
CREATE POLICY "wa_jobs_select" ON envios_whatsapp_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "wa_jobs_insert" ON envios_whatsapp_jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wa_jobs_update" ON envios_whatsapp_jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- envios_whatsapp_detalle: solo admin autenticado
CREATE POLICY "wa_detalle_select" ON envios_whatsapp_detalle FOR SELECT TO authenticated USING (true);
CREATE POLICY "wa_detalle_insert" ON envios_whatsapp_detalle FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "wa_detalle_update" ON envios_whatsapp_detalle FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ─── SEED: plantillas desde mensajes.py ──────────────────────────────────────

INSERT INTO plantillas_whatsapp (nombre, tipo, lineas, ruta_imagen) VALUES (
  'Envío inicial — Merch',
  'inicial',
  ARRAY[
    '¡Hola {nombre}! 👋',
    '',
    'En Crucianelli valoramos tu garra y tu experiencia en el campo 🚜. ¡Por eso queremos premiarte! 🎁',
    '',
    'Completa nuestra breve encuesta de satisfaccion y *llevate este increible MERCH de regalo* (Set de asado + Botella termica Contigo) 🍖🥤.',
    '',
    '📝 Solo te va a llevar 2 minutos. ¡Ponete la camiseta del lider en siembra! 🏆',
    '👉 {url}',
    '',
    '🔔 Importante: Este contacto se utiliza unicamente para este fin. Si necesitas asistencia tecnica o comercial, por favor contactate con tu Concesionario oficial.'
  ],
  'WhatsApp Image 2026-02-11 at 14.11.25.jpeg'
);

INSERT INTO plantillas_whatsapp (nombre, tipo, lineas, ruta_imagen) VALUES (
  'Recordatorio — Merch',
  'recordatorio',
  ARRAY[
    '¡Hola {nombre}! 👋',
    '',
    'Te recordamos que todavia no completaste nuestra encuesta de satisfaccion 🚜.',
    '',
    'No te pierdas la oportunidad de *llevarte este increible MERCH de regalo* (Set de asado + Botella termica Contigo) 🎁🍖🥤.',
    '',
    '📝 Solo te va a llevar 2 minutos y tu opinion es muy importante para nosotros. ¡Sumate y participa! 🏆',
    '👉 {url}',
    '',
    '⏳ Recorda que tenes tiempo limitado para participar y acceder al premio.',
    '',
    '🔔 Importante: Este contacto se utiliza unicamente para este fin. Si necesitas asistencia tecnica o comercial, por favor contactate con tu Concesionario oficial.'
  ],
  'WhatsApp Image 2026-02-11 at 14.11.25.jpeg'
);
