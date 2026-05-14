import { createSupabaseServer } from '@/lib/supabase/server'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { CampanaEstado } from '../types/campana.types'

export async function getCampanas() {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('campanas')
    .select('*, encuestas(estado)')
    .order('created_at', { ascending: false })
  if (error) throw error

  return data.map((c) => ({
    ...c,
    total: c.encuestas.length,
    respondidas: c.encuestas.filter((e) => e.estado === 'respondida').length,
    pendientes: c.encuestas.filter((e) => e.estado !== 'respondida' && e.estado !== 'sin_respuesta').length,
  }))
}

export async function getCampanaById(id: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('campanas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getCampanaConEncuestas(id: string) {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('encuestas')
    .select(`
      id, estado, token, created_at,
      clientes(id, nombre, telefono, telefono_2, telefono_3, concesionario, orden_fabricacion, tecnologia)
    `)
    .eq('campana_id', id)
    .order('created_at')
  if (error) throw error
  return data
}

export async function createCampana(data: { nombre: string; fecha: string }) {
  const supabase = await createSupabaseServer()
  const { data: campana, error } = await supabase
    .from('campanas')
    .insert(data)
    .select()
    .single()
  if (error) throw error
  return campana
}

export async function updateCampanaEstado(id: string, estado: CampanaEstado) {
  const supabase = await createSupabaseServer()
  const { error } = await supabase.from('campanas').update({ estado }).eq('id', id)
  if (error) throw error
}

export async function autoCompletarCampanaIfDone(campanaId: string) {
  const supabase = createSupabaseAdmin()

  const { data: encuestas, error } = await supabase
    .from('encuestas')
    .select('estado')
    .eq('campana_id', campanaId)

  if (error || !encuestas || encuestas.length === 0) return

  const allClosed = encuestas.every(
    (e) => e.estado === 'respondida' || e.estado === 'sin_respuesta'
  )
  if (!allClosed) return

  await supabase
    .from('campanas')
    .update({ estado: 'completada' })
    .eq('id', campanaId)
    .eq('estado', 'activa')
}
