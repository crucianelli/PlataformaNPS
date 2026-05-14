'use client'

import { useActionState } from 'react'
import { cambiarEstadoCampanaAction } from '@/app/(dashboard)/campanas/actions'
import type { CampanaEstado } from '../types/campana.types'
import { Card, CardContent } from '@/components/ui/Card'

const ESTADOS: CampanaEstado[] = ['activa', 'completada', 'archivada']

interface CambiarEstadoFormProps {
  campanaId: string
  estadoActual: string
}

export default function CambiarEstadoForm({ campanaId, estadoActual }: CambiarEstadoFormProps) {
  const [state, formAction, isPending] = useActionState(cambiarEstadoCampanaAction, {})

  return (
    <Card>
      <CardContent className="py-3 flex items-center gap-4">
        <span className="text-sm text-muted-foreground font-medium shrink-0">Cambiar estado:</span>
        <form action={formAction} className="flex items-center gap-2 flex-wrap">
          <input type="hidden" name="campana_id" value={campanaId} />
          {ESTADOS.filter((e) => e !== estadoActual).map((estado) => (
            <button
              key={estado}
              name="estado"
              value={estado}
              type="submit"
              disabled={isPending}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Marcar como {estado}
            </button>
          ))}
        </form>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </CardContent>
    </Card>
  )
}
