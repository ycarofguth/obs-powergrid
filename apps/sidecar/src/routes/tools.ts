import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import {
  getTimer,
  startTimer,
  pauseTimer,
  stopTimer,
  resetTimer,
  updateTimer,
} from '../services/timer-service.js'
import {
  getCounter,
  incrementCounter,
  decrementCounter,
  resetCounter,
  updateCounter,
} from '../services/counter-service.js'

const router = Router()

router.use(requireAuth)

// ==================== Timer ====================

/**
 * GET /api/tools/timer
 * Retorna estado atual do timer
 */
router.get('/timer', (_req: Request, res: Response) => {
  try {
    const state = getTimer()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Get timer error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar timer' },
    })
  }
})

/**
 * POST /api/tools/timer/start
 * Inicia o timer
 */
router.post('/timer/start', (_req: Request, res: Response) => {
  try {
    const state = startTimer()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Start timer error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao iniciar timer' },
    })
  }
})

/**
 * POST /api/tools/timer/pause
 * Pausa o timer
 */
router.post('/timer/pause', (_req: Request, res: Response) => {
  try {
    const state = pauseTimer()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Pause timer error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao pausar timer' },
    })
  }
})

/**
 * POST /api/tools/timer/stop
 * Para o timer (reset completo)
 */
router.post('/timer/stop', (_req: Request, res: Response) => {
  try {
    const state = stopTimer()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Stop timer error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao parar timer' },
    })
  }
})

/**
 * POST /api/tools/timer/reset
 * Reseta o elapsed do timer
 */
router.post('/timer/reset', (_req: Request, res: Response) => {
  try {
    const state = resetTimer()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Reset timer error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao resetar timer' },
    })
  }
})

/**
 * PUT /api/tools/timer
 * Atualiza configuracao do timer (label, direction, targetMs)
 */
router.put('/timer', (req: Request, res: Response) => {
  try {
    const state = updateTimer('default', req.body)
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Update timer error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao atualizar timer' },
    })
  }
})

// ==================== Counter ====================

/**
 * GET /api/tools/counter
 * Retorna estado atual do counter
 */
router.get('/counter', (_req: Request, res: Response) => {
  try {
    const state = getCounter()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Get counter error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar counter' },
    })
  }
})

/**
 * POST /api/tools/counter/increment
 * Incrementa o counter
 */
router.post('/counter/increment', (_req: Request, res: Response) => {
  try {
    const state = incrementCounter()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Increment counter error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao incrementar counter' },
    })
  }
})

/**
 * POST /api/tools/counter/decrement
 * Decrementa o counter
 */
router.post('/counter/decrement', (_req: Request, res: Response) => {
  try {
    const state = decrementCounter()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Decrement counter error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao decrementar counter' },
    })
  }
})

/**
 * POST /api/tools/counter/reset
 * Reseta o counter para 0
 */
router.post('/counter/reset', (_req: Request, res: Response) => {
  try {
    const state = resetCounter()
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Reset counter error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao resetar counter' },
    })
  }
})

/**
 * PUT /api/tools/counter
 * Atualiza configuracao do counter (label, step, min, max, value)
 */
router.put('/counter', (req: Request, res: Response) => {
  try {
    const state = updateCounter('default', req.body)
    res.json({ success: true, data: state })
  } catch (error) {
    console.error('Update counter error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao atualizar counter' },
    })
  }
})

export default router
