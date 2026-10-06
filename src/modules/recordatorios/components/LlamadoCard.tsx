'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { formatTipoMaquina } from '@/lib/utils/tipoMaquina'
import { agregarMedidaAction } from '@/app/(dashboard)/llamados/actions'
import MarcarSinRespuestaForm from './MarcarSinRespuestaForm'
import MedidaItem from './MedidaItem'
import type { EncuestaNecesidadLlamado } from '../types/recordatorio.types'

const tipoBadge: Record<string, 'info' | 'warning'> = {
  inicio_garantia: 'info',
  fin_garantia:    'warning',
}

interface LlamadoCardProps {
  encuesta: EncuestaNecesidadLlamado
}

export default function LlamadoCard({ encuesta }: LlamadoCardProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(agregarMedidaAction, {})
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state])

  const telefonos = [
    encuesta.cliente?.telefono,
    encuesta.cliente?.telefono_2,
    encuesta.cliente?.telefono_3,
  ].filter((t): t is string => Boolean(t))

  return (
    <li className="rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-sm)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{encuesta.cliente?.nombre ?? '—'}</p>
        {encuesta.campana?.tipoSlug && encuesta.campana?.tipoNombre && (
          <Badge variant={tipoBadge[encuesta.campana.tipoSlug] ?? 'default'}>
            {encuesta.campana.tipoNombre}
          </Badge>
        )}
      </div>

      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
        <dt className="text-muted-foreground">OF</dt>
        <dd className="text-foreground">{encuesta.cliente?.orden_fabricacion ?? '—'}</dd>
        <dt className="text-muted-foreground">Máquina</dt>
        <dd className="text-foreground">{formatTipoMaquina(encuesta.cliente?.tipo_maquina)}</dd>
        <dt className="text-muted-foreground">Concesionario</dt>
        <dd className="text-foreground">{encuesta.cliente?.concesionario ?? '—'}</dd>
        <dt className="text-muted-foreground">Campaña</dt>
        <dd className="text-foreground">{encuesta.campana?.nombre ?? '—'}</dd>
        <dt className="text-muted-foreground">Teléfonos</dt>
        <dd className="flex flex-col">
          {telefonos.length > 0 ? (
            telefonos.map((tel) => (
              <a key={tel} href={`tel:${tel}`} className="text-brand hover:underline">
                {tel}
              </a>
            ))
          ) : (
            <span className="text-foreground">—</span>
          )}
        </dd>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={cn('h-3.5 w-3.5 shrink-0 transition-transform duration-200', open && 'rotate-90')}
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
              clipRule="evenodd"
            />
          </svg>
          Medidas {encuesta.medidas.length > 0 ? `(${encuesta.medidas.length})` : ''}
        </button>
        <Link
          href={`/encuesta?token=${encuesta.token}`}
          className="text-sm font-medium text-brand hover:underline"
        >
          Abrir encuesta
        </Link>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {encuesta.medidas.length > 0 ? (
            <ul className="space-y-3">
              {encuesta.medidas.map((medida) => (
                <MedidaItem key={medida.id} medida={medida} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Todavía no hay medidas cargadas.</p>
          )}

          <form ref={formRef} action={formAction} className="space-y-2">
            <input type="hidden" name="encuestaId" value={encuesta.id} />
            <textarea
              name="comentario"
              rows={2}
              required
              minLength={3}
              maxLength={2000}
              disabled={isPending}
              placeholder="Agregar medida (ej: llamé, no atiende)"
              className="block w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button type="submit" variant="secondary" size="sm" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Agregar medida'}
            </Button>
          </form>
          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </div>
      )}

      <div className="mt-3">
        <MarcarSinRespuestaForm encuestaId={encuesta.id} />
      </div>
    </li>
  )
}
