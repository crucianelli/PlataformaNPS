'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Clock, RotateCcw, Save, FileDown } from 'lucide-react'
import { actualizarRegaloEstadoAction, guardarSeguimientoAction } from '@/app/(dashboard)/rambla/actions'
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
  const label = estadoActual === 'enviado' ? 'Marcar pendiente' : 'Marcar enviado'
  const isEnviar = estadoActual === 'pendiente_envio'

  return (
    <button
      type="button"
      onClick={() => startTransition(() => actualizarRegaloEstadoAction(respuestaId, nuevoEstado))}
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

function SeguimientoCell({
  respuestaId,
  numeroActual,
  fechaActual,
}: {
  respuestaId: string
  numeroActual: string | null
  fechaActual: string | null
}) {
  const [valor, setValor] = useState(numeroActual ?? '')
  const [isPending, startTransition] = useTransition()
  const [guardado, setGuardado] = useState(false)

  const sinCambios = valor.trim() === (numeroActual ?? '').trim()

  function handleGuardar() {
    startTransition(async () => {
      await guardarSeguimientoAction(respuestaId, valor)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2000)
    })
  }

  return (
    <div className="flex min-w-[180px] flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={valor}
          onChange={e => setValor(e.target.value)}
          placeholder="Ingresar N° de seguimiento"
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleGuardar}
          disabled={isPending || sinCambios || !valor.trim()}
          title="Guardar"
          className="flex-shrink-0 rounded-md p-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {isPending
            ? <RotateCcw size={12} className="animate-spin" aria-hidden />
            : guardado
              ? <CheckCircle2 size={12} className="text-green-600" aria-hidden />
              : <Save size={12} aria-hidden />
          }
        </button>
      </div>
      {fechaActual && (
        <span className="text-[10px] text-muted-foreground">
          Cargado el {new Date(fechaActual).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          {' '}a las {new Date(fechaActual).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
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

function exportarPDF(respuestas: RespuestaRambla[]) {
  const win = window.open('', '_blank')
  if (!win) return

  const filas = respuestas.map(r => `
    <tr>
      <td>${formatFecha(r.fecha_respuesta)}</td>
      <td>${r.nombre_apellido ?? '—'}</td>
      <td>${r.maquina_modelo ?? '—'}</td>
      <td>${buildDireccion(r)}</td>
      <td>${r.localidad ?? '—'} ${r.codigo_postal ?? ''}</td>
      <td>${r.provincia ?? '—'}</td>
      <td>${r.email ?? '—'}</td>
      <td>${r.telefono ?? '—'}</td>
      <td>${r.numero_seguimiento ?? '—'}</td>
      <td>${r.fecha_seguimiento ? new Date(r.fecha_seguimiento).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}</td>
      <td>${r.regalo_estado === 'enviado' ? 'Enviado' : 'Pendiente'}</td>
    </tr>
  `).join('')

  win.document.write(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Rambla — Listado de envíos</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; font-size: 10px; color: #111; padding: 20px; }
        h1 { font-size: 14px; margin-bottom: 4px; }
        p { font-size: 10px; color: #555; margin-bottom: 14px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f4f4f4; text-align: left; padding: 5px 6px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 2px solid #ddd; }
        td { padding: 5px 6px; border-bottom: 1px solid #eee; vertical-align: top; }
        tr:hover td { background: #fafafa; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>Rambla — Listado de envíos</h1>
      <p>Generado el ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${respuestas.length} registro${respuestas.length !== 1 ? 's' : ''}</p>
      <table>
        <thead>
          <tr>
            <th>Fecha encuesta</th>
            <th>Nombre</th>
            <th>Producto</th>
            <th>Dirección</th>
            <th>Localidad / CP</th>
            <th>Provincia</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>N° Seguimiento</th>
            <th>Fecha seguimiento</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <script>window.onload = () => { window.print() }<\/script>
    </body>
    </html>
  `)
  win.document.close()
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
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => exportarPDF(respuestas)}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <FileDown size={13} aria-hidden />
          Exportar PDF
        </button>
      </div>

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
                Producto
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
                N° Seguimiento
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
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {r.maquina_modelo ?? '—'}
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
                  <SeguimientoCell
                    respuestaId={r.id}
                    numeroActual={r.numero_seguimiento}
                    fechaActual={r.fecha_seguimiento}
                  />
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
    </div>
  )
}
