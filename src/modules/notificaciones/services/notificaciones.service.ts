import { createSupabaseServer } from '@/lib/supabase/server'
import type { Notificacion } from '../types/notificacion.types'

export async function getNotificaciones(rol: string): Promise<Notificacion[]> {
  const supabase = await createSupabaseServer()
  const { data, error } = await supabase
    .from('notificaciones')
    .select('id, tipo, titulo, mensaje, leida, para_rol, metadata, created_at')
    .eq('para_rol', rol)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return []
  return (data ?? []) as Notificacion[]
}

export async function getUnreadCount(rol: string): Promise<number> {
  const supabase = await createSupabaseServer()
  const { count, error } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('para_rol', rol)
    .eq('leida', false)

  if (error) return 0
  return count ?? 0
}
