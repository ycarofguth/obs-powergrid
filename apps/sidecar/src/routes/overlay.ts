import { Router, type Request, type Response } from 'express'
import { getDevice } from '../services/device-manager.js'
import {
  getOverlayConfig,
  getCombinedOverlayConfig,
  saveOverlayConfig,
  saveCombinedOverlayConfig,
  listOverlayPresets,
  getOverlayPreset,
  createOverlayPreset,
  updateOverlayPreset,
  deleteOverlayPreset,
  createPresetFromConfig,
  applyPresetToConfig,
  COMBINED_OVERLAY_ID,
  type OverlayConfigInput,
  type OverlayPresetInput,
} from '../services/overlay-service.js'
import {
  generateSingleOverlayHTML,
  generateCombinedOverlayHTML,
  generateErrorHTML,
} from '../services/overlay-generator.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { SIDECAR_PORT } from '@obs-tuya/shared'

export const overlayRouter = Router()

// ==================== Rotas publicas (overlay HTML) ====================

/**
 * GET /overlay
 * Overlay combinado (todos os dispositivos habilitados)
 */
overlayRouter.get('/', (_req: Request, res: Response) => {
  try {
    const config = getCombinedOverlayConfig()
    const html = generateCombinedOverlayHTML(config)

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Combined overlay error:', error)
    res.setHeader('Content-Type', 'text/html')
    res.send(generateErrorHTML('Erro ao gerar overlay'))
  }
})

/**
 * GET /overlay/timer
 * Overlay de timer para OBS Browser Source
 */
overlayRouter.get('/timer', (req: Request, res: Response) => {
  try {
    const fontSize = req.query.fontSize ? String(req.query.fontSize) : '48'
    const fontColor = req.query.fontColor ? String(req.query.fontColor) : 'white'
    const fontFamily = req.query.fontFamily ? String(req.query.fontFamily) : 'monospace'

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timer Overlay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      font-family: ${fontFamily}, monospace;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .timer-container {
      text-align: center;
      color: ${fontColor};
    }
    .timer-label {
      font-size: ${Math.round(Number(fontSize) * 0.5)}px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .timer-value {
      font-size: ${fontSize}px;
      font-weight: bold;
      font-variant-numeric: tabular-nums;
    }
    .timer-paused {
      opacity: 0.6;
    }
    .timer-stopped {
      opacity: 0.4;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="timer-container">
      <div class="timer-value">00:00:00</div>
    </div>
  </div>
  <script>
    const POLL_INTERVAL = 500;
    const API_URL = 'http://localhost:${SIDECAR_PORT}/api/tools/timer';

    let timerState = null;

    function padZero(n) {
      return String(Math.floor(n)).padStart(2, '0');
    }

    function formatTime(ms) {
      if (ms < 0) ms = 0;
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return padZero(hours) + ':' + padZero(minutes) + ':' + padZero(seconds);
    }

    function computeDisplayMs(state) {
      let elapsed = state.elapsedMs;
      if (state.status === 'running' && state.startedAt) {
        elapsed = state.elapsedMs + (Date.now() - state.startedAt);
      }
      if (state.direction === 'down' && state.targetMs !== null) {
        return state.targetMs - elapsed;
      }
      return elapsed;
    }

    function render() {
      if (!timerState) return;
      const app = document.getElementById('app');
      const displayMs = computeDisplayMs(timerState);

      const labelHTML = timerState.label
        ? '<div class="timer-label">' + timerState.label + '</div>'
        : '';

      let statusClass = '';
      if (timerState.status === 'paused') statusClass = ' timer-paused';
      if (timerState.status === 'stopped') statusClass = ' timer-stopped';

      app.innerHTML =
        '<div class="timer-container' + statusClass + '">' +
          labelHTML +
          '<div class="timer-value">' + formatTime(displayMs) + '</div>' +
        '</div>';
    }

    async function fetchTimer() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success) {
          timerState = data.data;
        }
      } catch {
        // Sidecar offline, keep last state
      }
    }

    // Render loop: update display every frame for smooth counting
    function renderLoop() {
      render();
      requestAnimationFrame(renderLoop);
    }

    fetchTimer();
    setInterval(fetchTimer, POLL_INTERVAL);
    requestAnimationFrame(renderLoop);
  </script>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Timer overlay error:', error)
    res.setHeader('Content-Type', 'text/html')
    res.send(generateErrorHTML('Erro ao gerar overlay do timer'))
  }
})

/**
 * GET /overlay/counter
 * Overlay de counter para OBS Browser Source
 */
overlayRouter.get('/counter', (req: Request, res: Response) => {
  try {
    const fontSize = req.query.fontSize ? String(req.query.fontSize) : '48'
    const fontColor = req.query.fontColor ? String(req.query.fontColor) : 'white'
    const fontFamily = req.query.fontFamily
      ? String(req.query.fontFamily)
      : 'system-ui, -apple-system, sans-serif'

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter Overlay</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: transparent;
      font-family: ${fontFamily};
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .counter-container {
      text-align: center;
      color: ${fontColor};
    }
    .counter-label {
      font-size: ${Math.round(Number(fontSize) * 0.5)}px;
      opacity: 0.8;
      margin-bottom: 4px;
    }
    .counter-value {
      font-size: ${fontSize}px;
      font-weight: bold;
      font-variant-numeric: tabular-nums;
    }
  </style>
</head>
<body>
  <div id="app">
    <div class="counter-container">
      <div class="counter-value">0</div>
    </div>
  </div>
  <script>
    const POLL_INTERVAL = 500;
    const API_URL = 'http://localhost:${SIDECAR_PORT}/api/tools/counter';

    async function fetchCounter() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data.success) {
          render(data.data);
        }
      } catch {
        // Sidecar offline, keep last state
      }
    }

    function render(state) {
      const app = document.getElementById('app');

      const labelHTML = state.label
        ? '<div class="counter-label">' + state.label + '</div>'
        : '';

      app.innerHTML =
        '<div class="counter-container">' +
          labelHTML +
          '<div class="counter-value">' + state.value + '</div>' +
        '</div>';
    }

    fetchCounter();
    setInterval(fetchCounter, POLL_INTERVAL);
  </script>
</body>
</html>`

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Counter overlay error:', error)
    res.setHeader('Content-Type', 'text/html')
    res.send(generateErrorHTML('Erro ao gerar overlay do counter'))
  }
})

/**
 * GET /overlay/:deviceId
 * Overlay individual para um dispositivo
 */
overlayRouter.get('/:deviceId', (req: Request<{ deviceId: string }>, res: Response) => {
  try {
    const { deviceId } = req.params

    const device = getDevice(deviceId)

    if (!device) {
      res.setHeader('Content-Type', 'text/html')
      res.status(404).send(generateErrorHTML('Dispositivo nao encontrado'))
      return
    }

    if (!device.enabled) {
      res.setHeader('Content-Type', 'text/html')
      res.status(400).send(generateErrorHTML('Dispositivo desabilitado'))
      return
    }

    const config = getOverlayConfig(deviceId)
    const html = generateSingleOverlayHTML(deviceId, config)

    res.setHeader('Content-Type', 'text/html')
    res.send(html)
  } catch (error) {
    console.error('Single overlay error:', error)
    res.setHeader('Content-Type', 'text/html')
    res.send(generateErrorHTML('Erro ao gerar overlay'))
  }
})

// ==================== Rotas protegidas (API de configuracao) ====================

/**
 * GET /overlay/api/config/:deviceId
 * Busca configuracao de overlay de um dispositivo
 */
overlayRouter.get(
  '/api/config/:deviceId',
  requireAuth,
  (req: Request<{ deviceId: string }>, res: Response) => {
    try {
      const { deviceId } = req.params

      // Verifica se e o overlay combinado
      if (deviceId === COMBINED_OVERLAY_ID) {
        const config = getCombinedOverlayConfig()
        res.json({ success: true, data: config })
        return
      }

      const device = getDevice(deviceId)

      if (!device) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
        })
        return
      }

      const config = getOverlayConfig(deviceId)
      res.json({ success: true, data: config })
    } catch (error) {
      console.error('Get overlay config error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar configuracao' },
      })
    }
  }
)

/**
 * PUT /overlay/api/config/:deviceId
 * Atualiza configuracao de overlay de um dispositivo
 */
overlayRouter.put(
  '/api/config/:deviceId',
  requireAuth,
  (req: Request<{ deviceId: string }>, res: Response) => {
    try {
      const { deviceId } = req.params
      const input: OverlayConfigInput = req.body

      // Verifica se e o overlay combinado
      if (deviceId === COMBINED_OVERLAY_ID) {
        const config = saveCombinedOverlayConfig(input)
        res.json({ success: true, data: config })
        return
      }

      const device = getDevice(deviceId)

      if (!device) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
        })
        return
      }

      const config = saveOverlayConfig(deviceId, input)
      res.json({ success: true, data: config })
    } catch (error) {
      console.error('Update overlay config error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao atualizar configuracao' },
      })
    }
  }
)

// ==================== Presets ====================

/**
 * GET /overlay/api/presets
 * Lista todos os presets
 */
overlayRouter.get('/api/presets', requireAuth, (_req: Request, res: Response) => {
  try {
    const presets = listOverlayPresets()
    res.json({ success: true, data: presets })
  } catch (error) {
    console.error('List presets error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao listar presets' },
    })
  }
})

/**
 * POST /overlay/api/presets
 * Cria um novo preset
 */
overlayRouter.post('/api/presets', requireAuth, (req: Request, res: Response) => {
  try {
    const input: OverlayPresetInput = req.body

    if (!input.name || typeof input.name !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Nome do preset e obrigatorio' },
      })
      return
    }

    const preset = createOverlayPreset(input)
    res.status(201).json({ success: true, data: preset })
  } catch (error) {
    console.error('Create preset error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao criar preset' },
    })
  }
})

/**
 * GET /overlay/api/presets/:id
 * Busca um preset por ID
 */
overlayRouter.get(
  '/api/presets/:id',
  requireAuth,
  (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params

      const preset = getOverlayPreset(id)

      if (!preset) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Preset nao encontrado' },
        })
        return
      }

      res.json({ success: true, data: preset })
    } catch (error) {
      console.error('Get preset error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar preset' },
      })
    }
  }
)

/**
 * PUT /overlay/api/presets/:id
 * Atualiza um preset
 */
overlayRouter.put(
  '/api/presets/:id',
  requireAuth,
  (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params
      const input: Partial<OverlayPresetInput> = req.body

      const preset = updateOverlayPreset(id, input)

      if (!preset) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Preset nao encontrado' },
        })
        return
      }

      res.json({ success: true, data: preset })
    } catch (error) {
      console.error('Update preset error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao atualizar preset' },
      })
    }
  }
)

/**
 * DELETE /overlay/api/presets/:id
 * Deleta um preset
 */
overlayRouter.delete(
  '/api/presets/:id',
  requireAuth,
  (req: Request<{ id: string }>, res: Response) => {
    try {
      const { id } = req.params

      const deleted = deleteOverlayPreset(id)

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Preset nao encontrado' },
        })
        return
      }

      res.json({ success: true, data: { message: 'Preset deletado com sucesso' } })
    } catch (error) {
      console.error('Delete preset error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao deletar preset' },
      })
    }
  }
)

/**
 * POST /overlay/api/presets/from-config/:deviceId
 * Cria preset a partir de uma configuracao existente
 */
overlayRouter.post(
  '/api/presets/from-config/:deviceId',
  requireAuth,
  (req: Request<{ deviceId: string }>, res: Response) => {
    try {
      const { deviceId } = req.params
      const { name } = req.body

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'Nome do preset e obrigatorio' },
        })
        return
      }

      let config

      if (deviceId === COMBINED_OVERLAY_ID) {
        config = getCombinedOverlayConfig()
      } else {
        const device = getDevice(deviceId)

        if (!device) {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
          })
          return
        }

        config = getOverlayConfig(deviceId)
      }

      const preset = createPresetFromConfig(name, config)
      res.status(201).json({ success: true, data: preset })
    } catch (error) {
      console.error('Create preset from config error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao criar preset' },
      })
    }
  }
)

/**
 * POST /overlay/api/config/:deviceId/apply-preset/:presetId
 * Aplica preset a uma configuracao
 */
overlayRouter.post(
  '/api/config/:deviceId/apply-preset/:presetId',
  requireAuth,
  (req: Request<{ deviceId: string; presetId: string }>, res: Response) => {
    try {
      const { deviceId, presetId } = req.params

      // Verifica se e o overlay combinado
      if (deviceId === COMBINED_OVERLAY_ID) {
        const preset = getOverlayPreset(presetId)

        if (!preset) {
          res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Preset nao encontrado' },
          })
          return
        }

        const config = saveCombinedOverlayConfig({
          fontSize: preset.fontSize,
          fontColor: preset.fontColor,
          fontFamily: preset.fontFamily,
          textStrokeEnabled: preset.textStrokeEnabled,
          textStrokeColor: preset.textStrokeColor,
          textStrokeWidth: preset.textStrokeWidth,
          textShadowEnabled: preset.textShadowEnabled,
          textShadowColor: preset.textShadowColor,
          textShadowBlur: preset.textShadowBlur,
          textShadowOffsetX: preset.textShadowOffsetX,
          textShadowOffsetY: preset.textShadowOffsetY,
          layout: preset.layout,
          backgroundColor: preset.backgroundColor,
          backgroundOpacity: preset.backgroundOpacity,
          borderRadius: preset.borderRadius,
          padding: preset.padding,
          visibleMetrics: preset.visibleMetrics,
          metricsOrder: preset.metricsOrder,
          showDeviceName: preset.showDeviceName,
        })

        res.json({ success: true, data: config })
        return
      }

      const device = getDevice(deviceId)

      if (!device) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Dispositivo nao encontrado' },
        })
        return
      }

      const config = applyPresetToConfig(deviceId, presetId)

      if (!config) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Preset nao encontrado' },
        })
        return
      }

      res.json({ success: true, data: config })
    } catch (error) {
      console.error('Apply preset error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao aplicar preset' },
      })
    }
  }
)
