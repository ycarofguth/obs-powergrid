import { memo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ComparisonChartDevice } from '@obs-tuya/shared'

interface StackedAreaChartProps {
  data: ComparisonChartDevice[]
}

function formatTime(timestamp: Date | string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`
  return `${watts.toFixed(1)} W`
}

interface UnifiedDataPoint {
  timestamp: string
  time: string
  [key: string]: string | number | undefined
}

function mergeTimelines(devices: ComparisonChartDevice[]): UnifiedDataPoint[] {
  const timestampSet = new Set<string>()
  for (const device of devices) {
    for (const reading of device.readings) {
      timestampSet.add(new Date(reading.timestamp).toISOString())
    }
  }

  const sortedTimestamps = Array.from(timestampSet).sort()

  return sortedTimestamps.map((ts) => {
    const point: UnifiedDataPoint = { timestamp: ts, time: formatTime(ts) }
    for (const device of devices) {
      const reading = device.readings.find((r) => new Date(r.timestamp).toISOString() === ts)
      point[device.deviceId] = reading ? reading.avgPower : undefined
    }
    return point
  })
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
  dataKey: string
}

function CustomTooltip({
  active,
  payload,
  label,
  deviceNameMap,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  deviceNameMap: Record<string, string>
}) {
  if (!active || !payload || !payload.length) return null

  const total = payload.reduce((sum, entry) => sum + (entry.value || 0), 0)

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">
              {deviceNameMap[entry.dataKey] || entry.dataKey}:
            </span>
            <span className="text-sm font-bold font-mono" style={{ color: entry.color }}>
              {formatPower(entry.value)}
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="flex items-center gap-2 border-t border-border pt-1 mt-1">
            <span className="text-xs text-muted-foreground font-medium">Total:</span>
            <span className="text-sm font-bold font-mono text-foreground">
              {formatPower(total)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export const StackedAreaChart = memo(function StackedAreaChart({ data }: StackedAreaChartProps) {
  if (!data.length || data.every((d) => d.readings.length === 0)) {
    return (
      <div className="h-72 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const chartData = mergeTimelines(data)

  const deviceNameMap: Record<string, string> = {}
  for (const device of data) {
    deviceNameMap[device.deviceId] = device.deviceName
  }

  const allPowerValues = data.flatMap((d) => d.readings.map((r) => r.avgPower))
  const maxPower = Math.max(...allPowerValues, 0)
  const nice = maxPower <= 10 ? 2 : maxPower <= 50 ? 10 : maxPower <= 200 ? 20 : maxPower <= 500 ? 50 : 100
  const yAxisMax = Math.ceil((maxPower * 1.2) / nice) * nice || 10

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <filter id="neon-glow-area" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix in="blur" type="saturate" values="3" result="saturated" />
              <feMerge>
                <feMergeNode in="saturated" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {data.map((device) => (
              <linearGradient
                key={`gradient-${device.deviceId}`}
                id={`gradient-${device.deviceId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={device.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={device.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            domain={[0, yAxisMax]}
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value: number) => `${Math.round(value)}W`}
          />
          <Tooltip content={<CustomTooltip deviceNameMap={deviceNameMap} />} />
          <Legend
            formatter={(value: string) => deviceNameMap[value] || value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {data.map((device) => (
            <Area
              key={device.deviceId}
              type="monotone"
              dataKey={device.deviceId}
              name={device.deviceId}
              stroke={device.color}
              strokeWidth={2}
              fill={`url(#gradient-${device.deviceId})`}
              stackId="power"
              connectNulls={true}
              dot={false}
              activeDot={{ r: 4, fill: device.color }}
              filter="url(#neon-glow-area)"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
})
