'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase/server'
import type { RegaloEstado } from '@/modules/rambla/types/rambla.types'

export async function actualizarRegaloEstadoAction(
  respuestaId: string,
  estado: RegaloEstado
): Promise<void> {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('No autorizado')

  const role = user.app_metadata?.role as string | undefined
  if (role && role !== 'admin' && role !== 'rambla') {
    throw new Error('No autorizado')
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .from('respuestas')
    .update({ regalo_estado: estado })
    .eq('id', respuestaId)

  if (error) throw error

  revalidatePath('/rambla')
}
