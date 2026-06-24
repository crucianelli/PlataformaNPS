import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { getAllJobs } from '@/modules/whatsapp/services/whatsapp.service'
import type { JobEstado } from '@/modules/whatsapp/types/whatsapp.types'
import type { JobConCampana } from '@/modules/whatsapp/services/whatsapp.service'

const ESTADO_BADGE: Record<JobEstado, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
  completado:   'success',
  en_progreso:  'info',
  pendiente:    'warning',
  interrumpido: 'default',
  error:        'danger',
}

const ESTADO_LABEL: Record<JobEstado, string> = {
  completado:   'Completado',
  en_progreso:  'En progreso',
  pendiente:    'Listo para ejecutar',
  interrumpido: 'Interrumpido',
  error:        'Error',
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function WhatsappPage() {
  const jobs = await getAllJobs()

  return (
    <PageContainer
      title="WhatsApp"
      actions={
        <Link href="/whatsapp/plantillas">
          <Button variant="ghost">Ver plantillas</Button>
        </Link>
      }
    >
      <div className="space-y-5">
        {/* Setup card */}
        <div className="rounded-lg border border-dashed border-border bg-muted/30 px-5 py-4">
          <p className="text-sm font-medium text-foreground">Setup del script local</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Para poder ejecutar envíos desde esta plataforma, instalá el protocol handler en tu PC
            Windows una sola vez.
          </p>
          <Link
            href="/whatsapp/setup"
            className="mt-2 inline-flex text-sm font-medium text-brand hover:underline"
          >
            Ver instrucciones de instalación →
          </Link>
        </div>

        {/* Lista de jobs */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Historial de envíos</h2>
          {jobs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No hay envíos todavía. Creá un job desde el detalle de una campaña.
              </p>
              <Link
                href="/campanas"
                className="mt-2 inline-flex text-sm font-medium text-brand hover:underline"
              >
                Ir a campañas →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {(jobs as JobConCampana[]).map((job) => {
                const pct = job.total_contactos > 0
                  ? Math.round((job.enviados / job.total_contactos) * 100)
                  : 0

                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={ESTADO_BADGE[job.estado]}>
                          {ESTADO_LABEL[job.estado]}
                        </Badge>
                        <span className="truncate text-sm font-medium text-foreground">
                          {job.campana?.nombre ?? 'Campaña'}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{job.plantilla.nombre}</span>
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {job.enviados}/{job.total_contactos} · {formatFecha(job.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      {(job.estado === 'pendiente' || job.estado === 'interrumpido') && (
                        <a
                          href={`whatsapp-sender://run?job=${job.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5
                                     text-xs font-semibold text-white hover:bg-brand/90 transition-colors"
                        >
                          {job.estado === 'pendiente' ? '▶ Ejecutar' : '↺ Reanudar'}
                        </a>
                      )}
                      <Link
                        href={`/whatsapp/jobs/${job.id}`}
                        className="rounded px-2 py-1 text-xs text-muted-foreground
                                   hover:bg-muted hover:text-foreground transition-colors"
                      >
                        Ver detalle
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
