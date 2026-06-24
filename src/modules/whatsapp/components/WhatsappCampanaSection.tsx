'use client'

import { useState } from 'react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import PrepararEnvioModal from './PrepararEnvioModal'
import type { PlantillaWhatsapp, JobConPlantilla, JobEstado } from '../types/whatsapp.types'

interface WhatsappCampanaSectionProps {
  campanaId: string
  campanaNombre: string
  plantillas: PlantillaWhatsapp[]
  jobs: JobConPlantilla[]
  totalPendientes: number
}

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

export default function WhatsappCampanaSection({
  campanaId,
  campanaNombre,
  plantillas,
  jobs,
  totalPendientes,
}: WhatsappCampanaSectionProps) {
  const [showModal, setShowModal] = useState(false)

  const plantillasActivas = plantillas.filter((p) => p.activa)

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">WhatsApp</span>
            {totalPendientes > 0 && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">
                {totalPendientes} pendientes
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowModal(true)}
            disabled={totalPendientes === 0 || plantillasActivas.length === 0}
          >
            Preparar envío
          </Button>
        </CardHeader>

        <CardContent>
          {jobs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No hay envíos WhatsApp para esta campaña todavía.
            </p>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={ESTADO_BADGE[job.estado]}>
                        {ESTADO_LABEL[job.estado]}
                      </Badge>
                      <span className="truncate text-sm text-foreground">
                        {job.plantilla.nombre}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatFecha(job.created_at)} ·{' '}
                      {job.enviados}/{job.total_contactos} enviados
                      {job.errores > 0 && ` · ${job.errores} errores`}
                    </p>
                  </div>

                  <div className="ml-3 flex items-center gap-2">
                    {job.estado === 'pendiente' && (
                      <a
                        href={`whatsapp-sender://run?job=${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5
                                   text-xs font-semibold text-white hover:bg-brand/90 transition-colors"
                      >
                        ▶ Ejecutar
                      </a>
                    )}
                    {job.estado === 'interrumpido' && (
                      <a
                        href={`whatsapp-sender://run?job=${job.id}`}
                        className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-1.5
                                   text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                      >
                        ↺ Reanudar
                      </a>
                    )}
                    <Link
                      href={`/whatsapp/jobs/${job.id}`}
                      className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {plantillasActivas.length === 0 && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Necesitás{' '}
              <Link href="/whatsapp/plantillas/nueva" className="text-brand hover:underline">
                crear al menos una plantilla activa
              </Link>{' '}
              para poder preparar un envío.
            </p>
          )}
        </CardContent>
      </Card>

      {showModal && (
        <PrepararEnvioModal
          campanaId={campanaId}
          campanaNombre={campanaNombre}
          plantillas={plantillasActivas}
          totalPendientes={totalPendientes}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
