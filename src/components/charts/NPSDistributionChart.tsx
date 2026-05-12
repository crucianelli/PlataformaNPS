'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts'
import { CHART_COLORS } from '@/lib/chart-colors'
import { CHART_DEFAULTS } from './chart-defaults'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'

interface DistributionData {
  promotores: number
  neutros: number
  detractores: number
}

interface NPSDistributionChartProps {
  data: DistributionData
  height?: number
}

const RADIAN = Math.PI / 180

function renderCustomLabel({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: PieLabelRenderProps) {
  if (percent < 0.05) return null
  const r = (innerRadius as number) + ((outerRadius as number) - (innerRadius as number)) * 0.5
  const x = (cx as number) + r * Math.cos(-midAngle * RADIAN)
  const y = (cy as number) + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={12} fontWeight={600} fontFamily="var(--font-mono)">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function NPSDistributionChart({ data, height = 260 }: NPSDistributionChartProps) {
  const reduced = usePrefersReducedMotion()
  const total = data.promotores + data.neutros + data.detractores

  if (total === 0) return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Sin datos disponibles
    </div>
  )

  const chartData = [
    { name: 'Promotores',  value: data.promotores,  color: CHART_COLORS.nps.promotor },
    { name: 'Neutros',     value: data.neutros,     color: CHART_COLORS.nps.neutro },
    { name: 'Detractores', value: data.detractores, color: CHART_COLORS.nps.detractor },
  ].filter((d) => d.value > 0)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius="70%"
          innerRadius="40%"
          dataKey="value"
          labelLine={false}
          label={renderCustomLabel}
          isAnimationActive={!reduced}
          animationDuration={CHART_DEFAULTS.animation.duration}
          animationEasing={CHART_DEFAULTS.animation.easing}
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} stroke="var(--card)" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          {...CHART_DEFAULTS.tooltip}
          formatter={(value) => {
            const n = Number(value)
            return [`${n} (${((n / total) * 100).toFixed(1)}%)`, '']
          }}
        />
        <Legend
          {...CHART_DEFAULTS.legend}
          formatter={(value) => (
            <span style={{ color: 'var(--foreground)', fontSize: 12 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
