export type Period = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom'

interface PeriodSelectorProps {
  period: Period
  onPeriodChange: (period: Period) => void
  customStart?: string
  customEnd?: string
  onCustomStartChange?: (value: string) => void
  onCustomEndChange?: (value: string) => void
}

const periods: { value: Period; label: string }[] = [
  { value: '1h', label: '1h' },
  { value: '6h', label: '6h' },
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: 'custom', label: 'Custom' },
]

export function PeriodSelector({
  period,
  onPeriodChange,
  customStart,
  customEnd,
  onCustomStartChange,
  onCustomEndChange,
}: PeriodSelectorProps) {
  return (
    <div>
      <div className="flex items-center gap-1 rounded-lg p-1 border border-border">
        {periods.map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`px-3 py-1.5 text-sm rounded transition-all font-medium ${
              period === p.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-[var(--hover-bg-subtle)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">De:</label>
            <input
              type="datetime-local"
              value={customStart ?? ''}
              onChange={(e) => onCustomStartChange?.(e.target.value)}
              className="!w-auto text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Ate:</label>
            <input
              type="datetime-local"
              value={customEnd ?? ''}
              onChange={(e) => onCustomEndChange?.(e.target.value)}
              className="!w-auto text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
