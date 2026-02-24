import { Router } from 'express'
import type { ApiResponse, DeviceStatus } from '../types/index.js'
import { tuyaClient } from '../services/tuya-client.js'

export const statusRouter = Router()

statusRouter.get('/', (_req, res) => {
  if (!tuyaClient.hasConfig()) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Configure o dispositivo primeiro' },
    }
    return res.status(400).json(response)
  }

  const status = tuyaClient.getStatus()

  if (!status) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NO_DATA', message: 'Aguardando dados do dispositivo. Clique em Conectar.' },
    }
    return res.status(503).json(response)
  }

  const response: ApiResponse<DeviceStatus> = {
    success: true,
    data: status,
  }
  res.json(response)
})
