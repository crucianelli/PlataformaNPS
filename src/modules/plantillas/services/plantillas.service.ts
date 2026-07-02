import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { Plantilla, Pregunta } from '../types/plantilla.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

const SLUGS_SISTEMA = ['inicio_garantia']

function rowToPlantilla(row: Record<string, unknown>): Plantilla {
  return {
    id:           row.id as string,
    nombre:       row.nombre as string,
    slug:         row.slug as string,
    activo:       row.activo as boolean,
    introduccion: (row.introduccion as string | null) ?? '',
    preguntas:    (row.preguntas as Pregunta[] | null) ?? [],
    created_at:   row.created_at as string,
    es_sistema:   SLUGS_SISTEMA.includes(row.slug as string),
  }
}

export async function getPlantillas(): Promise<Plantilla[]> {
  const supabase = createSupabaseAdmin() as AnyClient
  const { data, error } = await supabase
    .from('tipos_encuesta')
    .select('*')
    .eq('activo', true)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(rowToPlantilla)
}

export async function getPlantillaById(id: string): Promise<Plantilla | null> {
  const supabase = createSupabaseAdmin() as AnyClient
  const { data, error } = await supabase
    .from('tipos_encuesta')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return rowToPlantilla(data)
}

export async function createPlantilla(input: {
  nombre: string
  introduccion: string
  preguntas: Pregunta[]
}): Promise<Plantilla> {
  const supabase = createSupabaseAdmin() as AnyClient
  const slug = input.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

  const { data, error } = await supabase
    .from('tipos_encuesta')
    .insert({
      nombre:       input.nombre,
      slug,
      activo:       true,
      introduccion: input.introduccion,
      preguntas:    input.preguntas,
    })
    .select()
    .single()
  if (error) throw error
  return rowToPlantilla(data)
}

export async function updatePlantilla(
  id: string,
  input: { nombre: string; introduccion: string; preguntas: Pregunta[] },
): Promise<void> {
  const supabase = createSupabaseAdmin() as AnyClient
  const { error } = await supabase
    .from('tipos_encuesta')
    .update({
      nombre:       input.nombre,
      introduccion: input.introduccion,
      preguntas:    input.preguntas,
    })
    .eq('id', id)
  if (error) throw error
}

export async function deletePlantilla(id: string): Promise<void> {
  const supabase = createSupabaseAdmin() as AnyClient
  const { error } = await supabase
    .from('tipos_encuesta')
    .update({ activo: false })
    .eq('id', id)
  if (error) throw error
}

// Legacy — used by campanas service
export async function getTiposEncuesta() {
  const supabase = createSupabaseAdmin() as AnyClient
  const { data } = await supabase
    .from('tipos_encuesta')
    .select('id, nombre, slug')
    .eq('activo', true)
    .order('created_at')
  return data ?? []
}

// Legacy — used by encuesta/page.tsx
export async function getConfigFinGarantia() {
  const supabase = createSupabaseAdmin() as AnyClient
  const { data } = await supabase
    .from('tipos_encuesta')
    .select('introduccion, preguntas')
    .eq('slug', 'fin_garantia')
    .single()
  return data ?? null
}
