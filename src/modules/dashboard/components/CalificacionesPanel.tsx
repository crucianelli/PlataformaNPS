'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import type { CalificacionResumen } from '../services/dashboard.service'

// Score 1-10 → color ramp (rojo → amarillo → verde)
const SCORE_RAMP = [
  '#ef4444', // 1
  '#f97316', // 2
  '#f97316', // 3
  '#fb923c', // 4
  '#facc15', // 5
  '#facc15', // 6
  '#a3e635', // 7
  '#4ade80', // 8
  '#22c55e', // 9
  '#16a34a', // 10
]

function scoreColor(score: number) {
  return SCORE_RAMP[score - 1] ?? '#e5e7eb'
}

function promedioColor(value: number | null): string {
  if (value === null) return '#e5e7eb'
  if (value >= 8) return '#22c55e'
  if (value >= 6) return '#facc15'
  return '#ef4444'
}

// Tooltip personalizado para el gráfico de promedios
function PromedioTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string }; value: number }> }) {
  if (!active || !payload?.length) return null
  const { payload: item, value } = payload[0]
  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-gray-900">{item.label}</p>
      <p className="text-gray-600">Promedio: <span className="font-semibold">{value.toFixed(1)} / 10</span></p>
    </div>
  )
}

function PromediosChart({ calificaciones }: { calificaciones: CalificacionResumen[] }) {
  const data = calificaciones.map((c) => ({
    label: c.labelCorto,
    promedio: c.promedio ?? 0,
    color: promedioColor(c.promedio),
    total: c.total,
  }))

  return (
    <ResponsiveContainer width="100%" height={290}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
        <XAxis
          type="number"
          domain={[0, 10]}
          tickCount={6}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 12, fill: '#374151' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<PromedioTooltip />} cursor={{ fill: '#f9fafb' }} />
        <Bar dataKey="promedio" radius={[0, 6, 6, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function DistribucionMiniChart({ calificacion }: { calificacion: CalificacionResumen }) {
  const max = Math.max(...calificacion.distribucion.map((d) => d.count), 1)

  return (
    <div>
      <p className="mb-0.5 truncate text-xs font-medium text-gray-800">{calificacion.label}</p>
      <p className="mb-2 text-[11px] text-gray-400">
        {calificacion.total > 0
          ? `Prom. ${calificacion.promedio?.toFixed(1)} · ${calificacion.total} resp.`
          : 'Sin datos'}
      </p>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart
          data={calificacion.distribucion}
          margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
          barCategoryGap="10%"
        >
          <XAxis
            dataKey="score"
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide domain={[0, max]} />
          <Tooltip
            formatter={(value) => [value, 'Respuestas']}
            labelFormatter={(label) => `Score ${label}`}
            contentStyle={{ fontSize: 11 }}
          />
          <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={18}>
            {calificacion.distribucion.map((entry) => (
              <Cell key={`cell-${entry.score}`} fill={scoreColor(entry.score)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface CalificacionesPanelProps {
  calificaciones: CalificacionResumen[]
}

export default function CalificacionesPanel({ calificaciones }: CalificacionesPanelProps) {
  const conDatos = calificaciones.some((c) => c.total > 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Promedio por pregunta</h2>
        </CardHeader>
        <CardContent>
          {!conDatos ? (
            <p className="py-8 text-center text-sm text-gray-500">Sin datos para mostrar.</p>
          ) : (
            <PromediosChart calificaciones={calificaciones} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-gray-900">Distribución de respuestas por score</h2>
        </CardHeader>
        <CardContent>
          {!conDatos ? (
            <p className="py-8 text-center text-sm text-gray-500">Sin datos para mostrar.</p>
          ) : (
            <div className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {calificaciones.map((c) => (
                <DistribucionMiniChart key={c.key} calificacion={c} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
