import Link from 'next/link'
import PageContainer from '@/components/layout/PageContainer'
import { Card, CardHeader } from '@/components/ui/Card'
import { getTiposEncuesta } from '@/modules/campanas/services/campanas.service'
import LlamadoCard from '@/modules/recordatorios/components/LlamadoCard'
import { getEncuestasNecesidadLlamado } from '@/modules/recordatorios/services/recordatorios.service'
import { AREAS_LLAMADO, type EncuestaNecesidadLlamado } from '@/modules/recordatorios/types/recordatorio.types'

export default async function LlamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const params = await searchParams
  const tipo = params.tipo

  const [encuestas, tipos] = await Promise.all([
    getEncuestasNecesidadLlamado(tipo),
    getTiposEncuesta(),
  ])

  const columnas: { key: string; label: string; encuestas: EncuestaNecesidadLlamado[] }[] =
    AREAS_LLAMADO.map((area) => ({
      key: area.value,
      label: area.label,
      encuestas: encuestas.filter((e) => e.area === area.value),
    }))

  // Con el trigger activo no debería haber OF sin área; si aparece alguna, se muestra
  // aparte para que no quede fuera del tablero.
  const sinArea = encuestas.filter((e) => e.area === null)
  if (sinArea.length > 0) {
    columnas.push({ key: 'sin_area', label: 'Sin asignar', encuestas: sinArea })
  }

  return (
    <PageContainer title={`Necesidad de llamado (${encuestas.length})`}>
      <Card className="mb-4">
        <CardHeader className="block">
          <h2 className="text-sm font-semibold text-foreground">OF pendientes de llamado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Las OF que no respondieron luego del recordatorio se reparten al azar y en partes iguales
            entre las tres áreas. Cuando el cliente responde, la OF sale del tablero sola.
          </p>
        </CardHeader>
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <Link
            href="/llamados"
            className={`inline-flex h-8 items-center rounded-full px-3.5 text-xs font-medium transition-colors border ${
              !tipo
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            Todas
          </Link>
          {tipos.map((t) => (
            <Link
              key={t.id}
              href={`/llamados?tipo=${t.id}`}
              className={`inline-flex h-8 items-center rounded-full px-3.5 text-xs font-medium transition-colors border ${
                tipo === t.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
              }`}
            >
              {t.nombre}
            </Link>
          ))}
        </div>
      </Card>

      <div className={`grid gap-4 md:grid-cols-2 ${columnas.length > 3 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
        {columnas.map((columna) => (
          <section key={columna.key} className="flex flex-col rounded-xl border border-border bg-muted/30">
            <header className="flex items-center justify-between px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">{columna.label}</h3>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium tabular-nums text-foreground">
                {columna.encuestas.length}
              </span>
            </header>
            {columna.encuestas.length === 0 ? (
              <p className="px-4 pb-6 pt-2 text-center text-sm text-muted-foreground">
                Nada pendiente.
              </p>
            ) : (
              <ul className="space-y-3 px-3 pb-3">
                {columna.encuestas.map((encuesta) => (
                  <LlamadoCard key={encuesta.id} encuesta={encuesta} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </PageContainer>
  )
}
