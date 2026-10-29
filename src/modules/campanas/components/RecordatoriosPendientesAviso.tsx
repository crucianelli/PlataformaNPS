import Link from 'next/link'
import { necesitaAccion, textoEstadoRecordatorio } from '@/lib/utils/recordatorioEstado'
import type { CampanaConConteos } from '../types/campana.types'

// Recuadro arriba del listado: las campañas a las que hay que mandarles (o marcarles)
// el recordatorio, para no tener que entrar una por una.
export default function RecordatoriosPendientesAviso({ campanas }: { campanas: CampanaConConteos[] }) {
  const conAccion = campanas
    .filter((c) => necesitaAccion(c.recordatorio))
    .sort((a, b) => (a.recordatorio.tipo === 'sin_marcar' ? 0 : 1) - (b.recordatorio.tipo === 'sin_marcar' ? 0 : 1))

  if (conAccion.length === 0) return null

  return (
    <div className="rounded-lg border border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_7%,transparent)] px-4 py-3">
      <p className="text-sm font-semibold text-foreground">
        {conAccion.length === 1 ? '1 campaña necesita' : `${conAccion.length} campañas necesitan`} recordatorio
      </p>
      <ul className="mt-2 space-y-1.5">
        {conAccion.map((c) => {
          const sinMarcar = c.recordatorio.tipo === 'sin_marcar'
          const { titulo, detalle } = textoEstadoRecordatorio(c.recordatorio)
          return (
            <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span
                aria-hidden
                className={`inline-block h-2 w-2 shrink-0 rounded-full ${sinMarcar ? 'bg-destructive' : 'bg-[var(--warning)]'}`}
              />
              <Link
                href={sinMarcar ? `/campanas/${c.id}/recordatorio` : `/campanas/${c.id}`}
                className="font-medium text-brand hover:underline"
              >
                {c.nombre}
              </Link>
              <span className="text-muted-foreground">
                {titulo}
                {detalle ? ` · ${detalle}` : ''}
                {sinMarcar && ' · si ya salió, marcalo como enviado para que los pendientes pasen a llamado'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
