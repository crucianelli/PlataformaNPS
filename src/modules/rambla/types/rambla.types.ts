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
  maquina_modelo: string | null
  regalo_estado: RegaloEstado
  numero_seguimiento: string | null
  fecha_seguimiento: string | null
}

export type RegaloStats = {
  pendientes: number
  enviados: number
  total: number
}
