import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { getPlantillas } from '@/modules/plantillas/services/plantillas.service'
import EliminarPlantillaBtn from '@/modules/plantillas/components/EliminarPlantillaBtn'

export default async function PlantillasPage() {
  const plantillas = await getPlantillas()

  return (
    <PageContainer
      title="Plantillas de encuesta"
      actions={
        <Link href="/plantillas/nueva">
          <Button>+ Nueva plantilla</Button>
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plantillas.map((p) => (
          <div key={p.id} className="flex flex-col rounded-xl border border-border bg-card p-5 gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground leading-snug">{p.nombre}</h2>
              {p.es_sistema
                ? <Badge variant="default">Sistema</Badge>
                : <Badge variant="success">Editable</Badge>
              }
            </div>

            {/* Intro */}
            {p.introduccion && (
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {p.introduccion}
              </p>
            )}

            {/* Preguntas count */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              {p.es_sistema
                ? 'Formulario fijo (no editable)'
                : `${p.preguntas.length} pregunta${p.preguntas.length !== 1 ? 's' : ''}`
              }
            </div>

            {/* Acciones */}
            <div className="mt-auto flex items-center gap-2 pt-2 border-t border-border">
              <Link
                href={`/plantillas/${p.id}/preview`}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
                Vista previa
              </Link>

              {!p.es_sistema && (
                <>
                  <Link
                    href={`/plantillas/${p.id}/editar`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                    </svg>
                    Editar
                  </Link>
                  <EliminarPlantillaBtn id={p.id} nombre={p.nombre} />
                </>
              )}
            </div>
          </div>
        ))}

        {plantillas.length === 0 && (
          <p className="col-span-full text-center text-sm text-muted-foreground py-16">
            No hay plantillas. Creá la primera.
          </p>
        )}
      </div>
    </PageContainer>
  )
}
