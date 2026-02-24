import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Lock,
  WarningCircle,
  CaretRight,
  CaretLeft,
  Check,
  Lightning,
  Key,
  Globe,
  ArrowsClockwise,
  WifiHigh,
  WifiSlash,
  Monitor,
  Shield,
  CheckCircle,
  XCircle,
  Circle,
  Funnel,
  Copy,
} from '@phosphor-icons/react'
import { PasswordInput } from '../components/PasswordInput'
import { TuyaSetupGuide } from '../components/TuyaSetupGuide'
import {
  setup,
  saveCloudCredentials,
  testCloudConnection,
  getOverlayUrl,
  getAuthStatus,
  completeOnboarding,
} from '../services/api'
import type { CreateDeviceInput } from '../services/api'
import { API_ENDPOINTS, SIDECAR_URL } from '@obs-tuya/shared'
import type { CloudDevice, ApiResponse } from '@obs-tuya/shared'

const TOTAL_STEPS = 5

const STEP_LABELS = ['Boas-vindas', 'Senha', 'Cloud', 'Dispositivos', 'Pronto!']

const CATEGORY_LABELS: Record<string, string> = {
  cz: 'Tomada',
  dj: 'Luz',
  kg: 'Interruptor',
  pc: 'Power Strip',
}

// ==================== Step Indicator ====================

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const step = i + 1
        const isComplete = step < currentStep
        const isCurrent = step === currentStep

        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                isComplete
                  ? 'bg-primary text-primary-foreground'
                  : isCurrent
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                    : 'bg-secondary text-muted-foreground'
              }`}
            >
              {isComplete ? <Check size={16} weight="bold" /> : step}
            </div>
            <span
              className={`text-xs hidden sm:inline mr-1 ${isCurrent ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
            >
              {STEP_LABELS[i]}
            </span>
            {i < TOTAL_STEPS - 1 && (
              <div className={`w-6 h-0.5 ${step < currentStep ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ==================== Main Component ====================

export function SetupPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [resuming, setResuming] = useState(true)

  // Step 1: Welcome
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Step 2: Password
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [settingUp, setSettingUp] = useState(false)
  const [passwordDone, setPasswordDone] = useState(false)

  // Step 3: Cloud credentials
  const [accessId, setAccessId] = useState('')
  const [accessSecret, setAccessSecret] = useState('')
  const [region, setRegion] = useState('us')
  const [cloudError, setCloudError] = useState<string | null>(null)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudConfigured, setCloudConfigured] = useState(false)

  // Step 4: Devices
  const [cloudDevices, setCloudDevices] = useState<CloudDevice[]>([])
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set())
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [devicesError, setDevicesError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
  const [showOnlyPlugs, setShowOnlyPlugs] = useState(true)

  // Step 5: Done
  const [copied, setCopied] = useState(false)
  const [firstDeviceId, setFirstDeviceId] = useState<string | null>(null)

  // ==================== Resume from correct step ====================

  useEffect(() => {
    async function resumeOnboarding() {
      try {
        const authRes = await getAuthStatus()
        if (!authRes.success || !authRes.data?.isSetUp) {
          setResuming(false)
          return
        }

        // Password already created
        setPasswordDone(true)
        setTermsAccepted(true)

        // Check cloud status
        const cloudRes = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_STATUS}`)
        const cloudData = (await cloudRes.json()) as ApiResponse<{ isConfigured: boolean }>
        const cloudDone = cloudData.success && cloudData.data?.isConfigured

        if (cloudDone) {
          setCloudConfigured(true)
        }

        // Check if devices exist
        const devicesRes = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICES}`)
        const devicesData = (await devicesRes.json()) as ApiResponse<{ id: string }[]>
        const deviceCount = devicesData.success && devicesData.data ? devicesData.data.length : 0

        if (deviceCount > 0 && devicesData.data) {
          setImportedCount(deviceCount)
          const first = devicesData.data[0]
          if (first) setFirstDeviceId(first.id)
        }

        // Jump to the first incomplete step
        if (deviceCount > 0) {
          setStep(5)
        } else if (cloudDone) {
          setStep(4)
        } else {
          setStep(3)
        }
      } catch {
        // First time setup, stay on step 1
      } finally {
        setResuming(false)
      }
    }

    resumeOnboarding()
  }, [])

  // ==================== Step 2: Password ====================

  const handleSetupPassword = async () => {
    setPasswordError(null)

    if (password.length < 8) {
      setPasswordError('A senha deve ter no mínimo 8 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('As senhas não coincidem')
      return
    }

    setSettingUp(true)
    try {
      const response = await setup(password)
      if (!response.success) {
        setPasswordError(response.error?.message || 'Erro ao configurar')
        return
      }
      setPasswordDone(true)
    } catch {
      setPasswordError('Erro de conexão com o servidor')
    } finally {
      setSettingUp(false)
    }
  }

  // ==================== Step 3: Cloud ====================

  const handleSaveCloud = async () => {
    setCloudError(null)

    if (!accessId.trim() || !accessSecret.trim()) {
      setCloudError('Access ID e Access Secret são obrigatórios')
      return
    }

    setCloudLoading(true)
    try {
      const saveRes = await saveCloudCredentials(accessId, accessSecret, region)
      if (!saveRes.success) {
        if (saveRes.error?.code === 'INVALID_CREDENTIALS') {
          setCloudError('Credenciais inválidas. Verifique o Access ID e Access Secret.')
        } else {
          setCloudError(saveRes.error?.message || 'Erro ao salvar credenciais')
        }
        return
      }

      const testRes = await testCloudConnection()
      if (testRes.success && testRes.data?.isValid) {
        setCloudConfigured(true)
      } else {
        setCloudError('Credenciais salvas, mas falha no teste de conexão. Verifique os dados.')
      }
    } catch {
      setCloudError('Erro de conexão com o servidor')
    } finally {
      setCloudLoading(false)
    }
  }

  // ==================== Step 4: Devices ====================

  const fetchCloudDevices = async () => {
    setDevicesLoading(true)
    setDevicesError(null)
    try {
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_DEVICES}`)
      const data = (await response.json()) as ApiResponse<CloudDevice[]>
      if (data.success && data.data) {
        setCloudDevices(data.data)
      } else {
        setDevicesError(data.error?.message || 'Erro ao buscar dispositivos')
      }
    } catch {
      setDevicesError('Erro de conexão')
    } finally {
      setDevicesLoading(false)
    }
  }

  useEffect(() => {
    if (step === 4 && cloudDevices.length === 0 && cloudConfigured) {
      fetchCloudDevices()
    }
  }, [step, cloudConfigured])

  const toggleDevice = (deviceId: string) => {
    const next = new Set(selectedDevices)
    if (next.has(deviceId)) {
      next.delete(deviceId)
    } else {
      next.add(deviceId)
    }
    setSelectedDevices(next)
  }

  const ENERGY_DEVICE_CATEGORIES = new Set(['cz', 'pc', 'wk', 'dlq', 'tdq', 'kg'])
  const filteredDevices = showOnlyPlugs
    ? cloudDevices.filter((d) => ENERGY_DEVICE_CATEGORIES.has(d.category))
    : cloudDevices

  const handleImportDevices = async () => {
    if (selectedDevices.size === 0) return

    setImporting(true)
    setDevicesError(null)
    let imported = 0
    const errors: string[] = []
    let firstId: string | null = null

    const toImport = cloudDevices.filter((d) => selectedDevices.has(d.id))

    for (const device of toImport) {
      try {
        const input: CreateDeviceInput = {
          name: device.name,
          deviceId: device.id,
          localKey: device.localKey,
          protocolVersion: device.protocolVersion,
          communicationMode: 'local',
          category: device.category,
        }
        const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICES}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        const data = (await response.json()) as ApiResponse<{ id: string }>

        if (data.success) {
          imported++
          if (!firstId && data.data) {
            firstId = data.data.id
          }
        } else if (data.error?.code === 'DUPLICATE_DEVICE') {
          imported++
        } else {
          errors.push(`${device.name}: ${data.error?.message || 'erro'}`)
        }
      } catch {
        errors.push(`${device.name}: erro de conexão`)
      }
    }

    setImporting(false)
    setImportedCount(imported)
    if (firstId) setFirstDeviceId(firstId)

    if (errors.length > 0) {
      setDevicesError(errors.join('; '))
    }
  }

  // ==================== Step 5: Copy overlay URL ====================

  const handleCopyOverlayUrl = () => {
    const url = getOverlayUrl(firstDeviceId || undefined)
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ==================== Navigation ====================

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return termsAccepted
      case 2:
        return passwordDone
      case 3:
        return true
      case 4:
        return true
      case 5:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS && canAdvance()) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinish = async () => {
    await completeOnboarding()
    navigate('/dashboard')
  }

  // ==================== Render Steps ====================

  const handleOpenPrivacyPolicy = async (e: React.MouseEvent) => {
    e.preventDefault()
    const url = 'https://github.com/ycaroguth/obs-tuya-smart-plug/blob/main/docs/privacy-policy.md'
    try {
      const { os } = await import('@neutralinojs/lib')
      await os.open(url)
    } catch {
      window.open(url, '_blank')
    }
  }

  const renderStep1 = () => (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/5 backdrop-blur-sm mb-6 [&>span]:[filter:drop-shadow(0_0_8px_rgba(59,130,246,0.7))]">
        <span className="block text-primary">
          <Lightning size={40} weight="fill" />
        </span>
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo ao OBS PowerGrid</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Monitore o consumo de energia dos seus dispositivos Tuya e exiba como overlay no OBS Studio.
        Vamos configurar tudo em poucos passos.
      </p>

      <div className="bg-card border border-border rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
          <Shield size={20} weight="fill" className="text-primary" />
          <h3 className="text-base font-semibold text-foreground">Privacidade e Segurança</h3>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Check size={16} weight="bold" className="text-success mt-0.5 shrink-0" />
            <span>Seus dados ficam 100% no seu computador</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} weight="bold" className="text-success mt-0.5 shrink-0" />
            <span>Nenhuma telemetria ou rastreamento</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} weight="bold" className="text-success mt-0.5 shrink-0" />
            <span>Banco de dados criptografado (SQLCipher + AES-256)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check size={16} weight="bold" className="text-success mt-0.5 shrink-0" />
            <span>Código aberto e verificável</span>
          </li>
        </ul>
      </div>

      <label className="flex items-center justify-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="rounded border-border"
        />
        <span className="text-sm text-muted-foreground">
          Li e aceito a{' '}
          <a
            href="#"
            onClick={handleOpenPrivacyPolicy}
            className="text-primary hover:underline"
          >
            Política de Privacidade
          </a>
        </span>
      </label>
    </div>
  )

  const renderStep2 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 backdrop-blur-sm mb-3">
          <Lock size={24} weight="duotone" className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Criar Senha</h2>
        <p className="text-sm text-muted-foreground">
          Sua senha protege todos os dados com criptografia local (AES-256 + SQLCipher)
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        {passwordDone ? (
          <div className="flex items-center gap-2 text-sm text-success bg-success/15 p-3 rounded-md">
            <CheckCircle size={16} weight="duotone" />
            Senha criada com sucesso
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Senha
              </label>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="Mínimo 8 caracteres"
                disabled={settingUp}
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-1"
              >
                Confirmar senha
              </label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Digite a senha novamente"
                disabled={settingUp}
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                <WarningCircle size={16} weight="bold" />
                {passwordError}
              </div>
            )}

            <button
              onClick={handleSetupPassword}
              disabled={settingUp || !password || !confirmPassword}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {settingUp ? 'Criando...' : 'Criar Senha'}
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 backdrop-blur-sm mb-3">
          <Key size={24} weight="duotone" className="text-primary" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Tuya Cloud</h2>
        <p className="text-sm text-muted-foreground">
          Mesmo usando comunicação local, a Local Key de cada tomada só pode ser obtida pela API da
          Tuya Cloud. Após importar seus dispositivos, a conexão com a Cloud não será mais
          necessária.
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        {cloudConfigured ? (
          <div className="flex items-center gap-2 text-sm text-success bg-success/15 p-3 rounded-md">
            <CheckCircle size={16} weight="duotone" />
            Conexão com Tuya Cloud verificada
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Access ID (Client ID)
              </label>
              <input
                type="text"
                value={accessId}
                onChange={(e) => setAccessId(e.target.value)}
                placeholder="Digite o Access ID"
                className="font-mono"
                disabled={cloudLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Access Secret (Client Secret)
              </label>
              <input
                type="password"
                value={accessSecret}
                onChange={(e) => setAccessSecret(e.target.value)}
                placeholder="Digite o Access Secret"
                className="font-mono"
                disabled={cloudLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <Globe size={16} weight="duotone" className="mr-1 inline" />
                Região
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className=""
                disabled={cloudLoading}
              >
                <option value="us">Americas (US)</option>
                <option value="eu">Europa (EU)</option>
                <option value="cn">China (CN)</option>
                <option value="in">India (IN)</option>
              </select>
            </div>

            {cloudError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                <XCircle size={16} weight="bold" />
                {cloudError}
              </div>
            )}

            <button
              onClick={handleSaveCloud}
              disabled={cloudLoading || !accessId || !accessSecret}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
            >
              {cloudLoading ? 'Validando...' : 'Salvar e Testar Conexão'}
            </button>

            <div className="bg-secondary/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Não tem as credenciais? Siga o guia:
              </p>
              <TuyaSetupGuide />
            </div>

            <div className="pt-2 border-t border-border">
              <button
                onClick={handleNext}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                Já tenho a Local Key, pular esta etapa →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-foreground">Selecione seus Dispositivos</h2>
        <p className="text-sm text-muted-foreground">
          {cloudConfigured
            ? 'Escolha os dispositivos que deseja monitorar'
            : 'Você pode adicionar dispositivos manualmente após o setup'}
        </p>
      </div>

      {!cloudConfigured && importedCount === 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary mb-4">
            <WifiHigh size={24} weight="duotone" className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Como a Tuya Cloud não foi configurada, você poderá adicionar dispositivos manualmente na
            página de <strong>Dispositivos</strong> após concluir o setup.
          </p>
          <p className="text-xs text-muted-foreground">
            Você precisará do <strong>Device ID</strong> e da <strong>Local Key</strong> de cada
            dispositivo.
          </p>
        </div>
      )}

      {cloudConfigured && (
        <>
      {devicesError && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-destructive text-sm">
          <WarningCircle size={16} weight="bold" />
          {devicesError}
        </div>
      )}

      {importedCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-success/15 p-3 text-success text-sm">
          <CheckCircle size={16} weight="duotone" />
          {importedCount} dispositivo(s) importado(s) com sucesso!
        </div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Funnel size={16} weight="bold" className="text-muted-foreground" />
          <input
            type="checkbox"
            checked={showOnlyPlugs}
            onChange={(e) => setShowOnlyPlugs(e.target.checked)}
            className="rounded"
          />
          Apenas dispositivos de energia
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedDevices.size} selecionado(s)
          </span>
          <button
            onClick={fetchCloudDevices}
            disabled={devicesLoading}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md disabled:opacity-50"
            title="Atualizar lista"
          >
            <ArrowsClockwise
              size={16}
              weight="bold"
              className={devicesLoading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Device List */}
      {devicesLoading && cloudDevices.length === 0 ? (
        <div className="text-center py-12">
          <ArrowsClockwise
            size={32}
            weight="bold"
            className="mx-auto text-muted-foreground animate-spin"
          />
          <p className="mt-2 text-sm text-muted-foreground">Buscando dispositivos...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            {cloudDevices.length === 0
              ? 'Nenhum dispositivo encontrado na sua conta Tuya'
              : 'Nenhuma tomada encontrada. Desmarque o filtro para ver todos.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <button
            onClick={() => {
              if (selectedDevices.size === filteredDevices.length) {
                setSelectedDevices(new Set())
              } else {
                setSelectedDevices(new Set(filteredDevices.map((d) => d.id)))
              }
            }}
            className="flex items-center gap-2 text-sm text-primary hover:underline mb-2"
          >
            {selectedDevices.size === filteredDevices.length ? (
              <>
                <Check size={16} weight="bold" /> Desmarcar todos
              </>
            ) : (
              <>
                <Circle size={16} /> Selecionar todos
              </>
            )}
          </button>

          {filteredDevices.map((device) => (
            <div
              key={device.id}
              onClick={() => !importing && importedCount === 0 && toggleDevice(device.id)}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                importing || importedCount > 0 ? 'opacity-60' : 'cursor-pointer'
              } ${
                selectedDevices.has(device.id)
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-secondary/50'
              }`}
            >
              <div
                className={`flex items-center justify-center w-5 h-5 rounded border ${
                  selectedDevices.has(device.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                }`}
              >
                {selectedDevices.has(device.id) && <Check size={12} weight="bold" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{device.name}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                    {CATEGORY_LABELS[device.category] || 'Outro'}
                  </span>
                  {device.isOnline ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <WifiHigh size={12} weight="bold" /> Online
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <WifiSlash size={12} /> Offline
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                  <span>ID: {device.id.substring(0, 12)}...</span>
                  <span>Protocolo: {device.protocolVersion}</span>
                  {device.ip && <span>IP: {device.ip}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Import button */}
      {filteredDevices.length > 0 && importedCount === 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleImportDevices}
            disabled={selectedDevices.size === 0 || importing}
            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {importing ? (
              <>
                <ArrowsClockwise size={16} weight="bold" className="animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Check size={16} weight="bold" />
                Importar {selectedDevices.size} dispositivo(s)
              </>
            )}
          </button>
        </div>
      )}
        </>
      )}
    </div>
  )

  const renderStep5 = () => (
    <div className="max-w-lg mx-auto text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/15 mb-6">
        <CheckCircle size={40} weight="duotone" className="text-success" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">Tudo Pronto!</h2>
      <p className="text-muted-foreground mb-6">
        Seu app está configurado e pronto para uso.
      </p>

      <div className="bg-card border border-border rounded-lg p-6 text-left space-y-3 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle size={20} weight="duotone" className="text-success shrink-0" />
          <span className="text-sm text-foreground">Senha de criptografia criada</span>
        </div>
        <div className="flex items-center gap-3">
          {cloudConfigured ? (
            <CheckCircle size={20} weight="duotone" className="text-success shrink-0" />
          ) : (
            <Circle size={20} weight="duotone" className="text-muted-foreground shrink-0" />
          )}
          <span className="text-sm text-foreground">
            {cloudConfigured ? 'Tuya Cloud conectada' : 'Tuya Cloud não configurada (opcional)'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {importedCount > 0 ? (
            <CheckCircle size={20} weight="duotone" className="text-success shrink-0" />
          ) : (
            <Circle size={20} weight="duotone" className="text-muted-foreground shrink-0" />
          )}
          <span className="text-sm text-foreground">
            {importedCount > 0
              ? `${importedCount} dispositivo(s) importado(s)`
              : 'Nenhum dispositivo importado (adicione manualmente)'}
          </span>
        </div>
      </div>

      {importedCount > 0 && (
        <div className="bg-card border border-border rounded-lg p-6 text-left space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Monitor size={18} weight="duotone" className="text-primary" />
            <h3 className="text-sm font-medium text-foreground">Overlay para OBS</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Adicione uma <strong>Browser Source</strong> no OBS e cole a URL abaixo:
          </p>
          <div className="bg-secondary/50 rounded-md p-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-foreground bg-background rounded px-2 py-1.5 border border-border truncate">
                {getOverlayUrl(firstDeviceId || undefined)}
              </code>
              <button
                onClick={handleCopyOverlayUrl}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md shrink-0"
                title="Copiar URL"
              >
                {copied ? (
                  <Check size={16} weight="bold" className="text-success" />
                ) : (
                  <Copy size={16} weight="bold" />
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Personalize cores e layout em{' '}
            <span className="font-medium text-foreground">Overlays</span> no menu lateral.
          </p>
        </div>
      )}

      <div className="bg-secondary/50 rounded-lg p-4 text-left mb-6">
        <h3 className="text-sm font-medium text-foreground mb-2">Próximos passos:</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {importedCount === 0 && (
            <li>
              • Adicione seus dispositivos em <strong>Dispositivos</strong>
            </li>
          )}
          <li>
            • Acesse o <strong>Dashboard</strong> para ver dados em tempo real
          </li>
          <li>
            • Personalize o <strong>Overlay</strong> com cores e layout
          </li>
          <li>
            • Ajuste as <strong>Configurações</strong> de intervalo de leitura e custo de energia
          </li>
        </ul>
      </div>

      <button
        onClick={handleFinish}
        className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 font-medium"
      >
        <Lightning size={20} weight="bold" />
        Ir para o Dashboard
      </button>
    </div>
  )

  // ==================== Main Render ====================

  if (resuming) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <StepIndicator currentStep={step} />

          <div className="mb-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
            {step === 5 && renderStep5()}
          </div>

          {/* Navigation */}
          {step < 5 && (
            <div className="flex items-center justify-between max-w-lg mx-auto">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-1 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <CaretLeft size={16} weight="bold" />
                Voltar
              </button>

              <span className="text-xs text-muted-foreground">
                Passo {step} de {TOTAL_STEPS}
              </span>

              <button
                onClick={handleNext}
                disabled={!canAdvance()}
                className="flex items-center gap-1 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
