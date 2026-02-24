import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, WarningCircle, Plug } from '@phosphor-icons/react'
import { createDevice } from '../services/api'
import { GlowIcon } from '../components/GlowIcon'

export function AddDevicePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [deviceId, setDeviceId] = useState('')
  const [localKey, setLocalKey] = useState('')
  const [ipAddress, setIpAddress] = useState('')
  const [protocolVersion, setProtocolVersion] = useState('3.4')
  const [communicationMode, setCommunicationMode] = useState<'local' | 'cloud'>('local')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

    setLoading(true)

    try {
      const response = await createDevice({
        name: name.trim(),
        deviceId: deviceId.trim(),
        localKey: localKey.trim(),
        ipAddress: ipAddress.trim() || undefined,
        protocolVersion,
        communicationMode,
      })

      if (!response.success) {
        if (response.error?.code === 'DUPLICATE_DEVICE') {
          setError('Já existe um dispositivo com este Device ID')
        } else {
          setError(response.error?.message || 'Erro ao criar dispositivo')
        }
        return
      }

      navigate('/devices')
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
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
          <h1 className="text-xl font-bold text-foreground">Adicionar dispositivo</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <GlowIcon icon={<Plug size={20} weight="duotone" />} color="primary" />
            <div>
              <h2 className="font-medium text-foreground">Nova tomada inteligente</h2>
              <p className="text-sm text-muted-foreground">
                Preencha os dados do seu dispositivo Tuya
              </p>
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
                disabled={loading}
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
                disabled={loading}
                className="font-mono disabled:opacity-50"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Encontre no Tuya IoT Platform ou app Smart Life
              </p>
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
                disabled={loading}
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
                  <label htmlFor="localKey" className="block text-sm font-medium text-foreground mb-1">
                    Local Key *
                  </label>
                  <input
                    id="localKey"
                    type="text"
                    value={localKey}
                    onChange={(e) => setLocalKey(e.target.value)}
                    placeholder="Ex: abcdef1234567890"
                    disabled={loading}
                    className="font-mono disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Chave de criptografia local (16 caracteres)
                  </p>
                </div>

                <div>
                  <label htmlFor="ipAddress" className="block text-sm font-medium text-foreground mb-1">
                    Endereço IP
                  </label>
                  <input
                    id="ipAddress"
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="Ex: 192.168.1.100"
                    disabled={loading}
                    className="font-mono disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recomendado. Sem o IP, o app tenta descobrir via broadcast UDP, o que pode falhar dependendo da rede
                  </p>
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
                    disabled={loading}
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
                disabled={loading}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
