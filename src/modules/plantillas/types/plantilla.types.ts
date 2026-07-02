export type PreguntaTipo = 'escala' | 'si_no' | 'texto'
export type NpsCampo = 'nps_producto' | 'nps_empresa' | 'nps_concesionario'

export type SubPregunta = {
  id: string
  tipo: 'escala' | 'texto'
  titulo: string
  descripcion: string
  requerida: boolean
}

export type Pregunta = {
  id: string
  tipo: PreguntaTipo
  titulo: string
  descripcion: string
  requerida: boolean
  escala_min: number
  escala_max: number
  nps_campo: NpsCampo | null
  sub_si: SubPregunta[]
}

export type Plantilla = {
  id: string
  nombre: string
  slug: string
  activo: boolean
  introduccion: string
  preguntas: Pregunta[]
  created_at: string
  es_sistema: boolean
}

export function preguntaVacia(): Pregunta {
  return {
    id: crypto.randomUUID(),
    tipo: 'escala',
    titulo: '',
    descripcion: '',
    requerida: true,
    escala_min: 1,
    escala_max: 10,
    nps_campo: null,
    sub_si: [],
  }
}

export function subPreguntaVacia(): SubPregunta {
  return {
    id: crypto.randomUUID(),
    tipo: 'escala',
    titulo: '',
    descripcion: '',
    requerida: false,
  }
}
