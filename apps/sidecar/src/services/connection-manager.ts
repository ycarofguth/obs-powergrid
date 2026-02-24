import { TuyaClient, type ConnectionStatus } from './tuya-client.js'
import { fetchDeviceStatusCloud } from './cloud-status.js'
import { saveReading } from './readings-service.js'
import { listDevices, getDevice, updateDevice, type DeviceOutput } from './device-manager.js'
import { logConnection, logError } from './logs-service.js'
import type { DeviceStatus, DeviceWithStatus } from '@obs-tuya/shared'

// Mapa de clientes Tuya por deviceId (para modo local)
const tuyaClients = new Map<string, TuyaClient>()

// Mapa de intervalos de polling Cloud por deviceId
const cloudPollingIntervals = new Map<string, ReturnType<typeof setInterval>>()

// Cache de ultimo status para modo Cloud
const cloudStatusCache = new Map<string, { status: DeviceStatus; timestamp: Date }>()

// Cache de ultimo status para modo Local
const localStatusCache = new Map<string, { status: DeviceStatus; timestamp: Date }>()

// Intervalo de polling Cloud em ms
const CLOUD_POLLING_INTERVAL = 2000

// Intervalo minimo para salvar readings
const READING_SAVE_INTERVAL = 10000
const lastReadingSave = new Map<string, number>()

/**
 * Salva reading se passou tempo suficiente desde a ultima
 */
function maybeSaveReading(deviceId: string, status: DeviceStatus): void {
  const now = Date.now()
  const lastSave = lastReadingSave.get(deviceId) || 0

  if (now - lastSave >= READING_SAVE_INTERVAL) {
    try {
      saveReading({ deviceId, status })
      lastReadingSave.set(deviceId, now)
    } catch (err) {
      console.error(`[ConnectionManager] Erro ao salvar reading para ${deviceId}:`, err)
    }
  }
}

/**
 * Obtem o cliente Tuya de um dispositivo
 */
export function getTuyaClient(deviceId: string): TuyaClient | undefined {
  return tuyaClients.get(deviceId)
}

/**
 * Inicia polling Cloud para um dispositivo
 */
export function startCloudPolling(device: DeviceOutput): void {
  // Para polling existente se houver
  stopCloudPolling(device.id)

  console.log(`[ConnectionManager] Iniciando polling Cloud para ${device.id} (${device.deviceId})`)

  const pollStatus = async () => {
    const result = await fetchDeviceStatusCloud(device.deviceId)

    if (result.success && result.status) {
      cloudStatusCache.set(device.id, {
        status: result.status,
        timestamp: new Date(),
      })
      maybeSaveReading(device.id, result.status)
    }
  }

  // Busca status imediatamente
  pollStatus()

  // Inicia polling periodico
  const interval = setInterval(pollStatus, CLOUD_POLLING_INTERVAL)
  cloudPollingIntervals.set(device.id, interval)
}

/**
 * Para polling Cloud de um dispositivo
 */
export function stopCloudPolling(deviceId: string): void {
  const interval = cloudPollingIntervals.get(deviceId)
  if (interval) {
    clearInterval(interval)
    cloudPollingIntervals.delete(deviceId)
    cloudStatusCache.delete(deviceId)
    console.log(`[ConnectionManager] Polling Cloud parado para ${deviceId}`)
  }
}

/**
 * Conecta um dispositivo (local ou cloud)
 * Retorna resultado da conexao
 */
export async function connectDevice(
  device: DeviceOutput
): Promise<{ success: boolean; error?: string; errorCode?: string }> {
  // Modo Cloud
  if (device.communicationMode === 'cloud') {
    const testResult = await fetchDeviceStatusCloud(device.deviceId)

    if (!testResult.success) {
      const errorCode =
        testResult.error === 'CLOUD_PERMISSION_ERROR' ? 'CLOUD_PERMISSION_ERROR' : 'CLOUD_ERROR'
      logError(`Falha ao conectar via Cloud: ${testResult.error || 'Erro desconhecido'}`, device.id)
      return {
        success: false,
        error: testResult.errorDetails || testResult.error || 'Erro ao conectar via Cloud',
        errorCode,
      }
    }

    startCloudPolling(device)
    logConnection(`Conectado via Cloud`, device.id)
    return { success: true }
  }

  // Modo Local
  let client = tuyaClients.get(device.id)
  if (client) {
    client.disconnect()
  }

  client = new TuyaClient({
    deviceId: device.deviceId,
    localKey: device.localKey,
    ipAddress: device.ipAddress ?? undefined,
    protocolVersion: device.protocolVersion,
    dpsMapping: device.dpsMapping ?? undefined,
  })

  client.onStatusChange((status) => {
    maybeSaveReading(device.id, status)
  })

  try {
    await client.connect()
    tuyaClients.set(device.id, client)

    // Salva versao detectada no banco se diferente da configurada
    const detectedVersion = client.getDetectedVersion()
    if (detectedVersion && detectedVersion !== device.protocolVersion) {
      updateDevice(device.id, { protocolVersion: detectedVersion })
      console.log(
        `[ConnectionManager] Versao de protocolo atualizada para ${detectedVersion} (era ${device.protocolVersion}) - device ${device.id}`
      )
    }

    logConnection(
      `Conectado via Local (TCP/AES, v${detectedVersion || device.protocolVersion})`,
      device.id
    )
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao conectar'
    logError(`Falha ao conectar via Local: ${message}`, device.id, {
      mode: device.communicationMode,
      protocolVersion: device.protocolVersion,
      ipAddress: device.ipAddress,
      category: device.category,
    })
    return { success: false, error: message, errorCode: 'CONNECTION_ERROR' }
  }
}

/**
 * Desconecta um dispositivo
 */
export function disconnectDevice(deviceId: string): { success: boolean; error?: string } {
  const device = getDevice(deviceId)
  if (!device) return { success: false, error: 'Device not found' }

  if (device.communicationMode === 'cloud') {
    if (!cloudPollingIntervals.has(deviceId)) {
      return { success: false, error: 'Device is not connected' }
    }
    stopCloudPolling(deviceId)
    logConnection(`Desconectado (Cloud)`, deviceId)
    return { success: true }
  }

  const client = tuyaClients.get(deviceId)
  if (!client) {
    return { success: false, error: 'Device is not connected' }
  }

  client.disconnect()
  tuyaClients.delete(deviceId)
  logConnection(`Desconectado (Local)`, deviceId)
  return { success: true }
}

/**
 * Conecta automaticamente todos os dispositivos habilitados
 * Chamado apos login/unlock
 */
export async function autoConnectEnabledDevices(): Promise<void> {
  const devices = listDevices()
  const enabledDevices = devices.filter((d) => d.enabled)

  if (enabledDevices.length === 0) return

  console.log(`[ConnectionManager] Auto-conectando ${enabledDevices.length} dispositivo(s)...`)
  logConnection(`Auto-connect iniciado para ${enabledDevices.length} dispositivo(s)`)

  for (const device of enabledDevices) {
    try {
      await connectDevice(device)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error(`[ConnectionManager] Falha ao auto-conectar ${device.name}:`, message)
    }
  }
}

/**
 * Atualiza cache de status local
 */
export function updateLocalStatusCache(deviceId: string, status: DeviceStatus): void {
  localStatusCache.set(deviceId, {
    status,
    timestamp: new Date(),
  })
  maybeSaveReading(deviceId, status)
}

/**
 * Verifica se um dispositivo esta conectado
 */
export function isDeviceConnected(deviceId: string): boolean {
  const device = getDevice(deviceId)
  if (!device) return false

  if (device.communicationMode === 'local') {
    const client = tuyaClients.get(deviceId)
    return client?.isConnected() ?? false
  } else {
    return cloudStatusCache.has(deviceId)
  }
}

/**
 * Obtem status de conexao de um dispositivo
 */
export function getDeviceConnectionStatus(deviceId: string): ConnectionStatus | undefined {
  const client = tuyaClients.get(deviceId)
  return client?.getConnectionStatus()
}

/**
 * Obtem status atual de um dispositivo
 */
export function getDeviceCurrentStatus(deviceId: string): DeviceStatus | null {
  const device = getDevice(deviceId)
  if (!device) return null

  if (device.communicationMode === 'local') {
    const client = tuyaClients.get(deviceId)
    if (client) {
      return client.getLastStatus()
    }
    const cached = localStatusCache.get(deviceId)
    return cached?.status ?? null
  } else {
    const cached = cloudStatusCache.get(deviceId)
    return cached?.status ?? null
  }
}

/**
 * Obtem cache de status Cloud
 */
export function getCloudStatusCache(
  deviceId: string
): { status: DeviceStatus; timestamp: Date } | undefined {
  return cloudStatusCache.get(deviceId)
}

/**
 * Verifica se ha polling Cloud ativo
 */
export function isCloudPollingActive(deviceId: string): boolean {
  return cloudPollingIntervals.has(deviceId)
}

/**
 * Lista dispositivos com status de conexao
 */
export function listDevicesWithStatus(): DeviceWithStatus[] {
  const devices = listDevices()

  return devices.map((device) => {
    const isLocal = device.communicationMode === 'local'
    const client = tuyaClients.get(device.id)
    const cloudCache = cloudStatusCache.get(device.id)

    return {
      ...device,
      isConnected: isLocal ? (client?.isConnected() ?? false) : cloudCache !== undefined,
    }
  })
}

/**
 * Obtem um dispositivo com status de conexao
 */
export function getDeviceWithStatus(deviceId: string): DeviceWithStatus | null {
  const device = getDevice(deviceId)
  if (!device) return null

  const isLocal = device.communicationMode === 'local'
  const client = tuyaClients.get(deviceId)
  const cloudCache = cloudStatusCache.get(deviceId)

  return {
    ...device,
    isConnected: isLocal ? (client?.isConnected() ?? false) : cloudCache !== undefined,
  }
}

/**
 * Reseta retry de um dispositivo (modo local)
 */
export async function retryDevice(
  deviceId: string
): Promise<{ success: boolean; connectionStatus?: ConnectionStatus; error?: string }> {
  const device = getDevice(deviceId)
  if (!device) return { success: false, error: 'Device not found' }

  if (device.communicationMode !== 'local') {
    return { success: false, error: 'Retry is only available for local mode' }
  }

  let client = tuyaClients.get(deviceId)

  if (client) {
    client.resetRetry()
    if (!client.isConnected()) {
      try {
        await client.connect()
      } catch {
        // Retry automatico vai continuar
      }
    }
  } else {
    client = new TuyaClient({
      deviceId: device.deviceId,
      localKey: device.localKey,
      ipAddress: device.ipAddress ?? undefined,
      protocolVersion: device.protocolVersion,
      dpsMapping: device.dpsMapping ?? undefined,
    })

    client.onStatusChange((status) => {
      maybeSaveReading(deviceId, status)
    })

    tuyaClients.set(deviceId, client)

    try {
      await client.connect()
    } catch {
      // Retry automatico vai continuar
    }
  }

  logConnection(`Retry iniciado`, deviceId)
  return { success: true, connectionStatus: client.getConnectionStatus() }
}

/**
 * Limpa todos os recursos de conexao
 */
export function clearAllConnections(): void {
  for (const [id, client] of tuyaClients) {
    try {
      client.disconnect()
    } catch (err) {
      console.error(`[ConnectionManager] Erro ao desconectar ${id}:`, err)
    }
  }
  tuyaClients.clear()

  for (const [, interval] of cloudPollingIntervals) {
    clearInterval(interval)
  }
  cloudPollingIntervals.clear()
  cloudStatusCache.clear()
  localStatusCache.clear()
}
