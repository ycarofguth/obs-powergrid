import { memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ComparisonChartDevice } from '@obs-tuya/shared'

interface ComparisonCostChartProps {
  data: ComparisonChartDevice[]
  kwhPrice: number
  intervalMinutes: number
  currency?: string
}

function formatCost(cost: number): string {
  if (cost >= 1) return cost.toFixed(2)
  if (cost >= 0.01) return cost.toFixed(3)
  return cost.toFixed(4)
}

/** Choose a bucket size (in ms) that yields ~8-20 bars for readability */
function getBucketMs(intervalMinutes: number): number {
  const HOUR = 3_600_000
  const DAY = 86_400_000

  // For short periods (1h) — bucket by 10min
  if (intervalMinutes <= 1) return 10 * 60_000
  // 6h — bucket by 30min
  if (intervalMinutes <= 5) return 30 * 60_000
  // 24h — bucket by 1h
  if (intervalMinutes <= 15) return HOUR
  // 7d — bucket by 6h
  if (intervalMinutes <= 60) return 6 * HOUR
  // 30d — bucket by 1 day
  return DAY
}

function formatBucketLabel(timestamp: number, bucketMs: number): string {
  const date = new Date(timestamp)
  const DAY = 86_400_000

  if (bucketMs >= DAY) {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

interface BucketDataPoint {
  bucketStart: number
  label: string
  [key: string]: string | number
}

function buildCostBuckets(
  devices: ComparisonChartDevice[],
  kwhPrice: number,
  intervalMinutes: number
): BucketDataPoint[] {
  const bucketMs = getBucketMs(intervalMinutes)
  const intervalHours = intervalMinutes / 60

  // Collect all readings into buckets per device
  const bucketMap = new Map<number, BucketDataPoint>()

  for (const device of devices) {
    for (const reading of device.readings) {
      const ts = new Date(reading.timestamp).getTime()
      const bucketStart = Math.floor(ts / bucketMs) * bucketMs

      if (!bucketMap.has(bucketStart)) {
        bucketMap.set(bucketStart, {
          bucketStart,
          label: formatBucketLabel(bucketStart, bucketMs),
        })
      }

      const bucket = bucketMap.get(bucketStart)!
      const kwh = (reading.avgPower / 1000) * intervalHours
      const cost = kwh * kwhPrice
      bucket[device.deviceId] = ((bucket[device.deviceId] as number) || 0) + cost
    }
  }

  return Array.from(bucketMap.values()).sort((a, b) => a.bucketStart - b.bucketStart)
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
  currency,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  deviceNameMap: Record<string, string>
  currency: string
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
              {currency} {formatCost(entry.value)}
            </span>
          </div>
        ))}
        {payload.length > 1 && (
          <div className="flex items-center gap-2 border-t border-border pt-1 mt-1">
            <span className="text-xs text-muted-foreground font-medium">Total:</span>
            <span className="text-sm font-bold font-mono text-foreground">
              {currency} {formatCost(total)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export const ComparisonCostChart = memo(function ComparisonCostChart({
  data,
  kwhPrice,
  intervalMinutes,
  currency = 'R$',
}: ComparisonCostChartProps) {
  if (!data.length || data.every((d) => d.readings.length === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const chartData = buildCostBuckets(data, kwhPrice, intervalMinutes)

  const deviceNameMap: Record<string, string> = {}
  for (const device of data) {
    deviceNameMap[device.deviceId] = device.deviceName
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value: number) => value.toFixed(2)}
          />
          <Tooltip
            content={<CustomTooltip deviceNameMap={deviceNameMap} currency={currency} />}
          />
          <Legend
            formatter={(value: string) => deviceNameMap[value] || value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {data.map((device) => (
            <Bar
              key={device.deviceId}
              dataKey={device.deviceId}
              name={device.deviceId}
              fill={device.color}
              radius={[4, 4, 0, 0]}
              stackId="cost"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
