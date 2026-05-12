'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS } from '@/lib/chart-colors'
import { CHART_DEFAULTS } from './chart-defaults'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'

interface TrendPoint {
  label: string
  nps: number
}

interface NPSTrendChartProps {
  data: TrendPoint[]
  height?: number
  showZeroLine?: boolean
}

export default function NPSTrendChart({ data, height = 260, showZeroLine = true }: NPSTrendChartProps) {
  const reduced = usePrefersReducedMotion()

  if (data.length === 0) return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Sin datos disponibles
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={CHART_DEFAULTS.marginWithAxis}>
        <CartesianGrid {...CHART_DEFAULTS.grid} />
        <XAxis dataKey="label" {...CHART_DEFAULTS.xAxis} />
        <YAxis
          {...CHART_DEFAULTS.yAxis}
          domain={[-100, 100]}
          tickFormatter={(v: number) => `${v}`}
        />
        <Tooltip
          {...CHART_DEFAULTS.tooltip}
          formatter={(value) => [Number(value), 'NPS']}
        />
        {showZeroLine && (
          <ReferenceLine y={0} stroke={CHART_COLORS.axis} strokeDasharray="4 4" strokeWidth={1} />
        )}
        <Line
          type="monotone"
          dataKey="nps"
          stroke={CHART_COLORS.series[0]}
          strokeWidth={2}
          dot={{ r: 4, fill: CHART_COLORS.series[0], strokeWidth: 0 }}
          activeDot={{ r: 6, fill: CHART_COLORS.series[0], strokeWidth: 2, stroke: 'var(--card)' }}
          isAnimationActive={!reduced}
          animationDuration={CHART_DEFAULTS.animation.duration}
          animationEasing={CHART_DEFAULTS.animation.easing}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
