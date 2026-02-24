import { Clock, Pulse } from '@phosphor-icons/react'

interface ConnectionTimelineProps {
  isConnected: boolean
  connectedSince: Date | null
  totalConnectionTime: number
  readingsCount: number
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '-'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export function ConnectionTimeline({
  isConnected,
  connectedSince,
  totalConnectionTime,
  readingsCount,
}: ConnectionTimelineProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">Conexao</h3>

      {/* Timeline bar */}
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isConnected ? 'bg-success' : 'bg-muted-foreground'
          }`}
          style={{ width: isConnected ? '100%' : '0%' }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock size={14} weight="bold" />
          <span>
            {isConnected ? 'Conectado ha ' : 'Tempo total: '}
            <span className="font-mono text-foreground">
              {isConnected && connectedSince
                ? formatDuration(Date.now() - new Date(connectedSince).getTime())
                : formatDuration(totalConnectionTime)}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Pulse size={14} weight="bold" />
          <span>
            Leituras:{' '}
            <span className="font-mono text-foreground">{readingsCount.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
