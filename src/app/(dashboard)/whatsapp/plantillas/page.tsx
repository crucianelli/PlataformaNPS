import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import Button from '@/components/ui/Button'
import { getPlantillas } from '@/modules/whatsapp/services/whatsapp.service'
import PlantillasTable from '@/modules/whatsapp/components/PlantillasTable'

export default async function PlantillasPage() {
  const plantillas = await getPlantillas()

  return (
    <PageContainer
      title="Plantillas WhatsApp"
      actions={
        <Link href="/whatsapp/plantillas/nueva">
          <Button>Nueva plantilla</Button>
        </Link>
      }
    >
      <PlantillasTable plantillas={plantillas} />
    </PageContainer>
  )
}
