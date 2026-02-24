import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Copy,
  Check,
  ArrowSquareOut,
  GearSix,
  Stack,
  Plug,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { listDevices, getOverlayUrl, type DeviceWithStatus } from '../services/api'
import { GlowIcon } from '../components/GlowIcon'
import { COMBINED_OVERLAY_ID } from '@obs-tuya/shared'

export function OverlaysPage() {
  const [devices, setDevices] = useState<DeviceWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    try {
      const response = await listDevices()
      if (response.success && response.data) {
        setDevices(response.data.filter((d) => d.enabled))
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar dispositivos')
      }
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
  }, [fetchDevices])

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const combinedUrl = getOverlayUrl()

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Overlays</h1>
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md disabled:opacity-50"
            title="Atualizar"
          >
            <ArrowsClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Overlay Combinado */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="p-4 flex items-start gap-4">
              <GlowIcon
                icon={<Stack size={24} weight="duotone" />}
                color="primary"
                size="md"
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-foreground">Overlay Combinado</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Exibe todos os dispositivos habilitados em um único overlay
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 px-3 py-2 bg-secondary text-xs font-mono rounded truncate">
                    {combinedUrl}
                  </code>
                  <button
                    onClick={() => handleCopyUrl(COMBINED_OVERLAY_ID, combinedUrl)}
                    className="p-2 bg-secondary hover:bg-secondary/80 rounded-md flex-shrink-0"
                    title="Copiar URL"
                  >
                    {copiedId === COMBINED_OVERLAY_ID ? (
                      <Check size={16} weight="bold" className="text-success" />
                    ) : (
                      <Copy size={16} weight="bold" />
                    )}
                  </button>
                  <a
                    href={combinedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-secondary hover:bg-secondary/80 rounded-md flex-shrink-0"
                    title="Abrir em nova aba"
                  >
                    <ArrowSquareOut size={16} weight="bold" />
                  </a>
                </div>
              </div>
              <Link
                to="/overlay/editor"
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md flex-shrink-0"
                title="Configurar"
              >
                <GearSix size={20} weight="bold" />
              </Link>
            </div>
          </div>

          {/* Dispositivos individuais */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground px-1">Overlays Individuais</h3>

            {loading ? (
              <div className="text-center py-8">
                <ArrowsClockwise
                  size={24}
                  weight="bold"
                  className="mx-auto text-muted-foreground animate-spin"
                />
              </div>
            ) : devices.length === 0 ? (
              <div className="text-center py-8">
                <Plug size={32} weight="duotone" className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum dispositivo habilitado</p>
                <Link
                  to="/devices"
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  Gerenciar dispositivos
                </Link>
              </div>
            ) : (
              devices.map((device) => {
                const deviceUrl = getOverlayUrl(device.id)
                return (
                  <div
                    key={device.id}
                    className="rounded-lg border border-border bg-card overflow-hidden"
                  >
                    <div className="p-4 flex items-start gap-4">
                      <GlowIcon
                        icon={<Plug size={24} weight="duotone" />}
                        color="secondary"
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="font-medium text-foreground">{device.name}</h2>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              device.isConnected ? 'bg-success' : 'bg-muted-foreground'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{device.deviceId}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-secondary text-xs font-mono rounded truncate">
                            {deviceUrl}
                          </code>
                          <button
                            onClick={() => handleCopyUrl(device.id, deviceUrl)}
                            className="p-2 bg-secondary hover:bg-secondary/80 rounded-md flex-shrink-0"
                            title="Copiar URL"
                          >
                            {copiedId === device.id ? (
                              <Check size={16} weight="bold" className="text-success" />
                            ) : (
                              <Copy size={16} weight="bold" />
                            )}
                          </button>
                          <a
                            href={deviceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-secondary hover:bg-secondary/80 rounded-md flex-shrink-0"
                            title="Abrir em nova aba"
                          >
                            <ArrowSquareOut size={16} weight="bold" />
                          </a>
                        </div>
                      </div>
                      <Link
                        to={`/overlay/editor/${device.id}`}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md flex-shrink-0"
                        title="Configurar"
                      >
                        <GearSix size={20} weight="bold" />
                      </Link>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Dica */}
        <div className="mt-8 p-4 rounded-lg bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            Copie a URL e adicione como fonte{' '}
            <span className="font-medium text-foreground">Navegador</span> (Browser) no OBS.
            Clique na engrenagem para customizar e ver as dimensões recomendadas.
          </p>
        </div>
      </div>
    </div>
  )
}
