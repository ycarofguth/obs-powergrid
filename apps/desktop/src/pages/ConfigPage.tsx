import { useState, useEffect } from 'react'

const SIDECAR_URL = 'http://localhost:47531'

interface Config {
  deviceId: string
  localKey: string
  ipAddress: string
}

function ConfigPage() {
  const [config, setConfig] = useState<Config>({
    deviceId: '',
    localKey: '',
    ipAddress: '',
  })
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [connectStatus, setConnectStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>(
    'idle'
  )
  const [connectError, setConnectError] = useState('')

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${SIDECAR_URL}/api/config`)
        const data = await response.json()
        if (data.success && data.data) {
          setConfig(data.data)
        }
      } catch {
        // Config não existe ainda, ok
      }
    }
    loadConfig()
  }, [])

  const handleChange = (field: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({ ...prev, [field]: e.target.value }))
    setStatus('idle')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    setErrorMessage('')

    try {
      const response = await fetch(`${SIDECAR_URL}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(data.error?.message || 'Erro ao salvar configuração')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Não foi possível conectar ao sidecar. Verifique se está rodando.')
    }
  }

  const handleConnect = async () => {
    setConnectStatus('connecting')
    setConnectError('')

    try {
      const response = await fetch(`${SIDECAR_URL}/api/config/connect`, {
        method: 'POST',
      })
      const data = await response.json()
      if (data.success) {
        setConnectStatus('success')
      } else {
        setConnectStatus('error')
        setConnectError(data.error?.message || 'Erro ao conectar')
      }
    } catch {
      setConnectStatus('error')
      setConnectError('Não foi possível conectar ao sidecar. Verifique se está rodando.')
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-xl font-bold">Configuração do Dispositivo</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="deviceId" className="mb-1 block text-sm font-medium">
              Device ID
            </label>
            <input
              id="deviceId"
              type="text"
              value={config.deviceId}
              onChange={handleChange('deviceId')}
              placeholder="Ex: bf1234567890abcdef"
              required
            />
          </div>

          <div>
            <label htmlFor="localKey" className="mb-1 block text-sm font-medium">
              Local Key
            </label>
            <input
              id="localKey"
              type="text"
              value={config.localKey}
              onChange={handleChange('localKey')}
              placeholder="Ex: 1234567890abcdef"
              required
            />
          </div>

          <div>
            <label htmlFor="ipAddress" className="mb-1 block text-sm font-medium">
              IP Address
            </label>
            <input
              id="ipAddress"
              type="text"
              value={config.ipAddress}
              onChange={handleChange('ipAddress')}
              placeholder="Ex: 192.168.1.100"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={status === 'saving'}
              className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {status === 'saving' ? 'Salvando...' : 'Salvar Configuração'}
            </button>

            <button
              type="button"
              onClick={handleConnect}
              disabled={connectStatus === 'connecting'}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {connectStatus === 'connecting' ? 'Conectando...' : 'Conectar'}
            </button>
          </div>

          {status === 'success' && (
            <p className="text-sm text-success">Configuração salva com sucesso!</p>
          )}

          {status === 'error' && <p className="text-sm text-destructive">{errorMessage}</p>}

          {connectStatus === 'success' && (
            <p className="text-sm text-success flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success"></span>
              Dispositivo conectado
            </p>
          )}

          {connectStatus === 'error' && <p className="text-sm text-destructive">{connectError}</p>}
        </form>

        <div className="mt-8 rounded-md border border-border p-4">
          <h2 className="mb-2 font-medium">URL do Overlay para OBS</h2>
          <code className="block rounded bg-muted p-2 text-sm">http://localhost:47531/overlay</code>
          <p className="mt-2 text-xs text-muted-foreground">
            Adicione como Browser Source no OBS com fundo transparente.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ConfigPage
