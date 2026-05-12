import { CSSProperties } from 'react'
import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  style?: CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      style={style}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-32" />
    </div>
  )
}

export function SkeletonKPIGrid({ cols = 4, className }: { cols?: 2 | 3 | 4; className?: string }) {
  const colsMap: Record<2 | 3 | 4, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  return (
    <div className={cn('grid gap-4', colsMap[cols], className)}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-3 flex-1" style={{ opacity: 1 - i * 0.1 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChartCard({ height = 260, className }: { height?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1.5 h-3 w-48" />
        </div>
      </div>
      <div className="p-5" style={{ height }}>
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  )
}
