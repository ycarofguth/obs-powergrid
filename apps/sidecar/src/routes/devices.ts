import { Router, type Request, type Response } from 'express'
import {
  createDevice,
  getDevice,
  updateDevice,
  deleteDevice,
  toggleDeviceEnabled,
  type DeviceInput,
} from '../services/device-manager.js'
import { fetchDeviceSpecifications, isCloudClientInitialized } from '../services/cloud-service.js'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  connectDevice,
  disconnectDevice,
  retryDevice,
  getTuyaClient,
  getCloudStatusCache,
  isCloudPollingActive,
  listDevicesWithStatus,
  getDeviceWithStatus,
} from '../services/connection-manager.js'

const router = Router()

// Todas as rotas requerem autenticacao
router.use(requireAuth)

/**
 * GET /api/devices
 * Lista todos os dispositivos
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const devices = listDevicesWithStatus()

    res.json({
      success: true,
      data: devices,
    })
  } catch (error) {
    console.error('List devices error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to list devices' },
    })
  }
})

/**
 * GET /api/devices/:id
 * Retorna um dispositivo especifico
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const device = getDeviceWithStatus(req.params.id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    res.json({
      success: true,
      data: device,
    })
  } catch (error) {
    console.error('Get device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get device' },
    })
  }
})

/**
 * POST /api/devices
 * Cria um novo dispositivo
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, deviceId, localKey, ipAddress, protocolVersion, communicationMode, category } =
      req.body as Partial<DeviceInput> & { category?: string }

    if (!name || !deviceId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Name and Device ID are required',
        },
      })
      return
    }

    if (communicationMode !== 'cloud' && !localKey) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Local Key is required for local communication mode',
        },
      })
      return
    }

    // Verifica se deviceId ja existe
    try {
      const device = createDevice({
        name,
        deviceId,
        localKey,
        ipAddress,
        protocolVersion,
        communicationMode,
        category,
      })

      // Buscar specifications DPS da Cloud (async, nao bloqueia resposta)
      if (isCloudClientInitialized()) {
        fetchDeviceSpecifications(deviceId)
          .then((dpsMapping) => {
            if (dpsMapping) {
              updateDevice(device.id, { dpsMapping })
              console.log(`[Devices] DPS mapping salvo para ${device.name} (${deviceId})`)
            }
          })
          .catch((err) => {
            console.warn(`[Devices] Falha ao buscar DPS specs para ${deviceId}:`, err)
          })
      }

      res.status(201).json({
        success: true,
        data: device,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('UNIQUE constraint') || message.includes('SQLITE_CONSTRAINT')) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_DEVICE',
            message: 'A device with this Device ID already exists',
          },
        })
        return
      }
      throw err
    }
  } catch (error) {
    console.error('Create device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create device' },
    })
  }
})

/**
 * PUT /api/devices/:id
 * Atualiza um dispositivo
 */
router.put('/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const existing = getDevice(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    const { name, deviceId, localKey, ipAddress, protocolVersion, communicationMode } =
      req.body as Partial<DeviceInput>

    // Se o dispositivo estiver conectado e campos criticos mudaram, desconecta
    const criticalFieldChanged =
      (deviceId !== undefined && deviceId !== existing.deviceId) ||
      (localKey !== undefined && localKey !== existing.localKey) ||
      (ipAddress !== undefined && ipAddress !== existing.ipAddress) ||
      (protocolVersion !== undefined && protocolVersion !== existing.protocolVersion) ||
      (communicationMode !== undefined && communicationMode !== existing.communicationMode)

    if (criticalFieldChanged) {
      disconnectDevice(id)
    }

    const updated = updateDevice(id, {
      name,
      deviceId,
      localKey,
      ipAddress,
      protocolVersion,
      communicationMode,
    })

    if (!updated) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    res.json({
      success: true,
      data: { ...updated, isConnected: false },
    })
  } catch (error) {
    console.error('Update device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update device' },
    })
  }
})

/**
 * DELETE /api/devices/:id
 * Remove um dispositivo
 */
router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    // Desconecta se estiver conectado
    disconnectDevice(id)

    const deleted = deleteDevice(id)

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    res.json({
      success: true,
      data: { message: 'Device deleted successfully' },
    })
  } catch (error) {
    console.error('Delete device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to delete device' },
    })
  }
})

/**
 * PATCH /api/devices/:id/enabled
 * Habilita ou desabilita um dispositivo
 */
router.patch('/:id/enabled', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const { enabled } = req.body

    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'enabled must be a boolean' },
      })
      return
    }

    // Se estiver desabilitando, desconecta
    if (!enabled) {
      disconnectDevice(id)
    }

    const device = toggleDeviceEnabled(id, enabled)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    res.json({
      success: true,
      data: { ...device, isConnected: enabled ? undefined : false },
    })
  } catch (error) {
    console.error('Toggle device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle device' },
    })
  }
})

/**
 * PATCH /api/devices/:id/mode
 * Altera o modo de comunicacao de um dispositivo
 */
router.patch('/:id/mode', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const { mode } = req.body

    if (mode !== 'local' && mode !== 'cloud') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'mode must be "local" or "cloud"' },
      })
      return
    }

    const existing = getDevice(id)
    if (!existing) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    // Desconecta do modo atual
    disconnectDevice(id)

    // Atualiza modo
    const updated = updateDevice(id, { communicationMode: mode })

    res.json({
      success: true,
      data: { ...updated, isConnected: false },
    })
  } catch (error) {
    console.error('Update device mode error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update device mode' },
    })
  }
})

/**
 * POST /api/devices/:id/connect
 * Conecta a um dispositivo
 */
router.post('/:id/connect', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    if (!device.enabled) {
      res.status(400).json({
        success: false,
        error: { code: 'DEVICE_DISABLED', message: 'Device is disabled' },
      })
      return
    }

    const result = await connectDevice(device)

    if (!result.success) {
      const statusCode = result.errorCode === 'CLOUD_PERMISSION_ERROR' ? 403 : 500
      res.status(statusCode).json({
        success: false,
        error: { code: result.errorCode || 'CONNECTION_ERROR', message: result.error },
      })
      return
    }

    res.json({
      success: true,
      data: {
        message: 'Connected successfully',
        isConnected: true,
        mode: device.communicationMode,
      },
    })
  } catch (error) {
    console.error('Connect device error:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CONNECTION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to connect to device',
      },
    })
  }
})

/**
 * POST /api/devices/:id/disconnect
 * Desconecta de um dispositivo
 */
router.post('/:id/disconnect', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    const result = disconnectDevice(id)

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_CONNECTED', message: result.error },
      })
      return
    }

    res.json({
      success: true,
      data: { message: 'Disconnected successfully', isConnected: false },
    })
  } catch (error) {
    console.error('Disconnect device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to disconnect from device' },
    })
  }
})

/**
 * POST /api/devices/:id/retry
 * Reseta contador de retry e tenta reconectar (modo local)
 */
router.post('/:id/retry', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    const result = await retryDevice(id)

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_MODE', message: result.error },
      })
      return
    }

    res.json({
      success: true,
      data: {
        message: 'Retry initiated',
        connectionStatus: result.connectionStatus,
      },
    })
  } catch (error) {
    console.error('Retry device error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retry connection' },
    })
  }
})

/**
 * GET /api/devices/:id/status
 * Retorna o status atual do dispositivo
 */
router.get('/:id/status', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    // Modo Cloud
    if (device.communicationMode === 'cloud') {
      const cloudCache = getCloudStatusCache(id)

      if (!cloudCache) {
        res.status(400).json({
          success: false,
          error: { code: 'NOT_CONNECTED', message: 'Device is not connected' },
        })
        return
      }

      res.json({
        success: true,
        data: {
          deviceId: id,
          deviceName: device.name,
          isConnected: true,
          mode: 'cloud',
          lastUpdate: cloudCache.timestamp,
          ...cloudCache.status,
        },
      })
      return
    }

    // Modo Local
    const client = getTuyaClient(id)

    if (!client || !client.isConnected()) {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_CONNECTED', message: 'Device is not connected' },
      })
      return
    }

    const status = client.getLastStatus()
    const connectionStatus = client.getConnectionStatus()

    res.json({
      success: true,
      data: {
        deviceId: id,
        deviceName: device.name,
        isConnected: true,
        mode: 'local',
        connectionStatus,
        ...status,
      },
    })
  } catch (error) {
    console.error('Get device status error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get device status' },
    })
  }
})

/**
 * GET /api/devices/:id/connection-status
 * Retorna status detalhado da conexao
 */
router.get('/:id/connection-status', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    if (device.communicationMode === 'cloud') {
      const cloudCache = getCloudStatusCache(id)

      res.json({
        success: true,
        data: {
          mode: 'cloud',
          isConnected: cloudCache !== undefined,
          isPolling: isCloudPollingActive(id),
          lastUpdate: cloudCache?.timestamp ?? null,
        },
      })
      return
    }

    const client = getTuyaClient(id)

    if (!client) {
      res.json({
        success: true,
        data: {
          mode: 'local',
          isConnected: false,
          connectionAttempts: 0,
          maxAttempts: 10,
          lastError: null,
          lastConnected: null,
          isReconnecting: false,
        },
      })
      return
    }

    res.json({
      success: true,
      data: {
        mode: 'local',
        ...client.getConnectionStatus(),
      },
    })
  } catch (error) {
    console.error('Get connection status error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get connection status' },
    })
  }
})

export default router
