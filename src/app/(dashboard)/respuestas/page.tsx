import PageContainer from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import RespuestasTable from '@/modules/dashboard/components/RespuestasTable'
import Pagination from '@/components/ui/Pagination'
import {
  getDashboardFilterOptions,
  getRespuestas,
} from '@/modules/dashboard/services/dashboard.service'
import { normalizeTecnologiaInput } from '@/lib/utils/tecnologia'
import {
  normalizeNpsAnswerStatus,
  normalizeNpsDimension,
  NPS_ANSWER_STATUS_OPTIONS,
  NPS_DIMENSION_OPTIONS,
} from '@/modules/dashboard/utils/nps'

const PAGE_SIZE = 50

export default async function RespuestasPage({
  searchParams,
}: {
  searchParams: Promise<{
    concesionario?: string
    campanaId?: string
    q?: string
    fechaDesde?: string
    fechaHasta?: string
    tecnologia?: string
    estadoNps?: string
    npsDimension?: string
    canal?: string
    page?: string
  }>
}) {
  const {
    concesionario,
    campanaId,
    q,
    fechaDesde,
    fechaHasta,
    tecnologia,
    estadoNps,
    npsDimension,
    canal,
    page: pageParam,
  } = await searchParams

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)
  const tecnologiaFilter = normalizeTecnologiaInput(tecnologia) ?? undefined
  const estadoNpsFilter = normalizeNpsAnswerStatus(estadoNps)
  const npsDimensionFilter = normalizeNpsDimension(npsDimension)
  const canalFilter = canal === 'mensaje' || canal === 'llamado' ? canal : undefined
  const [options, respuestas] = await Promise.all([
    getDashboardFilterOptions(),
    getRespuestas({
      concesionario,
      campanaId,
      q,
      fechaDesde,
      fechaHasta,
      tecnologia: tecnologiaFilter,
      estadoNps: estadoNpsFilter,
      npsDimension: npsDimensionFilter,
      canal: canalFilter,
    }),
  ])

  const total = respuestas.length
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const pagedRespuestas = respuestas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const filterParams = new URLSearchParams()
  if (q) filterParams.set('q', q)
  if (concesionario) filterParams.set('concesionario', concesionario)
  if (campanaId) filterParams.set('campanaId', campanaId)
  if (fechaDesde) filterParams.set('fechaDesde', fechaDesde)
  if (fechaHasta) filterParams.set('fechaHasta', fechaHasta)
  if (tecnologiaFilter) filterParams.set('tecnologia', tecnologiaFilter)
  if (estadoNpsFilter) filterParams.set('estadoNps', estadoNpsFilter)
  if (npsDimensionFilter) filterParams.set('npsDimension', npsDimensionFilter)
  if (canalFilter) filterParams.set('canal', canalFilter)

  const exportHref = `/api/respuestas/exportar${filterParams.toString() ? `?${filterParams.toString()}` : ''}`

  const getPageUrl = (p: number) => {
    const params = new URLSearchParams(filterParams)
    params.set('page', p.toString())
    return `/respuestas?${params.toString()}`
  }

  return (
    <PageContainer title={`Respuestas (${total})`}>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-4">
            <form className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label htmlFor="q" className="mb-1 block text-sm font-medium text-foreground">
                    Buscar
                  </label>
                  <input
                    id="q"
                    name="q"
                    defaultValue={q}
                    placeholder="Cliente, email, campaña..."
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="concesionario" className="mb-1 block text-sm font-medium text-foreground">
                    Concesionario
                  </label>
                  <select
                    id="concesionario"
                    name="concesionario"
                    defaultValue={concesionario ?? ''}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todos</option>
                    {options.concesionarios.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="campanaId" className="mb-1 block text-sm font-medium text-foreground">
                    Campaña
                  </label>
                  <select
                    id="campanaId"
                    name="campanaId"
                    defaultValue={campanaId ?? ''}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todas</option>
                    {options.campanas.map((item) => (
                      <option key={item.id ?? item.nombre} value={item.id ?? ''}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fechaDesde" className="mb-1 block text-sm font-medium text-foreground">
                    Desde
                  </label>
                  <input
                    id="fechaDesde"
                    name="fechaDesde"
                    type="date"
                    defaultValue={fechaDesde}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="tecnologia" className="mb-1 block text-sm font-medium text-foreground">
                    Tecnología
                  </label>
                  <select
                    id="tecnologia"
                    name="tecnologia"
                    defaultValue={tecnologiaFilter ?? ''}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todas</option>
                    {options.tecnologias.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="fechaHasta" className="mb-1 block text-sm font-medium text-foreground">
                    Hasta
                  </label>
                  <input
                    id="fechaHasta"
                    name="fechaHasta"
                    type="date"
                    defaultValue={fechaHasta}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label htmlFor="estadoNps" className="mb-1 block text-sm font-medium text-foreground">
                    Estado NPS
                  </label>
                  <select
                    id="estadoNps"
                    name="estadoNps"
                    defaultValue={estadoNpsFilter ?? ''}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todos</option>
                    {NPS_ANSWER_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="npsDimension" className="mb-1 block text-sm font-medium text-foreground">
                    NPS
                  </label>
                  <select
                    id="npsDimension"
                    name="npsDimension"
                    defaultValue={npsDimensionFilter ?? ''}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Cualquiera</option>
                    {NPS_DIMENSION_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="canal" className="mb-1 block text-sm font-medium text-foreground">
                    Canal
                  </label>
                  <select
                    id="canal"
                    name="canal"
                    defaultValue={canalFilter ?? ''}
                    className="block w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todos</option>
                    <option value="mensaje">Mensaje</option>
                    <option value="llamado">Llamado</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">{total} respuesta{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-md bg-muted px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    Filtrar
                  </button>
                  <a
                    href="/respuestas"
                    className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    Limpiar
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">Listado de respuestas</h2>
            <a
              href={exportHref}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-brand hover:text-brand"
            >
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
                CSV
              </span>
              Exportar
            </a>
          </CardHeader>
          <CardContent className="p-0">
            <RespuestasTable respuestas={pagedRespuestas} />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageSize={PAGE_SIZE}
              getPageUrl={getPageUrl}
              itemLabel="respuestas"
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
