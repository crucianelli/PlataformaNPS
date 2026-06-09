export type RegaloEstado = 'pendiente_envio' | 'enviado'

export type RespuestaRambla = {
  id: string
  fecha_respuesta: string
  nombre_apellido: string | null
  calle_numero: string | null
  piso_departamento: string | null
  localidad: string | null
  codigo_postal: string | null
  provincia: string | null
  email: string | null
  telefono: string | null
  regalo_estado: RegaloEstado
}

export type RegaloStats = {
  pendientes: number
  enviados: number
  total: number
}
