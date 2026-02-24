import { cn } from '../lib/utils'

type StatusType = 'connected' | 'disconnected' | 'connecting' | 'error' | 'disabled'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<StatusType, { label: string; className: string; dotClass: string }> = {
  connected: {
    label: 'Conectado',
    className: 'bg-success/15 text-success border-success/30',
    dotClass: 'bg-success',
  },
  disconnected: {
    label: 'Desconectado',
    className: 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30',
    dotClass: 'bg-muted-foreground',
  },
  connecting: {
    label: 'Conectando...',
    className: 'bg-warning/15 text-warning border-warning/30',
    dotClass: 'bg-warning animate-pulse',
  },
  error: {
    label: 'Erro',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    dotClass: 'bg-destructive',
  },
  disabled: {
    label: 'Desabilitado',
    className: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
    dotClass: 'bg-muted-foreground',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5', config.dotClass)} />
      {config.label}
    </span>
  )
}
