import { useState } from 'react'
import { Plug, GearSix, Trash, Power, ArrowsClockwise, X } from '@phosphor-icons/react'
import { StatusBadge } from './StatusBadge'
import { useDialog } from './Dialog'
import { GlowIcon } from './GlowIcon'
import type { DeviceWithStatus } from '../services/api'

interface DeviceCardProps {
  device: DeviceWithStatus
  onConnect: (id: string) => Promise<void>
  onDisconnect: (id: string) => Promise<void>
  onEdit: (id: string) => void
  onDelete: (id: string) => Promise<void>
  onToggleEnabled: (id: string, enabled: boolean) => Promise<void>
}

export function DeviceCard({
  device,
  onConnect,
  onDisconnect,
  onEdit,
  onDelete,
  onToggleEnabled,
}: DeviceCardProps) {
  const dialog = useDialog()
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const getStatus = () => {
    if (!device.enabled) return 'disabled'
    if (loading) return 'connecting'
    if (device.isConnected) return 'connected'
    return 'disconnected'
  }

  const handleConnect = async () => {
    setLoading(true)
    setActionLoading('connect')
    try {
      await onConnect(device.id)
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleCancelConnect = async () => {
    try {
      await onDisconnect(device.id)
    } catch {
      // Ignora erro ao cancelar
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    setActionLoading('disconnect')
    try {
      await onDisconnect(device.id)
    } finally {
      setLoading(false)
      setActionLoading(null)
    }
  }

  const handleToggle = async () => {
    setActionLoading('toggle')
    try {
      await onToggleEnabled(device.id, !device.enabled)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async () => {
    const confirmed = await dialog.confirm(
      'Excluir dispositivo',
      `Tem certeza que deseja excluir "${device.name}"? Esta ação não pode ser desfeita.`
    )
    if (!confirmed) return

    setActionLoading('delete')
    try {
      await onDelete(device.id)
    } catch (err) {
      console.error('Erro ao excluir dispositivo:', err)
      await dialog.error('Erro', 'Não foi possível excluir o dispositivo.')
    } finally {
      setActionLoading(null)
    }
  }

  const getCardClasses = () => {
    const base = 'bg-card border rounded-lg p-4 transition-all duration-200'
    if (!device.enabled) return `${base} border-border/60 opacity-75`
    if (device.isConnected) return `${base} border-success/25 shadow-status`
    return `${base} border-border hover:border-primary/20`
  }

  return (
    <div className={getCardClasses()}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <GlowIcon
            icon={<Plug size={20} weight="duotone" />}
            color={device.isConnected ? 'success' : 'primary'}
          />
          <div>
            <h3 className="font-medium text-foreground">{device.name}</h3>
            <p className="text-sm text-muted-foreground">
              {device.communicationMode === 'local' ? 'Local' : 'Cloud'} - v{device.protocolVersion}
            </p>
          </div>
        </div>
        <StatusBadge status={getStatus()} />
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Device ID:</span> {device.deviceId}
          </p>
          {device.ipAddress && (
            <p>
              <span className="font-medium">IP:</span> {device.ipAddress}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {device.enabled &&
          !device.isConnected &&
          (actionLoading === 'connect' ? (
            <div className="flex-1 flex items-center gap-2">
              <span className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary/60 text-primary-foreground rounded text-sm">
                <ArrowsClockwise size={16} className="animate-spin" />
                Conectando...
              </span>
              <button
                onClick={handleCancelConnect}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                title="Cancelar conexão"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading || actionLoading !== null}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
            >
              <Power size={16} weight="bold" />
              Conectar
            </button>
          ))}

        {device.enabled && device.isConnected && (
          <button
            onClick={handleDisconnect}
            disabled={loading || actionLoading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-all"
          >
            <Power size={16} weight="bold" />
            {actionLoading === 'disconnect' ? 'Desconectando...' : 'Desconectar'}
          </button>
        )}

        {!device.enabled && (
          <button
            onClick={handleToggle}
            disabled={actionLoading !== null}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
          >
            <Power size={16} weight="bold" />
            Habilitar
          </button>
        )}

        <button
          onClick={() => onEdit(device.id)}
          disabled={actionLoading !== null}
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-[var(--hover-bg-subtle)] rounded disabled:opacity-50 transition-colors"
          title="Editar"
        >
          <GearSix size={18} />
        </button>

        {device.enabled && device.isConnected ? null : (
          <button
            onClick={handleDelete}
            disabled={actionLoading !== null}
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded disabled:opacity-50 transition-colors"
            title="Excluir"
          >
            <Trash size={18} />
          </button>
        )}
      </div>
    </div>
  )
}
