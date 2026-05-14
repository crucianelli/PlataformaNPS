import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-muted text-muted-foreground',
  success:  'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]',
  warning:  'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]',
  danger:   'bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-destructive',
  info:     'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary',
  outline:  'border border-border bg-transparent text-foreground',
}

export default function Badge({
  variant = 'default',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-none',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
