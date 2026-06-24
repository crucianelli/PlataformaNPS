import { notFound } from 'next/navigation'
import PageContainer from '@/components/layout/PageContainer'
import PlantillaForm from '@/modules/whatsapp/components/PlantillaForm'
import { getPlantillaById } from '@/modules/whatsapp/services/whatsapp.service'

export default async function EditarPlantillaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const plantilla = await getPlantillaById(id)
  if (!plantilla) notFound()

  return (
    <PageContainer title={`Editar: ${plantilla.nombre}`}>
      <PlantillaForm plantilla={plantilla} />
    </PageContainer>
  )
}
