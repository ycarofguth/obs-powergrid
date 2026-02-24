import type { DeviceRanking } from '@obs-tuya/shared'

interface RankingCardProps {
  title: string
  icon: React.ReactNode
  rankings: DeviceRanking[]
  formatValue: (value: number) => string
}

export function RankingCard({ title, icon, rankings, formatValue }: RankingCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-muted-foreground">{icon}</div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase">{title}</h3>
      </div>

      {rankings.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 text-center py-4">Sem dados</p>
      ) : (
        <div className="space-y-3">
          {rankings.map((entry) => (
            <div key={entry.deviceId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      entry.rank === 1
                        ? 'bg-warning/20 text-warning'
                        : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <span
                    className={`text-sm ${
                      entry.rank === 1 ? 'font-bold text-foreground' : 'text-foreground'
                    }`}
                  >
                    {entry.deviceName}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono ${
                    entry.rank === 1 ? 'font-bold text-warning' : 'text-muted-foreground'
                  }`}
                >
                  {formatValue(entry.value)}
                </span>
              </div>
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    entry.rank === 1 ? 'bg-warning' : 'bg-warning/40'
                  }`}
                  style={{ width: `${Math.max(entry.percentage, 2)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
