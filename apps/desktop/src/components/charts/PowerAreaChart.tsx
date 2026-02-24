import { useState, memo } from 'react'
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ReadingAggregation } from '@obs-tuya/shared'

interface PowerAreaChartProps {
  data: ReadingAggregation[]
  avgPower?: number
}

type Overlay = 'voltage' | 'current'

function formatTime(timestamp: Date | string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`
  return `${watts.toFixed(1)} W`
}

interface TooltipPayload {
  dataKey: string
  value: number
  color: string
  payload: {
    timestamp: Date | string
    avgVoltage: number
    avgCurrent: number
    avgPower: number
  }
}

function CustomTooltip({
  active,
  payload,
  overlays,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  overlays: Overlay[]
}) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0]?.payload
  if (!data) return null

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{formatTime(data.timestamp)}</p>
      <p className="text-lg font-bold text-warning font-mono">{formatPower(data.avgPower)}</p>
      <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
        {overlays.includes('voltage') && (
          <p>
            Tensão: <span className="text-primary font-mono">{data.avgVoltage.toFixed(0)}V</span>
          </p>
        )}
        {overlays.includes('current') && (
          <p>
            Corrente:{' '}
            <span className="text-success font-mono">{(data.avgCurrent / 1000).toFixed(2)}A</span>
          </p>
        )}
      </div>
    </div>
  )
}

export const PowerAreaChart = memo(function PowerAreaChart({ data, avgPower }: PowerAreaChartProps) {
  const [overlays, setOverlays] = useState<Overlay[]>([])

  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const toggleOverlay = (overlay: Overlay) => {
    setOverlays((prev) =>
      prev.includes(overlay) ? prev.filter((o) => o !== overlay) : [...prev, overlay]
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    time: formatTime(d.timestamp),
  }))

  const maxPower = Math.max(...data.map((d) => d.avgPower))
  const nice = maxPower <= 10 ? 2 : maxPower <= 50 ? 10 : maxPower <= 200 ? 20 : maxPower <= 500 ? 50 : 100
  const yAxisMax = Math.ceil((maxPower * 1.1) / nice) * nice || 10

  return (
    <div>
      {/* Toggle buttons */}
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-muted-foreground mr-2">Overlay:</span>
        <button
          onClick={() => toggleOverlay('voltage')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            overlays.includes('voltage')
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-[var(--hover-bg-subtle)]'
          }`}
        >
          Tensão
        </button>
        <button
          onClick={() => toggleOverlay('current')}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            overlays.includes('current')
              ? 'bg-success/15 text-success'
              : 'text-muted-foreground hover:text-foreground hover:bg-[var(--hover-bg-subtle)]'
          }`}
        >
          Corrente
        </button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="power-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-warning)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-warning)" stopOpacity={0.02} />
              </linearGradient>
              <filter id="neon-glow-power" x="-20%" y="-20%" width="140%" height="140%">
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
              yAxisId="power"
              domain={[0, yAxisMax]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickFormatter={(value: number) => `${Math.round(value)}W`}
            />
            {overlays.includes('voltage') && (
              <YAxis
                yAxisId="voltage"
                orientation="right"
                tick={{ fontSize: 10, fill: 'hsl(var(--primary))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}V`}
              />
            )}
            {overlays.includes('current') && !overlays.includes('voltage') && (
              <YAxis
                yAxisId="current"
                orientation="right"
                tick={{ fontSize: 10, fill: 'hsl(var(--success))' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(1)}A`}
              />
            )}
            <Tooltip content={<CustomTooltip overlays={overlays} />} />
            {avgPower && (
              <ReferenceLine
                yAxisId="power"
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
            <Area
              yAxisId="power"
              type="monotone"
              dataKey="avgPower"
              stroke="var(--color-warning)"
              strokeWidth={2}
              fill="url(#power-gradient)"
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-warning)' }}
              filter="url(#neon-glow-power)"
            />
            {overlays.includes('voltage') && (
              <Line
                yAxisId="voltage"
                type="monotone"
                dataKey="avgVoltage"
                stroke="var(--color-primary)"
                strokeWidth={1}
                strokeOpacity={0.5}
                dot={false}
                strokeDasharray="3 3"
              />
            )}
            {overlays.includes('current') && (
              <Line
                yAxisId={overlays.includes('voltage') ? 'voltage' : 'current'}
                type="monotone"
                dataKey="avgCurrent"
                stroke="var(--color-success)"
                strokeWidth={1}
                strokeOpacity={0.5}
                dot={false}
                strokeDasharray="3 3"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
})
