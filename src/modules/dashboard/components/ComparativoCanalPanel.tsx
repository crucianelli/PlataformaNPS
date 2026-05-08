import Badge from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import type { ComparativoPorCanal } from '../services/dashboard.service'
import { getNpsScoreVariant } from '../utils/nps'

interface ComparativoCanalPanelProps {
  comparativo: ComparativoPorCanal[]
}

function formatNps(value: number | null) {
  if (value === null) return '—'
  const formatted = value.toLocaleString('es-AR')
  return value > 0 ? `+${formatted}` : formatted
}

function formatPct(value: number | null) {
  if (value === null) return '—'
  return `${value.toLocaleString('es-AR')}%`
}

const CANAL_LABELS: Record<'mensaje' | 'llamado', string> = {
  mensaje: 'Mensaje',
  llamado: 'Llamado',
}

export default function ComparativoCanalPanel({ comparativo }: ComparativoCanalPanelProps) {
  const totalGlobal = comparativo.reduce((acc, item) => acc + item.total, 0)

  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-semibold text-gray-900">Respuestas por canal</h2>
      </CardHeader>
      <CardContent>
        {totalGlobal === 0 ? (
          <p className="text-sm text-gray-500">Sin datos</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {comparativo.map((item) => (
              <div
                key={item.canal}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {CANAL_LABELS[item.canal]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatPct(item.porcentaje)}</span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {item.total}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.total === 1 ? 'respuesta' : 'respuestas'}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-brand transition-all"
                    style={{
                      width: totalGlobal === 0 ? '0%' : `${(item.total / totalGlobal) * 100}%`,
                    }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'Concesionario', value: item.npsConcesionario },
                    { label: 'Producto', value: item.npsProducto },
                    { label: 'Empresa', value: item.npsEmpresa },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-md border border-gray-200 bg-white px-2 py-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-500 truncate">{label}</p>
                      <div className="mt-1 flex justify-center">
                        {item.total === 0 ? (
                          <span className="text-sm text-gray-400">—</span>
                        ) : (
                          <Badge variant={getNpsScoreVariant(value)}>
                            {formatNps(value)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
