import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Card, CardContent } from '@/components/ui/Card'

type Trend = 'up' | 'down' | 'neutral'

interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  description?: string
  trend?: Trend
  trendValue?: string
  icon?: ReactNode
  variant?: 'default' | 'promotor' | 'neutro' | 'detractor'
  className?: string
}

const variantStyles: Record<NonNullable<MetricCardProps['variant']>, string> = {
  default:    'text-foreground',
  promotor:   'text-[var(--nps-promotor)]',
  neutro:     'text-[var(--nps-neutro)]',
  detractor:  'text-[var(--nps-detractor)]',
}

const trendConfig: Record<Trend, { icon: typeof TrendingUp; color: string; label: string }> = {
  up:      { icon: TrendingUp,   color: 'text-[var(--success)]',     label: 'Subió' },
  down:    { icon: TrendingDown, color: 'text-[var(--destructive)]', label: 'Bajó' },
  neutral: { icon: Minus,        color: 'text-muted-foreground',      label: 'Sin cambio' },
}

export default function MetricCard({
  label,
  value,
  unit,
  description,
  trend,
  trendValue,
  icon,
  variant = 'default',
  className,
}: MetricCardProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={cn(
                  'font-mono text-3xl font-bold leading-none tracking-tight',
                  variantStyles[variant]
                )}
              >
                {value}
              </span>
              {unit && (
                <span className="text-sm font-medium text-muted-foreground">{unit}</span>
              )}
            </div>
            {(trend || description) && (
              <div className="mt-2 flex items-center gap-1.5">
                {trend && TrendIcon && (
                  <span
                    className={cn('flex items-center gap-0.5 text-xs font-medium', trendConfig[trend].color)}
                    aria-label={trendConfig[trend].label}
                  >
                    <TrendIcon size={12} aria-hidden />
                    {trendValue}
                  </span>
                )}
                {description && (
                  <span className="text-xs text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
              aria-hidden
            >
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
