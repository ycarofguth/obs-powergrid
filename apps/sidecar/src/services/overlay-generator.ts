import type { OverlayConfigOutput } from './overlay-service.js'
import { SIDECAR_PORT } from '@obs-tuya/shared'

/**
 * Gera o CSS para o overlay baseado nas configuracoes
 */
function generateCSS(config: OverlayConfigOutput): string {
  const textShadow = config.textShadowEnabled
    ? `${config.textShadowOffsetX}px ${config.textShadowOffsetY}px ${config.textShadowBlur}px ${config.textShadowColor}`
    : 'none'

  const textStroke = config.textStrokeEnabled
    ? `-webkit-text-stroke: ${config.textStrokeWidth}px ${config.textStrokeColor};`
    : ''

  const isVertical = config.layout === 'vertical'

  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: transparent;
      font-family: ${config.fontFamily}, -apple-system, sans-serif;
      overflow: hidden;
    }

    .overlay-container {
      display: inline-flex;
      flex-direction: ${config.combinedLayout === 'stacked' ? 'column' : 'row'};
      gap: 8px;
    }

    .overlay {
      display: inline-flex;
      flex-direction: ${isVertical ? 'column' : 'row'};
      align-items: ${isVertical ? 'flex-start' : 'center'};
      gap: ${isVertical ? '8px' : '16px'};
      background: ${config.backgroundColor};
      padding: ${config.padding}px;
      border-radius: ${config.borderRadius}px;
      color: ${config.fontColor};
      font-size: ${config.fontSize}px;
      text-shadow: ${textShadow};
      ${textStroke}
    }

    .device-name {
      font-size: ${Math.round(config.fontSize * 0.6)}px;
      opacity: 0.8;
      margin-bottom: ${isVertical ? '4px' : '0'};
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: ${Math.round(config.fontSize * 0.4)}px;
      height: ${Math.round(config.fontSize * 0.4)}px;
      border-radius: 50%;
      background: #ef4444;
      flex-shrink: 0;
    }

    .status-dot.on {
      background: #22c55e;
    }

    .status-label {
      font-size: ${Math.round(config.fontSize * 0.5)}px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric {
      text-align: ${isVertical ? 'left' : 'center'};
      display: flex;
      flex-direction: ${isVertical ? 'row' : 'column'};
      align-items: ${isVertical ? 'baseline' : 'center'};
      gap: ${isVertical ? '8px' : '2px'};
    }

    .metric-value {
      font-weight: bold;
      line-height: 1;
    }

    .metric-label {
      font-size: ${Math.round(config.fontSize * 0.4)}px;
      opacity: 0.6;
    }

    .error {
      background: rgba(239, 68, 68, 0.9);
      padding: ${config.padding}px;
      border-radius: ${config.borderRadius}px;
      color: white;
      font-size: ${Math.round(config.fontSize * 0.7)}px;
    }

    .loading {
      background: rgba(107, 114, 128, 0.9);
      padding: ${config.padding}px;
      border-radius: ${config.borderRadius}px;
      color: white;
      font-size: ${Math.round(config.fontSize * 0.7)}px;
    }

    .disconnected {
      opacity: 0.5;
    }
  `
}

/**
 * Gera o JavaScript para o overlay de um dispositivo individual
 */
function generateSingleDeviceScript(deviceId: string, config: OverlayConfigOutput): string {
  const visibleMetrics = JSON.stringify(config.visibleMetrics)
  const metricsOrder = JSON.stringify(config.metricsOrder)
  const showName = config.showDeviceName

  return `
    const POLL_INTERVAL = 2000;
    const DEVICE_ID = '${deviceId}';
    const API_URL = 'http://localhost:${SIDECAR_PORT}/api/devices/' + DEVICE_ID + '/status';
    const VISIBLE_METRICS = ${visibleMetrics};
    const METRICS_ORDER = ${metricsOrder};
    const SHOW_NAME = ${showName};

    function formatValue(metric, value) {
      switch (metric) {
        case 'power':
          if (value >= 1000) return (value / 1000).toFixed(1) + 'kW';
          return value.toFixed(1) + 'W';
        case 'voltage':
          return Math.round(value) + 'V';
        case 'current':
          if (value < 1000) return Math.round(value) + 'mA';
          return (value / 1000).toFixed(2) + 'A';
        default:
          return value;
      }
    }

    function getMetricLabel(metric) {
      const labels = {
        power: 'Potencia',
        voltage: 'Tensão',
        current: 'Corrente'
      };
      return labels[metric] || metric;
    }

    function render(status) {
      const app = document.getElementById('app');

      let metricsHTML = '';
      for (const metric of METRICS_ORDER) {
        if (!VISIBLE_METRICS.includes(metric)) continue;
        const value = status[metric];
        if (value === undefined) continue;

        metricsHTML += \`
          <div class="metric">
            <div class="metric-value">\${formatValue(metric, value)}</div>
            <div class="metric-label">\${getMetricLabel(metric)}</div>
          </div>
        \`;
      }

      const nameHTML = SHOW_NAME && status.deviceName
        ? \`<div class="device-name">\${status.deviceName}</div>\`
        : '';

      app.innerHTML = \`
        <div class="overlay">
          \${nameHTML}
          <div class="status-indicator">
            <div class="status-dot \${status.switch ? 'on' : ''}"></div>
            <span class="status-label">\${status.switch ? 'ON' : 'OFF'}</span>
          </div>
          \${metricsHTML}
        </div>
      \`;
    }

    function renderError(message) {
      const app = document.getElementById('app');
      app.innerHTML = \`<div class="error">\${message}</div>\`;
    }

    function renderLoading() {
      const app = document.getElementById('app');
      app.innerHTML = '<div class="loading">Conectando...</div>';
    }

    async function fetchStatus() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success) {
          render(data.data);
        } else {
          renderError(data.error?.message || 'Desconectado');
        }
      } catch {
        renderError('Sidecar offline');
      }
    }

    renderLoading();
    fetchStatus();
    setInterval(fetchStatus, POLL_INTERVAL);
  `
}

/**
 * Gera o JavaScript para o overlay combinado (todos os dispositivos)
 */
function generateCombinedScript(config: OverlayConfigOutput): string {
  const visibleMetrics = JSON.stringify(config.visibleMetrics)
  const metricsOrder = JSON.stringify(config.metricsOrder)
  const showName = config.showDeviceName

  return `
    const POLL_INTERVAL = 2000;
    const API_URL = 'http://localhost:${SIDECAR_PORT}/api/devices';
    const VISIBLE_METRICS = ${visibleMetrics};
    const METRICS_ORDER = ${metricsOrder};
    const SHOW_NAME = ${showName};

    let devices = [];

    function formatValue(metric, value) {
      switch (metric) {
        case 'power':
          if (value >= 1000) return (value / 1000).toFixed(1) + 'kW';
          return value.toFixed(1) + 'W';
        case 'voltage':
          return Math.round(value) + 'V';
        case 'current':
          if (value < 1000) return Math.round(value) + 'mA';
          return (value / 1000).toFixed(2) + 'A';
        default:
          return value;
      }
    }

    function getMetricLabel(metric) {
      const labels = {
        power: 'Potencia',
        voltage: 'Tensão',
        current: 'Corrente'
      };
      return labels[metric] || metric;
    }

    function renderDevice(device, status) {
      let metricsHTML = '';

      if (status) {
        for (const metric of METRICS_ORDER) {
          if (!VISIBLE_METRICS.includes(metric)) continue;
          const value = status[metric];
          if (value === undefined) continue;

          metricsHTML += \`
            <div class="metric">
              <div class="metric-value">\${formatValue(metric, value)}</div>
              <div class="metric-label">\${getMetricLabel(metric)}</div>
            </div>
          \`;
        }
      }

      const nameHTML = SHOW_NAME
        ? \`<div class="device-name">\${device.name}</div>\`
        : '';

      const isConnected = device.isConnected && status;
      const switchOn = status?.switch ?? false;

      return \`
        <div class="overlay \${!isConnected ? 'disconnected' : ''}">
          \${nameHTML}
          <div class="status-indicator">
            <div class="status-dot \${switchOn ? 'on' : ''}"></div>
            <span class="status-label">\${isConnected ? (switchOn ? 'ON' : 'OFF') : 'OFF'}</span>
          </div>
          \${isConnected ? metricsHTML : '<div class="metric"><span class="metric-label">Desconectado</span></div>'}
        </div>
      \`;
    }

    async function fetchDeviceStatus(deviceId) {
      try {
        const response = await fetch('http://localhost:${SIDECAR_PORT}/api/devices/' + deviceId + '/status');
        const data = await response.json();
        return data.success ? data.data : null;
      } catch {
        return null;
      }
    }

    async function render() {
      const app = document.getElementById('app');

      if (devices.length === 0) {
        app.innerHTML = '<div class="loading">Nenhum dispositivo</div>';
        return;
      }

      let html = '<div class="overlay-container">';

      for (const device of devices) {
        if (!device.enabled) continue;

        let status = null;
        if (device.isConnected) {
          status = await fetchDeviceStatus(device.id);
        }

        html += renderDevice(device, status);
      }

      html += '</div>';
      app.innerHTML = html;
    }

    async function fetchDevices() {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success) {
          devices = data.data.filter(d => d.enabled);
          await render();
        }
      } catch {
        const app = document.getElementById('app');
        app.innerHTML = '<div class="error">Sidecar offline</div>';
      }
    }

    document.getElementById('app').innerHTML = '<div class="loading">Carregando...</div>';
    fetchDevices();
    setInterval(fetchDevices, POLL_INTERVAL);
  `
}

/**
 * Gera HTML completo do overlay para um dispositivo
 */
export function generateSingleOverlayHTML(deviceId: string, config: OverlayConfigOutput): string {
  const css = generateCSS(config)
  const script = generateSingleDeviceScript(deviceId, config)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tuya Overlay</title>
  <style>${css}</style>
</head>
<body>
  <div id="app">
    <div class="loading">Conectando...</div>
  </div>
  <script>${script}</script>
</body>
</html>`
}

/**
 * Gera HTML completo do overlay combinado (todos os dispositivos)
 */
export function generateCombinedOverlayHTML(config: OverlayConfigOutput): string {
  const css = generateCSS(config)
  const script = generateCombinedScript(config)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tuya Overlay - Todos</title>
  <style>${css}</style>
</head>
<body>
  <div id="app">
    <div class="loading">Carregando...</div>
  </div>
  <script>${script}</script>
</body>
</html>`
}

/**
 * Gera HTML de erro quando dispositivo nao existe ou esta desabilitado
 */
export function generateErrorHTML(message: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tuya Overlay - Erro</title>
  <style>
    body {
      background: transparent;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .error {
      background: rgba(239, 68, 68, 0.9);
      padding: 16px 24px;
      border-radius: 8px;
      color: white;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="error">${message}</div>
</body>
</html>`
}
