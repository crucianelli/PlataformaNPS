import { CHART_COLORS } from '@/lib/chart-colors'

export const CHART_DEFAULTS = {
  margin: { top: 4, right: 4, bottom: 4, left: 4 },
  marginWithAxis: { top: 8, right: 16, bottom: 32, left: 40 },

  grid: {
    strokeDasharray: '3 3',
    stroke: CHART_COLORS.grid,
    vertical: false,
  },

  xAxis: {
    tick: { fontSize: 11, fill: CHART_COLORS.axis },
    axisLine: false,
    tickLine: false,
  },

  yAxis: {
    tick: { fontSize: 11, fill: CHART_COLORS.axis },
    axisLine: false,
    tickLine: false,
    width: 36,
  },

  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      boxShadow: 'var(--shadow-sm)',
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
      padding: '8px 12px',
    },
    labelStyle: {
      color: 'var(--foreground)',
      fontWeight: 600,
      marginBottom: 4,
    },
    itemStyle: {
      color: 'var(--muted-foreground)',
    },
    cursor: { fill: 'var(--muted)', opacity: 0.4 },
  },

  legend: {
    wrapperStyle: {
      fontSize: 12,
      color: CHART_COLORS.axis,
    },
  },

  animation: {
    duration: 400,
    easing: 'ease-out' as const,
  },
} as const
