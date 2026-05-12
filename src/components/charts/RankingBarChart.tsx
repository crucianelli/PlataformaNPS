'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { CHART_COLORS, getNPSScoreColor } from '@/lib/chart-colors'
import { CHART_DEFAULTS } from './chart-defaults'
import { usePrefersReducedMotion } from '@/hooks/use-reduced-motion'

interface RankingItem {
  label: string
  value: number
}

interface RankingBarChartProps {
  data: RankingItem[]
  height?: number
  valueLabel?: string
  colorByValue?: boolean
  horizontal?: boolean
}

export default function RankingBarChart({
  data,
  height = 260,
  valueLabel = 'NPS',
  colorByValue = true,
  horizontal = true,
}: RankingBarChartProps) {
  const reduced = usePrefersReducedMotion()

  if (data.length === 0) return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Sin datos disponibles
    </div>
  )

  const sorted = [...data].sort((a, b) => b.value - a.value)

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 80 }}
        >
          <CartesianGrid {...CHART_DEFAULTS.grid} horizontal={false} vertical />
          <XAxis
            type="number"
            domain={[-100, 100]}
            {...CHART_DEFAULTS.xAxis}
            tickFormatter={(v: number) => `${v}`}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: CHART_COLORS.axis }}
            axisLine={false}
            tickLine={false}
            width={76}
          />
          <Tooltip
            {...CHART_DEFAULTS.tooltip}
            formatter={(value) => [Number(value), valueLabel]}
          />
          <ReferenceLine x={0} stroke={CHART_COLORS.axis} strokeWidth={1} />
          <Bar
            dataKey="value"
            radius={[0, 4, 4, 0]}
            isAnimationActive={!reduced}
            animationDuration={CHART_DEFAULTS.animation.duration}
            animationEasing={CHART_DEFAULTS.animation.easing}
          >
            {sorted.map((entry) => (
              <Cell
                key={entry.label}
                fill={colorByValue ? getNPSScoreColor(entry.value) : CHART_COLORS.series[0]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={sorted} margin={CHART_DEFAULTS.marginWithAxis}>
        <CartesianGrid {...CHART_DEFAULTS.grid} />
        <XAxis dataKey="label" {...CHART_DEFAULTS.xAxis} />
        <YAxis domain={[-100, 100]} {...CHART_DEFAULTS.yAxis} tickFormatter={(v: number) => `${v}`} />
        <Tooltip
          {...CHART_DEFAULTS.tooltip}
          formatter={(value) => [Number(value), valueLabel]}
        />
        <ReferenceLine y={0} stroke={CHART_COLORS.axis} strokeWidth={1} />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          isAnimationActive={!reduced}
          animationDuration={CHART_DEFAULTS.animation.duration}
          animationEasing={CHART_DEFAULTS.animation.easing}
        >
          {sorted.map((entry) => (
            <Cell
              key={entry.label}
              fill={colorByValue ? getNPSScoreColor(entry.value) : CHART_COLORS.series[0]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
