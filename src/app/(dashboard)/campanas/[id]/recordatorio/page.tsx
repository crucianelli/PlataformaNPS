import { notFound, redirect } from 'next/navigation'
import PageContainer from '@/components/layout/PageContainer'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { getCampanaById } from '@/modules/campanas/services/campanas.service'
import PendientesRecordatorioTable from '@/modules/recordatorios/components/PendientesRecordatorioTable'
import CrearRecordatorioForm from '@/modules/recordatorios/components/CrearRecordatorioForm'
import ConfirmarRecordatorioForm from '@/modules/recordatorios/components/ConfirmarRecordatorioForm'
import {
  getClientesPendientes,
  getRecordatorioActivo,
  puedeCrearRecordatorio,
} from '@/modules/recordatorios/services/recordatorios.service'

export default async function RecordatorioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [campana, recordatorioActivo, pendientes, permisoCreacion] = await Promise.all([
    getCampanaById(id).catch(() => null),
    getRecordatorioActivo(id),
    getClientesPendientes(id),
    puedeCrearRecordatorio(id),
  ])

  if (!campana) notFound()

  const puedeInicializar = !recordatorioActivo && permisoCreacion.allowed

  if (!recordatorioActivo && !puedeInicializar) {
    redirect(`/campanas/${id}`)
  }

  return (
    <PageContainer title={`Recordatorio · ${campana.nombre}`}>
      <div className="space-y-6">
        {!recordatorioActivo ? (
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-foreground">
                Preparar recordatorio {permisoCreacion.nextNumero}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Se crearán registros de envío para todos los clientes que todavía no respondieron.
              </p>
            </CardHeader>
            <CardContent>
              <CrearRecordatorioForm campanaId={id} />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Recordatorio {recordatorioActivo.numero_recordatorio}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Exporta los clientes pendientes, realiza el envío externo y luego confirma este recordatorio.
                  </p>
                </div>
                <a
                  href={`/api/campanas/${id}/exportar`}
                  className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium bg-muted text-foreground hover:bg-muted transition-colors"
                >
                  Exportar pendientes
                </a>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Clientes pendientes</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{pendientes.length}</p>
                  </div>
                  <div className="rounded-lg border border-border px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
                    <p className="mt-1 text-lg font-semibold text-yellow-700">pendiente_envio</p>
                  </div>
                  <div className="rounded-lg border border-border px-4 py-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Acción</p>
                    <p className="mt-1 text-sm text-muted-foreground">Confirmar manualmente después del envío externo</p>
                  </div>
                </div>

                <ConfirmarRecordatorioForm
                  campanaId={id}
                  numeroRecordatorio={recordatorioActivo.numero_recordatorio}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-foreground">Clientes incluidos en este recordatorio</h2>
              </CardHeader>
              <CardContent className="p-0">
                <PendientesRecordatorioTable clientes={pendientes} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  )
}
