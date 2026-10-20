import { cache } from 'react'
import { createSupabaseAdmin } from '@/lib/supabase/server'

/**
 * Pasa a `necesidad_de_llamado` las encuestas cuyo recordatorio venció.
 *
 * Delega en la función SQL `sync_encuestas_necesidad_llamado()`, la misma que
 * corre pg_cron cada 15 minutos (migración 008): resuelve todo en un solo
 * UPDATE dentro de la base. Antes esto se hacía acá trayendo todos los envíos
 * y mandando un UPDATE por campaña, uno tras otro; con ~0,3 s por viaje a
 * Supabase y varias llamadas por página, el detalle de campaña tardaba ~10 s.
 *
 * Se llama al cargar páginas para que el estado esté al día sin esperar al
 * cron. `cache` hace que se ejecute una sola vez por request aunque la página
 * lo pida desde varios servicios.
 *
 * Va con el cliente admin porque la función tiene revocado EXECUTE para
 * `authenticated` (migración 010). Es seguro: no recibe parámetros.
 */
export const syncWorkflowEstados = cache(async () => {
  const { error } = await createSupabaseAdmin().rpc('sync_encuestas_necesidad_llamado')
  if (error) throw error
})
