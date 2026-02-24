import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Cloud,
  ArrowsClockwise,
  Check,
  Circle,
  WifiHigh,
  WifiSlash,
  DownloadSimple,
  Funnel,
} from '@phosphor-icons/react'
import type { CloudDevice, CloudStatus, ApiResponse } from '@obs-tuya/shared'
import { API_ENDPOINTS, SIDECAR_URL } from '@obs-tuya/shared'

export function ImportDevicesPage() {
  const navigate = useNavigate()
  const [devices, setDevices] = useState<CloudDevice[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showOnlyPlugs, setShowOnlyPlugs] = useState(true)
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    try {
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_STATUS}`)
      const data = (await response.json()) as { success: boolean; data: CloudStatus }
      if (data.success) {
        setIsConfigured(data.data.isConfigured)
        if (data.data.isConfigured) {
          fetchDevices()
        }
      }
    } catch {
      setError('Erro ao verificar configuração')
    }
  }

  const fetchDevices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_DEVICES}`)
      const data = (await response.json()) as ApiResponse<CloudDevice[]>

      if (!data.success) {
        setError(data.error?.message || 'Erro ao buscar dispositivos')
        return
      }

      setDevices(data.data || [])
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (deviceId: string) => {
    const newSelected = new Set(selected)
    if (newSelected.has(deviceId)) {
      newSelected.delete(deviceId)
    } else {
      newSelected.add(deviceId)
    }
    setSelected(newSelected)
  }

  // Categorias de dispositivos com medicao de energia (tomadas, reguas, disjuntores)
  const ENERGY_DEVICE_CATEGORIES = new Set(['cz', 'pc', 'wk', 'dlq', 'tdq', 'kg'])

  const selectAll = () => {
    const filteredDevices = showOnlyPlugs
      ? devices.filter((d) => ENERGY_DEVICE_CATEGORIES.has(d.category))
      : devices
    if (selected.size === filteredDevices.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredDevices.map((d) => d.id)))
    }
  }

  const handleImport = async () => {
    if (selected.size === 0) {
      setError('Selecione pelo menos um dispositivo')
      return
    }

    setImporting(true)
    setError(null)
    setSuccess(null)

    const selectedDevices = devices.filter((d) => selected.has(d.id))
    let imported = 0
    let failed = 0
    const errors: string[] = []

    for (const device of selectedDevices) {
      try {
        const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICES}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: device.name,
            deviceId: device.id,
            localKey: device.localKey,
            protocolVersion: device.protocolVersion,
            communicationMode: 'local',
            category: device.category,
          }),
        })

        const data = await response.json()

        if (data.success) {
          imported++
        } else {
          failed++
          if (data.error?.code === 'DUPLICATE_DEVICE') {
            errors.push(`${device.name}: já existe`)
          } else {
            errors.push(`${device.name}: ${data.error?.message || 'erro desconhecido'}`)
          }
        }
      } catch {
        failed++
        errors.push(`${device.name}: erro de conexão`)
      }
    }

    setImporting(false)

    if (imported > 0) {
      setSuccess(`${imported} dispositivo(s) importado(s) com sucesso!`)
    }
    if (failed > 0) {
      setError(`${failed} falha(s): ${errors.join(', ')}`)
    }

    // Limpar selecao dos importados com sucesso
    if (imported > 0) {
      setSelected(new Set())
      // Redirecionar apos 2 segundos se todos foram importados
      if (failed === 0) {
        setTimeout(() => navigate('/devices'), 2000)
      }
    }
  }

  const filteredDevices = showOnlyPlugs
    ? devices.filter((d) => ENERGY_DEVICE_CATEGORIES.has(d.category))
    : devices

  // Categoria labels
  const categoryLabels: Record<string, string> = {
    cz: 'Tomada',
    pc: 'Régua',
    wk: 'Tomada',
    dlq: 'Disjuntor',
    tdq: 'Tomada',
    kg: 'Interruptor',
    dj: 'Luz',
    default: 'Outro',
  }

  if (isConfigured === false) {
    return (
      <div className="flex flex-col items-center justify-center p-6 py-12">
        <Cloud size={64} weight="duotone" className="mb-4 text-muted-foreground" />
        <h1 className="mb-2 text-xl font-bold">Cloud não configurada</h1>
        <p className="mb-4 text-muted-foreground">
          Configure as credenciais do Tuya Cloud primeiro
        </p>
        <button
          onClick={() => navigate('/cloud')}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
        >
          Configurar Cloud
        </button>
      </div>
    )
  }

  return (
    <div>
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cloud')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-[var(--hover-bg-subtle)] rounded-md"
              title="Voltar"
            >
              <ArrowLeft size={20} weight="bold" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Importar Dispositivos</h1>
              <p className="text-sm text-muted-foreground">
                Selecione os dispositivos para importar da Tuya Cloud
              </p>
            </div>
          </div>
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 hover:bg-[var(--hover-bg-subtle)] disabled:opacity-50"
          >
            <ArrowsClockwise size={16} weight="bold" className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Feedback */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-destructive">{error}</div>
        )}
        {success && <div className="mb-4 rounded-lg bg-success/15 p-3 text-success">{success}</div>}

        {/* Filters */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Funnel size={16} weight="bold" className="text-muted-foreground" />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyPlugs}
                onChange={(e) => setShowOnlyPlugs(e.target.checked)}
                className="rounded"
              />
              Apenas dispositivos de energia
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredDevices.length} dispositivo(s) | {selected.size} selecionado(s)
          </div>
        </div>

        {/* Device List */}
        {loading && devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <ArrowsClockwise
              size={32}
              weight="bold"
              className="mb-4 animate-spin text-muted-foreground"
            />
            <p className="text-muted-foreground">Buscando dispositivos...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Cloud size={48} weight="duotone" className="mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {devices.length === 0
                ? 'Nenhum dispositivo encontrado na sua conta Tuya'
                : 'Nenhuma tomada encontrada. Desmarque o filtro para ver todos.'}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="mb-2 flex items-center gap-2 border-b pb-2">
              <button
                onClick={selectAll}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                {selected.size === filteredDevices.length ? (
                  <>
                    <Check size={16} weight="bold" />
                    Desmarcar todos
                  </>
                ) : (
                  <>
                    <Circle size={16} />
                    Selecionar todos
                  </>
                )}
              </button>
            </div>

            {/* List */}
            <div className="space-y-2">
              {filteredDevices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => toggleSelect(device.id)}
                  className={`flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                    selected.has(device.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      selected.has(device.id)
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {selected.has(device.id) && <Check size={12} weight="bold" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{device.name}</span>
                      <span className="rounded bg-muted px-2 py-0.5 text-xs">
                        {categoryLabels[device.category] || categoryLabels.default} (
                        {device.category})
                      </span>
                      {device.isOnline ? (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <WifiHigh size={12} weight="bold" />
                          Online
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <WifiSlash size={12} />
                          Offline
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      <span>ID: {device.id.substring(0, 12)}...</span>
                      <span>Protocolo: {device.protocolVersion}</span>
                      {device.ip && <span>IP: {device.ip}</span>}
                      {!device.localKey && <span className="text-warning">Sem Local Key</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Import Button */}
        {filteredDevices.length > 0 && (
          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={() => navigate('/devices')}
              className="rounded-lg border px-4 py-2 hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <DownloadSimple size={16} weight="bold" />
              {importing ? 'Importando...' : `Importar ${selected.size} dispositivo(s)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
