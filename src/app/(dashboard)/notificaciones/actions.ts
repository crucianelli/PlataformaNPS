'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdmin, createSupabaseServer } from '@/lib/supabase/server'

export async function marcarTodasLeidasAction(rol: string): Promise<void> {
  if (rol !== 'admin' && rol !== 'rambla') return

  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const admin = createSupabaseAdmin()
  await admin
    .from('notificaciones')
    .update({ leida: true })
    .eq('para_rol', rol)
    .eq('leida', false)

  revalidatePath('/', 'layout')
}
