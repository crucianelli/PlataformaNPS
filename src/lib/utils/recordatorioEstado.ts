// Estado del ciclo de recordatorios de una campaña, para verlo desde el listado
// sin entrar a cada una. Usa la misma regla que los avisos automáticos
// (avisos.service): toca recordatorio cuando pasaron los días configurados desde
// el último envío confirmado y quedan clientes sin responder.

export const MAX_RECORDATORIOS = 3
const DAY_MS = 1000 * 60 * 60 * 24

export type EnvioParaEstado = {
  numero_recordatorio: number
  estado_envio: 'pendiente_envio' | 'enviado' | string
  fecha_envio: string | null
  created_at: string | null
}

export type EstadoRecordatorio =
  // Recordatorio creado pero nunca marcado como enviado: frena el pase a llamado.
  | { tipo: 'sin_marcar'; numero: number; dias: number | null }
  // Ya pasaron los días y quedan clientes sin responder.
  | { tipo: 'toca'; numero: number; dias: number }
  // Todavía no pasaron los días desde el último envío.
  | { tipo: 'esperando'; numero: number; faltan: number; ultimoEnviado: number }
  | { tipo: 'al_dia'; motivo: 'sin_pendientes' | 'maximo' }
  // Campaña completada/archivada o sin envíos: no aplica.
  | { tipo: 'no_aplica' }

export function calcularEstadoRecordatorio(params: {
  estadoCampana: string
  envios: EnvioParaEstado[]
  // Encuestas en 'pendiente' o 'recordatorio_enviado' (las que un recordatorio puede alcanzar)
  sinResponder: number
  diasAviso: number
  now?: number
}): EstadoRecordatorio {
  const { estadoCampana, envios, sinResponder, diasAviso } = params
  const now = params.now ?? Date.now()
  if (estadoCampana !== 'activa' || envios.length === 0) return { tipo: 'no_aplica' }

  const pendiente = envios
    .filter((e) => e.numero_recordatorio > 0 && e.estado_envio === 'pendiente_envio')
    .sort((a, b) => a.numero_recordatorio - b.numero_recordatorio)[0]
  if (pendiente) {
    const creado = pendiente.created_at ? new Date(pendiente.created_at).getTime() : NaN
    return {
      tipo: 'sin_marcar',
      numero: pendiente.numero_recordatorio,
      dias: Number.isNaN(creado) ? null : Math.floor((now - creado) / DAY_MS),
    }
  }

  // Último envío confirmado (el de número más alto; dentro de un número, la fecha más nueva)
  let ultimo: { numero: number; fecha: number } | null = null
  for (const e of envios) {
    if (e.estado_envio !== 'enviado' || !e.fecha_envio) continue
    const fecha = new Date(e.fecha_envio).getTime()
    if (!ultimo || e.numero_recordatorio > ultimo.numero || (e.numero_recordatorio === ultimo.numero && fecha > ultimo.fecha)) {
      ultimo = { numero: e.numero_recordatorio, fecha }
    }
  }
  if (!ultimo) return { tipo: 'no_aplica' }

  if (sinResponder === 0) return { tipo: 'al_dia', motivo: 'sin_pendientes' }
  if (ultimo.numero >= MAX_RECORDATORIOS) return { tipo: 'al_dia', motivo: 'maximo' }

  const dias = (now - ultimo.fecha) / DAY_MS
  const numero = ultimo.numero + 1
  if (dias >= diasAviso) return { tipo: 'toca', numero, dias: Math.floor(dias) }
  return { tipo: 'esperando', numero, faltan: Math.max(1, Math.round(diasAviso - dias)), ultimoEnviado: ultimo.numero }
}

export function necesitaAccion(estado: EstadoRecordatorio): boolean {
  return estado.tipo === 'sin_marcar' || estado.tipo === 'toca'
}

function plural(n: number, uno: string, varios: string) {
  return `${n} ${n === 1 ? uno : varios}`
}

export function textoEstadoRecordatorio(estado: EstadoRecordatorio): { titulo: string; detalle: string | null } {
  switch (estado.tipo) {
    case 'sin_marcar':
      return {
        titulo: `Recordatorio ${estado.numero} sin marcar como enviado`,
        detalle: estado.dias === null ? null : `creado hace ${plural(estado.dias, 'día', 'días')}`,
      }
    case 'toca':
      return {
        titulo: `Toca recordatorio ${estado.numero}`,
        detalle: `último envío hace ${plural(estado.dias, 'día', 'días')}`,
      }
    case 'esperando':
      return estado.ultimoEnviado === 0
        ? { titulo: `Recordatorio ${estado.numero} en ${plural(estado.faltan, 'día', 'días')}`, detalle: null }
        : { titulo: `Recordatorio ${estado.ultimoEnviado} enviado`, detalle: `faltan ${plural(estado.faltan, 'día', 'días')} para el siguiente paso` }
    case 'al_dia':
      return estado.motivo === 'maximo'
        ? { titulo: `${MAX_RECORDATORIOS} recordatorios enviados`, detalle: null }
        : { titulo: 'Al día', detalle: 'sin clientes esperando recordatorio' }
    case 'no_aplica':
      return { titulo: '—', detalle: null }
  }
}
