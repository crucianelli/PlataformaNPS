function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type AvisoRecordatorioParams = {
  campanaNombre: string
  nextNumero: number
  pendientes: number
  detalleUrl: string
}

export function buildAvisoRecordatorioTemplate({
  campanaNombre,
  nextNumero,
  pendientes,
  detalleUrl,
}: AvisoRecordatorioParams) {
  const subject = `Recordatorio ${nextNumero} pendiente — ${campanaNombre}`

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f3f4f6;padding:24px;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
        <div style="background:#C0272D;padding:20px 24px;color:#ffffff;">
          <p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.9;">Plataforma NPS Crucianelli</p>
          <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;">Recordatorio ${nextNumero} pendiente</h1>
        </div>
        <div style="padding:24px;">
          <p style="margin:0 0 16px;color:#111827;font-size:15px;line-height:1.6;">
            Es momento de enviar el <strong>Recordatorio ${nextNumero}</strong> de la campaña
            <strong>${escapeHtml(campanaNombre)}</strong>.
          </p>
          <div style="background:#fef9ec;border:1px solid #fbbf24;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:14px;color:#92400e;">
              <strong>${pendientes} cliente${pendientes !== 1 ? 's' : ''}</strong>
              ${pendientes !== 1 ? 'todavía no respondieron' : 'todavía no respondió'} la encuesta.
            </p>
          </div>
          <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
            Ingresá a la campaña, exportá la lista de pendientes y coordinar el envío.
            Una vez realizado, marcá el recordatorio como enviado para continuar el seguimiento.
          </p>
          <a href="${escapeHtml(detalleUrl)}"
            style="display:inline-block;background:#C0272D;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:700;font-size:14px;">
            Ver campaña
          </a>
        </div>
        <div style="padding:0 24px 20px;">
          <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
            Este aviso se genera automáticamente una vez por día mientras haya clientes pendientes.
          </p>
        </div>
      </div>
    </div>
  `

  const text = [
    `Recordatorio ${nextNumero} pendiente — ${campanaNombre}`,
    '',
    `${pendientes} cliente${pendientes !== 1 ? 's' : ''} ${pendientes !== 1 ? 'todavía no respondieron' : 'todavía no respondió'} la encuesta.`,
    '',
    `Ver campaña: ${detalleUrl}`,
  ].join('\n')

  return { subject, html, text }
}
