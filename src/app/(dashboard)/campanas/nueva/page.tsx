import NuevaCampanaForm from '@/modules/campanas/components/NuevaCampanaForm'
import PageContainer from '@/components/layout/PageContainer'
import { getTiposEncuesta, getOFsElegiblesFinGarantia } from '@/modules/campanas/services/campanas.service'

export default async function NuevaCampanaPage() {
  const [tipos, ofsElegibles] = await Promise.all([
    getTiposEncuesta(),
    getOFsElegiblesFinGarantia(),
  ])

  return (
    <PageContainer title="Nueva campaña">
      <div className="max-w-4xl">
        <NuevaCampanaForm tipos={tipos} ofsElegibles={ofsElegibles} />
      </div>
    </PageContainer>
  )
}
