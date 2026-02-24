import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowsClockwise,
  Plug,
  Lightning,
  CurrencyDollar,
  Copy,
  Check,
  WifiSlash,
} from '@phosphor-icons/react'
import {
  getDashboardSummary,
  getOverlayUrl,
  getComparisonChartData,
  getComparisonRankings,
  getDeviceStats,
  type DashboardSummary,
  type ComparisonChartData,
  type ComparisonRankings,
  type DeviceStats,
} from '../services/api'
import { PeriodSelector, type Period } from '../components/dashboard/PeriodSelector'
import { DeviceSelector } from '../components/dashboard/DeviceSelector'
import { LiveMonitorStrip } from '../components/dashboard/LiveMonitorStrip'
import { DeviceSparklineCard } from '../components/dashboard/DeviceSparklineCard'
import { CostProjectionCard } from '../components/dashboard/CostProjectionCard'
import { StackedAreaChart } from '../components/charts/StackedAreaChart'
import { PowerDistributionChart } from '../components/charts/PowerDistributionChart'
import { ComparisonCostChart } from '../components/charts/ComparisonCostChart'
import { RankingCard } from '../components/dashboard/RankingCard'

// ==================== Helpers ====================

function periodToDateRange(
  period: Period,
  customStart?: string,
  customEnd?: string
): { startDate: string; endDate: string } {
  const now = new Date()
  const endDate = now.toISOString()

  if (period === 'custom') {
    return {
      startDate: customStart ? new Date(customStart).toISOString() : endDate,
      endDate: customEnd ? new Date(customEnd).toISOString() : endDate,
    }
  }

  const offsets: Record<Exclude<Period, 'custom'>, number> = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  }

  const startDate = new Date(now.getTime() - offsets[period]).toISOString()
  return { startDate, endDate }
}

function periodToInterval(period: Period): number {
  const intervals: Record<Period, number> = {
    '1h': 1,
    '6h': 5,
    '24h': 15,
    '7d': 60,
    '30d': 120,
    custom: 15,
  }
  return intervals[period]
}

// ==================== Main Component ====================

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const [period, setPeriod] = useState<Period>('24h')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')

  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([])
  const initializedDeviceIds = useRef(false)

  const [comparisonChart, setComparisonChart] = useState<ComparisonChartData | null>(null)
  const [rankings, setRankings] = useState<ComparisonRankings | null>(null)
  const [deviceStatsMap, setDeviceStatsMap] = useState<Record<string, DeviceStats>>({})

  const handleCopyOverlayUrl = () => {
    const url = getOverlayUrl()
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  // Fetch dashboard summary (real-time, every 2s)
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getDashboardSummary()
      if (response.success && response.data) {
        setDashboard(response.data)
        setError(null)

        if (!initializedDeviceIds.current && response.data.devices.length > 0) {
          setSelectedDeviceIds(response.data.devices.map((d) => d.id))
          initializedDeviceIds.current = true
        }
      } else {
        setError(response.error?.message || 'Erro ao carregar dashboard')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch comparison data + per-device stats
  const fetchComparisonData = useCallback(async () => {
    const { startDate, endDate } = periodToDateRange(period, customStart, customEnd)
    const interval = periodToInterval(period)
    const deviceIds = selectedDeviceIds.length > 0 ? selectedDeviceIds : undefined

    try {
      const [chartResponse, rankingsResponse] = await Promise.all([
        getComparisonChartData({ startDate, endDate, interval, deviceIds }),
        getComparisonRankings({ startDate, endDate, deviceIds }),
      ])

      if (chartResponse.success && chartResponse.data) {
        setComparisonChart(chartResponse.data)
      }
      if (rankingsResponse.success && rankingsResponse.data) {
        setRankings(rankingsResponse.data)
      }

      // Fetch stats for each device (for sparkline cards)
      if (selectedDeviceIds.length > 0) {
        const statsPromises = selectedDeviceIds.map(async (id) => {
          try {
            const res = await getDeviceStats(id, { startDate, endDate })
            if (res.success && res.data) return { id, stats: res.data }
          } catch {
            // ignore individual failures
          }
          return null
        })
        const results = await Promise.all(statsPromises)
        const map: Record<string, DeviceStats> = {}
        for (const r of results) {
          if (r) map[r.id] = r.stats
        }
        setDeviceStatsMap(map)
      }
    } catch (err) {
      console.error('Erro ao carregar dados de comparação:', err)
    }
  }, [period, customStart, customEnd, selectedDeviceIds])

  // Poll dashboard every 2s
  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 2000)
    return () => clearInterval(interval)
  }, [fetchDashboard])

  // Poll comparison data every 30s
  useEffect(() => {
    if (!initializedDeviceIds.current) return
    fetchComparisonData()
    const interval = setInterval(fetchComparisonData, 30000)
    return () => clearInterval(interval)
  }, [fetchComparisonData])

  const kwhPrice = useMemo(() => rankings?.totals.kwhPrice ?? 0.75, [rankings])

  const handleRefresh = () => {
    fetchDashboard()
    fetchComparisonData()
  }

  // Stable derived data — only recomputes when comparisonChart/rankings change (every 30s)
  const chartDevices = useMemo(() => comparisonChart?.devices ?? [], [comparisonChart])

  const deviceColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    if (comparisonChart) {
      for (const d of comparisonChart.devices) {
        map[d.deviceId] = d.color
      }
    }
    return map
  }, [comparisonChart])

  const deviceReadingsMap = useMemo(() => {
    const map: Record<string, ComparisonChartData['devices'][0]['readings']> = {}
    if (comparisonChart) {
      for (const d of comparisonChart.devices) {
        map[d.deviceId] = d.readings
      }
    }
    return map
  }, [comparisonChart])

  const chartColors = useMemo(
    () => comparisonChart?.devices.map((d) => d.color) ?? [],
    [comparisonChart]
  )

  const powerRankings = useMemo(() => rankings?.rankings.power ?? [], [rankings])
  const costRankings = useMemo(() => rankings?.rankings.cost ?? [], [rankings])

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <div className="flex items-center gap-2">
            {dashboard && dashboard.devices.length > 0 && (
              <DeviceSelector
                devices={dashboard.devices}
                selectedIds={selectedDeviceIds}
                onSelectionChange={setSelectedDeviceIds}
              />
            )}
            <button
              onClick={handleCopyOverlayUrl}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title={copiedUrl ? 'URL copiada!' : 'Copiar URL do overlay'}
            >
              {copiedUrl ? (
                <Check size={20} weight="bold" className="text-success" />
              ) : (
                <Copy size={20} weight="bold" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md disabled:opacity-50"
              title="Atualizar"
            >
              <ArrowsClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
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
            {dashboard.devices.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
                  <WifiSlash size={32} weight="duotone" className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">Nenhum dispositivo</h3>
                <p className="text-muted-foreground mt-1">
                  Adicione dispositivos para monitorar o consumo
                </p>
                <Link
                  to="/devices/add"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <Plug size={18} weight="bold" />
                  Adicionar dispositivo
                </Link>
              </div>
            ) : (
              <>
                {/* === MONITOR AO VIVO === */}
                <section className="mb-6">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Monitor ao Vivo
                  </h2>
                  <LiveMonitorStrip dashboard={dashboard} />
                </section>

                {/* === PERIODO === */}
                <section className="mb-6">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Periodo
                  </h2>
                  <PeriodSelector
                    period={period}
                    onPeriodChange={setPeriod}
                    customStart={customStart}
                    customEnd={customEnd}
                    onCustomStartChange={setCustomStart}
                    onCustomEndChange={setCustomEnd}
                  />
                </section>

                {/* === DEVICE SPARKLINE CARDS === */}
                <section className="mb-6">
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Dispositivos
                  </h2>
                  <div className="space-y-3">
                    {dashboard.devices
                      .filter(
                        (d) => selectedDeviceIds.length === 0 || selectedDeviceIds.includes(d.id)
                      )
                      .map((device) => (
                        <DeviceSparklineCard
                          key={device.id}
                          deviceId={device.id}
                          deviceName={device.name}
                          stats={deviceStatsMap[device.id] || null}
                          readings={deviceReadingsMap[device.id] || []}
                          currentPower={
                            device.isConnected && device.status ? device.status.power : null
                          }
                          currency={dashboard.currency}
                          kwhPrice={kwhPrice}
                          color={deviceColorMap[device.id] || '#3B82F6'}
                        />
                      ))}
                  </div>
                </section>

                {/* === CONSUMO (Stacked Area Chart) === */}
                <section className="mb-6 bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase mb-4">
                    Consumo por Dispositivo (W)
                  </h2>
                  <StackedAreaChart data={chartDevices} />
                </section>

                {/* === CUSTO (Bar Chart) === */}
                <section className="mb-6 bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase mb-4">
                    Custo por Dispositivo
                  </h2>
                  <ComparisonCostChart
                    data={chartDevices}
                    kwhPrice={kwhPrice}
                    intervalMinutes={periodToInterval(period)}
                    currency={rankings?.totals.currency ?? dashboard.currency}
                  />
                </section>

                {/* === PROJECAO + DISTRIBUICAO === */}
                <section className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <CostProjectionCard
                    kwhPrice={kwhPrice}
                    currency={rankings?.totals.currency ?? dashboard.currency}
                    deviceRankings={powerRankings}
                    deviceColors={deviceColorMap}
                  />
                  <PowerDistributionChart
                    rankings={powerRankings}
                    totalKwh={rankings?.totals.totalKwh ?? 0}
                    colors={chartColors}
                  />
                </section>

                {/* === RANKINGS (2 columns) === */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RankingCard
                    title="Consumo (kWh)"
                    icon={<Lightning size={16} weight="bold" />}
                    rankings={powerRankings}
                    formatValue={(v) => v.toFixed(3) + ' kWh'}
                  />
                  <RankingCard
                    title="Custo"
                    icon={<CurrencyDollar size={16} weight="bold" />}
                    rankings={costRankings}
                    formatValue={(v) => (rankings?.totals.currency ?? 'R$') + ' ' + v.toFixed(2)}
                  />
                </section>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
