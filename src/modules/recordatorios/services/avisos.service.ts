import { createSupabaseAdmin } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send-email'
import { buildAvisoRecordatorioTemplate } from '@/lib/email/templates/aviso-recordatorio'

const DAY_MS = 1000 * 60 * 60 * 24

export async function checkAvisosRecordatorio() {
  const supabase = createSupabaseAdmin()

  const [{ data: config }, { data: campanas }] = await Promise.all([
    supabase
      .from('system_config')
      .select('dias_notificacion_inicial, emails_notificacion')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('campanas')
      .select('id, nombre')
      .eq('estado', 'activa'),
  ])

  if (!config || !campanas || campanas.length === 0) return

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const now = Date.now()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  for (const campana of campanas) {
    try {
      const { data: envios } = await supabase
        .from('envios')
        .select('numero_recordatorio, estado_envio, fecha_envio')
        .eq('campana_id', campana.id)
        .order('numero_recordatorio', { ascending: false })

      if (!envios || envios.length === 0) continue

      // Si hay un recordatorio sin confirmar (pendiente de envío externo), saltar
      const tieneRecordatorioPendiente = envios.some(
        (e) => e.numero_recordatorio > 0 && e.estado_envio === 'pendiente_envio'
      )
      if (tieneRecordatorioPendiente) continue

      // Último recordatorio confirmado (enviado)
      const ultimoConfirmado = envios.find((e) => e.estado_envio === 'enviado')
      if (!ultimoConfirmado || !ultimoConfirmado.fecha_envio) continue

      // Máximo de recordatorios ya alcanzado
      if (ultimoConfirmado.numero_recordatorio >= 3) continue

      // ¿Pasaron suficientes días desde el último envío confirmado?
      const diasTranscurridos =
        (now - new Date(ultimoConfirmado.fecha_envio).getTime()) / DAY_MS
      if (diasTranscurridos < config.dias_notificacion_inicial) continue

      // ¿Hay clientes pendientes de responder?
      const { count: pendientes } = await supabase
        .from('encuestas')
        .select('id', { count: 'exact', head: true })
        .eq('campana_id', campana.id)
        .in('estado', ['pendiente', 'recordatorio_enviado'])

      if (!pendientes || pendientes === 0) continue

      // Deduplicación: ya notificamos hoy para esta campaña?
      const { count: notifHoy } = await supabase
        .from('notificaciones')
        .select('id', { count: 'exact', head: true })
        .eq('tipo', 'aviso_recordatorio')
        .gte('created_at', todayStart.toISOString())
        .filter('metadata->>campana_id', 'eq', campana.id)

      if (notifHoy && notifHoy > 0) continue

      const nextNumero = ultimoConfirmado.numero_recordatorio + 1
      const mensaje = `Campaña "${campana.nombre}" tiene ${pendientes} cliente${pendientes !== 1 ? 's' : ''} sin responder. Es momento de enviar el recordatorio ${nextNumero}.`

      // Notificación interna
      await supabase.from('notificaciones').insert({
        tipo: 'aviso_recordatorio',
        titulo: `Recordatorio ${nextNumero} pendiente`,
        mensaje,
        para_rol: 'admin',
        metadata: {
          campana_id: campana.id,
          campana_nombre: campana.nombre,
          numero: String(nextNumero),
          pendientes: String(pendientes),
        },
      })

      // Email solo al administrador
      const recipients = ['rasef@crucianelli.com']
      if (recipients.length > 0) {
        const email = buildAvisoRecordatorioTemplate({
          campanaNombre: campana.nombre,
          nextNumero,
          pendientes,
          detalleUrl: `${appUrl}/campanas/${campana.id}`,
        })

        await sendEmail({
          bcc: recipients,
          subject: email.subject,
          html: email.html,
          text: email.text,
        })
      }
    } catch (err) {
      console.error(`[avisos] Error en campaña ${campana.id}:`, err)
    }
  }
}
