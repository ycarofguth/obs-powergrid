import { Router, type Request, type Response } from 'express'
import { checkForUpdate, getChangelog } from '../services/update-checker.js'

const router = Router()

/**
 * GET /api/system/version
 * Retorna versao atual e verifica atualizacoes (publico)
 */
router.get('/version', async (req: Request, res: Response) => {
  try {
    const forceRefresh = req.query.force === 'true'
    const info = await checkForUpdate(forceRefresh)

    res.json({
      success: true,
      data: info,
    })
  } catch (error) {
    console.error('Version check error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to check version' },
    })
  }
})

/**
 * GET /api/system/changelog
 * Retorna changelog (release notes do GitHub)
 */
router.get('/changelog', async (_req: Request, res: Response) => {
  try {
    const releases = await getChangelog()

    res.json({
      success: true,
      data: releases,
    })
  } catch (error) {
    console.error('Changelog error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch changelog' },
    })
  }
})

export default router
