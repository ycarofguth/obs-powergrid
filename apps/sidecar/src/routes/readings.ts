import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getDevice } from '../services/device-manager.js'
import {
  getReadings,
  getLastReading,
  countReadings,
  cleanupOldReadings,
} from '../services/readings-service.js'

const router = Router()

router.use(requireAuth)

/**
 * GET /api/devices/:id/readings
 * Busca historico de leituras de um dispositivo
 */
router.get('/:id/readings', (req: Request<{ id: string }>, res: Response) => {
  try {
    const id = req.params.id
    const { startDate, endDate, limit } = req.query

    const device = getDevice(id)

    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
      })
      return
    }

    const options: {
      startDate?: Date
      endDate?: Date
      limit?: number
    } = {}

    if (startDate && typeof startDate === 'string') {
      options.startDate = new Date(startDate)
    }
    if (endDate && typeof endDate === 'string') {
      options.endDate = new Date(endDate)
    }
    if (limit && typeof limit === 'string') {
      const parsedLimit = parseInt(limit, 10)
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        options.limit = parsedLimit
      }
    }

    const readings = getReadings(id, options)

    res.json({
      success: true,
      data: readings,
    })
  } catch (error) {
    console.error('Get readings error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get readings' },
    })
  }
})

/**
 * GET /api/devices/:id/readings/last
 * Retorna a ultima leitura de um dispositivo
 */
router.get('/:id/readings/last', (req: Request<{ id: string }>, res: Response) => {
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

    const reading = getLastReading(id)

    res.json({
      success: true,
      data: reading,
    })
  } catch (error) {
    console.error('Get last reading error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get last reading' },
    })
  }
})

/**
 * GET /api/devices/:id/readings/count
 * Retorna contagem de leituras de um dispositivo
 */
router.get('/:id/readings/count', (req: Request<{ id: string }>, res: Response) => {
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

    const count = countReadings(id)

    res.json({
      success: true,
      data: { count },
    })
  } catch (error) {
    console.error('Count readings error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to count readings' },
    })
  }
})

/**
 * DELETE /api/readings/cleanup
 * Remove leituras antigas (admin/manutencao)
 */
router.delete('/cleanup', (req: Request, res: Response) => {
  try {
    const { daysToKeep } = req.query
    const days = daysToKeep && typeof daysToKeep === 'string' ? parseInt(daysToKeep, 10) : 30

    if (isNaN(days) || days < 1) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'daysToKeep must be a positive number' },
      })
      return
    }

    const deletedCount = cleanupOldReadings(days)

    res.json({
      success: true,
      data: { deletedCount, message: `Removed ${deletedCount} readings older than ${days} days` },
    })
  } catch (error) {
    console.error('Cleanup readings error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to cleanup readings' },
    })
  }
})

export default router
