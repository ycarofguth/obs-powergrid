import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Cloud,
  Key,
  Globe,
  CheckCircle,
  XCircle,
  Trash,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import type { CloudCredentialsMasked, CloudStatus, CloudTestResult } from '@obs-tuya/shared'
import { API_ENDPOINTS, SIDECAR_URL } from '@obs-tuya/shared'
import { TuyaSetupGuide } from '../components/TuyaSetupGuide'

export function CloudSettingsPage() {
  const navigate = useNavigate()
  const [accessId, setAccessId] = useState('')
  const [accessSecret, setAccessSecret] = useState('')
  const [region, setRegion] = useState('us')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)
  const [credentials, setCredentials] = useState<CloudCredentialsMasked | null>(null)

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      // Verificar status
      const statusRes = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_STATUS}`)
      const statusData = (await statusRes.json()) as { success: boolean; data: CloudStatus }
      if (statusData.success) {
        setIsConfigured(statusData.data.isConfigured)
      }

      // Se configurado, buscar credenciais mascaradas
      if (statusData.data?.isConfigured) {
        const credRes = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_CREDENTIALS}`)
        const credData = (await credRes.json()) as {
          success: boolean
          data: CloudCredentialsMasked | null
        }
        if (credData.success && credData.data) {
          setCredentials(credData.data)
          setRegion(credData.data.region)
        }
      }
    } catch (err) {
      console.error('Failed to load cloud status:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!accessId.trim()) {
      setError('Access ID é obrigatório')
      return
    }
    if (!accessSecret.trim()) {
      setError('Access Secret é obrigatório')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_CREDENTIALS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessId, accessSecret, region }),
      })

      const data = await response.json()

      if (!data.success) {
        if (data.error?.code === 'INVALID_CREDENTIALS') {
          setError('Credenciais inválidas. Verifique o Access ID e Access Secret.')
        } else {
          setError(data.error?.message || 'Erro ao salvar credenciais')
        }
        return
      }

      setSuccess('Credenciais salvas com sucesso!')
      setAccessId('')
      setAccessSecret('')
      loadStatus()
    } catch (err) {
      setError('Erro de conexão com o servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleTest = async () => {
    setError(null)
    setSuccess(null)
    setTesting(true)

    try {
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_TEST}`, {
        method: 'POST',
      })

      const data = (await response.json()) as { success: boolean; data: CloudTestResult }

      if (data.success && data.data.isValid) {
        setSuccess('Conexão com Tuya Cloud OK!')
      } else {
        setError('Falha na conexão com Tuya Cloud')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja remover as credenciais Cloud?')) {
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_CREDENTIALS}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Credenciais removidas')
        setCredentials(null)
        setIsConfigured(false)
      } else {
        setError(data.error?.message || 'Erro ao remover credenciais')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
    }
  }

  return (
    <div>
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">Tuya Cloud</h1>
            <p className="text-sm text-muted-foreground">
              Configure as credenciais do Tuya IoT Platform
            </p>
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Status Card */}
        {isConfigured && credentials && (
          <div className="mb-6 rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/15">
                  <CheckCircle size={20} weight="duotone" className="text-success" />
                </div>
                <div>
                  <p className="font-medium">Configurado</p>
                  <p className="text-sm text-muted-foreground">Access ID: {credentials.accessId}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
                >
                  <ArrowsClockwise
                    size={16}
                    weight="bold"
                    className={testing ? 'animate-spin' : ''}
                  />
                  Testar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <Trash size={16} weight="bold" />
                  Remover
                </button>
              </div>
            </div>

            {/* Link para importar */}
            <div className="mt-4 border-t pt-4">
              <button
                onClick={() => navigate('/cloud/import')}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                <Cloud size={16} weight="bold" />
                Importar Dispositivos da Cloud
              </button>
            </div>
          </div>
        )}

        {/* Feedback */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
            <XCircle size={20} weight="duotone" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/15 p-3 text-success">
            <CheckCircle size={20} weight="duotone" />
            {success}
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Key size={20} weight="duotone" />
            {isConfigured ? 'Atualizar Credenciais' : 'Configurar Credenciais'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Access ID (Client ID)</label>
              <input
                type="text"
                value={accessId}
                onChange={(e) => setAccessId(e.target.value)}
                placeholder="Digite o Access ID"
                className="font-mono"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Encontre em iot.tuya.com → Cloud → seu projeto
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Access Secret (Client Secret)
              </label>
              <input
                type="password"
                value={accessSecret}
                onChange={(e) => setAccessSecret(e.target.value)}
                placeholder="Digite o Access Secret"
                className="font-mono"
                disabled={loading}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                <Globe size={16} weight="duotone" className="mr-1 inline" />
                Região
              </label>
              <select value={region} onChange={(e) => setRegion(e.target.value)} disabled={loading}>
                <option value="us">Americas (US)</option>
                <option value="eu">Europa (EU)</option>
                <option value="cn">China (CN)</option>
                <option value="in">Índia (IN)</option>
              </select>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione a mesma região do seu projeto Tuya
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Credenciais'}
            </button>
          </form>
        </div>

        {/* Help */}
        <div className="mt-6 rounded-lg border bg-muted/50 p-4">
          <h3 className="mb-3 font-medium">Como obter as credenciais?</h3>
          <TuyaSetupGuide />
        </div>
      </div>
    </div>
  )
}
