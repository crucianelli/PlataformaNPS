import { Gift } from 'lucide-react'
import { getRespuestasRambla, getRegaloStats } from '@/modules/rambla/services/rambla.service'
import RamblaKPIs from '@/modules/rambla/components/RamblaKPIs'
import RamblaTable from '@/modules/rambla/components/RamblaTable'

export default async function RamblaPage() {
  const [respuestas, stats] = await Promise.all([
    getRespuestasRambla(),
    getRegaloStats(),
  ])

  return (
    <div className="mx-auto max-w-screen-2xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
          <Gift size={20} className="text-amber-600 dark:text-amber-400" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Rambla</h1>
          <p className="text-xs text-muted-foreground">Gestión de envío de presentes</p>
        </div>
      </div>

      {/* KPIs */}
      <RamblaKPIs stats={stats} />

      {/* Tabla */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Registros ({respuestas.length})
        </h2>
        <RamblaTable respuestas={respuestas} />
      </div>
    </div>
  )
}
