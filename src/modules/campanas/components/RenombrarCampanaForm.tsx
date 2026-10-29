'use client'

import { useActionState, useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { renombrarCampanaAction } from '@/app/(dashboard)/campanas/actions'

interface RenombrarCampanaFormProps {
  campanaId: string
  campanaNombre: string
}

export default function RenombrarCampanaForm({ campanaId, campanaNombre }: RenombrarCampanaFormProps) {
  const [editando, setEditando] = useState(false)
  const [state, formAction, isPending] = useActionState(renombrarCampanaAction, {})

  // Guardado: se cierra. El título nuevo llega con la página revalidada.
  useEffect(() => {
    if (state?.ok) setEditando(false)
  }, [state])

  if (!editando) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setEditando(true)}>
        Renombrar
      </Button>
    )
  }

  return (
    <form action={formAction} className="inline-flex flex-col gap-1">
      <input type="hidden" name="campana_id" value={campanaId} />
      <div className="flex items-center gap-2">
        <input
          name="nombre"
          defaultValue={campanaNombre}
          aria-label="Nombre de la campaña"
          maxLength={200}
          required
          autoFocus
          onFocus={(e) => e.currentTarget.select()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setEditando(false)
          }}
          className="h-9 w-72 max-w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setEditando(false)}>
          Cancelar
        </Button>
      </div>
      {state?.error && <span className="text-xs font-medium text-red-600">{state.error}</span>}
    </form>
  )
}
