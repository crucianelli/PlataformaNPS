import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card text-card-foreground shadow-[var(--shadow-sm)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between px-5 py-4 border-b border-border', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold leading-none text-foreground', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-5 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center px-5 py-3 border-t border-border', className)} {...props}>
      {children}
    </div>
  )
}
