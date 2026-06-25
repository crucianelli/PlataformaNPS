import { Gift } from 'lucide-react'
import { getRespuestasRambla, getRegaloStats, RAMBLA_PAGE_SIZE } from '@/modules/rambla/services/rambla.service'
import RamblaKPIs from '@/modules/rambla/components/RamblaKPIs'
import RamblaTable from '@/modules/rambla/components/RamblaTable'
import RamblaFiltros from '@/modules/rambla/components/RamblaFiltros'
import Pagination from '@/components/ui/Pagination'
import type { RamblaFiltros as Filtros, FiltroTipo } from '@/modules/rambla/types/rambla.types'

interface SearchParams {
  desde?: string
  hasta?: string
  tipo?: string
  page?: string
}

export default async function RamblaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const desde = params.desde
  const hasta = params.hasta
  const tipo: FiltroTipo = params.tipo === 'envio' ? 'envio' : 'respuesta'
  const page = Math.max(1, Number(params.page ?? 1))

  const filtros: Filtros = { desde, hasta, tipo }

  const [result, stats] = await Promise.all([
    getRespuestasRambla(filtros, page),
    getRegaloStats(filtros),
  ])

  const totalPages = Math.ceil(result.total / RAMBLA_PAGE_SIZE)

  function getPageUrl(p: number) {
    const sp = new URLSearchParams()
    if (tipo !== 'respuesta') sp.set('tipo', tipo)
    if (desde) sp.set('desde', desde)
    if (hasta) sp.set('hasta', hasta)
    if (p > 1) sp.set('page', String(p))
    const qs = sp.toString()
    return `/rambla${qs ? '?' + qs : ''}`
  }

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

      {/* Filtros */}
      <RamblaFiltros desde={desde} hasta={hasta} tipo={tipo} />

      {/* KPIs — reflejan el período y tipo de filtro activo */}
      <RamblaKPIs stats={stats} tipo={tipo} />

      {/* Tabla */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Registros ({result.total})
        </h2>
        <RamblaTable respuestas={result.data} filtros={filtros} />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={result.total}
          pageSize={RAMBLA_PAGE_SIZE}
          getPageUrl={getPageUrl}
          itemLabel="registros"
        />
      </div>
    </div>
  )
}
