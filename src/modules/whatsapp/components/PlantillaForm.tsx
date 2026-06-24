'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { crearPlantillaAction, editarPlantillaAction } from '@/app/(dashboard)/whatsapp/actions'
import type { PlantillaWhatsapp, PlantillaTipo } from '../types/whatsapp.types'

interface PlantillaFormProps {
  plantilla?: PlantillaWhatsapp
}

const TIPO_LABELS: Record<PlantillaTipo, string> = {
  inicial:        'Envío inicial',
  recordatorio:   'Recordatorio',
  personalizado:  'Personalizado',
}

const VARIABLES = ['{nombre}', '{url}']

export default function PlantillaForm({ plantilla }: PlantillaFormProps) {
  const isEdit = !!plantilla
  const router = useRouter()

  const action = isEdit ? editarPlantillaAction : crearPlantillaAction
  const [state, formAction, isPending] = useActionState(action, {})

  const [lineas, setLineas] = useState<string[]>(
    plantilla?.lineas ?? ['¡Hola {nombre}! 👋', '', '👉 {url}']
  )
  const [tipo, setTipo] = useState<PlantillaTipo>(plantilla?.tipo ?? 'inicial')

  // Redirigir al éxito
  if (state.success) {
    router.push('/whatsapp/plantillas')
  }

  const addLinea = () => setLineas((prev) => [...prev, ''])
  const removeLinea = (i: number) => setLineas((prev) => prev.filter((_, idx) => idx !== i))
  const updateLinea = (i: number, val: string) =>
    setLineas((prev) => prev.map((l, idx) => (idx === i ? val : l)))

  const previewMensaje = lineas
    .map((l) => l.replace(/\{nombre\}/g, 'Juan García').replace(/\{url\}/g, 'https://ejemplo.com/encuesta?token=abc123'))
    .join('\n')

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={plantilla.id} />}
      <input type="hidden" name="lineas" value={JSON.stringify(lineas)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ── Columna izquierda: editor ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Datos de la plantilla</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nombre de la plantilla"
                name="nombre"
                required
                placeholder="Ej: Envío inicial Cosecha 2026"
                defaultValue={plantilla?.nombre}
                disabled={isPending}
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Tipo</label>
                <div className="flex gap-2">
                  {(Object.keys(TIPO_LABELS) as PlantillaTipo[]).map((t) => (
                    <label key={t} className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="radio"
                        name="tipo"
                        value={t}
                        checked={tipo === t}
                        onChange={() => setTipo(t)}
                        className="accent-brand"
                      />
                      <span className="text-sm">{TIPO_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Input
                label="Ruta de imagen (opcional)"
                name="ruta_imagen"
                placeholder="Ej: C:\Users\rasef\imagen.jpeg"
                defaultValue={plantilla?.ruta_imagen ?? ''}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Ruta completa a la imagen en la PC donde se ejecuta el script.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Líneas del mensaje</h3>
              <div className="flex gap-1.5">
                {VARIABLES.map((v) => (
                  <span
                    key={v}
                    className="rounded bg-brand/15 px-2 py-0.5 font-mono text-xs text-brand"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {lineas.map((linea, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={linea}
                    onChange={(e) => updateLinea(i, e.target.value)}
                    placeholder={linea === '' ? '(línea vacía = salto de párrafo)' : ''}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm
                               text-foreground placeholder:text-muted-foreground/50
                               focus:outline-none focus:ring-2 focus:ring-brand/40"
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => removeLinea(i)}
                    disabled={lineas.length <= 1 || isPending}
                    className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground
                               hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    title="Eliminar línea"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addLinea}
                disabled={isPending}
                className="mt-1 w-full border border-dashed border-border"
              >
                + Agregar línea
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Columna derecha: preview ── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold">Preview del mensaje</h3>
              <p className="text-xs text-muted-foreground">
                Así se verá el mensaje con datos de ejemplo.
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-[#DCF8C6] p-4 font-[system-ui] text-sm text-[#111] shadow-sm">
                <pre className="whitespace-pre-wrap break-words leading-relaxed">
                  {previewMensaje || '(sin contenido)'}
                </pre>
              </div>
              <p className="mt-2 text-right text-xs text-muted-foreground">
                {lineas.filter(Boolean).length} líneas con texto ·{' '}
                {previewMensaje.length} caracteres
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/whatsapp/plantillas')}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear plantilla'}
        </Button>
      </div>
    </form>
  )
}
