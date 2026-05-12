import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface KPIGridProps {
  children: ReactNode
  cols?: 2 | 3 | 4
  className?: string
}

const colsMap: Record<NonNullable<KPIGridProps['cols']>, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}

export default function KPIGrid({ children, cols = 4, className }: KPIGridProps) {
  return (
    <div className={cn('grid gap-4', colsMap[cols], className)}>
      {children}
    </div>
  )
}
