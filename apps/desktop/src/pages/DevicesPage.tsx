import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Plus,
  GearSix,
  ArrowsClockwise,
  Plug,
  Cloud,
  Stack,
  ChartLineUp,
} from '@phosphor-icons/react'
import { DeviceCard } from '../components/DeviceCard'
import { useDialog } from '../components/Dialog'
import {
  listDevices,
  connectDevice,
  disconnectDevice,
  deleteDevice,
  toggleDeviceEnabled,
  type DeviceWithStatus,
} from '../services/api'

export function DevicesPage() {
  const navigate = useNavigate()
  const dialog = useDialog()
  const [devices, setDevices] = useState<DeviceWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDevices = useCallback(async () => {
    try {
      const response = await listDevices()
      if (response.success && response.data) {
        setDevices(response.data)
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar dispositivos')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()

    // Atualiza a cada 5 segundos
    const interval = setInterval(fetchDevices, 5000)
    return () => clearInterval(interval)
  }, [fetchDevices])

  const handleConnect = async (id: string) => {
    const response = await connectDevice(id)
    if (!response.success) {
      const errorCode = response.error?.code
      const errorMessage = response.error?.message || 'Erro ao conectar'

      // Erro de permissao Cloud - mostrar instrucoes
      if (errorCode === 'CLOUD_PERMISSION_ERROR') {
        await dialog.warning('Permissao necessaria', errorMessage)
      } else {
        await dialog.error('Erro ao conectar', errorMessage)
      }
    }
    await fetchDevices()
  }

  const handleDisconnect = async (id: string) => {
    const response = await disconnectDevice(id)
    if (!response.success) {
      await dialog.error('Erro ao desconectar', response.error?.message || 'Erro ao desconectar')
    }
    await fetchDevices()
  }

  const handleEdit = (id: string) => {
    navigate(`/devices/${id}`)
  }

  const handleDelete = async (id: string) => {
    const response = await deleteDevice(id)
    if (!response.success) {
      await dialog.error('Erro ao excluir', response.error?.message || 'Erro ao excluir')
    }
    await fetchDevices()
  }

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    const response = await toggleDeviceEnabled(id, enabled)
    if (!response.success) {
      await dialog.error('Erro', response.error?.message || 'Erro ao alterar status')
    }
    await fetchDevices()
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Dispositivos</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDevices}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md disabled:opacity-50"
              title="Atualizar"
            >
              <ArrowsClockwise size={20} weight="bold" className={loading ? 'animate-spin' : ''} />
            </button>
            <Link
              to="/dashboard"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title="Dashboard"
            >
              <ChartLineUp size={20} weight="bold" />
            </Link>
            <Link
              to="/overlays"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title="Overlays"
            >
              <Stack size={20} weight="bold" />
            </Link>
            <Link
              to="/cloud"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title="Tuya Cloud"
            >
              <Cloud size={20} weight="bold" />
            </Link>
            <Link
              to="/security"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
              title="Configuracoes"
            >
              <GearSix size={20} weight="bold" />
            </Link>
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

        {loading && devices.length === 0 ? (
          <div className="text-center py-12">
            <ArrowsClockwise
              size={32}
              weight="duotone"
              className="mx-auto text-muted-foreground animate-spin"
            />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary mb-4">
              <Plug size={32} weight="duotone" className="text-muted-foreground" />
            </div>
            <h2 className="text-lg font-medium text-foreground">Nenhum dispositivo</h2>
            <p className="text-muted-foreground mt-1">Adicione sua primeira tomada inteligente</p>
            <Link
              to="/devices/add"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus size={18} weight="bold" />
              Adicionar dispositivo
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleEnabled={handleToggleEnabled}
                />
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/devices/add"
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                <Plus size={18} weight="bold" />
                Adicionar dispositivo
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
