'use client'

import { useRouter, usePathname } from 'next/navigation'
import { CalendarRange, X, Send, ClipboardList } from 'lucide-react'
import type { FiltroTipo } from '../types/rambla.types'

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

type MesAtajo = { label: string; desde: string; hasta: string }

function getMesesAtajos(): MesAtajo[] {
  const now = new Date()
  return [0, -1, -2, -3].map((offset) => {
    const inicio = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const fin = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
    const nombre = inicio.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    return {
      label: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      desde: toDateStr(inicio),
      hasta: toDateStr(fin),
    }
  })
}

interface Props {
  desde?: string
  hasta?: string
  tipo?: FiltroTipo
}

export default function RamblaFiltros({ desde, hasta, tipo = 'respuesta' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const meses = getMesesAtajos()

  function navigate(params: { desde?: string; hasta?: string; tipo?: FiltroTipo }) {
    const sp = new URLSearchParams()
    const t = params.tipo ?? tipo
    if (t !== 'respuesta') sp.set('tipo', t)
    if (params.desde) sp.set('desde', params.desde)
    if (params.hasta) sp.set('hasta', params.hasta)
    const qs = sp.toString()
    router.push(`${pathname}${qs ? '?' + qs : ''}`)
  }

  function handleTipo(t: FiltroTipo) {
    navigate({ tipo: t, desde, hasta })
  }

  function handleDesde(val: string) {
    navigate({ desde: val || undefined, hasta })
  }

  function handleHasta(val: string) {
    navigate({ desde, hasta: val || undefined })
  }

  const hasFilter = !!(desde || hasta)

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card px-4 py-3">
      {/* Toggle tipo de filtro */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Filtrar por:</span>
        <div className="flex overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() => handleTipo('respuesta')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              tipo === 'respuesta'
                ? 'bg-amber-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <ClipboardList size={12} aria-hidden />
            Fecha de encuesta
          </button>
          <button
            type="button"
            onClick={() => handleTipo('envio')}
            className={`inline-flex items-center gap-1.5 border-l border-border px-3 py-1.5 text-xs font-medium transition-colors ${
              tipo === 'envio'
                ? 'bg-amber-500 text-white'
                : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <Send size={12} aria-hidden />
            Fecha de envío
          </button>
        </div>
        {tipo === 'envio' && (
          <span className="text-xs text-muted-foreground">
            — para cruzar con la factura de Rambla
          </span>
        )}
        {tipo === 'respuesta' && (
          <span className="text-xs text-muted-foreground">
            — para ver qué regalos hay que despachar
          </span>
        )}
      </div>

      {/* Atajos por mes + rango personalizado */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Mes:</span>
          {meses.map((m) => {
            const active = m.desde === desde && m.hasta === hasta
            return (
              <button
                key={m.label}
                type="button"
                onClick={() => navigate({ desde: m.desde, hasta: m.hasta })}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        <div className="hidden h-4 w-px bg-border sm:block" />

        <div className="flex items-center gap-2">
          <CalendarRange size={13} className="shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-xs font-medium text-muted-foreground">Desde:</span>
          <input
            type="date"
            value={desde ?? ''}
            onChange={e => handleDesde(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-xs text-muted-foreground">Hasta:</span>
          <input
            type="date"
            value={hasta ?? ''}
            min={desde}
            onChange={e => handleHasta(e.target.value)}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => navigate({ tipo })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={11} aria-hidden />
            Limpiar fechas
          </button>
        )}
      </div>
    </div>
  )
}
