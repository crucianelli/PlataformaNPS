import Badge from '@/components/ui/Badge'
import { textoEstadoRecordatorio, type EstadoRecordatorio } from '@/lib/utils/recordatorioEstado'

const variante: Record<EstadoRecordatorio['tipo'], 'danger' | 'warning' | 'default' | 'success'> = {
  sin_marcar: 'danger',
  toca:       'warning',
  esperando:  'default',
  al_dia:     'success',
  no_aplica:  'default',
}

export default function RecordatorioEstadoBadge({ estado }: { estado: EstadoRecordatorio }) {
  if (estado.tipo === 'no_aplica') {
    return <span className="text-muted-foreground text-xs">—</span>
  }
  const { titulo, detalle } = textoEstadoRecordatorio(estado)
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={variante[estado.tipo]}>{titulo}</Badge>
      {detalle && <span className="text-[11px] text-muted-foreground">{detalle}</span>}
    </div>
  )
}
