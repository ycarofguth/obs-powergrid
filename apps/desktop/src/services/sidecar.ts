import { os, events, window as neuWindow } from '@neutralinojs/lib'
import { SIDECAR_PORT, SIDECAR_URL, API_ENDPOINTS } from '@obs-tuya/shared'
import type { ApiResponse, AppSettings } from '@obs-tuya/shared'
import { setWindowHidden } from './tray'
let sidecarProcessId: number | null = null

export async function startSidecar(): Promise<void> {
  if (sidecarProcessId !== null) {
    console.log('[Sidecar] Já está rodando')
    return
  }

  try {
    const result = await os.spawnProcess('node apps/sidecar/dist/bundle.mjs')
    sidecarProcessId = result.id
    console.log(`[Sidecar] Iniciado com PID: ${sidecarProcessId}`)

    await waitForSidecar()
  } catch (error) {
    console.error('[Sidecar] Erro ao iniciar:', error)
    throw error
  }
}

export async function stopSidecar(): Promise<void> {
  if (sidecarProcessId === null) {
    return
  }

  try {
    await os.updateSpawnedProcess(sidecarProcessId, 'exit')
    sidecarProcessId = null
    console.log('[Sidecar] Encerrado')
  } catch (error) {
    console.error('[Sidecar] Erro ao encerrar:', error)
  }
}

async function waitForSidecar(maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${SIDECAR_PORT}/api/health`)
      if (response.ok) {
        console.log('[Sidecar] Pronto')
        return
      }
    } catch {
      // Sidecar ainda não está pronto
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error('Sidecar não iniciou a tempo')
}

export function setupSidecarLifecycle(): void {
  events.on('windowClose', async () => {
    try {
      // Check if minimize-to-tray is enabled
      const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.SETTINGS}`)
      const data = (await response.json()) as ApiResponse<AppSettings>
      if (data.success && data.data?.minimizeToTray) {
        await neuWindow.hide()
        setWindowHidden()
        return
      }
    } catch {
      // If settings unavailable, proceed with normal close
    }
    await stopSidecar()
  })
}

export function isSidecarRunning(): boolean {
  return sidecarProcessId !== null
}
