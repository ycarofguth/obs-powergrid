import express from 'express'
import cors from 'cors'
import { statusRouter } from './routes/status.js'
import { configRouter } from './routes/config.js'
import { healthRouter } from './routes/health.js'
import { overlayRouter } from './routes/overlay.js'
import authRouter from './routes/auth.js'
import devicesRouter from './routes/devices.js'
import cloudRouter from './routes/cloud.js'
import readingsRouter from './routes/readings.js'
import settingsRouter from './routes/settings.js'
import logsRouter from './routes/logs.js'
import dashboardRouter from './routes/dashboard.js'
import systemRouter from './routes/system.js'
import toolsRouter from './routes/tools.js'

export function createServer() {
  const app = express()

  app.use(
    cors({
      origin: [
        'http://localhost:47532', // Neutralino app
        'http://localhost:47533', // Vite dev server
        'http://127.0.0.1:47532',
        'http://127.0.0.1:47533',
      ],
    })
  )
  app.use(express.json())

  // Rotas publicas (nao requerem autenticacao)
  app.use('/api/health', healthRouter)
  app.use('/api/auth', authRouter)

  // Rotas legadas da POC (manter para compatibilidade)
  app.use('/api/config', configRouter)
  app.use('/api/status', statusRouter)
  app.use('/overlay', overlayRouter)

  // Novas rotas (requerem autenticacao - middleware aplicado internamente)
  app.use('/api/devices', devicesRouter)
  app.use('/api/devices', readingsRouter) // Rotas de readings em /api/devices/:id/readings
  app.use('/api/cloud', cloudRouter)
  app.use('/api/settings', settingsRouter)
  app.use('/api/logs', logsRouter)
  app.use('/api/dashboard', dashboardRouter)
  app.use('/api/system', systemRouter)
  app.use('/api/tools', toolsRouter)

  return app
}
