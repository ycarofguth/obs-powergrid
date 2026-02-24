import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ComparisonChartDevice } from '@obs-tuya/shared'

interface ComparisonPowerChartProps {
  data: ComparisonChartDevice[]
}

function formatTime(timestamp: Date | string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatPower(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`
  }
  return `${watts.toFixed(1)} W`
}

interface UnifiedDataPoint {
  timestamp: string
  time: string
  [key: string]: string | number | undefined
}

function mergeTimelines(devices: ComparisonChartDevice[]): UnifiedDataPoint[] {
  // Collect all unique timestamps across all devices
  const timestampSet = new Set<string>()
  for (const device of devices) {
    for (const reading of device.readings) {
      timestampSet.add(new Date(reading.timestamp).toISOString())
    }
  }

  // Sort timestamps chronologically
  const sortedTimestamps = Array.from(timestampSet).sort()

  // Build unified data array
  const unified: UnifiedDataPoint[] = sortedTimestamps.map((ts) => {
    const point: UnifiedDataPoint = {
      timestamp: ts,
      time: formatTime(ts),
    }

    for (const device of devices) {
      const reading = device.readings.find((r) => new Date(r.timestamp).toISOString() === ts)
      point[device.deviceId] = reading ? reading.avgPower : undefined
    }

    return point
  })

  return unified
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
      </div>
    </div>
  )
}

export function ComparisonPowerChart({ data }: ComparisonPowerChartProps) {
  if (!data.length || data.every((d) => d.readings.length === 0)) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const chartData = mergeTimelines(data)

  // Build device name lookup
  const deviceNameMap: Record<string, string> = {}
  for (const device of data) {
    deviceNameMap[device.deviceId] = device.deviceName
  }

  // Calculate Y-axis max across all devices
  const allPowerValues = data.flatMap((d) => d.readings.map((r) => r.avgPower))
  const maxPower = Math.max(...allPowerValues, 0)
  const nice =
    maxPower <= 10 ? 2 : maxPower <= 50 ? 10 : maxPower <= 200 ? 20 : maxPower <= 500 ? 50 : 100
  const yAxisMax = Math.ceil((maxPower * 1.1) / nice) * nice || 10

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <filter id="neon-glow-comparison" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feColorMatrix in="blur" type="saturate" values="3" result="saturated" />
              <feMerge>
                <feMergeNode in="saturated" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
            <Line
              key={device.deviceId}
              type="linear"
              dataKey={device.deviceId}
              name={device.deviceId}
              stroke={device.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: device.color }}
              connectNulls={true}
              filter="url(#neon-glow-comparison)"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
