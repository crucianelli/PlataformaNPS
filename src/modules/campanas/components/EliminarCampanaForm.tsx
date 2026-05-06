'use client'

import { useActionState } from 'react'
import Button from '@/components/ui/Button'
import { eliminarCampanaAction } from '@/app/(dashboard)/campanas/actions'

interface EliminarCampanaFormProps {
  campanaId: string
  campanaNombre: string
  compact?: boolean
}

export default function EliminarCampanaForm({
  campanaId,
  campanaNombre,
  compact = false,
}: EliminarCampanaFormProps) {
  const [state, formAction, isPending] = useActionState(eliminarCampanaAction, {})

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Eliminar la campana "${campanaNombre}"? Se eliminaran sus encuestas, envios y respuestas asociadas.`
        )
        if (!confirmed) event.preventDefault()
      }}
      className={compact ? 'inline-flex flex-col items-end gap-1' : 'inline-flex flex-col gap-1'}
    >
      <input type="hidden" name="campana_id" value={campanaId} />
      <Button type="submit" variant="danger" size="sm" disabled={isPending}>
        {isPending ? 'Eliminando...' : 'Eliminar'}
      </Button>
      {state?.error && (
        <span className="max-w-48 text-right text-xs font-medium text-red-600">{state.error}</span>
      )}
    </form>
  )
}
