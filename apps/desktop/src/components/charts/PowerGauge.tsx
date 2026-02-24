import { memo } from 'react'

interface PowerGaugeProps {
  currentPower: number
  minPower: number
  avgPower: number
  maxPower: number
  voltage: number
  current: number
  switchState: boolean
}

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`
  return `${watts.toFixed(1)} W`
}

function formatCurrent(milliamps: number): string {
  if (milliamps < 1000) return `${milliamps.toFixed(0)}mA`
  return `${(milliamps / 1000).toFixed(2)}A`
}

export const PowerGauge = memo(function PowerGauge({
  currentPower,
  minPower,
  avgPower,
  maxPower,
  voltage,
  current,
  switchState,
}: PowerGaugeProps) {
  // Gauge dimensions
  const cx = 120
  const cy = 110
  const radius = 90
  const strokeWidth = 12

  // Calculate angle (0° = left, 180° = right)
  const gaugeMax = Math.max(maxPower * 1.2, 10)
  const ratio = Math.min(currentPower / gaugeMax, 1)
  const angle = ratio * 180

  // SVG arc path helper
  function describeArc(
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): string {
    const startRad = ((180 + startAngle) * Math.PI) / 180
    const endRad = ((180 + endAngle) * Math.PI) / 180
    const x1 = cx + r * Math.cos(startRad)
    const y1 = cy + r * Math.sin(startRad)
    const x2 = cx + r * Math.cos(endRad)
    const y2 = cy + r * Math.sin(endRad)
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex flex-col items-center">
        {/* SVG Gauge */}
        <svg width="240" height="140" viewBox="0 0 240 140" className="overflow-visible">
          <defs>
            <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-success)" />
              <stop offset="50%" stopColor="var(--color-warning)" />
              <stop offset="100%" stopColor="var(--color-destructive)" />
            </linearGradient>
            <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix in="blur" type="saturate" values="2" result="saturated" />
              <feMerge>
                <feMergeNode in="saturated" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={describeArc(cx, cy, radius, 0, 180)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {angle > 0 && (
            <path
              d={describeArc(cx, cy, radius, 0, Math.max(angle, 1))}
              fill="none"
              stroke="url(#gauge-gradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              filter="url(#gauge-glow)"
            />
          )}

          {/* Center text */}
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            className="font-mono"
            style={{
              fontSize: '28px',
              fontWeight: 700,
              fill: 'var(--color-warning)',
              filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.4))',
            }}
          >
            {formatPower(currentPower)}
          </text>

          {/* Min / Avg / Max labels */}
          <text
            x={cx - 60}
            y={cy + 18}
            textAnchor="middle"
            style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }}
          >
            min {formatPower(minPower)}
          </text>
          <text
            x={cx}
            y={cy + 18}
            textAnchor="middle"
            style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }}
          >
            avg {formatPower(avgPower)}
          </text>
          <text
            x={cx + 60}
            y={cy + 18}
            textAnchor="middle"
            style={{ fontSize: '10px', fill: 'var(--color-muted-foreground)' }}
          >
            max {formatPower(maxPower)}
          </text>
        </svg>

        {/* Bottom row: voltage, current, switch */}
        <div className="flex items-center justify-center gap-6 mt-2 text-sm">
          <span className="font-mono text-primary">{voltage.toFixed(0)}V</span>
          <span className="font-mono text-success">{formatCurrent(current)}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
              switchState
                ? 'bg-success/15 text-success border-success/30'
                : 'bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30'
            }`}
          >
            {switchState ? 'LIGADO' : 'DESLIGADO'}
          </span>
        </div>
      </div>
    </div>
  )
})
