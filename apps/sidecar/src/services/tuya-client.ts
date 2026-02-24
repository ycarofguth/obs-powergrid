import TuyAPI from 'tuyapi'
import type { DeviceConfig, DeviceStatus } from '../types/index.js'
import type { DpsMapping } from '@obs-tuya/shared'

interface TuyaClientConfig {
  deviceId: string
  localKey: string
  ipAddress?: string
  protocolVersion?: string
  dpsMapping?: DpsMapping
}

export interface ConnectionStatus {
  isConnected: boolean
  connectionAttempts: number
  maxAttempts: number
  lastError: string | null
  lastConnected: Date | null
  isReconnecting: boolean
}

type StatusChangeCallback = (status: DeviceStatus) => void

// Configuracao de retry (FR-108)
const MAX_RECONNECT_ATTEMPTS = 10 // 10 tentativas
const INITIAL_RECONNECT_DELAY = 5000 // 5 segundos
const MAX_RECONNECT_DELAY = 60000 // 60 segundos max
const BACKOFF_MULTIPLIER = 1.5 // Fator de backoff exponencial
const CONNECTION_TIMEOUT = 15000 // 15 segundos para find/connect
const PROTOCOL_VERSIONS = ['3.5', '3.4', '3.3'] // Ordem de tentativa

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * Decodifica dados raw de phase_a (usado por dispositivos dlq/breaker)
 * Layout: [voltage 2B][current 3B][power 3B] (big-endian)
 */
function decodePhaseData(
  base64Value: string
): { voltage: number; current: number; power: number } | null {
  try {
    const buffer = Buffer.from(base64Value, 'base64')
    if (buffer.length < 8) return null

    const voltage = buffer.readUInt16BE(0) / 10 // Volts
    const current = (buffer[2]! << 16) | (buffer[3]! << 8) | buffer[4]! // Amps * 1000
    const power = (buffer[5]! << 16) | (buffer[6]! << 8) | buffer[7]! // Watts

    return { voltage, current, power }
  } catch {
    return null
  }
}

export class TuyaClient {
  private device: TuyAPI | null = null
  private _config: TuyaClientConfig
  private lastStatus: DeviceStatus | null = null
  private _isConnected = false
  private shouldReconnect = false
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private refreshInterval: ReturnType<typeof setInterval> | null = null

  // Status de conexao detalhado
  private _connectionAttempts = 0
  private _lastError: string | null = null
  private _lastConnected: Date | null = null
  private _isReconnecting = false
  private _currentReconnectDelay = INITIAL_RECONNECT_DELAY

  // Callback para quando status muda
  private _onStatusChange: StatusChangeCallback | null = null

  // Versao detectada durante auto-detect
  private _detectedVersion: string | null = null

  constructor(config: TuyaClientConfig) {
    this._config = config
    this.createDevice(config.protocolVersion ?? '3.4')
    console.log(`[TuyaClient] Criado para dispositivo: ${config.deviceId}`)
  }

  /**
   * Cria/recria a instancia TuyAPI com uma versao especifica
   */
  private createDevice(version: string): void {
    if (this.device) {
      this.device.removeAllListeners()
    }
    this.device = new TuyAPI({
      id: this._config.deviceId,
      key: this._config.localKey,
      ip: this._config.ipAddress,
      version,
      issueRefreshOnConnect: true,
    })
    this.setupListeners()
  }

  /**
   * Define callback para quando o status mudar
   */
  onStatusChange(callback: StatusChangeCallback): void {
    this._onStatusChange = callback
  }

  private stopTimers() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  private setupListeners() {
    if (!this.device) return

    this.device.on('connected', async () => {
      console.log(`[TuyaClient:${this._config.deviceId}] Evento: connected`)
      this._isConnected = true
      this._lastConnected = new Date()
      this._isReconnecting = false
      this._connectionAttempts = 0
      this._currentReconnectDelay = INITIAL_RECONNECT_DELAY
      this._lastError = null

      // Busca dados imediatamente apos conectar
      try {
        console.log(`[TuyaClient:${this._config.deviceId}] Buscando dados com get()...`)
        const data = await this.device!.get({ schema: true })
        console.log(`[TuyaClient:${this._config.deviceId}] Dados recebidos:`, JSON.stringify(data))
        if (data && typeof data === 'object' && 'dps' in data) {
          this.parseData((data as { dps: Record<string, unknown> }).dps)
        }
      } catch (err) {
        console.error(
          `[TuyaClient:${this._config.deviceId}] Erro ao buscar dados:`,
          (err as Error).message
        )
      }
    })

    this.device.on('disconnected', () => {
      console.log(`[TuyaClient:${this._config.deviceId}] Evento: disconnected`)
      this._isConnected = false
      this.stopTimers()

      // Reconecta automaticamente se estava ativo
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    })

    this.device.on('error', (error: Error) => {
      console.error(`[TuyaClient:${this._config.deviceId}] Evento error:`, error.message)
      this._lastError = error.message
    })

    this.device.on('data', (data: { dps?: Record<string, unknown> }) => {
      console.log(`[TuyaClient:${this._config.deviceId}] Evento data:`, JSON.stringify(data))
      if (data.dps) {
        this.parseData(data.dps)
      }
    })

    this.device.on('dp-refresh', (data: { dps?: Record<string, unknown> }) => {
      console.log(`[TuyaClient:${this._config.deviceId}] Evento dp-refresh:`, JSON.stringify(data))
      if (data.dps) {
        this.parseData(data.dps)
      }
    })
  }

  private scheduleReconnect() {
    if (this._connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(
        `[TuyaClient:${this._config.deviceId}] Max tentativas (${MAX_RECONNECT_ATTEMPTS}) atingido. Desistindo.`
      )
      this.shouldReconnect = false
      this._isReconnecting = false
      return
    }

    this._isReconnecting = true
    this._connectionAttempts++

    const delay = Math.min(this._currentReconnectDelay, MAX_RECONNECT_DELAY)
    console.log(
      `[TuyaClient:${this._config.deviceId}] Reconectando em ${delay / 1000}s... (tentativa ${this._connectionAttempts}/${MAX_RECONNECT_ATTEMPTS})`
    )

    this.reconnectTimer = setTimeout(() => {
      this.reconnect()
    }, delay)

    // Aumenta delay para proxima tentativa (backoff exponencial)
    this._currentReconnectDelay = Math.min(
      this._currentReconnectDelay * BACKOFF_MULTIPLIER,
      MAX_RECONNECT_DELAY
    )
  }

  private async reconnect() {
    if (!this.device || !this.shouldReconnect) return

    try {
      console.log(
        `[TuyaClient:${this._config.deviceId}] Tentando reconectar (tentativa ${this._connectionAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
      )
      await withTimeout(this.device.find(), CONNECTION_TIMEOUT, 'Timeout na reconexao (find)')
      await withTimeout(this.device.connect(), CONNECTION_TIMEOUT, 'Timeout na reconexao (connect)')
      this.startRefreshInterval()
    } catch (error) {
      const errorMsg = (error as Error).message
      console.error(`[TuyaClient:${this._config.deviceId}] Erro ao reconectar:`, errorMsg)
      this._lastError = errorMsg

      // Agenda proxima tentativa
      if (this.shouldReconnect) {
        this.scheduleReconnect()
      }
    }
  }

  private startRefreshInterval() {
    // Para qualquer interval existente
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }

    // Solicita refresh dos dados a cada 2 segundos para manter conexao ativa
    const requestedDPS = this._config.dpsMapping
      ? Object.keys(this._config.dpsMapping).map(Number).filter(Boolean)
      : undefined // undefined = TuyAPI usa default [4, 5, 6, 18, 19, 20]

    this.refreshInterval = setInterval(() => {
      if (this.device && this._isConnected) {
        console.log(`[TuyaClient:${this._config.deviceId}] Solicitando refresh...`)
        const opts = requestedDPS ? { requestedDPS } : { schema: true }
        this.device.refresh(opts).catch((err: Error) => {
          console.error(`[TuyaClient:${this._config.deviceId}] Erro no refresh:`, err.message)
        })
      }
    }, 2000)
  }

  private parseData(dps: Record<string, unknown>) {
    console.log(`[TuyaClient:${this._config.deviceId}] parseData:`, JSON.stringify(dps))

    const newStatus: DeviceStatus = {
      switch: this.lastStatus?.switch ?? false,
      current: this.lastStatus?.current ?? 0,
      power: this.lastStatus?.power ?? 0,
      voltage: this.lastStatus?.voltage ?? 0,
    }

    if (this._config.dpsMapping) {
      // Parsing dinamico baseado no mapeamento DPS
      for (const [dpId, value] of Object.entries(dps)) {
        const entry = this._config.dpsMapping[dpId]
        if (!entry) continue

        if (entry.type === 'raw' && typeof value === 'string') {
          const decoded = decodePhaseData(value)
          if (decoded) {
            newStatus.voltage = decoded.voltage
            newStatus.current = decoded.current
            newStatus.power = decoded.power
          }
        } else if (entry.type === 'boolean') {
          ;(newStatus as unknown as Record<string, unknown>)[entry.field] = Boolean(value)
        } else if (entry.type === 'number' && typeof value === 'number') {
          const converted = entry.scale > 0 ? value / Math.pow(10, entry.scale) : value
          ;(newStatus as unknown as Record<string, unknown>)[entry.field] =
            entry.field === 'voltage' ? Math.round(converted) : converted
        }
      }
    } else {
      // Fallback: layout hardcoded para smart plugs cz (DPS 1/4/5/6/18/19/20)
      const rawPower = (dps['19'] as number) ?? (dps['5'] as number)
      const rawVoltage = (dps['20'] as number) ?? (dps['6'] as number)

      if (dps['1'] !== undefined) newStatus.switch = Boolean(dps['1'])
      if (dps['18'] !== undefined) newStatus.current = dps['18'] as number
      else if (dps['4'] !== undefined) newStatus.current = dps['4'] as number
      if (rawPower !== undefined) newStatus.power = rawPower / 10
      if (rawVoltage !== undefined) newStatus.voltage = Math.round(rawVoltage / 10)
    }

    this.lastStatus = newStatus
    console.log(
      `[TuyaClient:${this._config.deviceId}] Status atualizado:`,
      JSON.stringify(this.lastStatus)
    )

    // Chama callback se definido
    if (this._onStatusChange) {
      this._onStatusChange(newStatus)
    }
  }

  async connect(): Promise<void> {
    if (!this.device) {
      throw new Error('Device not initialized')
    }

    this.shouldReconnect = true
    this._connectionAttempts = 0
    this._currentReconnectDelay = INITIAL_RECONNECT_DELAY
    this._isReconnecting = false

    // Se versao ja foi detectada anteriormente, usa direto
    if (this._detectedVersion) {
      await this.tryConnect(this._detectedVersion)
      return
    }

    // Monta lista de versoes para tentar: a configurada primeiro, depois as outras
    const configVersion = this._config.protocolVersion ?? '3.4'
    const versionsToTry = [configVersion, ...PROTOCOL_VERSIONS.filter((v) => v !== configVersion)]

    let lastError = ''

    for (const version of versionsToTry) {
      try {
        console.log(`[TuyaClient:${this._config.deviceId}] Tentando versao ${version}...`)
        this.createDevice(version)
        await this.tryConnect(version)
        this._detectedVersion = version
        console.log(`[TuyaClient:${this._config.deviceId}] Versao detectada: ${version}`)
        return
      } catch (error) {
        lastError = (error as Error).message
        console.warn(`[TuyaClient:${this._config.deviceId}] Versao ${version} falhou: ${lastError}`)
        // Limpa estado antes de tentar proxima versao
        try {
          this.device?.disconnect()
        } catch {
          // ignora
        }
      }
    }

    this._lastError = lastError
    this.shouldReconnect = false
    throw new Error(
      `Falha ao conectar: nenhuma versão de protocolo funcionou (tentou ${versionsToTry.join(', ')}). Verifique se o dispositivo está ligado e na mesma rede. Se o problema persistir, informe o endereço IP manualmente.`
    )
  }

  private async tryConnect(version: string): Promise<void> {
    if (!this.device) throw new Error('Device not initialized')

    console.log(`[TuyaClient:${this._config.deviceId}] Buscando dispositivo (v${version})...`)
    await withTimeout(
      this.device.find(),
      CONNECTION_TIMEOUT,
      `Timeout: dispositivo não encontrado na rede em 15s (v${version}).`
    )
    console.log(`[TuyaClient:${this._config.deviceId}] Conectando (v${version})...`)
    await withTimeout(
      this.device.connect(),
      CONNECTION_TIMEOUT,
      `Timeout: conexão não estabelecida em 15s (v${version}).`
    )
    console.log(`[TuyaClient:${this._config.deviceId}] Conectado com protocolo ${version}!`)

    // Inicia refresh periodico para manter conexao e obter dados
    this.startRefreshInterval()
  }

  disconnect(): void {
    this.shouldReconnect = false
    this._isReconnecting = false
    this.stopTimers()
    if (this.device) {
      this.device.disconnect()
    }
    this._isConnected = false
  }

  /**
   * Reseta contadores de retry e permite novas tentativas
   */
  resetRetry(): void {
    this._connectionAttempts = 0
    this._currentReconnectDelay = INITIAL_RECONNECT_DELAY
    this._lastError = null
    this.shouldReconnect = true
  }

  getLastStatus(): DeviceStatus | null {
    return this.lastStatus
  }

  isConnected(): boolean {
    return this._isConnected
  }

  getConfig(): TuyaClientConfig {
    return this._config
  }

  /**
   * Retorna a versao de protocolo detectada durante auto-detect
   */
  getDetectedVersion(): string | null {
    return this._detectedVersion
  }

  /**
   * Retorna status detalhado da conexao
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this._isConnected,
      connectionAttempts: this._connectionAttempts,
      maxAttempts: MAX_RECONNECT_ATTEMPTS,
      lastError: this._lastError,
      lastConnected: this._lastConnected,
      isReconnecting: this._isReconnecting,
    }
  }
}

// Singleton legado para compatibilidade com rotas da POC
class LegacyTuyaClient {
  private client: TuyaClient | null = null
  private _config: DeviceConfig | null = null
  private isConfigured = false

  setConfig(config: DeviceConfig) {
    this._config = config

    if (this.client) {
      this.client.disconnect()
    }

    this.client = new TuyaClient({
      deviceId: config.deviceId,
      localKey: config.localKey,
      ipAddress: config.ipAddress,
    })

    this.isConfigured = true
    console.log('[LegacyTuyaClient] Configurado:', config.deviceId)
  }

  async connect(): Promise<void> {
    if (!this.client) {
      throw new Error('Configure o dispositivo primeiro')
    }
    await this.client.connect()
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.disconnect()
    }
  }

  getStatus(): DeviceStatus | null {
    return this.client?.getLastStatus() ?? null
  }

  hasConfig(): boolean {
    return this.isConfigured
  }

  getConfig(): DeviceConfig | null {
    return this._config
  }
}

export const tuyaClient = new LegacyTuyaClient()
