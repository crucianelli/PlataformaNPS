import { cn } from '@/lib/utils/cn'

type StatusKey =
  | 'activa'
  | 'completada'
  | 'archivada'
  | 'pendiente'
  | 'respondida'
  | 'enviado'
  | 'recordatorio_enviado'
  | 'necesidad_de_llamado'
  | 'sin_respuesta'

interface StatusConfig {
  label: string
  classes: string
  dot?: string
}

const STATUS_MAP: Record<StatusKey, StatusConfig> = {
  activa: {
    label: 'Activa',
    classes: 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]',
    dot: 'bg-[var(--success)]',
  },
  completada: {
    label: 'Completada',
    classes: 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary',
    dot: 'bg-primary',
  },
  archivada: {
    label: 'Archivada',
    classes: 'bg-muted text-muted-foreground',
  },
  pendiente: {
    label: 'Pendiente',
    classes: 'bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] text-[var(--warning)]',
    dot: 'bg-[var(--warning)]',
  },
  respondida: {
    label: 'Respondida',
    classes: 'bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]',
    dot: 'bg-[var(--success)]',
  },
  enviado: {
    label: 'Enviado',
    classes: 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary',
  },
  recordatorio_enviado: {
    label: 'Rec. enviado',
    classes: 'bg-[color-mix(in_srgb,var(--primary)_10%,transparent)] text-primary',
  },
  necesidad_de_llamado: {
    label: 'Llamado',
    classes: 'bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] text-destructive',
    dot: 'bg-destructive',
  },
  sin_respuesta: {
    label: 'Sin respuesta',
    classes: 'bg-muted text-muted-foreground',
  },
}

interface StatusBadgeProps {
  status: StatusKey
  showDot?: boolean
  className?: string
}

export default function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium leading-none',
        config.classes,
        className
      )}
    >
      {showDot && config.dot && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)}
          aria-hidden
        />
      )}
      {config.label}
    </span>
  )
}
