'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Phone,
  Clock,
  MessageSquare,
  BarChart3,
  Settings,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSidebar } from '@/hooks/use-sidebar'

// ─── Nav config ──────────────────────────────────────────────────

interface NavItem {
  href:    string
  label:   string
  icon:    React.ElementType
  exact?:  boolean
  badge?:  number
  urgent?: boolean
}

const NAV_MAIN: NavItem[] = [
  { href: '/',           label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { href: '/nps',        label: 'NPS',          icon: BarChart3 },
  { href: '/respuestas', label: 'Respuestas',   icon: MessageSquare },
]

const NAV_OPS: NavItem[] = [
  { href: '/campanas',      label: 'Campañas',     icon: Megaphone },
  { href: '/clientes',      label: 'Clientes',      icon: Users },
  { href: '/llamados',      label: 'Llamados',      icon: Phone, urgent: true },
  { href: '/sin-respuesta', label: 'Sin respuesta', icon: Clock },
]

const NAV_SYSTEM: NavItem[] = [
  { href: '/configuracion', label: 'Configuración', icon: Settings },
]

// ─── Sub-components ───────────────────────────────────────────────

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 px-3 pt-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 first:pt-0">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const pathname = usePathname()
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href)
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
        isActive
          ? 'bg-white/10 text-white'
          : 'text-sidebar-foreground/60 hover:bg-white/[0.06] hover:text-white/90'
      )}
    >
      {isActive && (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand"
          aria-hidden
        />
      )}
      <Icon
        size={16}
        aria-hidden
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-white' : 'text-sidebar-foreground/40 group-hover:text-white/70'
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span
          className={cn(
            'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5',
            'font-mono text-[10px] font-semibold text-white',
            item.urgent ? 'bg-destructive' : 'bg-primary/80'
          )}
          aria-label={`${item.badge} pendientes`}
        >
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  )
}

// ─── Main component ───────────────────────────────────────────────

interface AppSidebarProps {
  llamadosPendientes?: number
  sinRespuestaPendientes?: number
}

export default function AppSidebar({
  llamadosPendientes = 0,
  sinRespuestaPendientes = 0,
}: AppSidebarProps) {
  const { isOpen, close } = useSidebar()
  const pathname = usePathname()

  // Cerrar al navegar en mobile
  useEffect(() => { close() }, [pathname, close])

  // Cerrar con Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, close])

  const navOpsWithBadges = NAV_OPS.map((item) => {
    if (item.href === '/llamados')      return { ...item, badge: llamadosPendientes }
    if (item.href === '/sin-respuesta') return { ...item, badge: sinRespuestaPendientes }
    return item
  })

  return (
    <>
      {/* Overlay backdrop — solo mobile */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={close}
        aria-hidden
      />

      {/* Sidebar */}
      <aside
        className={cn(
          // Mobile: fixed, desliza desde la izquierda
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar',
          'transition-transform duration-300 ease-in-out',
          'md:relative md:z-auto md:w-56 md:shrink-0 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navegación principal"
      >
        {/* Logo + close btn */}
        <div className="flex items-center gap-3 px-4 py-5">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white"
            aria-hidden
          >
            <span className="text-sm font-bold">C</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-none text-white">Crucianelli</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/35">
              NPS
            </p>
          </div>
          {/* Botón cerrar — solo visible en mobile */}
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar menú"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md
                       text-sidebar-foreground/40 transition-colors hover:bg-white/10
                       hover:text-white md:hidden"
          >
            <X size={16} aria-hidden />
          </button>
        </div>

        <div className="mx-4 h-px bg-sidebar-border" />

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-4">
            <NavGroup label="Principal">
              {NAV_MAIN.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={close} />
              ))}
            </NavGroup>

            <div className="mx-0 h-px bg-sidebar-border" />

            <NavGroup label="Operaciones">
              {navOpsWithBadges.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={close} />
              ))}
            </NavGroup>

            <div className="mx-0 h-px bg-sidebar-border" />

            <NavGroup label="Sistema">
              {NAV_SYSTEM.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={close} />
              ))}
            </NavGroup>
          </div>
        </nav>
      </aside>
    </>
  )
}
