import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ReadingAggregation } from '@obs-tuya/shared'

interface PowerChartProps {
  data: ReadingAggregation[]
  avgPower?: number
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

interface TooltipPayload {
  value: number
  payload: {
    timestamp: Date | string
    avgVoltage: number
    avgCurrent: number
  }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload || !payload.length) return null

  const item = payload[0]
  if (!item) return null

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{formatTime(item.payload.timestamp)}</p>
      <p className="text-lg font-bold text-warning font-mono">{formatPower(item.value)}</p>
      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
        <p>Tensão: {item.payload.avgVoltage.toFixed(0)}V</p>
        <p>Corrente: {(item.payload.avgCurrent / 1000).toFixed(2)}A</p>
      </div>
    </div>
  )
}

export function PowerChart({ data, avgPower }: PowerChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    time: formatTime(d.timestamp),
  }))

  const maxPower = Math.max(...data.map((d) => d.avgPower))
  const nice =
    maxPower <= 10 ? 2 : maxPower <= 50 ? 10 : maxPower <= 200 ? 20 : maxPower <= 500 ? 50 : 100
  const yAxisMax = Math.ceil((maxPower * 1.1) / nice) * nice || 10

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
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
          <Tooltip content={<CustomTooltip />} />
          {avgPower && (
            <ReferenceLine
              y={avgPower}
              stroke="var(--color-primary)"
              strokeDasharray="5 5"
              label={{
                value: `Media: ${formatPower(avgPower)}`,
                position: 'right',
                fontSize: 10,
                fill: 'var(--color-primary)',
              }}
            />
          )}
          <Line
            type="linear"
            dataKey="avgPower"
            stroke="var(--color-warning)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-warning)' }}
            filter="url(#neon-glow)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
