import { Router } from 'express'
import type { ApiResponse } from '../types/index.js'

export const healthRouter = Router()

healthRouter.get('/', (_req, res) => {
  const response: ApiResponse<{ status: string }> = {
    success: true,
    data: { status: 'ok' },
  }
  res.json(response)
})
