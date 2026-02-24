import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { getSettings, updateSettings, type AppSettingsInput } from '../services/settings-service.js'

const router = Router()

router.use(requireAuth)

/**
 * GET /api/settings
 * Retorna todas as configuracoes
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const settings = getSettings()
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar configuracoes' },
    })
  }
})

/**
 * PUT /api/settings
 * Atualiza configuracoes
 */
router.put('/', (req: Request, res: Response) => {
  try {
    const input: AppSettingsInput = req.body

    // Validacoes
    if (input.kwhPrice !== undefined && (isNaN(input.kwhPrice) || input.kwhPrice < 0)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Preco do kWh deve ser um numero positivo' },
      })
      return
    }

    if (input.dataRetentionDays !== undefined) {
      if (
        isNaN(input.dataRetentionDays) ||
        input.dataRetentionDays < 1 ||
        input.dataRetentionDays > 365
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Retencao de dados deve ser entre 1 e 365 dias',
          },
        })
        return
      }
    }

    if (input.logRetentionDays !== undefined) {
      if (
        isNaN(input.logRetentionDays) ||
        input.logRetentionDays < 1 ||
        input.logRetentionDays > 365
      ) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Retencao de logs deve ser entre 1 e 365 dias' },
        })
        return
      }
    }

    if (input.pollingIntervalSeconds !== undefined) {
      if (
        isNaN(input.pollingIntervalSeconds) ||
        input.pollingIntervalSeconds < 1 ||
        input.pollingIntervalSeconds > 60
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Intervalo de polling deve ser entre 1 e 60 segundos',
          },
        })
        return
      }
    }

    if (input.theme !== undefined && !['light', 'dark', 'system'].includes(input.theme)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Tema deve ser light, dark ou system' },
      })
      return
    }

    const settings = updateSettings(input)
    res.json({ success: true, data: settings })
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao atualizar configuracoes' },
    })
  }
})

export default router
