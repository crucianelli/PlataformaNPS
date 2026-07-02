import Badge from '@/components/ui/Badge'
import { getNpsScoreVariant } from '../utils/nps'
import type { NpsPorTipo } from '../services/dashboard.service'

function renderNps(value: number | null) {
  if (value === null) return '—'
  const f = value.toLocaleString('es-AR')
  return value > 0 ? `+${f}` : f
}

function npsLabel(value: number | null) {
  if (value === null) return null
  if (value < 0) return 'Bajo'
  if (value < 30) return 'Regular'
  if (value < 70) return 'Bueno'
  return 'Excelente'
}

function NpsCard({ title, value, score, sub }: { title: string; value: string; score: number | null; sub: string }) {
  const label = npsLabel(score)
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground leading-tight">{title}</p>
        {label && <Badge variant={getNpsScoreVariant(score)}>{label}</Badge>}
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  )
}

const SLUG_COLORS: Record<string, string> = {
  inicio_garantia: 'bg-blue-50 border-blue-200',
  fin_garantia:    'bg-amber-50 border-amber-200',
}

const SLUG_HEADER_COLORS: Record<string, string> = {
  inicio_garantia: 'bg-blue-100/60 text-blue-800',
  fin_garantia:    'bg-amber-100/60 text-amber-800',
}

interface Props {
  data: NpsPorTipo[]
  currentSearchParams: Record<string, string | undefined>
}

export default function NpsPorTipoPanel({ data, currentSearchParams }: Props) {
  if (data.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">NPS por tipo de encuesta</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {data.map(({ tipo, resumen, efectividad }) => {
          const cardBg = SLUG_COLORS[tipo.slug] ?? 'bg-muted/20 border-border'
          const headerBg = SLUG_HEADER_COLORS[tipo.slug] ?? 'bg-muted text-muted-foreground'

          // Build filter URL — preserve other filters, set tipoEncuestaId to this tipo
          const params = new URLSearchParams()
          for (const [k, v] of Object.entries(currentSearchParams)) {
            if (v && k !== 'tipoEncuestaId') params.set(k, v)
          }
          params.set('tipoEncuestaId', tipo.id)
          const filterUrl = `/nps?${params.toString()}`

          return (
            <div key={tipo.id} className={`rounded-xl border p-4 space-y-3 ${cardBg}`}>
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${headerBg}`}>
                  {tipo.nombre}
                </span>
                <a
                  href={filterUrl}
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
                >
                  Ver solo este →
                </a>
              </div>

              {/* NPS cards */}
              <div className="grid grid-cols-2 gap-2">
                <NpsCard
                  title="NPS Producto · Sembradora"
                  value={renderNps(resumen.npsSembradora)}
                  score={resumen.npsSembradora}
                  sub={`${resumen.totalSembradora} resp.`}
                />
                <NpsCard
                  title="NPS Producto · Fertilizadora"
                  value={renderNps(resumen.npsFertilizadora)}
                  score={resumen.npsFertilizadora}
                  sub={`${resumen.totalFertilizadora} resp.`}
                />
                <NpsCard
                  title="NPS Concesionario"
                  value={renderNps(resumen.npsConcesionario)}
                  score={resumen.npsConcesionario}
                  sub={`${resumen.totalRespuestas} resp.`}
                />
                <NpsCard
                  title="NPS Empresa"
                  value={renderNps(resumen.npsEmpresa)}
                  score={resumen.npsEmpresa}
                  sub={`${resumen.totalRespuestas} resp.`}
                />
              </div>

              {/* Efectividad */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
                <span className="text-muted-foreground">Efectividad de envíos</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {efectividad.porcentaje !== null ? `${efectividad.porcentaje}%` : '—'}
                  <span className="text-muted-foreground font-normal ml-1">
                    ({efectividad.respondidas}/{efectividad.enviadas})
                  </span>
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
