import { useState, useEffect } from 'react'
import { Lightning, Timer } from '@phosphor-icons/react'
import type { DashboardSummary, DashboardDeviceCard } from '@obs-tuya/shared'

interface LiveMonitorStripProps {
  dashboard: DashboardSummary
}

function formatPower(watts: number): string {
  if (watts >= 1000) {
    return `${(watts / 1000).toFixed(2)} kW`
  }
  return `${watts.toFixed(1)} W`
}

function formatCost(cost: number, currency: string): string {
  return `${currency} ${cost.toFixed(2)}`
}

function getEarliestSessionStart(devices: DashboardDeviceCard[]): Date | null {
  let earliest: Date | null = null
  for (const d of devices) {
    if (d.sessionStartTime) {
      const t = new Date(d.sessionStartTime)
      if (!earliest || t < earliest) earliest = t
    }
  }
  return earliest
}

function SessionDuration({ devices }: { devices: DashboardDeviceCard[] }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const earliest = getEarliestSessionStart(devices)
  if (!earliest) return <span>-</span>

  const diffMs = Date.now() - earliest.getTime()
  const totalMins = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60

  return <span>{hours > 0 ? `${hours}h${String(mins).padStart(2, '0')}m` : `${mins}m`}</span>
}

export function LiveMonitorStrip({ dashboard }: LiveMonitorStripProps) {
  const connectedDevices = dashboard.devices.filter((d) => d.isConnected && d.status)

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
      {/* Main stats row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Lightning size={20} weight="fill" className="text-warning" />
          <span className="text-2xl font-bold font-mono text-warning neon-text-energy">
            {formatPower(dashboard.totalPowerWatts)}
          </span>
          <span className="text-sm text-muted-foreground">total</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-lg font-mono text-success font-medium">
            {formatCost(dashboard.sessionCost, dashboard.currency)}
          </span>
          <span className="text-sm text-muted-foreground">sessao</span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Timer size={16} weight="bold" />
          <span className="text-sm font-mono">
            <SessionDuration devices={dashboard.devices} />
          </span>
        </div>
      </div>

      {/* Device dots */}
      {connectedDevices.length > 0 && (
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          {dashboard.devices
            .filter((d) => d.enabled)
            .map((device) => (
              <div key={device.id} className="flex items-center gap-1.5 text-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    device.isConnected ? 'bg-success' : 'bg-destructive'
                  }`}
                />
                <span className="text-muted-foreground">{device.name}</span>
                {device.isConnected && device.status && (
                  <span className="font-mono text-foreground">
                    ({formatPower(device.status.power)})
                  </span>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
