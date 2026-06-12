export function buildRecuperarPasswordTemplate(link: string) {
  return {
    subject: 'Recuperación de contraseña — Plataforma NPS',
    html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">

        <!-- Barra superior -->
        <tr><td style="height:5px;background:linear-gradient(90deg,#C0272D,#e05a5a,#C0272D);"></td></tr>

        <!-- Cuerpo -->
        <tr><td style="padding:36px 40px 32px;">

          <!-- Logo + título -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="padding-right:14px;">
                <div style="width:44px;height:44px;background:#fef2f2;border-radius:10px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:44px;">
                  <span style="font-size:20px;">🔑</span>
                </div>
              </td>
              <td>
                <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#C0272D;margin-bottom:2px;">Plataforma NPS · Crucianelli</div>
                <div style="font-size:20px;font-weight:700;color:#111827;line-height:1.2;">Recuperá tu contraseña</div>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 16px;color:#374151;font-size:14px;line-height:1.65;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón para crear una nueva contraseña.
          </p>

          <p style="margin:0 0 28px;color:#6b7280;font-size:13px;line-height:1.6;">
            Este enlace es válido por <strong style="color:#374151;">1 hora</strong>. Si no solicitaste el cambio, podés ignorar este correo.
          </p>

          <!-- Botón -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr>
              <td style="background:#C0272D;border-radius:10px;">
                <a href="${link}" target="_blank"
                  style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.01em;">
                  Restablecer contraseña →
                </a>
              </td>
            </tr>
          </table>

          <!-- Fallback link -->
          <p style="margin:0 0 4px;color:#9ca3af;font-size:11px;">Si el botón no funciona, copiá este enlace en tu navegador:</p>
          <p style="margin:0;word-break:break-all;font-size:11px;color:#6b7280;">${link}</p>

        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-top:1px solid #f3f4f6;padding:16px 40px;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">
            Plataforma NPS · Crucianelli &nbsp;·&nbsp; Acceso restringido a personal autorizado
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
    `,
    text: `Recuperá tu contraseña — Plataforma NPS\n\nHacé clic en el siguiente enlace para restablecer tu contraseña:\n\n${link}\n\nEste enlace es válido por 1 hora. Si no solicitaste el cambio, ignorá este correo.\n\n— Plataforma NPS · Crucianelli`,
  }
}
