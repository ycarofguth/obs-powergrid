import type { Request, Response, NextFunction } from 'express'
import { isUnlocked } from '../services/session.js'

/**
 * Middleware que requer autenticacao para acessar a rota
 * Retorna 401 se o app estiver bloqueado
 */
export function requireAuth(_req: Request, res: Response, next: NextFunction): void {
  if (!isUnlocked()) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'App is locked. Please login first.',
      },
    })
    return
  }
  next()
}
