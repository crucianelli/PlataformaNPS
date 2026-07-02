import Link from 'next/link'
import { getCampanas, getTiposEncuesta } from '@/modules/campanas/services/campanas.service'
import CampanasTable from '@/modules/campanas/components/CampanasTable'
import PageContainer from '@/components/layout/PageContainer'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

interface Props {
  searchParams: Promise<{ tipo?: string }>
}

export default async function CampanasPage({ searchParams }: Props) {
  const { tipo } = await searchParams

  const [campanas, tipos] = await Promise.all([
    getCampanas(tipo ? { tipoEncuestaId: tipo } : undefined),
    getTiposEncuesta(),
  ])

  return (
    <PageContainer
      title="Campañas"
      actions={
        <Link href="/campanas/nueva">
          <Button>+ Nueva campaña</Button>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filtro por tipo */}
        <form className="flex items-center gap-3">
          <div className="flex gap-2">
            <a
              href="/campanas"
              className={`inline-flex h-8 items-center rounded-full px-3.5 text-xs font-medium transition-colors border ${
                !tipo
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              Todas
            </a>
            {tipos.map((t) => (
              <a
                key={t.id}
                href={`/campanas?tipo=${t.id}`}
                className={`inline-flex h-8 items-center rounded-full px-3.5 text-xs font-medium transition-colors border ${
                  tipo === t.id
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                }`}
              >
                {t.nombre}
              </a>
            ))}
          </div>
          {tipo && (
            <span className="text-xs text-muted-foreground">
              {campanas.length} campaña{campanas.length !== 1 ? 's' : ''}
            </span>
          )}
        </form>

        <Card>
          <CardContent className="p-0">
            <CampanasTable campanas={campanas} />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
