import { memo } from 'react'
import { Link } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { DeviceStats, ReadingAggregation } from '@obs-tuya/shared'
import { TrendIndicator } from './TrendIndicator'

interface DeviceSparklineCardProps {
  deviceId: string
  deviceName: string
  stats: DeviceStats | null
  readings: ReadingAggregation[]
  currentPower: number | null
  currency: string
  kwhPrice: number
  color: string
}

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`
  return `${watts.toFixed(1)} W`
}

export const DeviceSparklineCard = memo(function DeviceSparklineCard({
  deviceId,
  deviceName,
  stats,
  readings,
  currentPower,
  currency,
  kwhPrice,
  color,
}: DeviceSparklineCardProps) {
  const sparklineData = readings.map((r) => ({ value: r.avgPower }))
  const cost = stats ? stats.totalKwh * kwhPrice : 0

  return (
    <Link
      to={`/dashboard/devices/${deviceId}`}
      className="block bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground truncate">{deviceName}</h3>
            <CaretRight
              size={14}
              weight="bold"
              className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0"
            />
          </div>
        </div>

        {/* Sparkline */}
        {sparklineData.length > 1 && (
          <div className="flex-shrink-0" style={{ width: 80, height: 32 }}>
            <ResponsiveContainer width={80} height={32} minWidth={0}>
              <LineChart data={sparklineData}>
                <defs>
                  <filter
                    id={`sparkline-glow-${deviceId}`}
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
                    <feColorMatrix in="blur" type="saturate" values="3" result="saturated" />
                    <feMerge>
                      <feMergeNode in="saturated" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  filter={`url(#sparkline-glow-${deviceId})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats row */}
      {stats && (
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          <span>
            Media: <span className="font-mono text-foreground">{formatPower(stats.avgPower)}</span>
          </span>
          <span>
            Pico: <span className="font-mono text-foreground">{formatPower(stats.maxPower)}</span>
          </span>
          <span>
            <span className="font-mono text-foreground">{stats.totalKwh.toFixed(3)}</span> kWh
          </span>
          <span>
            <span className="font-mono text-success">
              {currency} {cost.toFixed(2)}
            </span>
          </span>
        </div>
      )}

      {/* Trend */}
      {currentPower !== null && stats && stats.avgPower > 0 && (
        <div className="mt-1.5">
          <TrendIndicator currentPower={currentPower} avgPower={stats.avgPower} />
        </div>
      )}
    </Link>
  )
})
