import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import Badge from '@/components/ui/Badge'
import Pagination from '@/components/ui/Pagination'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import MarcarSinRespuestaForm from '@/modules/recordatorios/components/MarcarSinRespuestaForm'
import { getEncuestasNecesidadLlamado, LLAMADOS_PAGE_SIZE } from '@/modules/recordatorios/services/recordatorios.service'

export default async function LlamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))

  const { data: encuestas, total } = await getEncuestasNecesidadLlamado(page)
  const totalPages = Math.ceil(total / LLAMADOS_PAGE_SIZE)

  return (
    <PageContainer title={`Necesidad de llamado (${total})`}>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">OF pendientes de llamado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Desde esta vista se gestionan las OF que no respondieron luego del recordatorio.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {encuestas.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No hay OF en necesidad de llamado.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaña</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>OF</TableHead>
                    <TableHead>Concesionario</TableHead>
                    <TableHead>Teléfono 1</TableHead>
                    <TableHead>Teléfono 2</TableHead>
                    <TableHead>Teléfono 3</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encuestas.map((encuesta) => (
                    <TableRow key={encuesta.id}>
                      <TableCell>{encuesta.campana?.nombre ?? '—'}</TableCell>
                      <TableCell className="font-medium">{encuesta.cliente?.nombre ?? '—'}</TableCell>
                      <TableCell>{encuesta.cliente?.orden_fabricacion ?? '—'}</TableCell>
                      <TableCell>{encuesta.cliente?.concesionario ?? '—'}</TableCell>
                      <TableCell>{encuesta.cliente?.telefono ?? '—'}</TableCell>
                      <TableCell>{encuesta.cliente?.telefono_2 ?? '—'}</TableCell>
                      <TableCell>{encuesta.cliente?.telefono_3 ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant="warning">necesidad_de_llamado</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-2">
                          <Link
                            href={`/encuesta?token=${encuesta.token}`}
                            className="text-sm font-medium text-brand hover:underline"
                          >
                            Abrir encuesta
                          </Link>
                          <MarcarSinRespuestaForm encuestaId={encuesta.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                pageSize={LLAMADOS_PAGE_SIZE}
                getPageUrl={(p) => `/llamados${p > 1 ? `?page=${p}` : ''}`}
                itemLabel="OF"
              />
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  )
}
