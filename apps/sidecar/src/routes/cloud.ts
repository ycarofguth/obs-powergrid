import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  hasCloudCredentials,
  getCloudCredentials,
  saveCloudCredentials,
  deleteCloudCredentials,
} from '../services/credential-manager.js'
import {
  initCloudClient,
  clearCloudClient,
  testConnection,
  fetchCloudDevices,
  fetchDeviceDetails,
} from '../services/cloud-service.js'
import { getDeviceByTuyaId, updateDevice } from '../services/device-manager.js'

const router = Router()
router.use(requireAuth)

// GET /api/cloud/status - Verifica se credenciais estao configuradas
router.get('/status', (_req: Request, res: Response) => {
  const hasCredentials = hasCloudCredentials()
  res.json({
    success: true,
    data: { isConfigured: hasCredentials },
  })
})

// GET /api/cloud/credentials - Retorna credenciais (mascaradas)
router.get('/credentials', (_req: Request, res: Response) => {
  const credentials = getCloudCredentials()
  if (!credentials) {
    return res.json({
      success: true,
      data: null,
    })
  }

  // Mascarar secrets para exibicao
  res.json({
    success: true,
    data: {
      accessId: maskString(credentials.accessId),
      accessSecret: maskString(credentials.accessSecret),
      region: credentials.region,
      updatedAt: credentials.updatedAt,
    },
  })
})

// POST /api/cloud/credentials - Salvar credenciais
router.post('/credentials', async (req: Request, res: Response) => {
  const { accessId, accessSecret, region } = req.body

  if (!accessId || !accessSecret) {
    return res.status(400).json({
      success: false,
      error: { code: 'MISSING_FIELDS', message: 'Access ID e Access Secret sao obrigatorios' },
    })
  }

  try {
    // Inicializar cliente para testar
    initCloudClient({ accessId, accessSecret, region })

    // Testar conexao
    const testResult = await testConnection()
    if (!testResult.success) {
      clearCloudClient()
      const errorMessage = testResult.error || 'Credenciais invalidas'
      const errorCode = testResult.code || 'INVALID_CREDENTIALS'
      console.log('[Cloud] Test failed:', errorCode, errorMessage)
      return res.status(400).json({
        success: false,
        error: {
          code: errorCode,
          message: `Erro: ${errorMessage}`,
        },
      })
    }

    // Salvar no banco
    saveCloudCredentials({ accessId, accessSecret, region })

    res.json({
      success: true,
      data: { message: 'Credenciais salvas com sucesso' },
    })
  } catch (error) {
    clearCloudClient()
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Cloud] Save credentials error:', message)
    res.status(500).json({
      success: false,
      error: { code: 'CLOUD_ERROR', message: `Erro ao conectar com Tuya Cloud: ${message}` },
    })
  }
})

// POST /api/cloud/test - Testar conexao
router.post('/test', async (_req: Request, res: Response) => {
  const credentials = getCloudCredentials()
  if (!credentials) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Credenciais nao configuradas' },
    })
  }

  try {
    initCloudClient(credentials)
    const isValid = await testConnection()

    res.json({
      success: true,
      data: { isValid },
    })
  } catch {
    res.json({
      success: true,
      data: { isValid: false },
    })
  }
})

// DELETE /api/cloud/credentials - Remover credenciais
router.delete('/credentials', (_req: Request, res: Response) => {
  deleteCloudCredentials()
  clearCloudClient()
  res.json({
    success: true,
    data: { message: 'Credenciais removidas' },
  })
})

// GET /api/cloud/devices - Buscar dispositivos da Cloud
router.get('/devices', async (_req: Request, res: Response) => {
  const credentials = getCloudCredentials()
  if (!credentials) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Credenciais nao configuradas' },
    })
  }

  try {
    initCloudClient(credentials)
    const devices = await fetchCloudDevices()

    res.json({
      success: true,
      data: devices,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar dispositivos'
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message },
    })
  }
})

// GET /api/cloud/devices/:id - Buscar detalhes de um dispositivo
router.get('/devices/:id', async (req: Request<{ id: string }>, res: Response) => {
  const credentials = getCloudCredentials()
  if (!credentials) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Credenciais nao configuradas' },
    })
  }

  try {
    initCloudClient(credentials)
    const device = await fetchDeviceDetails(req.params.id)

    if (!device) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
      })
    }

    res.json({
      success: true,
      data: device,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao buscar dispositivo'
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message },
    })
  }
})

// POST /api/cloud/devices/:id/refresh - Atualizar Local Key e protocolo via Cloud
router.post('/devices/:id/refresh', async (req: Request<{ id: string }>, res: Response) => {
  const credentials = getCloudCredentials()
  if (!credentials) {
    return res.status(400).json({
      success: false,
      error: { code: 'NOT_CONFIGURED', message: 'Credenciais nao configuradas' },
    })
  }

  const tuyaDeviceId = req.params.id

  // Verifica se o device existe no banco
  const existingDevice = getDeviceByTuyaId(tuyaDeviceId)
  if (!existingDevice) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado no banco local' },
    })
  }

  try {
    initCloudClient(credentials)
    const cloudDevice = await fetchDeviceDetails(tuyaDeviceId)

    if (!cloudDevice) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado na Tuya Cloud' },
      })
    }

    // Atualiza campos obtidos da Cloud
    const updates: Record<string, string> = {}
    if (cloudDevice.localKey) {
      updates.localKey = cloudDevice.localKey
    }
    if (cloudDevice.protocolVersion) {
      updates.protocolVersion = cloudDevice.protocolVersion
    }
    if (cloudDevice.ip) {
      updates.ipAddress = cloudDevice.ip
    }

    const updated = updateDevice(existingDevice.id, updates)

    res.json({
      success: true,
      data: {
        message: 'Dispositivo atualizado com dados da Cloud',
        device: updated,
        refreshed: {
          localKey: !!cloudDevice.localKey,
          protocolVersion: cloudDevice.protocolVersion,
          ip: cloudDevice.ip || null,
        },
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar dispositivo'
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_ERROR', message },
    })
  }
})

function maskString(str: string): string {
  if (str.length <= 8) return '****'
  return str.substring(0, 4) + '****' + str.substring(str.length - 4)
}

export default router
