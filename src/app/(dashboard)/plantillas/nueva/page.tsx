import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import PlantillaFormClient from '@/modules/plantillas/components/PlantillaFormClient'
import { crearPlantillaAction } from './actions'

export default function NuevaPlantillaPage() {
  return (
    <PageContainer
      title="Nueva plantilla"
      actions={
        <Link
          href="/plantillas"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Volver
        </Link>
      }
    >
      <div className="max-w-2xl">
        <PlantillaFormClient
          action={crearPlantillaAction}
          submitLabel="Crear plantilla"
        />
      </div>
    </PageContainer>
  )
}
