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
  fecha_envio: string | null
}

export type RegaloStats = {
  pendientes: number
  enviados: number
  total: number
}

// 'respuesta' filtra por fecha_respuesta (mes en que llegó la encuesta → para planificar envíos)
// 'envio' filtra por fecha_envio (mes en que se marcó enviado → para cruzar con factura Rambla)
export type FiltroTipo = 'respuesta' | 'envio'

export type RamblaFiltros = {
  desde?: string     // YYYY-MM-DD
  hasta?: string     // YYYY-MM-DD
  tipo?: FiltroTipo
}

export type RamblaPage = {
  data: RespuestaRambla[]
  total: number
  page: number
  pageSize: number
}
