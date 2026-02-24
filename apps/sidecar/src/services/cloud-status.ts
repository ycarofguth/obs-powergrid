import { getCloudClient, isCloudClientInitialized, initCloudClient } from './cloud-service.js'
import { getCloudCredentials } from './credential-manager.js'
import type { DeviceStatus } from '@obs-tuya/shared'

/**
 * Decodifica dados raw de phase_a (usado por dispositivos dlq/breaker)
 */
function decodePhaseData(
  base64Value: string
): { voltage: number; current: number; power: number } | null {
  try {
    const buffer = Buffer.from(base64Value, 'base64')
    if (buffer.length < 8) return null

    const voltage = buffer.readUInt16BE(0) / 10
    const current = (buffer[2]! << 16) | (buffer[3]! << 8) | buffer[4]!
    const power = (buffer[5]! << 16) | (buffer[6]! << 8) | buffer[7]!

    return { voltage, current, power }
  } catch {
    return null
  }
}

export interface CloudStatusResult {
  success: boolean
  status?: DeviceStatus
  error?: string
  errorDetails?: string
}

/**
 * Busca o status de um dispositivo via Tuya Cloud API
 */
export async function fetchDeviceStatusCloud(tuyaDeviceId: string): Promise<CloudStatusResult> {
  try {
    // Garante que o client esta inicializado
    if (!isCloudClientInitialized()) {
      const credentials = getCloudCredentials()
      if (!credentials) {
        return { success: false, error: 'Cloud credentials not configured' }
      }
      initCloudClient(credentials)
    }

    const client = getCloudClient()

    // Busca status do dispositivo via Cloud API
    const response = await client.request({
      method: 'GET',
      path: `/v1.0/iot-03/devices/${tuyaDeviceId}/status`,
    })

    console.log(`[CloudStatus] Response for ${tuyaDeviceId}:`, JSON.stringify(response))

    if (!response.success) {
      // Erro de permissao - API nao autorizada no projeto
      const errorCode = response.code as unknown as number
      if (errorCode === 28841105) {
        return {
          success: false,
          error: 'CLOUD_PERMISSION_ERROR',
          errorDetails:
            'O projeto Tuya IoT Platform nao tem permissao para a API IoT Core. Acesse Tuya IoT Platform > Cloud > Development > seu projeto > Service API e habilite "IoT Core".',
        }
      }
      return {
        success: false,
        error: response.msg || 'Failed to fetch device status',
      }
    }

    // Parse do status - o formato pode variar
    const statusArray = (response.result || []) as Array<{ code: string; value: unknown }>
    const status = parseCloudStatus(statusArray)

    return {
      success: true,
      status,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[CloudStatus] Error fetching status for ${tuyaDeviceId}:`, message)
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Envia comando para o dispositivo via Cloud
 */
export async function sendCommandCloud(
  tuyaDeviceId: string,
  command: { code: string; value: unknown }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isCloudClientInitialized()) {
      const credentials = getCloudCredentials()
      if (!credentials) {
        return { success: false, error: 'Cloud credentials not configured' }
      }
      initCloudClient(credentials)
    }

    const client = getCloudClient()

    const response = await client.request({
      method: 'POST',
      path: `/v1.0/iot-03/devices/${tuyaDeviceId}/commands`,
      body: {
        commands: [command],
      },
    })

    console.log(`[CloudStatus] Command response for ${tuyaDeviceId}:`, JSON.stringify(response))

    if (!response.success) {
      return {
        success: false,
        error: response.msg || 'Failed to send command',
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[CloudStatus] Error sending command to ${tuyaDeviceId}:`, message)
    return { success: false, error: message }
  }
}

/**
 * Parse do status retornado pela Cloud API
 * O formato e um array de { code, value }
 */
function parseCloudStatus(statusArray: Array<{ code: string; value: unknown }>): DeviceStatus {
  const status: DeviceStatus = {
    switch: false,
    power: 0,
    voltage: 0,
    current: 0,
  }

  for (const item of statusArray) {
    switch (item.code) {
      case 'switch_1':
      case 'switch':
        status.switch = Boolean(item.value)
        break
      case 'cur_power':
        // Power vem em decimos de W (ex: 263 = 26.3W)
        status.power = typeof item.value === 'number' ? item.value / 10 : 0
        break
      case 'cur_voltage':
        // Voltage vem em decimos de V (ex: 1270 = 127.0V)
        status.voltage =
          typeof item.value === 'number' ? Math.round((item.value as number) / 10) : 0
        break
      case 'cur_current':
        // Current em mA
        status.current = typeof item.value === 'number' ? item.value : 0
        break
      case 'add_ele':
        // Eletricidade acumulada
        status.electricity = typeof item.value === 'number' ? item.value : 0
        break
      // Codigos de dispositivos dlq (breaker/disjuntor)
      case 'cur_voltage_a':
        status.voltage = typeof item.value === 'number' ? Math.round(item.value / 10) : 0
        break
      case 'cur_current_a':
        status.current = typeof item.value === 'number' ? item.value : 0
        break
      case 'cur_activepower_a':
        status.power = typeof item.value === 'number' ? item.value / 10 : 0
        break
      case 'total_forward_energy':
        status.electricity = typeof item.value === 'number' ? item.value / 100 : 0
        break
      case 'total_ele':
        if (!status.electricity) {
          status.electricity = typeof item.value === 'number' ? item.value / 10 : 0
        }
        break
      case 'phase_a':
        if (typeof item.value === 'string') {
          const decoded = decodePhaseData(item.value)
          if (decoded) {
            status.voltage = decoded.voltage
            status.current = decoded.current
            status.power = decoded.power
          }
        }
        break
    }
  }

  return status
}
