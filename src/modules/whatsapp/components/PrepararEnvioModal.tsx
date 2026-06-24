'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import { crearJobAction } from '@/app/(dashboard)/whatsapp/actions'
import { renderizarMensaje } from '@/modules/whatsapp/utils/renderizar'
import type { PlantillaWhatsapp, PlantillaTipo } from '../types/whatsapp.types'

interface PrepararEnvioModalProps {
  campanaId: string
  campanaNombre: string
  plantillas: PlantillaWhatsapp[]
  totalPendientes: number
  onClose: () => void
}

const TIPO_LABEL: Record<PlantillaTipo, string> = {
  inicial:       'Inicial',
  recordatorio:  'Recordatorio',
  personalizado: 'Personalizado',
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export default function PrepararEnvioModal({
  campanaId,
  campanaNombre,
  plantillas,
  totalPendientes,
  onClose,
}: PrepararEnvioModalProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(crearJobAction, {})
  const [plantillaId, setPlantillaId] = useState<string>(plantillas[0]?.id ?? '')
  const [step, setStep] = useState<'seleccionar' | 'confirmar'>('seleccionar')

  const plantillaSeleccionada = plantillas.find((p) => p.id === plantillaId)

  // Al éxito, redirigir al job
  if (state.success && state.id) {
    router.push(`/whatsapp/jobs/${state.id}`)
    return null
  }

  const previewMensaje = plantillaSeleccionada
    ? renderizarMensaje(
        plantillaSeleccionada.lineas,
        'Juan García',
        `${APP_URL}/encuesta?token=ejemplo`,
      )
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Preparar envío WhatsApp</h2>
            <p className="text-sm text-muted-foreground">{campanaNombre}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground
                       hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form action={formAction}>
          <input type="hidden" name="campana_id" value={campanaId} />
          <input type="hidden" name="plantilla_id" value={plantillaId} />

          <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
            {step === 'seleccionar' ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 px-4 py-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{totalPendientes}</span> contactos pendientes
                    recibirán este mensaje.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Elegir plantilla</p>
                  <div className="space-y-2">
                    {plantillas.filter((p) => p.activa).map((p) => (
                      <label
                        key={p.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
                          ${plantillaId === p.id
                            ? 'border-brand bg-brand/5'
                            : 'border-border hover:border-border/80 hover:bg-muted/30'
                          }`}
                      >
                        <input
                          type="radio"
                          name="plantilla_radio"
                          value={p.id}
                          checked={plantillaId === p.id}
                          onChange={() => setPlantillaId(p.id)}
                          className="mt-0.5 accent-brand"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{p.nombre}</span>
                            <Badge variant={p.tipo === 'inicial' ? 'success' : p.tipo === 'recordatorio' ? 'info' : 'default'}>
                              {TIPO_LABEL[p.tipo]}
                            </Badge>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {p.lineas[0]}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {plantillaSeleccionada && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-foreground">Preview</p>
                    <div className="rounded-xl bg-[#DCF8C6] p-4 font-[system-ui] text-sm text-[#111]">
                      <pre className="whitespace-pre-wrap break-words leading-relaxed">
                        {previewMensaje}
                      </pre>
                    </div>
                    {plantillaSeleccionada.ruta_imagen && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Con imagen: {plantillaSeleccionada.ruta_imagen}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Campaña</span>
                      <span className="font-medium">{campanaNombre}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plantilla</span>
                      <span className="font-medium">{plantillaSeleccionada?.nombre}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Contactos</span>
                      <span className="font-medium">{totalPendientes}</span>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-sm text-muted-foreground">
                  Al confirmar se crea el job. Después usás el botón{' '}
                  <strong>▶ Ejecutar</strong> para lanzar el script en tu PC.
                </p>
              </div>
            )}
          </div>

          {state.error && (
            <div className="px-6 pb-3">
              <p className="rounded bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            {step === 'seleccionar' ? (
              <>
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button
                  type="button"
                  disabled={!plantillaId}
                  onClick={() => setStep('confirmar')}
                >
                  Siguiente →
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="ghost" onClick={() => setStep('seleccionar')}>
                  ← Volver
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creando job...' : 'Confirmar y crear job'}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
