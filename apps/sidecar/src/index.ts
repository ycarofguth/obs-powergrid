import { SIDECAR_PORT } from '@obs-tuya/shared'
import { createServer } from './server.js'

const server = createServer()

server.listen(SIDECAR_PORT, '127.0.0.1', () => {
  console.log(`[Sidecar] Rodando em http://localhost:${SIDECAR_PORT}`)
  console.log(`[Sidecar] Overlay disponível em http://localhost:${SIDECAR_PORT}/overlay`)
})
