'use client'

import { useActionState, useState } from 'react'
import Button from '@/components/ui/Button'
import { marcarSinRespuestaAction } from '@/app/(dashboard)/llamados/actions'

interface MarcarSinRespuestaFormProps {
  encuestaId: string
}

export default function MarcarSinRespuestaForm({ encuestaId }: MarcarSinRespuestaFormProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(marcarSinRespuestaAction, {})

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Marcar sin respuesta
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Marcar OF como sin respuesta</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Dejá un comentario explicando por qué la dejamos como sin respuesta. Quedará guardado para auditoría.
            </p>

            <form action={formAction} className="mt-4 space-y-3">
              <input type="hidden" name="encuestaId" value={encuestaId} />
              <div>
                <label htmlFor="comentario" className="mb-1 block text-sm font-medium text-foreground">
                  Comentario *
                </label>
                <textarea
                  id="comentario"
                  name="comentario"
                  rows={4}
                  required
                  minLength={3}
                  maxLength={2000}
                  disabled={isPending}
                  placeholder="Ej: no atiende ninguno de los teléfonos, número equivocado, etc."
                  className="block w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-red-600">{state.error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                  disabled={isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Guardando...' : 'Confirmar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
