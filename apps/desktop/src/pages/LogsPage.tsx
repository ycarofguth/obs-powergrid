import { useState, useEffect, useCallback } from 'react'
import {
  ArrowsClockwise,
  DownloadSimple,
  Trash,
  Funnel,
  CaretDown,
  WarningCircle,
  GearSix,
  WifiHigh,
  User,
  Desktop,
} from '@phosphor-icons/react'
import {
  getLogs,
  getLogTypes,
  cleanupLogs,
  getLogsExportUrl,
  listDevices,
  type LogEntry,
  type LogType,
  type DeviceWithStatus,
} from '../services/api'

const LOG_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  system: {
    icon: <Desktop size={16} weight="duotone" />,
    color: 'text-primary bg-primary/15',
    label: 'Sistema',
  },
  connection: {
    icon: <WifiHigh size={16} weight="duotone" />,
    color: 'text-success bg-success/15',
    label: 'Conexao',
  },
  config: {
    icon: <GearSix size={16} weight="duotone" />,
    color: 'text-info bg-info/10',
    label: 'Configuração',
  },
  error: {
    icon: <WarningCircle size={16} weight="duotone" />,
    color: 'text-destructive bg-destructive/15',
    label: 'Erro',
  },
  user: {
    icon: <User size={16} weight="duotone" />,
    color: 'text-warning bg-warning/15',
    label: 'Usuario',
  },
}

interface LogItemProps {
  log: LogEntry
}

function LogItem({ log }: LogItemProps) {
  const config = LOG_TYPE_CONFIG[log.type] ?? LOG_TYPE_CONFIG.system
  const timestamp = new Date(log.timestamp)

  return (
    <div className="flex items-start gap-3 p-3 hover:bg-secondary/50 rounded-md transition-colors">
      <div className={`p-1.5 rounded-md ${config?.color ?? ''}`}>{config?.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{log.message}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
          <span>{timestamp.toLocaleDateString()}</span>
          <span>{timestamp.toLocaleTimeString()}</span>
          {log.deviceId && (
            <>
              <span>-</span>
              <span className="font-mono">{log.deviceId.slice(0, 8)}...</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [logTypes, setLogTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<LogType[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [devices, setDevices] = useState<DeviceWithStatus[]>([])
  const [limit] = useState(100)
  const [offset, setOffset] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  // Cleanup
  const [cleaningUp, setCleaningUp] = useState(false)
  const [cleanupDays, setCleanupDays] = useState('30')

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getLogs({
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        deviceId: selectedDeviceId || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        limit,
        offset,
      })

      if (response.success && response.data) {
        setLogs(response.data.logs)
        setTotal(response.data.total)
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar logs')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedTypes, selectedDeviceId, startDate, endDate, limit, offset])

  const fetchLogTypes = useCallback(async () => {
    try {
      const response = await getLogTypes()
      if (response.success && response.data) {
        setLogTypes(response.data)
      }
    } catch (err) {
      console.error('Error fetching log types:', err)
    }
  }, [])

  const fetchDevices = useCallback(async () => {
    try {
      const response = await listDevices()
      if (response.success && response.data) {
        setDevices(response.data)
      }
    } catch (err) {
      console.error('Error fetching devices:', err)
    }
  }, [])

  useEffect(() => {
    fetchLogTypes()
    fetchDevices()
  }, [fetchLogTypes, fetchDevices])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleTypeToggle = (type: LogType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
    setOffset(0)
  }

  const handleCleanup = async () => {
    if (!confirm(`Remover logs com mais de ${cleanupDays} dias?`)) return

    setCleaningUp(true)
    try {
      const response = await cleanupLogs(parseInt(cleanupDays))
      if (response.success && response.data) {
        alert(`${response.data.deletedCount} logs removidos`)
        fetchLogs()
      } else {
        alert(response.error?.message || 'Erro ao limpar logs')
      }
    } catch (err) {
      alert('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setCleaningUp(false)
    }
  }

  const handleExport = () => {
    const url = getLogsExportUrl({
      types: selectedTypes.length > 0 ? selectedTypes : undefined,
      deviceId: selectedDeviceId || undefined,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    })
    window.open(url, '_blank')
  }

  const handleLoadMore = () => {
    setOffset((prev) => prev + limit)
  }

  const hasMore = logs.length < total

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Logs de Atividade</h1>
            <p className="text-sm text-muted-foreground">{total} registros</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                showFilters || selectedTypes.length > 0 || selectedDeviceId || startDate || endDate
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title="Filtros"
            >
              <Funnel size={20} weight="bold" />
            </button>
            <button
              onClick={handleExport}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title="Exportar CSV"
            >
              <DownloadSimple size={20} weight="bold" />
            </button>
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md disabled:opacity-50"
              title="Atualizar"
            >
              <ArrowsClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      {showFilters && (
        <div className="border-b border-border bg-card/50">
          <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
            {/* Type filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Tipos:</span>
              {logTypes.map((type) => {
                const config = LOG_TYPE_CONFIG[type] || { icon: null, color: '', label: type }
                const isSelected = selectedTypes.includes(type as LogType)
                return (
                  <button
                    key={type}
                    onClick={() => handleTypeToggle(type as LogType)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {config.icon}
                    {config.label}
                  </button>
                )
              })}
            </div>

            {/* Device + Date filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Dispositivo:</span>
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value)
                    setOffset(0)
                  }}
                  className="py-1 text-sm"
                >
                  <option value="">Todos</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">De:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setOffset(0)
                  }}
                  className="py-1 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ate:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setOffset(0)
                  }}
                  className="py-1 text-sm"
                />
              </div>

              {(selectedDeviceId || startDate || endDate) && (
                <button
                  onClick={() => {
                    setSelectedDeviceId('')
                    setStartDate('')
                    setEndDate('')
                    setOffset(0)
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Cleanup */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <input
                type="number"
                min="1"
                max="365"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(e.target.value)}
                className="w-20 py-1 text-sm"
                placeholder="30"
              />
              <span className="text-sm text-muted-foreground">dias</span>
              <button
                onClick={handleCleanup}
                disabled={cleaningUp}
                className="flex items-center gap-1.5 px-2 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-md disabled:opacity-50"
              >
                {cleaningUp ? (
                  <ArrowsClockwise size={14} weight="bold" className="animate-spin" />
                ) : (
                  <Trash size={14} weight="bold" />
                )}
                Limpar antigos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        {loading && logs.length === 0 ? (
          <div className="text-center py-12">
            <ArrowsClockwise
              size={32}
              weight="bold"
              className="mx-auto text-muted-foreground animate-spin"
            />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <WarningCircle size={32} weight="duotone" className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground">Nenhum log encontrado</h2>
            <p className="text-muted-foreground mt-1">
              {selectedTypes.length > 0
                ? 'Tente remover os filtros'
                : 'Os logs de atividade aparecerao aqui'}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-lg divide-y divide-border">
              {logs.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-primary/10 rounded-md disabled:opacity-50"
                >
                  <CaretDown size={18} weight="bold" />
                  Carregar mais ({total - logs.length} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
