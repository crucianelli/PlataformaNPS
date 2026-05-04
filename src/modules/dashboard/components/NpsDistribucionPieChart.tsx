'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { NpsDistribucionRow } from '../services/dashboard.service'

const SLICE_COLORS = {
  Promotores: '#22c55e',
  Pasivos: '#facc15',
  Detractores: '#ef4444',
} as const

type SliceName = keyof typeof SLICE_COLORS

interface Props {
  distribucion: NpsDistribucionRow[]
}

function SinglePie({ row }: { row: NpsDistribucionRow }) {
  const slices: { name: SliceName; value: number; pct: number }[] = [
    { name: 'Promotores', value: row.promotores, pct: row.promotoresPct },
    { name: 'Pasivos', value: row.pasivos, pct: row.pasivosPct },
    { name: 'Detractores', value: row.detractores, pct: row.detractoresPct },
  ]

  const hasData = row.total > 0

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-sm font-semibold text-gray-900">{row.label}</p>
      <p className="text-xs text-gray-400">{row.total} respuestas</p>

      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          {hasData ? (
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {slices.map((slice) => (
                <Cell key={slice.name} fill={SLICE_COLORS[slice.name]} />
              ))}
            </Pie>
          ) : (
            <Pie
              data={[{ name: 'Sin datos', value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={46}
              outerRadius={68}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#e5e7eb" />
            </Pie>
          )}
          {hasData && (
            <Tooltip
              formatter={(value, name, item) => {
                const pct = (item as { payload: { pct: number } }).payload.pct
                return [`${pct}% (${value})`, name]
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600">
        {slices.map((slice) => (
          <span key={slice.name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: SLICE_COLORS[slice.name] }}
            />
            {slice.name} {hasData ? `${slice.pct}%` : '—'}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function NpsDistribucionPieChart({ distribucion }: Props) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {distribucion.map((row) => (
        <SinglePie key={row.label} row={row} />
      ))}
    </div>
  )
}
