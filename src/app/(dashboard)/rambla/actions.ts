'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase/server'
import type { RegaloEstado, RamblaFiltros, RespuestaRambla } from '@/modules/rambla/types/rambla.types'
import { exportarRespuestasRambla } from '@/modules/rambla/services/rambla.service'

async function getRoleOrThrow() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const role = user.app_metadata?.role as string | undefined
  if (role && role !== 'admin' && role !== 'rambla') throw new Error('No autorizado')
}

export async function actualizarRegaloEstadoAction(
  respuestaId: string,
  estado: RegaloEstado
): Promise<void> {
  await getRoleOrThrow()

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('respuestas')
    .update({ regalo_estado: estado })
    .eq('id', respuestaId)

  if (error) throw error
  revalidatePath('/rambla')
}

export async function guardarSeguimientoAction(
  respuestaId: string,
  numeroSeguimiento: string
): Promise<void> {
  await getRoleOrThrow()

  const trimmed = numeroSeguimiento.trim()
  if (!trimmed) throw new Error('El número de seguimiento no puede estar vacío')

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('respuestas')
    .update({
      numero_seguimiento: trimmed,
      fecha_seguimiento: new Date().toISOString(),
    })
    .eq('id', respuestaId)

  if (error) throw error
  revalidatePath('/rambla')
}

export async function exportarRamblaAction(filtros?: RamblaFiltros): Promise<RespuestaRambla[]> {
  await getRoleOrThrow()
  return exportarRespuestasRambla(filtros)
}
