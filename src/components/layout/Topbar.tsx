import { LogOut, Bell } from 'lucide-react'
import { logoutAction } from '@/lib/supabase/actions'
import { cn } from '@/lib/utils/cn'
import ThemeToggle from '@/components/ui-custom/ThemeToggle'
import MobileMenuButton from '@/components/layout/MobileMenuButton'

interface TopbarProps {
  title?: string
  className?: string
}

export default function Topbar({ title, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-6',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Hamburger — solo visible en mobile */}
        <MobileMenuButton />

        {/* Indicador de sección activa */}
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title ?? 'Plataforma NPS'}
          </span>
        </div>
      </div>

      {/* Acciones del header */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        <div className="mx-1 h-4 w-px bg-border" aria-hidden />

        <button
          type="button"
          aria-label="Notificaciones"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground
                     transition-colors duration-150 hover:bg-muted hover:text-foreground
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell size={16} aria-hidden />
        </button>

        <div className="mx-1 h-4 w-px bg-border" aria-hidden />

        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium
                       text-muted-foreground transition-colors duration-150
                       hover:bg-muted hover:text-foreground
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                       md:px-3"
          >
            <LogOut size={15} aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </form>
      </div>
    </header>
  )
}
