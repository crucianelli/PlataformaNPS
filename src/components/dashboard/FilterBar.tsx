'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface FilterBarProps {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5',
        className
      )}
    >
      {children}
    </div>
  )
}

interface FilterGroupProps {
  label: string
  children: ReactNode
}

export function FilterGroup({ label, children }: FilterGroupProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  )
}

interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
}

export function FilterSelect({ value, onChange, options, placeholder, className }: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-8 rounded-md border border-border bg-background px-2.5 pr-7 text-xs font-medium text-foreground',
        'transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring',
        'appearance-none bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDYgMTEgMSIgc3Ryb2tlPSIjNjQ3NDhCIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+")] bg-[right_8px_center] bg-no-repeat',
        className
      )}
    >
      {placeholder && (
        <option value="">{placeholder}</option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

interface FilterDividerProps {
  className?: string
}

export function FilterDivider({ className }: FilterDividerProps) {
  return <div className={cn('h-4 w-px bg-border', className)} aria-hidden />
}
