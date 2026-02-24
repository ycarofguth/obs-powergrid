import { memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { HourlyCost } from '@obs-tuya/shared'

interface CostChartProps {
  data: HourlyCost[]
  currency: string
}

function formatHour(hour: Date | string): string {
  const date = new Date(hour)
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatCost(cost: number, currency: string): string {
  return `${currency} ${cost.toFixed(4)}`
}

interface TooltipPayload {
  value: number
  payload: {
    hour: Date | string
    kwh: number
  }
}

function CustomTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  currency: string
}) {
  if (!active || !payload || !payload.length) return null

  const item = payload[0]
  if (!item) return null

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{formatHour(item.payload.hour)}</p>
      <p className="text-lg font-bold text-success font-mono">{formatCost(item.value, currency)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Consumo: {item.payload.kwh.toFixed(4)} kWh
      </p>
    </div>
  )
}

export const CostChart = memo(function CostChart({ data, currency }: CostChartProps) {
  if (!data.length) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    time: formatHour(d.hour),
  }))

  const avgCost = data.reduce((sum, d) => sum + d.cost, 0) / data.length

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `${currency} ${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip currency={currency} />} />
          <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.cost > avgCost ? 'var(--color-warning)' : 'var(--color-success)'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
})
