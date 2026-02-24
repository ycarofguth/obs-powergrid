import { useState, useEffect } from 'react'
import {
  FloppyDisk,
  ArrowsClockwise,
  CurrencyDollar,
  Database,
  Clock,
  Sun,
  Moon,
  Desktop,
} from '@phosphor-icons/react'
import {
  getSettings,
  updateSettings,
  type AppSettings,
  type AppSettingsInput,
} from '../services/api'
import { useTheme, type Theme } from '../hooks/use-theme'
import { GlowIcon } from '../components/GlowIcon'

const themeOptions = [
  { value: 'light' as Theme, label: 'Claro', icon: Sun },
  { value: 'dark' as Theme, label: 'Escuro', icon: Moon },
  { value: 'system' as Theme, label: 'Sistema', icon: Desktop },
]

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [kwhPrice, setKwhPrice] = useState('')
  const [currency, setCurrency] = useState('R$')
  const [dataRetentionDays, setDataRetentionDays] = useState('')
  const [logRetentionDays, setLogRetentionDays] = useState('')
  const [pollingIntervalSeconds, setPollingIntervalSeconds] = useState('')
  const [minimizeToTray, setMinimizeToTray] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await getSettings()
      if (response.success && response.data) {
        setSettings(response.data)
        setKwhPrice(response.data.kwhPrice.toString())
        setCurrency(response.data.currency)
        setDataRetentionDays(response.data.dataRetentionDays.toString())
        setLogRetentionDays(response.data.logRetentionDays.toString())
        setPollingIntervalSeconds(response.data.pollingIntervalSeconds.toString())
        setMinimizeToTray(response.data.minimizeToTray)
        setError(null)
      } else {
        setError(response.error?.message || 'Erro ao carregar configurações')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSaving(true)

    const input: AppSettingsInput = {}

    const priceNum = parseFloat(kwhPrice)
    if (!isNaN(priceNum) && priceNum !== settings?.kwhPrice) {
      if (priceNum < 0) {
        setError('Preço do kWh deve ser maior ou igual a zero')
        setSaving(false)
        return
      }
      input.kwhPrice = priceNum
    }

    if (currency && currency !== settings?.currency) {
      input.currency = currency
    }

    const dataRetentionNum = parseInt(dataRetentionDays)
    if (!isNaN(dataRetentionNum) && dataRetentionNum !== settings?.dataRetentionDays) {
      if (dataRetentionNum < 1 || dataRetentionNum > 365) {
        setError('Retenção de dados deve ser entre 1 e 365 dias')
        setSaving(false)
        return
      }
      input.dataRetentionDays = dataRetentionNum
    }

    const logRetentionNum = parseInt(logRetentionDays)
    if (!isNaN(logRetentionNum) && logRetentionNum !== settings?.logRetentionDays) {
      if (logRetentionNum < 1 || logRetentionNum > 365) {
        setError('Retenção de logs deve ser entre 1 e 365 dias')
        setSaving(false)
        return
      }
      input.logRetentionDays = logRetentionNum
    }

    const pollingNum = parseInt(pollingIntervalSeconds)
    if (!isNaN(pollingNum) && pollingNum !== settings?.pollingIntervalSeconds) {
      if (pollingNum < 1 || pollingNum > 60) {
        setError('Intervalo de polling deve ser entre 1 e 60 segundos')
        setSaving(false)
        return
      }
      input.pollingIntervalSeconds = pollingNum
    }

    if (minimizeToTray !== settings?.minimizeToTray) {
      input.minimizeToTray = minimizeToTray
    }

    if (Object.keys(input).length === 0) {
      setSuccess('Nenhuma alteração para salvar')
      setSaving(false)
      return
    }

    try {
      const response = await updateSettings(input)
      if (response.success && response.data) {
        setSettings(response.data)
        setSuccess('Configurações salvas com sucesso')
      } else {
        setError(response.error?.message || 'Erro ao salvar configurações')
      }
    } catch (err) {
      setError('Erro de conexão com o servidor')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const currencies = ['R$', 'US$', 'EUR', 'GBP', 'ARS', 'CLP', 'COP', 'MXN', 'PEN', 'UYU']

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-15 flex items-center gap-4">
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <ArrowsClockwise
              size={32}
              weight="bold"
              className="mx-auto text-muted-foreground animate-spin"
            />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-success/15 border border-success/30 rounded-md text-success text-sm">
                {success}
              </div>
            )}

            {/* Aparencia */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <GlowIcon icon={<Sun size={20} weight="duotone" />} color="info" />
                <div>
                  <h2 className="font-medium text-foreground">Aparência</h2>
                  <p className="text-sm text-muted-foreground">
                    Escolha o tema visual do aplicativo
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                {themeOptions.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      theme === value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon size={16} weight={theme === value ? 'fill' : 'regular'} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custo de Energia */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <GlowIcon icon={<CurrencyDollar size={20} weight="duotone" />} color="success" />
                <div>
                  <h2 className="font-medium text-foreground">Custo de Energia</h2>
                  <p className="text-sm text-muted-foreground">
                    Defina o preço do kWh para calcular custos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Preço do kWh
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={kwhPrice}
                    onChange={(e) => setKwhPrice(e.target.value)}
                    placeholder="0.75"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Moeda</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Retencao de Dados */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <GlowIcon icon={<Database size={20} weight="duotone" />} color="primary" />
                <div>
                  <h2 className="font-medium text-foreground">Retenção de Dados</h2>
                  <p className="text-sm text-muted-foreground">
                    Por quanto tempo manter leituras e logs
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Leituras (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={dataRetentionDays}
                    onChange={(e) => setDataRetentionDays(e.target.value)}
                    placeholder="90"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1-365 dias</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Logs (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={logRetentionDays}
                    onChange={(e) => setLogRetentionDays(e.target.value)}
                    placeholder="30"
                  />
                  <p className="text-xs text-muted-foreground mt-1">1-365 dias</p>
                </div>
              </div>
            </div>

            {/* Polling */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <GlowIcon icon={<Clock size={20} weight="duotone" />} color="warning" />
                <div>
                  <h2 className="font-medium text-foreground">Intervalo de Atualização</h2>
                  <p className="text-sm text-muted-foreground">
                    Frequência de coleta de dados dos dispositivos
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Intervalo (segundos)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={pollingIntervalSeconds}
                  onChange={(e) => setPollingIntervalSeconds(e.target.value)}
                  className="max-w-[200px]"
                  placeholder="5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Valores menores = mais precisão, mais uso de recursos
                </p>
              </div>
            </div>

            {/* System Tray */}
            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Minimizar para bandeja ao fechar
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  Ao fechar a janela, o app continua rodando na bandeja do sistema
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMinimizeToTray(!minimizeToTray)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  minimizeToTray ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-foreground transition-transform ${
                    minimizeToTray ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <ArrowsClockwise size={18} weight="bold" className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <FloppyDisk size={18} weight="bold" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
