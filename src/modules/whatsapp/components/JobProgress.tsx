'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import Badge from '@/components/ui/Badge'
import { detenerJobAction } from '@/app/(dashboard)/whatsapp/actions'
import type { JobConDetalle, DetalleEstado } from '../types/whatsapp.types'

interface JobProgressProps {
  jobId: string
  initialData: JobConDetalle
}

/**
 * Lo que se muestra no sale solo del `estado` guardado: también importa si hay
 * un script vivo. "Interrumpido" con el script todavía andando quiere decir que
 * se pidió detenerlo y está terminando el mensaje en curso — ofrecer "Reanudar"
 * ahí arrancaba un segundo script en paralelo. Y "en progreso" sin script vivo
 * es que se cerró la ventana sin avisar.
 */
type Vista = 'corriendo' | 'deteniendo' | 'no_responde' | 'listo' | 'detenido' | 'terminado'

function calcularVista(data: JobConDetalle, pendientes: number): Vista {
  if (data.script_activo) return data.estado === 'en_progreso' ? 'corriendo' : 'deteniendo'
  if (pendientes === 0) return 'terminado'
  if (data.estado === 'pendiente') return 'listo'
  if (data.estado === 'en_progreso') return 'no_responde'
  return 'detenido'
}

const VISTA_BADGE: Record<Vista, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
  corriendo:   'info',
  deteniendo:  'warning',
  no_responde: 'danger',
  listo:       'warning',
  detenido:    'default',
  terminado:   'success',
}

const VISTA_LABEL: Record<Vista, string> = {
  corriendo:   'En progreso',
  deteniendo:  'Deteniendo…',
  no_responde: 'El script no responde',
  listo:       'Listo para ejecutar',
  detenido:    'Interrumpido',
  terminado:   'Completado',
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
  const [isDetening, startDetener] = useTransition()

  const pendientes = data.detalles.filter((d) => d.estado === 'pendiente').length
  const vista = calcularVista(data, pendientes)

  const handleDetener = () => {
    if (!confirm('¿Detener el envío? Si está mandando un mensaje lo termina, y después para.')) return
    startDetener(async () => {
      await detenerJobAction(jobId)
      setData((prev) => ({ ...prev, estado: 'interrumpido' }))
    })
  }

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

  // Polling cada 5s mientras quede algo por pasar. También con el job detenido:
  // si alguien aprieta "Reanudar", la pantalla tiene que enterarse sola.
  const seguirActualizando = vista !== 'terminado'
  useEffect(() => {
    if (!seguirActualizando) return
    const id = setInterval(refresh, 5000)
    return () => clearInterval(id)
  }, [seguirActualizando, refresh])

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
          { label: 'Pendientes', value: pendientes, color: 'text-amber-600' },
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
            <Badge variant={VISTA_BADGE[vista]}>{VISTA_LABEL[vista]}</Badge>
            <span className="text-sm text-muted-foreground">{data.plantilla.nombre}</span>
          </div>
          <div className="flex items-center gap-3">
            {vista === 'corriendo' && (
              <button
                type="button"
                onClick={handleDetener}
                disabled={isDetening}
                className="rounded-md border border-destructive/40 px-3 py-1 text-xs font-medium
                           text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {isDetening ? 'Deteniendo...' : '⏹ Detener'}
              </button>
            )}
            <span className="text-sm font-semibold text-foreground">{pct}%</span>
          </div>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {seguirActualizando && (
          <p className="mt-1 text-xs text-muted-foreground">Actualizando automáticamente cada 5 segundos…</p>
        )}
      </div>

      {vista === 'deteniendo' && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4 text-center">
          <p className="text-sm text-foreground">
            El script termina lo que está haciendo y se cierra. Suele tardar unos segundos.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cuando se cierre vas a poder reanudar el envío desde donde quedó.
          </p>
        </div>
      )}

      {/* Acciones */}
      {(vista === 'listo' || vista === 'detenido' || vista === 'no_responde') && (
        <div className="rounded-lg border border-dashed border-brand/40 bg-brand/5 px-4 py-4 text-center">
          <p className="mb-3 text-sm text-foreground">
            {vista === 'listo' && 'El job está listo. Hacé clic para lanzar el script en tu PC.'}
            {vista === 'detenido' && 'El envío quedó interrumpido. Al reanudar, solo se le manda a quien falta.'}
            {vista === 'no_responde' &&
              'El script dejó de dar señales hace más de un minuto: se cerró la ventana, se apagó la PC o se cortó internet. Podés retomarlo desde donde quedó.'}
          </p>
          <a
            href={`whatsapp-sender://run?job=${jobId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm
                       font-semibold text-white shadow hover:bg-brand/90 transition-colors"
          >
            {vista === 'listo' ? '▶ Ejecutar script' : '↺ Reanudar script'}
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
