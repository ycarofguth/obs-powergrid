import { TuyaContext } from '@tuya/tuya-connector-nodejs'
import type { DpsMapping, DpsMappingEntry } from '@obs-tuya/shared'

export interface TuyaCloudConfig {
  accessId: string
  accessSecret: string
  region?: string // 'us' | 'eu' | 'cn' | 'in'
}

export interface CloudDevice {
  id: string // device_id
  name: string // nome do dispositivo
  localKey: string // local_key para comunicacao local
  category: string // categoria (cz = tomada)
  productId: string
  productName: string
  isOnline: boolean
  protocolVersion: string
  ip?: string // IP se disponivel
}

// Tipos para respostas da API Tuya
interface TuyaDeviceResult {
  id?: string
  name?: string
  local_key?: string
  category?: string
  product_id?: string
  product_name?: string
  online?: boolean
  protocol_version?: string
  ip?: string
}

interface TuyaDevicesResult {
  devices?: TuyaDeviceResult[]
  list?: TuyaDeviceResult[]
}

let tuyaContext: TuyaContext | null = null

export function initCloudClient(config: TuyaCloudConfig): void {
  tuyaContext = new TuyaContext({
    baseUrl: getBaseUrl(config.region || 'us'),
    accessKey: config.accessId,
    secretKey: config.accessSecret,
  })
}

export function getCloudClient(): TuyaContext {
  if (!tuyaContext) throw new Error('Cloud client not initialized')
  return tuyaContext
}

export function clearCloudClient(): void {
  tuyaContext = null
}

export function isCloudClientInitialized(): boolean {
  return tuyaContext !== null
}

export interface TestConnectionResult {
  success: boolean
  error?: string
  code?: string
}

export async function testConnection(): Promise<TestConnectionResult> {
  try {
    const client = getCloudClient()
    // Usa a API de estatisticas que nao requer parametros especificos
    // Se as credenciais estiverem erradas, retorna erro 1010 ou 1004
    const response = await client.request({
      method: 'GET',
      path: '/v1.0/statistics-datas-survey',
    })

    console.log('[Cloud] Test connection response:', JSON.stringify(response))

    // Codigos de erro de autenticacao
    const authErrorCodes = [1004, 1010, 1011, 1012, 1013, 2001, 2002, 2003, 2004, 2006]

    if (response.success === true) {
      return { success: true }
    }

    // Se o erro NAO for de autenticacao, as credenciais estao OK
    // Pode ser que a API nao esteja disponivel mas as credenciais sao validas
    if (response.code && !authErrorCodes.includes(Number(response.code))) {
      console.log('[Cloud] API error but credentials are valid')
      return { success: true }
    }

    // Retorna erro da API
    return {
      success: false,
      error: response.msg || 'Unknown error',
      code: String(response.code || ''),
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Cloud] Test connection error:', message)
    return {
      success: false,
      error: message,
    }
  }
}

export async function fetchCloudDevices(): Promise<CloudDevice[]> {
  const client = getCloudClient()

  // Buscar dispositivos usando a API correta
  // A API /v1.0/iot-01/associated-users/devices lista dispositivos associados ao app
  const devicesResponse = await client.request({
    method: 'GET',
    path: '/v1.0/iot-01/associated-users/devices',
    query: { page_no: 1, page_size: 100 },
  })

  console.log('[Cloud] Fetch devices response:', JSON.stringify(devicesResponse))

  if (!devicesResponse.success) {
    // Tenta API alternativa se a primeira falhar
    console.log('[Cloud] Trying alternative API...')
    return fetchCloudDevicesAlternative()
  }

  const result = devicesResponse.result as TuyaDevicesResult | undefined
  const devices = result?.devices || result?.list || []

  // Para cada dispositivo, buscar detalhes incluindo local_key
  const detailedDevices: CloudDevice[] = []

  for (const device of devices) {
    try {
      const details = await fetchDeviceDetails(device.id || '')
      if (details) {
        detailedDevices.push(details)
      }
    } catch {
      // Se falhar ao buscar detalhes, adiciona com dados basicos
      detailedDevices.push({
        id: device.id || '',
        name: device.name || 'Unknown',
        localKey: device.local_key || '',
        category: device.category || '',
        productId: device.product_id || '',
        productName: device.product_name || '',
        isOnline: device.online || false,
        protocolVersion: '3.4',
        ip: device.ip,
      })
    }
  }

  return detailedDevices
}

async function fetchCloudDevicesAlternative(): Promise<CloudDevice[]> {
  const client = getCloudClient()

  // API alternativa: /v2.0/cloud/thing/device
  const response = await client.request({
    method: 'GET',
    path: '/v2.0/cloud/thing/device',
    query: { page_no: 1, page_size: 100 },
  })

  console.log('[Cloud] Alternative API response:', JSON.stringify(response))

  if (!response.success) {
    throw new Error(response.msg || 'Failed to fetch devices')
  }

  const result = response.result as TuyaDevicesResult | undefined
  const devices = result?.list || []

  return devices.map((d) => ({
    id: d.id || '',
    name: d.name || 'Unknown',
    localKey: d.local_key || '',
    category: d.category || '',
    productId: d.product_id || '',
    productName: d.product_name || '',
    isOnline: d.online || false,
    protocolVersion: detectProtocolVersion(d),
    ip: d.ip,
  }))
}

export async function fetchDeviceDetails(deviceId: string): Promise<CloudDevice | null> {
  const client = getCloudClient()

  const response = await client.request({
    method: 'GET',
    path: `/v1.0/iot-03/devices/${deviceId}`,
  })

  if (!response.success || !response.result) return null

  const d = response.result as TuyaDeviceResult
  return {
    id: d.id || deviceId,
    name: d.name || 'Unknown',
    localKey: d.local_key || '',
    category: d.category || '',
    productId: d.product_id || '',
    productName: d.product_name || '',
    isOnline: d.online || false,
    protocolVersion: detectProtocolVersion(d),
    ip: d.ip,
  }
}

// Mapa de codigo Tuya → campo interno
const CODE_TO_FIELD: Record<string, DpsMappingEntry['field']> = {
  switch: 'switch',
  switch_1: 'switch',
  cur_power: 'power',
  cur_activepower_a: 'power',
  cur_voltage: 'voltage',
  cur_voltage_a: 'voltage',
  cur_current: 'current',
  cur_current_a: 'current',
  add_ele: 'electricity',
  total_forward_energy: 'electricity',
  total_ele: 'electricity',
  phase_a: 'power', // Raw blob — tratamento especial no parser
}

interface TuyaSpecItem {
  code?: string
  dp_id?: number
  type?: string
  values?: string // JSON string com min/max/scale/unit
}

interface TuyaSpecResult {
  functions?: TuyaSpecItem[]
  status?: TuyaSpecItem[]
}

/**
 * Busca as especificacoes DPS de um dispositivo na Tuya Cloud
 * Retorna o mapeamento dpId → campo/tipo/scale
 */
export async function fetchDeviceSpecifications(deviceId: string): Promise<DpsMapping | null> {
  try {
    const client = getCloudClient()

    const response = await client.request({
      method: 'GET',
      path: `/v1.1/devices/${deviceId}/specifications`,
    })

    console.log(`[Cloud] Specifications for ${deviceId}:`, JSON.stringify(response))

    if (!response.success || !response.result) {
      console.warn(`[Cloud] Falha ao buscar specifications para ${deviceId}:`, response.msg)
      return null
    }

    const result = response.result as TuyaSpecResult
    const allSpecs = [...(result.functions || []), ...(result.status || [])]

    const mapping: DpsMapping = {}

    for (const spec of allSpecs) {
      if (!spec.code || !spec.dp_id) continue

      const field = CODE_TO_FIELD[spec.code]
      if (!field) continue

      // Extrair scale do campo values (JSON string)
      let scale = 0
      if (spec.values) {
        try {
          const values = JSON.parse(spec.values)
          if (typeof values.scale === 'number') {
            scale = values.scale
          }
        } catch {
          // Ignora erro de parse
        }
      }

      const isRaw = spec.code === 'phase_a' || spec.code === 'phase_b' || spec.code === 'phase_c'
      const isBoolean = spec.type === 'Boolean' || spec.code.startsWith('switch')

      mapping[String(spec.dp_id)] = {
        field,
        type: isRaw ? 'raw' : isBoolean ? 'boolean' : 'number',
        scale,
        code: spec.code,
      }
    }

    if (Object.keys(mapping).length === 0) {
      console.warn(`[Cloud] Nenhum DPS mapeado para ${deviceId}`)
      return null
    }

    console.log(`[Cloud] DPS mapping para ${deviceId}:`, JSON.stringify(mapping))
    return mapping
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Cloud] Erro ao buscar specifications para ${deviceId}:`, message)
    return null
  }
}

function getBaseUrl(region: string): string {
  const urls: Record<string, string> = {
    us: 'https://openapi.tuyaus.com',
    eu: 'https://openapi.tuyaeu.com',
    cn: 'https://openapi.tuyacn.com',
    in: 'https://openapi.tuyain.com',
  }
  return urls[region] ?? 'https://openapi.tuyaus.com'
}

function detectProtocolVersion(device: TuyaDeviceResult): string {
  if (typeof device.protocol_version === 'string' && device.protocol_version !== '') {
    return device.protocol_version
  }
  console.warn(
    `[Cloud] Versao de protocolo nao disponivel para ${device.id || 'unknown'}, usando fallback 3.4`
  )
  return '3.4'
}
