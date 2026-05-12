'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { crearCampanaAction } from '@/app/(dashboard)/campanas/actions'
import { parseClientesCSV, type ClienteCSVRow } from '@/lib/utils/csv'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { formatTecnologia } from '@/lib/utils/tecnologia'

const today = new Date().toISOString().split('T')[0]

export default function NuevaCampanaForm() {
  const [state, formAction, isPending] = useActionState(crearCampanaAction, {})
  const [preview, setPreview] = useState<ClienteCSVRow[]>([])
  const [csvError, setCsvError] = useState<string>('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setPreview([]); return }

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const rows = parseClientesCSV(ev.target?.result as string)
        setPreview(rows)
        setCsvError('')
      } catch (err: unknown) {
        setPreview([])
        setCsvError(err instanceof Error ? err.message : 'Error al leer el archivo.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Datos de la campaña */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Datos de la campaña</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre de la campaña"
            name="nombre"
            placeholder="Ej: Campaña Junio 2025"
            required
            disabled={isPending}
          />
          <Input
            label="Fecha"
            name="fecha"
            type="date"
            defaultValue={today}
            required
            disabled={isPending}
          />
        </CardContent>
      </Card>

      {/* CSV */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-foreground">Clientes (CSV)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Columnas esperadas:{' '}
            <code className="bg-muted px-1 rounded text-xs">
              CONCESIONARIO, CLIENTE (según factura), ORDEN DE FABRICACION MÁQUINA, Teléfono del Cliente
            </code>
            {' '}+ opcionales <code className="bg-muted px-1 rounded text-xs">Teléfono del Cliente 2</code>, <code className="bg-muted px-1 rounded text-xs">Teléfono del Cliente 3</code> y <code className="bg-muted px-1 rounded text-xs">TECNOLOGIA</code>/<code className="bg-muted px-1 rounded text-xs">TECNOLOGÍA</code>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            name="archivo"
            type="file"
            accept=".csv,text/csv"
            required
            disabled={isPending}
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
              file:text-sm file:font-medium file:bg-muted file:text-foreground
              hover:file:bg-muted cursor-pointer"
          />

          {csvError && <p className="text-sm text-red-600">{csvError}</p>}

          {preview.length > 0 && (
            <div className="rounded-md border border-border overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                Vista previa — {preview.length} cliente{preview.length !== 1 ? 's' : ''} detectado{preview.length !== 1 ? 's' : ''}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      {['Nombre', 'Tel. 1', 'Tel. 2', 'Tel. 3', 'Concesionario', 'OF', 'Tecnología'].map((h) => (
                        <th key={h} className="px-3 py-2 text-left text-muted-foreground font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-3 py-2 text-foreground">{row.nombre}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.telefono}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.telefono_2 ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.telefono_3 ?? '—'}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.concesionario}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.orden_fabricacion}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatTecnologia(row.tecnologia)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.length > 10 && (
                <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                  y {preview.length - 10} cliente{preview.length - 10 !== 1 ? 's' : ''} más...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {state?.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/campanas"
          className="inline-flex items-center justify-center h-10 px-4 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isPending || preview.length === 0}>
          {isPending ? 'Creando campaña...' : `Crear campaña${preview.length > 0 ? ` (${preview.length} clientes)` : ''}`}
        </Button>
      </div>
    </form>
  )
}
