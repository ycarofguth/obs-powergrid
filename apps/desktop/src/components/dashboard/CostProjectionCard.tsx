import { memo } from 'react'
import { TrendUp } from '@phosphor-icons/react'
import { GlowIcon } from '../GlowIcon'
import type { DeviceRanking } from '@obs-tuya/shared'

interface DeviceProjection {
  deviceName: string
  color: string
  dailyCost: number
  monthlyCost: number
}

interface CostProjectionCardProps {
  kwhPrice: number
  currency: string
  deviceRankings?: DeviceRanking[]
  deviceColors?: Record<string, string>
}

export const CostProjectionCard = memo(function CostProjectionCard({
  kwhPrice,
  currency,
  deviceRankings,
  deviceColors,
}: CostProjectionCardProps) {
  // deviceRankings[].value = avgPower em watts (do power ranking)
  // Projeção baseada na potência média: (W / 1000) * 24h * preço/kWh
  const totalAvgPowerWatts = deviceRankings?.reduce((sum, r) => sum + r.value, 0) ?? 0
  const dailyEstimate = (totalAvgPowerWatts / 1000) * 24 * kwhPrice
  const monthlyEstimate = dailyEstimate * 30

  const currentHour = new Date().getHours()
  const dayProgress = (currentHour / 24) * 100

  // Per-device projections
  const deviceProjections: DeviceProjection[] = []
  if (deviceRankings && deviceRankings.length > 1) {
    for (const r of deviceRankings) {
      // r.value = avgPower em watts
      const daily = (r.value / 1000) * 24 * kwhPrice
      deviceProjections.push({
        deviceName: r.deviceName,
        color: deviceColors?.[r.deviceId] || '#3B82F6',
        dailyCost: daily,
        monthlyCost: daily * 30,
      })
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <GlowIcon icon={<TrendUp size={16} weight="bold" />} color="success" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase">Projeção de Custo</h3>
      </div>

      <div className="space-y-3">
        {/* Totals */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Hoje</span>
          <span className="text-lg font-mono font-bold text-success">
            {currency} {dailyEstimate.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Mes</span>
          <span className="text-lg font-mono font-bold text-success">
            {currency} {monthlyEstimate.toFixed(2)}
          </span>
        </div>

        {/* Per-device breakdown */}
        {deviceProjections.length > 0 && (
          <div className="border-t border-border pt-2 space-y-1.5">
            {deviceProjections.map((dp) => (
              <div key={dp.deviceName} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dp.color }}
                />
                <span className="text-muted-foreground truncate min-w-0 flex-1">
                  {dp.deviceName}
                </span>
                <span className="font-mono text-foreground flex-shrink-0">
                  {currency} {dp.dailyCost.toFixed(2)}/d
                </span>
                <span className="font-mono text-muted-foreground flex-shrink-0">
                  {currency} {dp.monthlyCost.toFixed(0)}/m
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Day progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progresso do dia</span>
            <span>{dayProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
