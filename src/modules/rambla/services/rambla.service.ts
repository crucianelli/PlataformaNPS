import { createSupabaseServer } from '@/lib/supabase/server'
import type { RegaloStats, RespuestaRambla } from '../types/rambla.types'

export async function getRespuestasRambla(): Promise<RespuestaRambla[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('respuestas')
    .select(
      'id, fecha_respuesta, nombre_apellido, calle_numero, piso_departamento, localidad, codigo_postal, provincia, email, telefono, maquina_modelo, regalo_estado, numero_seguimiento, fecha_seguimiento'
    )
    .order('fecha_respuesta', { ascending: false })

  if (error) throw error
  return (data ?? []) as RespuestaRambla[]
}

export async function getRegaloStats(): Promise<RegaloStats> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('respuestas')
    .select('regalo_estado')

  if (error) throw error

  const pendientes = data?.filter(r => r.regalo_estado === 'pendiente_envio').length ?? 0
  const enviados = data?.filter(r => r.regalo_estado === 'enviado').length ?? 0

  return { pendientes, enviados, total: pendientes + enviados }
}
