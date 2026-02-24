import { memo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { DeviceRanking } from '@obs-tuya/shared'

interface PowerDistributionChartProps {
  rankings: DeviceRanking[]
  totalKwh: number
  colors: string[]
}

interface TooltipPayloadItem {
  name: string
  value: number
  payload: { name: string; value: number; color: string; percentage: number }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload || !payload.length) return null

  const item = payload[0]
  if (!item) return null

  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.payload.color }}
        />
        <span className="text-sm text-foreground font-medium">{item.payload.name}</span>
      </div>
      <p className="text-lg font-bold font-mono text-foreground mt-1">
        {item.value.toFixed(3)} kWh
      </p>
      <p className="text-xs text-muted-foreground">{item.payload.percentage.toFixed(1)}%</p>
    </div>
  )
}

// Default palette matching the comparison chart colors
const DEFAULT_COLORS = [
  '#3B82F6',
  '#22c55e',
  '#fbbf24',
  '#ef4444',
  '#a855f7',
  '#ec4899',
  '#06b6d4',
  '#f97316',
]

export const PowerDistributionChart = memo(function PowerDistributionChart({
  rankings,
  totalKwh,
  colors,
}: PowerDistributionChartProps) {
  if (!rankings.length) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    )
  }

  const palette = colors.length > 0 ? colors : DEFAULT_COLORS

  const chartData = rankings.map((r, i) => ({
    name: r.deviceName,
    value: r.value,
    percentage: r.percentage,
    color: palette[i % palette.length],
  }))

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">Distribuição</h3>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="w-32 h-32 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={2}
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-sm font-bold font-mono text-foreground">
              {totalKwh.toFixed(2)}
            </span>
            <span className="text-[10px] text-muted-foreground">kWh</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate">{entry.name}</span>
              <span className="font-mono text-foreground ml-auto flex-shrink-0">
                {entry.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
