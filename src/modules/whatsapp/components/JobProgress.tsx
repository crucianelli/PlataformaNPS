'use client'

import { useEffect, useState, useCallback } from 'react'
import Badge from '@/components/ui/Badge'
import type { JobConDetalle, JobEstado, DetalleEstado } from '../types/whatsapp.types'

interface JobProgressProps {
  jobId: string
  initialData: JobConDetalle
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

const DETALLE_BADGE: Record<DetalleEstado, 'success' | 'warning' | 'danger'> = {
  enviado:   'success',
  pendiente: 'warning',
  error:     'danger',
}

function formatFecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function JobProgress({ jobId, initialData }: JobProgressProps) {
  const [data, setData] = useState<JobConDetalle>(initialData)

  const isActive = data.estado === 'en_progreso' || data.estado === 'pendiente'

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/whatsapp/jobs/${jobId}`)
      if (res.ok) {
        const updated = await res.json()
        setData(updated)
      }
    } catch {
      // silencioso
    }
  }, [jobId])

  // Polling cada 5s mientras el job está activo
  useEffect(() => {
    if (!isActive) return
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [isActive, refresh])

  const pct = data.total_contactos > 0
    ? Math.round((data.enviados / data.total_contactos) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total',    value: data.total_contactos, color: 'text-foreground' },
          { label: 'Enviados', value: data.enviados,        color: 'text-emerald-600' },
          { label: 'Errores',  value: data.errores,         color: 'text-destructive' },
          { label: 'Pendientes', value: data.total_contactos - data.enviados - data.errores, color: 'text-amber-600' },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-border bg-card px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={ESTADO_BADGE[data.estado]}>{ESTADO_LABEL[data.estado]}</Badge>
            <span className="text-sm text-muted-foreground">{data.plantilla.nombre}</span>
          </div>
          <span className="text-sm font-semibold text-foreground">{pct}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {isActive && (
          <p className="mt-1 text-xs text-muted-foreground">Actualizando automáticamente cada 5 segundos…</p>
        )}
      </div>

      {/* Acciones */}
      {(data.estado === 'pendiente' || data.estado === 'interrumpido') && (
        <div className="rounded-lg border border-dashed border-brand/40 bg-brand/5 px-4 py-4 text-center">
          <p className="mb-3 text-sm text-foreground">
            {data.estado === 'pendiente'
              ? 'El job está listo. Hacé clic para lanzar el script en tu PC.'
              : 'El script se interrumpió. Podés retomarlo desde donde quedó.'}
          </p>
          <a
            href={`whatsapp-sender://run?job=${jobId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm
                       font-semibold text-white shadow hover:bg-brand/90 transition-colors"
          >
            {data.estado === 'pendiente' ? '▶ Ejecutar script' : '↺ Reanudar script'}
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            Requiere tener el protocol handler instalado en la PC.
          </p>
        </div>
      )}

      {/* Tabla de contactos */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-foreground">Detalle por contacto</h3>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Celular</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.detalles.map((d) => (
                <tr key={d.id} className="bg-card">
                  <td className="px-4 py-2.5 font-medium text-foreground">{d.nombre}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{d.celular}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={DETALLE_BADGE[d.estado]}>
                      {d.estado === 'enviado' ? 'Enviado' : d.estado === 'error' ? 'Error' : 'Pendiente'}
                    </Badge>
                    {d.error_mensaje && (
                      <p className="mt-0.5 text-xs text-destructive">{d.error_mensaje}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{formatFecha(d.enviado_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
