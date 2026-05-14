import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { LAYOUT } from '@/lib/constants/layout'

interface ChartCardProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  height?: keyof typeof LAYOUT.chartHeight
  className?: string
  contentClassName?: string
}

export default function ChartCard({
  title,
  description,
  actions,
  children,
  height = 'standard',
  className,
  contentClassName,
}: ChartCardProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardHeader>
      <CardContent
        className={cn('flex-1 pb-4 pt-2', contentClassName)}
        style={{ minHeight: LAYOUT.chartHeight[height] }}
      >
        {children}
      </CardContent>
    </Card>
  )
}
