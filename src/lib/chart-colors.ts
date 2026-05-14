export const CHART_COLORS = {
  series: [
    'var(--primary)',
    'var(--accent)',
    'var(--nps-promotor)',
    'var(--nps-detractor)',
    'var(--secondary)',
    'hsl(270 60% 55%)',
  ],
  nps: {
    promotor:  'var(--nps-promotor)',
    neutro:    'var(--nps-neutro)',
    detractor: 'var(--nps-detractor)',
  },
  npsBg: {
    promotor:  'var(--nps-promotor-bg)',
    neutro:    'var(--nps-neutro-bg)',
    detractor: 'var(--nps-detractor-bg)',
  },
  grid:    'var(--border)',
  axis:    'var(--muted-foreground)',
  tooltip: 'var(--foreground)',
} as const

export function getNPSColor(score: number): string {
  if (score >= 9) return CHART_COLORS.nps.promotor
  if (score >= 7) return CHART_COLORS.nps.neutro
  return CHART_COLORS.nps.detractor
}

export function getNPSScoreColor(nps: number): string {
  if (nps >= 50) return CHART_COLORS.nps.promotor
  if (nps >= 0)  return CHART_COLORS.nps.neutro
  return CHART_COLORS.nps.detractor
}

export type NPSVariant = 'promotor' | 'neutro' | 'detractor'

export function getNPSVariant(score: number): NPSVariant {
  if (score >= 9) return 'promotor'
  if (score >= 7) return 'neutro'
  return 'detractor'
}

export function getNPSScoreVariant(nps: number): NPSVariant {
  if (nps >= 50) return 'promotor'
  if (nps >= 0)  return 'neutro'
  return 'detractor'
}
