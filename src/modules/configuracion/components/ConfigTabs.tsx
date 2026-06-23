'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface ConfigTabsProps {
  configTab: React.ReactNode
  usuariosTab: React.ReactNode
}

const TABS = [
  { id: 'config', label: 'Sistema' },
  { id: 'usuarios', label: 'Usuarios' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ConfigTabs({ configTab, usuariosTab }: ConfigTabsProps) {
  const [active, setActive] = useState<TabId>('config')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors duration-150',
              'border-b-2 -mb-px',
              active === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {active === 'config' && configTab}
      {active === 'usuarios' && usuariosTab}
    </div>
  )
}
