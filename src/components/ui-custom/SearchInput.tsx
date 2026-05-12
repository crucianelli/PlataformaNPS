'use client'

import { useRef, InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  className?: string
}

export default function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar…',
  className,
  ...props
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    onChange('')
    onClear?.()
    inputRef.current?.focus()
  }

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        size={14}
        className="pointer-events-none absolute left-3 text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-9 w-full rounded-md border border-border bg-background pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground',
          'transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring',
          '[&::-webkit-search-cancel-button]:hidden'
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpiar búsqueda"
          className="absolute right-2 flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <X size={12} aria-hidden />
        </button>
      )}
    </div>
  )
}
