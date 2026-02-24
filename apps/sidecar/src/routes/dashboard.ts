import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getDashboardSummary,
  getDeviceDashboard,
  getDeviceStats,
  getAggregatedReadings,
  getHourlyCosts,
  getComparisonChartData,
  getComparisonRankings,
} from '../services/dashboard-service.js'
import { getDevice } from '../services/device-manager.js'

const router = Router()

router.use(requireAuth)

/**
 * GET /api/dashboard
 * Retorna resumo do dashboard unificado
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const summary = getDashboardSummary()
    res.json({ success: true, data: summary })
  } catch (error) {
    console.error('Get dashboard summary error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar dashboard' },
    })
  }
})

/**
 * GET /api/dashboard/devices/:id
 * Retorna dashboard detalhado de um dispositivo
 */
router.get('/devices/:id', (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query

    const device = getDevice(id)
    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
      })
      return
    }

    let start: Date | undefined
    let end: Date | undefined

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        start = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        end = date
      }
    }

    const dashboard = getDeviceDashboard(id, start, end)

    if (!dashboard) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dashboard nao encontrado' },
      })
      return
    }

    res.json({ success: true, data: dashboard })
  } catch (error) {
    console.error('Get device dashboard error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar dashboard do dispositivo' },
    })
  }
})

/**
 * GET /api/dashboard/devices/:id/stats
 * Retorna estatisticas de um dispositivo para um periodo
 */
router.get('/devices/:id/stats', (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate, period } = req.query

    const device = getDevice(id)
    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
      })
      return
    }

    const now = new Date()
    let start: Date
    let end: Date = now

    // Periodos pre-definidos
    if (period && typeof period === 'string') {
      switch (period) {
        case 'hour':
          start = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case '24h':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }
    } else {
      // Periodo customizado
      if (startDate && typeof startDate === 'string') {
        const date = new Date(startDate)
        if (!isNaN(date.getTime())) {
          start = date
        } else {
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      } else {
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }

      if (endDate && typeof endDate === 'string') {
        const date = new Date(endDate)
        if (!isNaN(date.getTime())) {
          end = date
        }
      }
    }

    const stats = getDeviceStats(id, start, end)
    res.json({ success: true, data: stats })
  } catch (error) {
    console.error('Get device stats error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar estatisticas' },
    })
  }
})

/**
 * GET /api/dashboard/devices/:id/chart
 * Retorna dados agregados para grafico de linha (potencia)
 */
router.get('/devices/:id/chart', (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate, interval } = req.query

    const device = getDevice(id)
    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
      })
      return
    }

    const now = new Date()
    let start: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    let end: Date = now
    let intervalMinutes = 5

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        start = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        end = date
      }
    }

    if (interval && typeof interval === 'string') {
      const parsed = parseInt(interval, 10)
      if (!isNaN(parsed) && parsed > 0) {
        intervalMinutes = parsed
      }
    }

    const data = getAggregatedReadings(id, start, end, intervalMinutes)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Get chart data error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar dados do grafico' },
    })
  }
})

/**
 * GET /api/dashboard/devices/:id/costs
 * Retorna custos por hora para grafico de barras
 */
router.get('/devices/:id/costs', (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { startDate, endDate } = req.query

    const device = getDevice(id)
    if (!device) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
      })
      return
    }

    const now = new Date()
    let start: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    let end: Date = now

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        start = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        end = date
      }
    }

    const data = getHourlyCosts(id, start, end)
    res.json({ success: true, data })
  } catch (error) {
    console.error('Get costs data error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar custos' },
    })
  }
})

/**
 * GET /api/dashboard/compare/chart
 * Retorna dados de grafico de comparacao entre dispositivos
 */
router.get('/compare/chart', (req: Request, res: Response) => {
  try {
    const { startDate, endDate, interval, deviceIds } = req.query

    const now = new Date()
    let start: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    let end: Date = now
    let intervalMinutes = 15

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        start = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        end = date
      }
    }

    if (interval && typeof interval === 'string') {
      const parsed = parseInt(interval, 10)
      if (!isNaN(parsed) && parsed > 0) {
        intervalMinutes = parsed
      }
    }

    let parsedDeviceIds: string[] | undefined
    if (deviceIds && typeof deviceIds === 'string') {
      parsedDeviceIds = deviceIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    }

    const data = getComparisonChartData({
      deviceIds: parsedDeviceIds,
      startDate: start,
      endDate: end,
      intervalMinutes,
    })
    res.json({ success: true, data })
  } catch (error) {
    console.error('Get comparison chart data error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar dados de comparacao' },
    })
  }
})

/**
 * GET /api/dashboard/compare/ranking
 * Retorna rankings de comparacao entre dispositivos
 */
router.get('/compare/ranking', (req: Request, res: Response) => {
  try {
    const { startDate, endDate, deviceIds } = req.query

    const now = new Date()
    let start: Date = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    let end: Date = now

    if (startDate && typeof startDate === 'string') {
      const date = new Date(startDate)
      if (!isNaN(date.getTime())) {
        start = date
      }
    }

    if (endDate && typeof endDate === 'string') {
      const date = new Date(endDate)
      if (!isNaN(date.getTime())) {
        end = date
      }
    }

    let parsedDeviceIds: string[] | undefined
    if (deviceIds && typeof deviceIds === 'string') {
      parsedDeviceIds = deviceIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    }

    const data = getComparisonRankings({
      deviceIds: parsedDeviceIds,
      startDate: start,
      endDate: end,
    })
    res.json({ success: true, data })
  } catch (error) {
    console.error('Get comparison rankings error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar rankings de comparacao' },
    })
  }
})

export default router
