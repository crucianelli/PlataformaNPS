import { createSupabaseServer, createSupabaseAdmin } from '@/lib/supabase/server'
import type { CampanaEstado } from '../types/campana.types'
import type { Tecnologia } from '@/lib/utils/tecnologia'

export type OFElegible = {
  clienteId: string
  nombre: string
  telefono: string
  concesionario: string
  ordenFabricacion: string
  tecnologia: Tecnologia | null
  campanaInicioNombre: string
  campanaInicioFecha: string
}

export async function getCampanas(filtros?: { tipoEncuestaId?: string }) {
  const supabase = await createSupabaseServer()
  let query = supabase
    .from('campanas')
    .select('*, encuestas(estado), tipos_encuesta(id, nombre, slug)')
    .order('created_at', { ascending: false })

  if (filtros?.tipoEncuestaId) {
    query = query.eq('tipo_encuesta_id', filtros.tipoEncuestaId)
  }

  const { data, error } = await query
  if (error) throw error

  return data.map((c) => {
    const tipo = Array.isArray(c.tipos_encuesta) ? c.tipos_encuesta[0] : c.tipos_encuesta
    return {
      ...c,
      total:       c.encuestas.length,
      respondidas: c.encuestas.filter((e) => e.estado === 'respondida').length,
      pendientes:  c.encuestas.filter((e) => e.estado !== 'respondida' && e.estado !== 'sin_respuesta').length,
      tipoNombre:  tipo?.nombre ?? null,
      tipoSlug:    tipo?.slug ?? null,
    }
  })
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

export async function createCampana(data: { nombre: string; fecha: string; tipo_encuesta_id: string }) {
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

export async function getOFsElegiblesFinGarantia(): Promise<OFElegible[]> {
  const supabase = createSupabaseAdmin()

  const { data: tipos } = await supabase
    .from('tipos_encuesta')
    .select('id, slug')

  const inicioId = tipos?.find((t) => t.slug === 'inicio_garantia')?.id
  const finId    = tipos?.find((t) => t.slug === 'fin_garantia')?.id

  if (!inicioId || !finId) return []

  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 12)
  const cutoffDate = cutoff.toISOString().split('T')[0]

  const { data: encuestasFinRaw } = await supabase
    .from('encuestas')
    .select('cliente_id, campanas!inner(tipo_encuesta_id)')
    .eq('campanas.tipo_encuesta_id', finId)

  const clientesEnFin = new Set((encuestasFinRaw ?? []).map((e) => e.cliente_id))

  const { data: encuestasInicioRaw } = await supabase
    .from('encuestas')
    .select(`
      cliente_id,
      clientes(id, nombre, telefono, concesionario, orden_fabricacion, tecnologia),
      campanas!inner(id, nombre, fecha, tipo_encuesta_id)
    `)
    .eq('campanas.tipo_encuesta_id', inicioId)
    .lte('campanas.fecha', cutoffDate)

  if (!encuestasInicioRaw) return []

  const byCliente = new Map<string, OFElegible>()

  for (const encRaw of encuestasInicioRaw) {
    const clienteId = encRaw.cliente_id
    if (clientesEnFin.has(clienteId)) continue

    const cliente = Array.isArray(encRaw.clientes) ? encRaw.clientes[0] : encRaw.clientes
    const campana = Array.isArray(encRaw.campanas) ? encRaw.campanas[0] : encRaw.campanas

    if (!cliente?.orden_fabricacion || !campana) continue

    const existing = byCliente.get(clienteId)
    if (!existing || campana.fecha > existing.campanaInicioFecha) {
      byCliente.set(clienteId, {
        clienteId:           cliente.id,
        nombre:              cliente.nombre,
        telefono:            cliente.telefono,
        concesionario:       cliente.concesionario,
        ordenFabricacion:    cliente.orden_fabricacion,
        tecnologia:          cliente.tecnologia as Tecnologia | null,
        campanaInicioNombre: campana.nombre,
        campanaInicioFecha:  campana.fecha,
      })
    }
  }

  return Array.from(byCliente.values())
    .sort((a, b) => a.ordenFabricacion.localeCompare(b.ordenFabricacion))
}

export async function getTiposEncuesta() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('tipos_encuesta')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('created_at')
  return data ?? []
}
