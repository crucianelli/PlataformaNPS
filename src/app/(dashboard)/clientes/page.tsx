import { getClientes } from '@/modules/clientes/services/clientes.service'
import ClientesTable from '@/modules/clientes/components/ClientesTable'
import ClienteForm from '@/modules/clientes/components/ClienteForm'
import ImportarClientesCSV from '@/modules/clientes/components/ImportarClientesCSV'
import PageContainer from '@/components/layout/PageContainer'
import Pagination from '@/components/ui/Pagination'
import { Card, CardContent } from '@/components/ui/Card'

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const { data: clientes, count, pageSize } = await getClientes(q, page)
  const totalPages = Math.ceil(count / pageSize)

  const getPageUrl = (p: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    params.set('page', p.toString())
    return `/clientes?${params.toString()}`
  }

  return (
    <PageContainer title={`Clientes (${count})`}>
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-4 pb-4">
            <form method="GET" className="flex gap-3">
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nombre o concesionario..."
                className="block w-full max-w-sm rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="rounded-md bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Buscar
              </button>
              {q && (
                <a
                  href="/clientes"
                  className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Limpiar
                </a>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <ClientesTable clientes={clientes} />
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={count}
              pageSize={pageSize}
              getPageUrl={getPageUrl}
            />
          </CardContent>
        </Card>

        <ImportarClientesCSV />
        <ClienteForm />
      </div>
    </PageContainer>
  )
}
