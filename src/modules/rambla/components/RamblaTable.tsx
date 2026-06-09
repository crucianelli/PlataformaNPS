'use client'

import { useTransition } from 'react'
import { CheckCircle2, Clock, RotateCcw } from 'lucide-react'
import { actualizarRegaloEstadoAction } from '@/app/(dashboard)/rambla/actions'
import type { RespuestaRambla } from '../types/rambla.types'

interface Props {
  respuestas: RespuestaRambla[]
}

function EstadoBadge({ estado }: { estado: RespuestaRambla['regalo_estado'] }) {
  if (estado === 'enviado') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 size={11} aria-hidden />
        Enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
      <Clock size={11} aria-hidden />
      Pendiente
    </span>
  )
}

function AccionBtn({
  respuestaId,
  estadoActual,
}: {
  respuestaId: string
  estadoActual: RespuestaRambla['regalo_estado']
}) {
  const [isPending, startTransition] = useTransition()

  const nuevoEstado = estadoActual === 'enviado' ? 'pendiente_envio' : 'enviado'
  const label    = estadoActual === 'enviado' ? 'Marcar pendiente' : 'Marcar enviado'
  const isEnviar = estadoActual === 'pendiente_envio'

  function handleClick() {
    startTransition(() => {
      actualizarRegaloEstadoAction(respuestaId, nuevoEstado)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={
        isEnviar
          ? 'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 bg-green-600 text-white hover:bg-green-700 disabled:cursor-not-allowed'
          : 'inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 bg-card text-muted-foreground hover:bg-muted disabled:cursor-not-allowed'
      }
    >
      {isPending
        ? <><RotateCcw size={11} className="animate-spin" aria-hidden />Guardando…</>
        : label
      }
    </button>
  )
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function buildDireccion(r: RespuestaRambla) {
  const partes = [r.calle_numero, r.piso_departamento].filter(Boolean)
  return partes.join(', ') || '—'
}

export default function RamblaTable({ respuestas }: Props) {
  if (respuestas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">No hay respuestas registradas todavía.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Nombre
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dirección
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Localidad
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CP
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Provincia
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teléfono
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {respuestas.map((r) => (
            <tr key={r.id} className="transition-colors hover:bg-muted/30">
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {formatFecha(r.fecha_respuesta)}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {r.nombre_apellido ?? '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {buildDireccion(r)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {r.localidad ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {r.codigo_postal ?? '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {r.provincia ?? '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {r.email ?? '—'}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {r.telefono ?? '—'}
              </td>
              <td className="px-4 py-3">
                <EstadoBadge estado={r.regalo_estado} />
              </td>
              <td className="px-4 py-3 text-right">
                <AccionBtn respuestaId={r.id} estadoActual={r.regalo_estado} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
