import { Router } from 'express'
import type { ApiResponse, DeviceConfig } from '../types/index.js'
import { tuyaClient } from '../services/tuya-client.js'

export const configRouter = Router()

let currentConfig: DeviceConfig | null = null

configRouter.get('/', (_req, res) => {
  if (!currentConfig) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NO_CONFIG', message: 'Nenhuma configuração salva' },
    }
    return res.status(404).json(response)
  }

  const response: ApiResponse<DeviceConfig> = {
    success: true,
    data: currentConfig,
  }
  res.json(response)
})

configRouter.post('/', (req, res) => {
  const { deviceId, localKey, ipAddress } = req.body as Partial<DeviceConfig>

  if (!deviceId || !localKey || !ipAddress) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'INVALID_CONFIG', message: 'Todos os campos são obrigatórios' },
    }
    return res.status(400).json(response)
  }

  try {
    currentConfig = { deviceId, localKey, ipAddress }
    tuyaClient.setConfig(currentConfig)

    const response: ApiResponse<DeviceConfig> = {
      success: true,
      data: currentConfig,
    }
    res.json(response)
  } catch (error) {
    currentConfig = null
    const response: ApiResponse = {
      success: false,
      error: { code: 'INVALID_CONFIG', message: (error as Error).message },
    }
    res.status(400).json(response)
  }
})

configRouter.post('/connect', async (_req, res) => {
  if (!currentConfig) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NO_CONFIG', message: 'Configure o dispositivo primeiro' },
    }
    return res.status(400).json(response)
  }

  try {
    await tuyaClient.connect()
    const response: ApiResponse = { success: true }
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'CONNECTION_ERROR', message: (error as Error).message },
    }
    res.status(500).json(response)
  }
})

configRouter.post('/disconnect', async (_req, res) => {
  try {
    await tuyaClient.disconnect()
    const response: ApiResponse = { success: true }
    res.json(response)
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'DISCONNECT_ERROR', message: (error as Error).message },
    }
    res.status(500).json(response)
  }
})

export function getConfig(): DeviceConfig | null {
  return currentConfig
}
