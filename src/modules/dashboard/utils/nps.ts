export type NpsAnswerStatus = 'detractor' | 'pasivo' | 'promotor'
export type NpsDimension = 'concesionario' | 'producto' | 'empresa'

export const NPS_ANSWER_STATUS_OPTIONS: { value: NpsAnswerStatus; label: string }[] = [
  { value: 'detractor', label: 'Detractores' },
  { value: 'pasivo', label: 'Pasivos' },
  { value: 'promotor', label: 'Promotores' },
]

export const NPS_DIMENSION_OPTIONS: { value: NpsDimension; label: string }[] = [
  { value: 'concesionario', label: 'NPS concesionario' },
  { value: 'producto', label: 'NPS producto' },
  { value: 'empresa', label: 'NPS empresa' },
]

export function normalizeNpsAnswerStatus(value: string | null | undefined): NpsAnswerStatus | undefined {
  return value === 'detractor' || value === 'pasivo' || value === 'promotor' ? value : undefined
}

export function normalizeNpsDimension(value: string | null | undefined): NpsDimension | undefined {
  return value === 'concesionario' || value === 'producto' || value === 'empresa' ? value : undefined
}

export function matchesNpsAnswerStatus(value: number, status: NpsAnswerStatus) {
  if (status === 'detractor') return value <= 6
  if (status === 'pasivo') return value >= 7 && value <= 8
  return value >= 9
}

export function getNpsAnswerVariant(value: number): 'danger' | 'warning' | 'success' {
  if (value <= 6) return 'danger'
  if (value <= 8) return 'warning'
  return 'success'
}

export function getNpsScoreVariant(value: number | null): 'default' | 'danger' | 'warning' | 'success' {
  if (value === null) return 'default'
  if (value < 0) return 'danger'
  if (value < 30) return 'warning'
  return 'success'
}
