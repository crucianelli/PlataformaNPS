import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, ...props },
  ref
) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ' +
    'disabled:pointer-events-none disabled:opacity-50'

  const variants = {
    primary:   'bg-primary text-primary-foreground hover:bg-[var(--primary-hover)]',
    secondary: 'bg-muted text-foreground hover:bg-muted/80',
    danger:    'bg-destructive text-white hover:bg-destructive/90',
    ghost:     'text-muted-foreground hover:bg-muted hover:text-foreground',
    outline:   'border border-border bg-transparent text-foreground hover:bg-muted',
  }

  const sizes = {
    sm:   'h-8 px-3 text-xs',
    md:   'h-9 px-4 text-sm',
    lg:   'h-10 px-5 text-sm',
    icon: 'h-9 w-9 p-0',
  }

  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
})

export default Button
