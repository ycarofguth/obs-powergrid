import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getLogs,
  countLogs,
  cleanupOldLogs,
  LOG_TYPES,
  type LogType,
  type LogFilters,
} from '../services/logs-service.js'

const router = Router()

router.use(requireAuth)

/**
 * GET /api/logs
 * Lista logs com filtros
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { types, deviceId, startDate, endDate, limit, offset } = req.query

    const filters: LogFilters = {}

    // Parse types
    if (types) {
      const typeArray = typeof types === 'string' ? types.split(',') : []
      const validTypes = typeArray.filter((t) =>
        Object.values(LOG_TYPES).includes(t as LogType)
      ) as LogType[]
      if (validTypes.length > 0) {
        filters.types = validTypes
      }
    }

    // Parse deviceId
    if (deviceId && typeof deviceId === 'string') {
      filters.deviceId = deviceId
    }

    // Parse dates
    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        filters.startDate = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        filters.endDate = date
      }
    }

    // Parse pagination
    if (limit && typeof limit === 'string') {
      const parsedLimit = parseInt(limit, 10)
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        filters.limit = Math.min(parsedLimit, 1000) // Max 1000
      }
    }

    if (offset && typeof offset === 'string') {
      const parsedOffset = parseInt(offset, 10)
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        filters.offset = parsedOffset
      }
    }

    const logs = getLogs(filters)
    const total = countLogs({
      types: filters.types,
      deviceId: filters.deviceId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    })

    res.json({
      success: true,
      data: {
        logs,
        total,
        limit: filters.limit || 500,
        offset: filters.offset || 0,
      },
    })
  } catch (error) {
    console.error('Get logs error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar logs' },
    })
  }
})

/**
 * GET /api/logs/types
 * Retorna tipos de log disponiveis
 */
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: Object.values(LOG_TYPES),
  })
})

/**
 * DELETE /api/logs/cleanup
 * Remove logs antigos
 */
router.delete('/cleanup', (req: Request, res: Response) => {
  try {
    const { daysToKeep } = req.query
    const days = daysToKeep && typeof daysToKeep === 'string' ? parseInt(daysToKeep, 10) : 30

    if (isNaN(days) || days < 1) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'daysToKeep deve ser um numero positivo' },
      })
      return
    }

    const deletedCount = cleanupOldLogs(days)

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Removidos ${deletedCount} logs mais antigos que ${days} dias`,
      },
    })
  } catch (error) {
    console.error('Cleanup logs error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao limpar logs' },
    })
  }
})

/**
 * GET /api/logs/export
 * Exporta logs em CSV
 */
router.get('/export', (req: Request, res: Response) => {
  try {
    const { types, deviceId, startDate, endDate } = req.query

    const filters: LogFilters = { limit: 10000 }

    if (types && typeof types === 'string') {
      const typeArray = types.split(',')
      const validTypes = typeArray.filter((t) =>
        Object.values(LOG_TYPES).includes(t as LogType)
      ) as LogType[]
      if (validTypes.length > 0) {
        filters.types = validTypes
      }
    }

    if (deviceId && typeof deviceId === 'string') {
      filters.deviceId = deviceId
    }

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        filters.startDate = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        filters.endDate = date
      }
    }

    const logs = getLogs(filters)

    // Gerar CSV
    const headers = ['ID', 'Timestamp', 'Tipo', 'Mensagem', 'Device ID', 'Metadata']
    const rows = logs.map((log) => [
      log.id.toString(),
      log.timestamp.toISOString(),
      log.type,
      `"${log.message.replace(/"/g, '""')}"`,
      log.deviceId || '',
      log.metadata ? `"${JSON.stringify(log.metadata).replace(/"/g, '""')}"` : '',
    ])

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"')
    res.send(csv)
  } catch (error) {
    console.error('Export logs error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao exportar logs' },
    })
  }
})

export default router
