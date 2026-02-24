import { TrendUp, TrendDown } from '@phosphor-icons/react'

interface TrendIndicatorProps {
  currentPower: number
  avgPower: number
}

export function TrendIndicator({ currentPower, avgPower }: TrendIndicatorProps) {
  if (avgPower <= 0) return null

  const diff = ((currentPower - avgPower) / avgPower) * 100
  const isAbove = diff > 0

  if (Math.abs(diff) < 1) {
    return <span className="text-xs text-muted-foreground">~ media</span>
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isAbove ? 'text-warning' : 'text-success'
      }`}
    >
      {isAbove ? <TrendUp size={12} weight="bold" /> : <TrendDown size={12} weight="bold" />}
      {isAbove ? '+' : ''}
      {diff.toFixed(0)}% vs media
    </span>
  )
}
