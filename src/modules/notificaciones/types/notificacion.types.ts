export type NotificacionTipo =
  | 'nps_critico'
  | 'nueva_respuesta'
  | 'regalo_pendiente'
  | 'campana_sin_actividad'

export type Notificacion = {
  id: string
  tipo: NotificacionTipo
  titulo: string
  mensaje: string
  leida: boolean
  para_rol: 'admin' | 'rambla'
  metadata: Record<string, string> | null
  created_at: string
}
