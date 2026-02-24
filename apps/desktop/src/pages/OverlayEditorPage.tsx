import { useState, useEffect, useCallback, type CSSProperties } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  FloppyDisk,
  ArrowCounterClockwise,
  Copy,
  Check,
  BookmarkSimple,
  ArrowSquareOut,
  ArrowsClockwise,
  Lightning,
  TrendUp,
  Clock,
  Pulse,
  CaretUp,
  CaretDown,
  PencilSimple,
  Trash,
  X,
} from '@phosphor-icons/react'
import {
  getOverlayConfig,
  updateOverlayConfig,
  listOverlayPresets,
  applyPresetToConfig,
  createPresetFromConfig,
  updateOverlayPreset,
  deleteOverlayPreset,
  getOverlayUrl,
  listDevices,
  getDeviceStats,
  getDeviceStatus,
  type OverlayConfigOutput,
  type OverlayPresetOutput,
  type DeviceWithStatus,
  type DeviceStats,
} from '../services/api'
import { COMBINED_OVERLAY_ID } from '@obs-tuya/shared'

const AVAILABLE_METRICS = [
  { id: 'power', label: 'Potência' },
  { id: 'voltage', label: 'Tensão' },
  { id: 'current', label: 'Corrente' },
]

const METRIC_LABELS: Record<string, string> = {
  power: 'Potência',
  voltage: 'Tensão',
  current: 'Corrente',
}

const FONT_FAMILIES = [
  { value: 'system-ui', label: 'System UI' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'monospace', label: 'Monospace' },
]

const MOCK_STATUS = { switch: true, power: 142.5, voltage: 127, current: 1120 }

function formatPreviewValue(metric: string, value: number): string {
  switch (metric) {
    case 'power':
      if (value >= 1000) return (value / 1000).toFixed(1) + 'kW'
      return value.toFixed(1) + 'W'
    case 'voltage':
      return Math.round(value) + 'V'
    case 'current':
      if (value < 1000) return Math.round(value) + 'mA'
      return (value / 1000).toFixed(2) + 'A'
    default:
      return String(value)
  }
}

/**
 * Extrai cor hex e opacidade de um valor CSS de background
 */
function parseBackgroundColor(bg: string): { hex: string; opacity: number } {
  // rgba(r,g,b,a)
  const rgbaMatch = bg.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/)
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]!)
    const g = parseInt(rgbaMatch[2]!)
    const b = parseInt(rgbaMatch[3]!)
    const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
    const hex = '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')
    return { hex, opacity: Math.round(a * 100) }
  }

  // transparent
  if (bg === 'transparent') {
    return { hex: '#000000', opacity: 0 }
  }

  // hex
  if (bg.startsWith('#')) {
    return { hex: bg.length === 4 ? bg : bg.slice(0, 7), opacity: 100 }
  }

  return { hex: '#000000', opacity: 70 }
}

function composeBackgroundColor(hex: string, opacity: number): string {
  if (opacity === 0) return 'transparent'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (opacity === 100) return hex
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`
}

/**
 * Calcula dimensoes recomendadas para o Browser Source do OBS
 * baseado na configuracao atual do overlay
 */
function calcRecommendedDimensions(config: OverlayConfigOutput): { width: number; height: number } {
  const isVertical = config.layout === 'vertical'
  const visibleCount = config.visibleMetrics.length
  const hasName = config.showDeviceName
  const fontSize = config.fontSize
  const padding = config.padding

  // Estima tamanho de cada elemento
  const metricValueWidth = fontSize * 4 // "142.5W" ~4 chars
  const metricLabelWidth = fontSize * 0.4 * 6 // label ~6 chars com fonte menor
  const nameHeight = hasName ? Math.round(fontSize * 0.6) + 8 : 0
  const statusHeight = Math.round(fontSize * 0.5) + 8

  if (isVertical) {
    // Vertical: elementos empilhados
    const metricHeight = fontSize + Math.round(fontSize * 0.4) + 8 // valor + label + gap
    const contentHeight = nameHeight + statusHeight + visibleCount * metricHeight
    const contentWidth = Math.max(metricValueWidth + metricLabelWidth + 8, fontSize * 5)

    return {
      width: Math.ceil((contentWidth + padding * 2) / 10) * 10,
      height: Math.ceil((contentHeight + padding * 2) / 10) * 10,
    }
  } else {
    // Horizontal: elementos lado a lado
    const metricWidth = Math.max(metricValueWidth, metricLabelWidth) + 16
    const contentWidth =
      (hasName ? fontSize * 5 : 0) + fontSize * 3 + visibleCount * metricWidth + 16 * visibleCount
    const contentHeight = fontSize + Math.round(fontSize * 0.4) + 4

    return {
      width: Math.ceil((contentWidth + padding * 2) / 10) * 10,
      height: Math.ceil((contentHeight + padding * 2) / 10) * 10,
    }
  }
}

/**
 * Preview em tempo real do overlay usando estado local
 */
function OverlayPreview({ config }: { config: OverlayConfigOutput }) {
  const isVertical = config.layout === 'vertical'
  const textShadow = config.textShadowEnabled
    ? `${config.textShadowOffsetX}px ${config.textShadowOffsetY}px ${config.textShadowBlur}px ${config.textShadowColor}`
    : 'none'

  const overlayStyle: CSSProperties = {
    display: 'inline-flex',
    flexDirection: isVertical ? 'column' : 'row',
    alignItems: isVertical ? 'flex-start' : 'center',
    gap: isVertical ? '8px' : '16px',
    background: config.backgroundColor,
    padding: `${config.padding}px`,
    borderRadius: `${config.borderRadius}px`,
    color: config.fontColor,
    fontSize: `${config.fontSize}px`,
    fontFamily: `${config.fontFamily}, -apple-system, sans-serif`,
    textShadow,
    WebkitTextStroke: config.textStrokeEnabled
      ? `${config.textStrokeWidth}px ${config.textStrokeColor}`
      : undefined,
  }

  const visibleOrdered = config.metricsOrder.filter((m) => config.visibleMetrics.includes(m))

  return (
    <div style={overlayStyle}>
      {config.showDeviceName && (
        <div style={{ fontSize: `${Math.round(config.fontSize * 0.6)}px`, opacity: 0.8 }}>
          Tomada PC
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div
          style={{
            width: `${Math.round(config.fontSize * 0.4)}px`,
            height: `${Math.round(config.fontSize * 0.4)}px`,
            borderRadius: '50%',
            background: '#22c55e',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: `${Math.round(config.fontSize * 0.5)}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          ON
        </span>
      </div>
      {visibleOrdered.map((metric) => (
        <div
          key={metric}
          style={{
            textAlign: isVertical ? 'left' : 'center',
            display: 'flex',
            flexDirection: isVertical ? 'row' : 'column',
            alignItems: isVertical ? 'baseline' : 'center',
            gap: isVertical ? '8px' : '2px',
          }}
        >
          <div style={{ fontWeight: 'bold', lineHeight: 1 }}>
            {formatPreviewValue(metric, MOCK_STATUS[metric as keyof typeof MOCK_STATUS] as number)}
          </div>
          <div style={{ fontSize: `${Math.round(config.fontSize * 0.4)}px`, opacity: 0.6 }}>
            {METRIC_LABELS[metric]}
          </div>
        </div>
      ))}
    </div>
  )
}

export function OverlayEditorPage() {
  const { deviceId } = useParams<{ deviceId?: string }>()
  const navigate = useNavigate()
  const targetId = deviceId || COMBINED_OVERLAY_ID

  const [config, setConfig] = useState<OverlayConfigOutput | null>(null)
  const [presets, setPresets] = useState<OverlayPresetOutput[]>([])
  const [devices, setDevices] = useState<DeviceWithStatus[]>([])
  const [stats, setStats] = useState<DeviceStats | null>(null)
  const [currentPower, setCurrentPower] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [editingPresetName, setEditingPresetName] = useState('')

  const isCombined = targetId === COMBINED_OVERLAY_ID

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [configRes, presetsRes, devicesRes] = await Promise.all([
        getOverlayConfig(targetId),
        listOverlayPresets(),
        listDevices(),
      ])

      if (configRes.success && configRes.data) {
        setConfig(configRes.data)
      } else {
        setError(configRes.error?.message || 'Erro ao carregar configuração')
      }

      if (presetsRes.success && presetsRes.data) {
        setPresets(presetsRes.data)
      }

      if (devicesRes.success && devicesRes.data) {
        setDevices(devicesRes.data)
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [targetId])

  const fetchDeviceStats = useCallback(async () => {
    if (isCombined) return

    try {
      const end = new Date()
      const start = new Date()
      start.setHours(start.getHours() - 24)

      const [statsRes, statusRes] = await Promise.all([
        getDeviceStats(targetId, {
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
        getDeviceStatus(targetId),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }

      if (statusRes.success && statusRes.data) {
        setCurrentPower(statusRes.data.power ?? null)
        setIsConnected(true)
      } else {
        setIsConnected(false)
      }
    } catch {
      setIsConnected(false)
    }
  }, [targetId, isCombined])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!isCombined) {
      fetchDeviceStats()
      const interval = setInterval(fetchDeviceStats, 5000)
      return () => clearInterval(interval)
    }
  }, [fetchDeviceStats, isCombined])

  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const response = await updateOverlayConfig(targetId, {
        fontSize: config.fontSize,
        fontColor: config.fontColor,
        fontFamily: config.fontFamily,
        textStrokeEnabled: config.textStrokeEnabled,
        textStrokeColor: config.textStrokeColor,
        textStrokeWidth: config.textStrokeWidth,
        textShadowEnabled: config.textShadowEnabled,
        textShadowColor: config.textShadowColor,
        textShadowBlur: config.textShadowBlur,
        textShadowOffsetX: config.textShadowOffsetX,
        textShadowOffsetY: config.textShadowOffsetY,
        layout: config.layout,
        backgroundColor: config.backgroundColor,
        backgroundOpacity: config.backgroundOpacity,
        borderRadius: config.borderRadius,
        padding: config.padding,
        visibleMetrics: config.visibleMetrics,
        metricsOrder: config.metricsOrder,
        showDeviceName: config.showDeviceName,
        combinedLayout: config.combinedLayout,
      })

      if (response.success && response.data) {
        setConfig(response.data)
      } else {
        setError(response.error?.message || 'Erro ao salvar')
      }
    } catch {
      setError('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    await fetchData()
  }

  const handleApplyPreset = async (presetId: string) => {
    try {
      const response = await applyPresetToConfig(targetId, presetId)
      if (response.success && response.data) {
        setConfig(response.data)
      } else {
        setError(response.error?.message || 'Erro ao aplicar preset')
      }
    } catch {
      setError('Erro ao aplicar preset')
    }
  }

  const handleSaveAsPreset = async () => {
    if (!presetName.trim()) return
    try {
      const response = await createPresetFromConfig(targetId, presetName.trim())
      if (response.success && response.data) {
        setPresets([...presets, response.data])
        setPresetName('')
        setShowPresetDialog(false)
      } else {
        setError(response.error?.message || 'Erro ao criar preset')
      }
    } catch {
      setError('Erro ao criar preset')
    }
  }

  const handleRenamePreset = async (presetId: string) => {
    if (!editingPresetName.trim()) return
    try {
      const response = await updateOverlayPreset(presetId, { name: editingPresetName.trim() })
      if (response.success && response.data) {
        setPresets(presets.map((p) => (p.id === presetId ? response.data! : p)))
        setEditingPresetId(null)
        setEditingPresetName('')
      } else {
        setError(response.error?.message || 'Erro ao renomear preset')
      }
    } catch {
      setError('Erro ao renomear preset')
    }
  }

  const handleDeletePreset = async (presetId: string) => {
    try {
      const response = await deleteOverlayPreset(presetId)
      if (response.success) {
        setPresets(presets.filter((p) => p.id !== presetId))
      } else {
        setError(response.error?.message || 'Erro ao deletar preset')
      }
    } catch {
      setError('Erro ao deletar preset')
    }
  }

  const handleCopyUrl = () => {
    const url = getOverlayUrl(isCombined ? undefined : targetId)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const updateConfig = <K extends keyof OverlayConfigOutput>(
    key: K,
    value: OverlayConfigOutput[K]
  ) => {
    if (!config) return
    setConfig({ ...config, [key]: value })
  }

  const toggleMetric = (metricId: string) => {
    if (!config) return
    const isVisible = config.visibleMetrics.includes(metricId)
    if (isVisible) {
      // Impedir desmarcar a ultima metrica
      if (config.visibleMetrics.length <= 1) return
      updateConfig(
        'visibleMetrics',
        config.visibleMetrics.filter((m) => m !== metricId)
      )
    } else {
      updateConfig('visibleMetrics', [...config.visibleMetrics, metricId])
    }
  }

  const moveMetric = (metricId: string, direction: 'up' | 'down') => {
    if (!config) return
    const order = [...config.metricsOrder]
    const idx = order.indexOf(metricId)
    if (idx === -1) return
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === order.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = order[idx]!
    order[idx] = order[swapIdx]!
    order[swapIdx] = temp
    updateConfig('metricsOrder', order)
  }

  const updateBackgroundColor = (hex: string, opacity: number) => {
    if (!config) return
    const bg = composeBackgroundColor(hex, opacity)
    setConfig({ ...config, backgroundColor: bg, backgroundOpacity: opacity })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowsClockwise size={32} weight="bold" className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Erro ao carregar'}</p>
          <Link to="/devices" className="text-primary hover:underline">
            Voltar
          </Link>
        </div>
      </div>
    )
  }

  const overlayUrl = getOverlayUrl(isCombined ? undefined : targetId)
  const { hex: bgHex, opacity: bgOpacity } = parseBackgroundColor(config.backgroundColor)

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isCombined ? 'Overlay Combinado' : 'Configurar Overlay'}
              </h1>
              {!isCombined && (
                <p className="text-xs text-muted-foreground">
                  {devices.find((d) => d.id === targetId)?.name || targetId}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title="Reverter alterações"
            >
              <ArrowCounterClockwise size={18} weight="bold" />
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <FloppyDisk size={18} weight="bold" />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Preview + Presets */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Preview em tempo real */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-3">Pré-visualização</h2>
              <div
                className="min-h-[200px] rounded-md overflow-hidden flex items-center justify-center"
                style={{ background: '#1a1a1a' }}
              >
                <OverlayPreview config={config} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={overlayUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-secondary text-sm rounded-md font-mono text-muted-foreground"
                />
                <button
                  onClick={handleCopyUrl}
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-md"
                  title="Copiar URL"
                >
                  {copied ? (
                    <Check size={18} weight="bold" className="text-success" />
                  ) : (
                    <Copy size={18} weight="bold" />
                  )}
                </button>
                <a
                  href={overlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-secondary hover:bg-secondary/80 rounded-md"
                  title="Abrir em nova aba"
                >
                  <ArrowSquareOut size={18} weight="bold" />
                </a>
              </div>

              {/* Como usar no OBS */}
              <div className="mt-3 p-3 rounded-md bg-secondary/50">
                <h3 className="text-xs font-medium text-foreground mb-2">Como usar no OBS</h3>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                  <li>Copie a URL acima</li>
                  <li>
                    No OBS, adicione uma fonte{' '}
                    <span className="font-medium text-foreground">Navegador</span> (Browser)
                  </li>
                  <li>Cole a URL no campo URL</li>
                  <li>
                    Configure as dimensões:{' '}
                    <span className="font-mono text-foreground">
                      {calcRecommendedDimensions(config).width} x{' '}
                      {calcRecommendedDimensions(config).height}
                    </span>
                  </li>
                  <li>
                    Marque{' '}
                    <span className="font-medium text-foreground">
                      Atualizar navegador quando a cena ficar ativa
                    </span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Mini-Dashboard (FR-303) */}
            {!isCombined && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-foreground">Status do Monitoramento</h2>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-muted-foreground'}`}
                    />
                    <span className="text-xs text-muted-foreground">
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </span>
                  </div>
                </div>

                {isConnected && stats ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-warning/15">
                        <Lightning size={14} weight="duotone" className="text-warning" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Atual</p>
                        <p className="text-sm font-bold font-mono text-warning">
                          {currentPower !== null
                            ? currentPower >= 1000
                              ? `${(currentPower / 1000).toFixed(2)} kW`
                              : `${currentPower.toFixed(1)} W`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-primary/15">
                        <Pulse size={14} weight="duotone" className="text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Média (24h)</p>
                        <p className="text-sm font-bold font-mono text-primary">
                          {stats.avgPower >= 1000
                            ? `${(stats.avgPower / 1000).toFixed(2)} kW`
                            : `${stats.avgPower.toFixed(1)} W`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-destructive/15">
                        <TrendUp size={14} weight="duotone" className="text-destructive" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pico</p>
                        <p className="text-sm font-bold font-mono text-destructive">
                          {stats.maxPower >= 1000
                            ? `${(stats.maxPower / 1000).toFixed(2)} kW`
                            : `${stats.maxPower.toFixed(1)} W`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded bg-success/15">
                        <Clock size={14} weight="duotone" className="text-success" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Leituras</p>
                        <p className="text-sm font-bold font-mono text-success">
                          {stats.readingsCount}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isConnected
                      ? 'Carregando dados...'
                      : 'Conecte o dispositivo para ver estatísticas'}
                  </p>
                )}
              </div>
            )}

            {/* Presets */}
            <div className="mt-4 rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-foreground">Presets</h2>
                <button
                  onClick={() => setShowPresetDialog(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Salvar como preset
                </button>
              </div>
              {presets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum preset salvo</p>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div key={preset.id} className="flex items-center gap-2 group">
                      {editingPresetId === preset.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            value={editingPresetName}
                            onChange={(e) => setEditingPresetName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenamePreset(preset.id)
                              if (e.key === 'Escape') setEditingPresetId(null)
                            }}
                            className="flex-1 px-2 py-1 bg-secondary rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenamePreset(preset.id)}
                            className="p-1 text-primary hover:bg-secondary rounded"
                          >
                            <Check size={14} weight="bold" />
                          </button>
                          <button
                            onClick={() => setEditingPresetId(null)}
                            className="p-1 text-muted-foreground hover:bg-secondary rounded"
                          >
                            <X size={14} weight="bold" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApplyPreset(preset.id)}
                            className="flex-1 inline-flex items-center gap-1 px-3 py-1.5 bg-secondary text-sm rounded-md hover:bg-secondary/80 text-left"
                          >
                            <BookmarkSimple size={14} weight="duotone" className="flex-shrink-0" />
                            <span className="truncate">{preset.name}</span>
                          </button>
                          <button
                            onClick={() => {
                              setEditingPresetId(preset.id)
                              setEditingPresetName(preset.name)
                            }}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Renomear"
                          >
                            <PencilSimple size={14} weight="bold" />
                          </button>
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Deletar"
                          >
                            <Trash size={14} weight="bold" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-6">
            {/* Fonte */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-4">Fonte</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Tamanho</label>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={config.fontSize}
                    onChange={(e) => updateConfig('fontSize', Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {config.fontSize}px
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.fontColor}
                        onChange={(e) => updateConfig('fontColor', e.target.value)}
                        className="w-10 h-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.fontColor}
                        onChange={(e) => updateConfig('fontColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-secondary rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Família</label>
                    <select
                      value={config.fontFamily}
                      onChange={(e) => updateConfig('fontFamily', e.target.value)}
                      className="w-full px-3 py-2 bg-secondary rounded-md text-sm"
                    >
                      {FONT_FAMILIES.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Borda do texto */}
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-foreground">Borda do texto</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.textStrokeEnabled}
                    onChange={(e) => updateConfig('textStrokeEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
              {config.textStrokeEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.textStrokeColor}
                        onChange={(e) => updateConfig('textStrokeColor', e.target.value)}
                        className="w-10 h-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.textStrokeColor}
                        onChange={(e) => updateConfig('textStrokeColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-secondary rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Largura</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={config.textStrokeWidth}
                      onChange={(e) => updateConfig('textStrokeWidth', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {config.textStrokeWidth}px
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Sombra do texto */}
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-foreground">Sombra do texto</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.textShadowEnabled}
                    onChange={(e) => updateConfig('textShadowEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-secondary peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
              {config.textShadowEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.textShadowColor}
                        onChange={(e) => updateConfig('textShadowColor', e.target.value)}
                        className="w-10 h-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={config.textShadowColor}
                        onChange={(e) => updateConfig('textShadowColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-secondary rounded-md text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Blur</label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={config.textShadowBlur}
                        onChange={(e) => updateConfig('textShadowBlur', Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {config.textShadowBlur}px
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Offset X</label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={config.textShadowOffsetX}
                        onChange={(e) => updateConfig('textShadowOffsetX', Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {config.textShadowOffsetX}px
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Offset Y</label>
                      <input
                        type="range"
                        min="-10"
                        max="10"
                        value={config.textShadowOffsetY}
                        onChange={(e) => updateConfig('textShadowOffsetY', Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {config.textShadowOffsetY}px
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Layout */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-4">Layout</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-2">Orientação</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateConfig('layout', 'horizontal')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm ${
                        config.layout === 'horizontal'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      Horizontal
                    </button>
                    <button
                      onClick={() => updateConfig('layout', 'vertical')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm ${
                        config.layout === 'vertical'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary'
                      }`}
                    >
                      Vertical
                    </button>
                  </div>
                </div>
                {isCombined && (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-2">
                      Disposição dos dispositivos
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateConfig('combinedLayout', 'stacked')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm ${
                          config.combinedLayout === 'stacked'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        Empilhado
                      </button>
                      <button
                        onClick={() => updateConfig('combinedLayout', 'side-by-side')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm ${
                          config.combinedLayout === 'side-by-side'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary'
                        }`}
                      >
                        Lado a lado
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Background */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-4">Fundo</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Cor</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={bgHex}
                        onChange={(e) => updateBackgroundColor(e.target.value, bgOpacity)}
                        className="w-10 h-10 rounded border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={bgHex}
                        onChange={(e) => {
                          if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
                            updateBackgroundColor(e.target.value, bgOpacity)
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-secondary rounded-md text-sm font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Opacidade</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={bgOpacity}
                      onChange={(e) => updateBackgroundColor(bgHex, Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground text-right">{bgOpacity}%</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">
                      Raio da borda
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="32"
                      value={config.borderRadius}
                      onChange={(e) => updateConfig('borderRadius', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {config.borderRadius}px
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Padding</label>
                    <input
                      type="range"
                      min="0"
                      max="48"
                      value={config.padding}
                      onChange={(e) => updateConfig('padding', Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-muted-foreground text-right">
                      {config.padding}px
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dados exibidos */}
            <section className="rounded-lg border border-border bg-card p-4">
              <h2 className="text-sm font-medium text-foreground mb-4">Dados exibidos</h2>
              <div className="space-y-1">
                {config.metricsOrder.map((metricId, idx) => {
                  const metric = AVAILABLE_METRICS.find((m) => m.id === metricId)
                  if (!metric) return null
                  const isVisible = config.visibleMetrics.includes(metricId)
                  const isFirst = idx === 0
                  const isLast = idx === config.metricsOrder.length - 1

                  return (
                    <div
                      key={metricId}
                      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/50"
                    >
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={() => toggleMetric(metricId)}
                        className="w-4 h-4 rounded"
                        disabled={isVisible && config.visibleMetrics.length <= 1}
                      />
                      <span className="text-sm flex-1">{metric.label}</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveMetric(metricId, 'up')}
                          disabled={isFirst}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded"
                          title="Mover para cima"
                        >
                          <CaretUp size={14} weight="bold" />
                        </button>
                        <button
                          onClick={() => moveMetric(metricId, 'down')}
                          disabled={isLast}
                          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed rounded"
                          title="Mover para baixo"
                        >
                          <CaretDown size={14} weight="bold" />
                        </button>
                      </div>
                    </div>
                  )
                })}
                <label className="flex items-center gap-3 cursor-pointer pt-2 mt-1 border-t border-border px-2">
                  <input
                    type="checkbox"
                    checked={config.showDeviceName}
                    onChange={(e) => updateConfig('showDeviceName', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">Mostrar nome do dispositivo</span>
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Preset Dialog */}
      {showPresetDialog && (
        <div className="fixed inset-0 bg-[var(--overlay-backdrop)] flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-4">Salvar como preset</h3>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && presetName.trim()) handleSaveAsPreset()
                if (e.key === 'Escape') setShowPresetDialog(false)
              }}
              placeholder="Nome do preset"
              className="w-full px-3 py-2 bg-secondary rounded-md mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPresetDialog(false)}
                className="px-4 py-2 bg-secondary rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveAsPreset}
                disabled={!presetName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
