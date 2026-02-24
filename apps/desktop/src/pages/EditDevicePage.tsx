import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, WarningCircle, Plug, ArrowsClockwise, Cloud } from '@phosphor-icons/react'
import {
  getDevice,
  updateDevice,
  refreshDeviceFromCloud,
  type DeviceWithStatus,
} from '../services/api'
import { GlowIcon } from '../components/GlowIcon'

export function EditDevicePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [device, setDevice] = useState<DeviceWithStatus | null>(null)
  const [name, setName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [localKey, setLocalKey] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [protocolVersion, setProtocolVersion] = useState('3.4')
  const [communicationMode, setCommunicationMode] = useState<'local' | 'cloud'>('local')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    async function fetchDevice() {
      if (!id) return

      try {
        const response = await getDevice(id)
        if (response.success && response.data) {
          const d = response.data
          setDevice(d)
          setName(d.name)
          setDeviceId(d.deviceId)
          setLocalKey(d.localKey)
          setIpAddress(d.ipAddress || '')
          setProtocolVersion(d.protocolVersion)
          setCommunicationMode(d.communicationMode)
        } else {
          setError(response.error?.message || 'Dispositivo não encontrado')
        }
      } catch (err) {
        setError('Erro de conexão com o servidor')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchDevice()
  }, [id])

  const handleRefreshFromCloud = async () => {
    if (!deviceId.trim()) {
      setError('Device ID é necessário para atualizar via Cloud')
      return
    }
    setError(null)
    setSuccess(null)
    setRefreshing(true)

    try {
      const response = await refreshDeviceFromCloud(deviceId.trim())
      if (response.success && response.data) {
        const d = response.data.device
        setLocalKey(d.localKey)
        setProtocolVersion(d.protocolVersion)
        if (d.ipAddress) setIpAddress(d.ipAddress)
        setSuccess('Dados atualizados via Cloud')
      } else {
        setError(response.error?.message || 'Erro ao atualizar via Cloud')
      }
    } catch {
      setError('Erro de conexão com o servidor')
    } finally {
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setError(null)

    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!deviceId.trim()) {
      setError('Device ID é obrigatório')
      return
    }

    if (communicationMode === 'local' && !localKey.trim()) {
      setError('Local Key é obrigatória para o modo Local')
      return
    }

    setSaving(true)

    try {
      const response = await updateDevice(id, {
        name: name.trim(),
        deviceId: deviceId.trim(),
        localKey: localKey.trim(),
        ipAddress: ipAddress.trim() || undefined,
        protocolVersion,
        communicationMode,
      })

      if (!response.success) {
        setError(response.error?.message || 'Erro ao atualizar dispositivo')
        return
      }

      navigate('/devices')
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowsClockwise size={32} weight="bold" className="text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!device && !loading) {
    return (
      <div>
        <header className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
            <Link
              to="/devices"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
            >
              <ArrowLeft size={20} weight="bold" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">Editar dispositivo</h1>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-destructive">{error || 'Dispositivo não encontrado'}</p>
            <Link to="/devices" className="mt-4 text-primary hover:underline">
              Voltar para dispositivos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
          <Link
            to="/devices"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md"
          >
            <ArrowLeft size={20} weight="bold" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Editar dispositivo</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <GlowIcon icon={<Plug size={20} weight="duotone" />} color="primary" />
            <div>
              <h2 className="font-medium text-foreground">Editar tomada</h2>
              <p className="text-sm text-muted-foreground">Atualize os dados do dispositivo</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                Nome *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Tomada PC"
                disabled={saving}
                className="disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="deviceId" className="block text-sm font-medium text-foreground mb-1">
                Device ID *
              </label>
              <input
                id="deviceId"
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="Ex: bf1234567890abcdef"
                disabled={saving}
                className="font-mono disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor="communicationMode"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Modo de comunicação
              </label>
              <select
                id="communicationMode"
                value={communicationMode}
                onChange={(e) => setCommunicationMode(e.target.value as 'local' | 'cloud')}
                disabled={saving}
                className="disabled:opacity-50"
              >
                <option value="local">Local (recomendado)</option>
                <option value="cloud">Cloud</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                {communicationMode === 'local'
                  ? 'Conexão direta via rede local (menor latência)'
                  : 'Conexão via API da Tuya Cloud (não requer IP ou Local Key)'}
              </p>
            </div>

            {communicationMode === 'local' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="localKey" className="block text-sm font-medium text-foreground">
                      Local Key *
                    </label>
                    <button
                      type="button"
                      onClick={handleRefreshFromCloud}
                      disabled={saving || refreshing}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Cloud
                        size={14}
                        weight="bold"
                        className={refreshing ? 'animate-pulse' : ''}
                      />
                      {refreshing ? 'Atualizando...' : 'Atualizar via Cloud'}
                    </button>
                  </div>
                  <input
                    id="localKey"
                    type="text"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder="Ex: abcdef1234567890"
                    disabled={saving}
                    className="font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ipAddress"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Endereço IP
                  </label>
                  <input
                    id="ipAddress"
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Ex: 192.168.1.100"
                    disabled={saving}
                    className="font-mono disabled:opacity-50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="protocolVersion"
                    className="block text-sm font-medium text-foreground mb-1"
                  >
                    Versão do protocolo
                  </label>
                  <select
                    id="protocolVersion"
                    value={protocolVersion}
                    onChange={(e) => setProtocolVersion(e.target.value)}
                    disabled={saving}
                    className="disabled:opacity-50"
                  >
                    <option value="3.1">3.1</option>
                    <option value="3.2">3.2</option>
                    <option value="3.3">3.3</option>
                    <option value="3.4">3.4</option>
                    <option value="3.5">3.5</option>
                  </select>
                </div>
              </>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-success/15 border border-success/30 rounded-md text-success text-sm">
                <Cloud size={16} weight="duotone" />
                {success}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                <WarningCircle size={16} weight="bold" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Link
                to="/devices"
                className="flex-1 py-2 px-4 text-center bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
