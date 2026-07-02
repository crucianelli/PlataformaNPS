import Link from 'next/link'
import { notFound } from 'next/navigation'
import PageContainer from '@/components/layout/PageContainer'
import Badge from '@/components/ui/Badge'
import PlantillaFormClient from '@/modules/plantillas/components/PlantillaFormClient'
import { getPlantillaById } from '@/modules/plantillas/services/plantillas.service'
import { actualizarPlantillaAction } from '../actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditarPlantillaPage({ params }: Props) {
  const { id } = await params
  const plantilla = await getPlantillaById(id)
  if (!plantilla) notFound()

  return (
    <PageContainer
      title={plantilla.nombre}
      description={plantilla.es_sistema ? 'Esta plantilla del sistema no puede modificarse.' : 'Editá el contenido de esta plantilla.'}
      actions={
        <div className="flex items-center gap-3">
          {plantilla.es_sistema
            ? <Badge variant="default">Sistema</Badge>
            : <Badge variant="success">Editable</Badge>
          }
          <Link
            href={`/plantillas/${id}/preview`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            Vista previa
          </Link>
          <Link
            href="/plantillas"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Volver
          </Link>
        </div>
      }
    >
      <div className="max-w-2xl">
        {plantilla.es_sistema ? (
          <div className="rounded-xl border border-border bg-muted/30 px-5 py-8 text-center text-sm text-muted-foreground space-y-2">
            <svg className="h-8 w-8 mx-auto text-muted-foreground/50" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <p className="font-medium text-foreground">Este formulario no es editable</p>
            <p>La encuesta de <strong>Inicio de Garantía</strong> usa un formulario fijo que no se gestiona desde este panel. Podés usar la vista previa para ver cómo se ve.</p>
          </div>
        ) : (
          <PlantillaFormClient
            action={actualizarPlantillaAction}
            id={id}
            initialNombre={plantilla.nombre}
            initialIntroduccion={plantilla.introduccion}
            initialPreguntas={plantilla.preguntas}
            submitLabel="Guardar cambios"
          />
        )}
      </div>
    </PageContainer>
  )
}
