import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowsClockwise,
  ArrowLeft,
  Lightning,
  CurrencyDollar,
  Pulse,
  TrendUp,
  WifiHigh,
  Cloud,
  Power,
  PencilSimple,
  Copy,
  Check,
} from '@phosphor-icons/react'
import {
  getDeviceDashboard,
  getDeviceStats,
  getDeviceChartData,
  getDeviceCosts,
  connectDevice,
  disconnectDevice,
  getOverlayUrl,
  type DeviceStats,
  type ReadingAggregation,
  type HourlyCost,
} from '../services/api'
import { StatusBadge } from '../components/StatusBadge'
import { GlowIcon } from '../components/GlowIcon'
import { PowerGauge } from '../components/charts/PowerGauge'
import { PowerAreaChart } from '../components/charts/PowerAreaChart'
import { CostChart } from '../components/charts'
import { ConnectionTimeline } from '../components/dashboard/ConnectionTimeline'

interface DeviceDashboard {
  device: {
    id: string
    name: string
    deviceId: string
    ipAddress: string | null
    protocolVersion: string
    communicationMode: 'local' | 'cloud'
    isConnected: boolean
    enabled: boolean
  }
  realtime: {
    switch: boolean
    power: number
    voltage: number
    current: number
  } | null
  stats: DeviceStats
  costSummary: {
    totalCost: number
    currency: string
    kwhPrice: number
    totalKwh: number
  }
  connectionInfo: {
    mode: 'local' | 'cloud'
    connectedSince: Date | null
    totalConnectionTime: number
  }
}

function formatPower(watts: number): string {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`
  return `${watts.toFixed(1)} W`
}

function formatCost(cost: number, currency: string): string {
  return `${currency} ${cost.toFixed(4)}`
}

type Period = 'today' | '1h' | '6h' | '24h' | '7d' | '30d' | 'custom'

function getPeriodDates(period: Period): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case '1h':
      start.setHours(start.getHours() - 1)
      break
    case '6h':
      start.setHours(start.getHours() - 6)
      break
    case '24h':
      start.setHours(start.getHours() - 24)
      break
    case '7d':
      start.setDate(start.getDate() - 7)
      break
    case '30d':
      start.setDate(start.getDate() - 30)
      break
    case 'custom':
      break
  }

  return { start, end }
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subValue?: string
  color?: 'default' | 'green' | 'yellow' | 'blue' | 'red'
}

const statColorMap = {
  default: 'primary',
  green: 'success',
  yellow: 'warning',
  blue: 'primary',
  red: 'destructive',
} as const

function StatCard({ icon, label, value, subValue, color = 'default' }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2">
        <GlowIcon icon={icon} color={statColorMap[color]} />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-base font-bold text-foreground font-mono truncate">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground font-mono">{subValue}</p>}
        </div>
      </div>
    </div>
  )
}

export function DeviceDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const [dashboard, setDashboard] = useState<DeviceDashboard | null>(null)
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const [chartData, setChartData] = useState<ReadingAggregation[]>([])
  const [costData, setCostData] = useState<HourlyCost[]>([])
  const [period, setPeriod] = useState<Period>('24h')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [copied, setCopied] = useState(false)

  const getDateRange = useCallback(() => {
    if (period === 'custom' && customStart) {
      const start = new Date(customStart)
      const end = customEnd ? new Date(customEnd) : new Date()
      return { start, end }
    }
    return getPeriodDates(period)
  }, [period, customStart, customEnd])

  const fetchDashboard = useCallback(async () => {
    if (!id) return

    try {
      const { start, end } = getDateRange()
      const response = await getDeviceDashboard(id, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })

      if (response.success && response.data) {
        setDashboard(response.data as unknown as DeviceDashboard)
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar dashboard')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id, getDateRange])

  const fetchStats = useCallback(async () => {
    if (!id) return

    try {
      const { start, end } = getDateRange()
      const response = await getDeviceStats(id, {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      })

      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }, [id, getDateRange])

  const fetchChartData = useCallback(async () => {
    if (!id) return

    try {
      const { start, end } = getDateRange()
      const intervalMinutes =
        period === '1h'
          ? 1
          : period === '6h'
            ? 5
            : period === '24h'
              ? 15
              : period === '7d'
                ? 60
                : 120

      const [chartResponse, costResponse] = await Promise.all([
        getDeviceChartData(id, {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          interval: intervalMinutes,
        }),
        getDeviceCosts(id, {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      ])

      if (chartResponse.success && chartResponse.data) {
        setChartData(chartResponse.data)
      }
      if (costResponse.success && costResponse.data) {
        setCostData(costResponse.data)
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
    }
  }, [id, period, getDateRange])

  useEffect(() => {
    fetchDashboard()
    fetchStats()
    fetchChartData()

    const interval = setInterval(() => {
      fetchDashboard()
    }, 2000)

    const chartInterval = setInterval(() => {
      fetchChartData()
    }, 30000)

    return () => {
      clearInterval(interval)
      clearInterval(chartInterval)
    }
  }, [fetchDashboard, fetchStats, fetchChartData])

  const handleToggleConnection = async () => {
    if (!id || !dashboard) return
    setConnecting(true)
    try {
      if (dashboard.device.isConnected) {
        await disconnectDevice(id)
      } else {
        await connectDevice(id)
      }
      fetchDashboard()
    } catch (err) {
      console.error('Toggle connection error:', err)
    } finally {
      setConnecting(false)
    }
  }

  const handleCopyOverlayUrl = () => {
    if (!id) return
    const url = getOverlayUrl(id)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getStatus = () => {
    if (!dashboard?.device.enabled) return 'disabled'
    if (dashboard.device.isConnected) return 'connected'
    return 'disconnected'
  }

  const periods: { value: Period; label: string }[] = [
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'custom', label: 'Custom' },
  ]

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {dashboard?.device.name || 'Carregando...'}
              </h1>
              {dashboard && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {dashboard.device.communicationMode === 'local' ? (
                    <WifiHigh size={12} weight="bold" />
                  ) : (
                    <Cloud size={12} weight="bold" />
                  )}
                  <span>{dashboard.device.communicationMode === 'local' ? 'Local' : 'Cloud'}</span>
                  <span className="mx-1">-</span>
                  <StatusBadge status={getStatus()} />
                </div>
              )}
            </div>
          </div>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md disabled:opacity-50"
            title="Atualizar"
          >
            <ArrowsClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        {loading && !dashboard ? (
          <div className="text-center py-12">
            <ArrowsClockwise
              size={32}
              weight="bold"
              className="mx-auto text-muted-foreground animate-spin"
            />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        ) : dashboard ? (
          <>
            {/* === POWER GAUGE === */}
            {dashboard.realtime && (
              <section className="mb-6">
                <PowerGauge
                  currentPower={dashboard.realtime.power}
                  minPower={stats?.minPower ?? 0}
                  avgPower={stats?.avgPower ?? 0}
                  maxPower={stats?.maxPower ?? dashboard.realtime.power * 1.5}
                  voltage={dashboard.realtime.voltage}
                  current={dashboard.realtime.current}
                  switchState={dashboard.realtime.switch}
                />
              </section>
            )}

            {/* === STAT CARDS 2x2 === */}
            <section className="grid grid-cols-2 gap-3 mb-6">
              <StatCard
                icon={<Pulse size={18} weight="duotone" />}
                label="Media"
                value={stats ? formatPower(stats.avgPower) : '-'}
                color="blue"
              />
              <StatCard
                icon={<TrendUp size={18} weight="duotone" />}
                label="Pico"
                value={stats ? formatPower(stats.maxPower) : '-'}
                subValue={stats ? `Min: ${formatPower(stats.minPower)}` : undefined}
                color="red"
              />
              <StatCard
                icon={<Lightning size={18} weight="duotone" />}
                label="Total"
                value={dashboard.costSummary.totalKwh.toFixed(3) + ' kWh'}
                color="yellow"
              />
              <StatCard
                icon={<CurrencyDollar size={18} weight="duotone" />}
                label="Custo"
                value={formatCost(dashboard.costSummary.totalCost, dashboard.costSummary.currency)}
                subValue={`${dashboard.costSummary.currency} ${dashboard.costSummary.kwhPrice.toFixed(2)}/kWh`}
                color="green"
              />
            </section>

            {/* === PERIOD SELECTOR === */}
            <section className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Periodo
                </h2>
              </div>
              <div className="flex items-center gap-1 rounded-lg p-1 border border-border">
                {periods.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value)}
                    className={`px-3 py-1.5 text-sm rounded transition-all font-medium ${
                      period === p.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-[var(--hover-bg-subtle)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {period === 'custom' && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">De:</label>
                    <input
                      type="datetime-local"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="!w-auto text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">Ate:</label>
                    <input
                      type="datetime-local"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="!w-auto text-sm"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* === POWER AREA CHART === */}
            <section className="bg-card border border-border rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-muted-foreground uppercase mb-3">
                Consumo de Potencia
              </h3>
              <PowerAreaChart data={chartData} avgPower={stats?.avgPower} />
            </section>

            {/* === COST CHART === */}
            <section className="bg-card border border-border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase">
                  Custo por Hora
                </h3>
                {costData.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Total:{' '}
                    <span className="font-mono text-success">
                      {formatCost(dashboard.costSummary.totalCost, dashboard.costSummary.currency)}
                    </span>
                  </span>
                )}
              </div>
              <CostChart data={costData} currency={dashboard.costSummary.currency} />
            </section>

            {/* === CONNECTION TIMELINE === */}
            <section className="mb-6">
              <ConnectionTimeline
                isConnected={dashboard.device.isConnected}
                connectedSince={dashboard.connectionInfo.connectedSince}
                totalConnectionTime={dashboard.connectionInfo.totalConnectionTime}
                readingsCount={stats?.readingsCount || 0}
              />
            </section>

            {/* === INFO + ACTIONS === */}
            <section className="bg-card border border-border rounded-lg p-4">
              <div className="flex flex-col gap-3">
                {/* Info row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>
                    Device ID:{' '}
                    <span className="font-mono text-foreground">{dashboard.device.deviceId}</span>
                  </span>
                  {dashboard.device.ipAddress && (
                    <span>
                      IP:{' '}
                      <span className="font-mono text-foreground">
                        {dashboard.device.ipAddress}
                      </span>
                    </span>
                  )}
                  <span>
                    Protocolo:{' '}
                    <span className="font-mono text-foreground">
                      v{dashboard.device.protocolVersion}
                    </span>
                  </span>
                  <span>
                    Modo:{' '}
                    <span className="text-foreground">
                      {dashboard.device.communicationMode === 'local'
                        ? 'Local (TCP)'
                        : 'Cloud (REST)'}
                    </span>
                  </span>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleToggleConnection}
                    disabled={connecting || !dashboard.device.enabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors disabled:opacity-50 ${
                      dashboard.device.isConnected
                        ? 'text-destructive hover:bg-destructive/10'
                        : 'text-success hover:bg-success/15'
                    }`}
                  >
                    {connecting ? (
                      <ArrowsClockwise size={14} weight="bold" className="animate-spin" />
                    ) : (
                      <Power size={14} weight="bold" />
                    )}
                    {dashboard.device.isConnected ? 'Desconectar' : 'Conectar'}
                  </button>
                  <Link
                    to={`/devices/${id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                  >
                    <PencilSimple size={14} weight="bold" />
                    Editar
                  </Link>
                  <button
                    onClick={handleCopyOverlayUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-foreground hover:bg-secondary rounded-md transition-colors"
                  >
                    {copied ? (
                      <Check size={14} weight="bold" className="text-success" />
                    ) : (
                      <Copy size={14} weight="bold" />
                    )}
                    {copied ? 'Copiada!' : 'URL Overlay'}
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}
