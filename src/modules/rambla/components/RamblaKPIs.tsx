import { Gift, CheckCircle2, Package } from 'lucide-react'
import type { RegaloStats } from '../types/rambla.types'

interface Props {
  stats: RegaloStats
}

interface KPICardProps {
  label: string
  value: number
  icon: React.ElementType
  color: 'yellow' | 'green' | 'blue'
}

function KPICard({ label, value, icon: Icon, color }: KPICardProps) {
  const colorMap = {
    yellow: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      icon: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      value: 'text-amber-700 dark:text-amber-300',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      icon: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      value: 'text-green-700 dark:text-green-300',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      icon: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      value: 'text-blue-700 dark:text-blue-300',
    },
  }

  const c = colorMap[color]

  return (
    <div className={`flex items-center gap-4 rounded-xl border border-border p-5 ${c.bg}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
        <Icon size={20} className={c.icon} aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`mt-0.5 text-3xl font-bold tabular-nums ${c.value}`}>{value}</p>
      </div>
    </div>
  )
}

export default function RamblaKPIs({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <KPICard
        label="Pendientes de envío"
        value={stats.pendientes}
        icon={Gift}
        color="yellow"
      />
      <KPICard
        label="Enviados"
        value={stats.enviados}
        icon={CheckCircle2}
        color="green"
      />
      <KPICard
        label="Total regalos"
        value={stats.total}
        icon={Package}
        color="blue"
      />
    </div>
  )
}
