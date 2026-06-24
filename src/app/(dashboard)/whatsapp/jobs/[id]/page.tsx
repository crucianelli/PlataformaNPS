import { notFound } from 'next/navigation'
import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import { getJobConDetalle } from '@/modules/whatsapp/services/whatsapp.service'
import JobProgress from '@/modules/whatsapp/components/JobProgress'

export default async function JobDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const job = await getJobConDetalle(id)
  if (!job) notFound()

  return (
    <PageContainer
      title="Detalle del envío"
      actions={
        <Link
          href="/whatsapp"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver a WhatsApp
        </Link>
      }
    >
      <JobProgress jobId={id} initialData={job} />
    </PageContainer>
  )
}
