'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/hooks/use-sidebar'

export default function MobileMenuButton() {
  const { toggle } = useSidebar()

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Abrir menú de navegación"
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground
                 transition-colors duration-150 hover:bg-muted hover:text-foreground
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                 md:hidden"
    >
      <Menu size={18} aria-hidden />
    </button>
  )
}
