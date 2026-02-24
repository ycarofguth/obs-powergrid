import { SIDECAR_URL, API_ENDPOINTS } from '@obs-tuya/shared'
import type {
  DeviceConfig,
  DeviceStatus,
  ApiResponse,
  AuthStatus,
  DeviceWithStatus,
  CreateDeviceInput,
  UpdateDeviceInput,
  ConnectionStatus,
  DeviceStatusResponse,
  Reading,
  OverlayConfigInput,
  OverlayConfigOutput,
  OverlayPresetInput,
  OverlayPresetOutput,
  AppSettings,
  AppSettingsInput,
  LogEntry,
  LogFilters,
  LogType,
  DashboardSummary,
  DashboardDeviceCard,
  DeviceStats,
  ReadingAggregation,
  HourlyCost,
  ComparisonChartData,
  ComparisonRankings,
  TimerState,
  TimerConfigInput,
  CounterState,
  CounterConfigInput,
} from '@obs-tuya/shared'

export type {
  DeviceConfig,
  DeviceStatus,
  ApiResponse,
  AuthStatus,
  DeviceWithStatus,
  CreateDeviceInput,
  UpdateDeviceInput,
  ConnectionStatus,
  DeviceStatusResponse,
  Reading,
  OverlayConfigInput,
  OverlayConfigOutput,
  OverlayPresetInput,
  OverlayPresetOutput,
  AppSettings,
  AppSettingsInput,
  LogEntry,
  LogFilters,
  LogType,
  DashboardSummary,
  DashboardDeviceCard,
  DeviceStats,
  ReadingAggregation,
  HourlyCost,
  ComparisonChartData,
  ComparisonRankings,
  TimerState,
  TimerConfigInput,
  CounterState,
  CounterConfigInput,
}

// ==================== Auth Event Listener ====================

// Evento customizado para quando o app está bloqueado
export const AUTH_LOCKED_EVENT = 'app:locked'

// Dispara evento quando recebe 401
function handleUnauthorized() {
  window.dispatchEvent(new CustomEvent(AUTH_LOCKED_EVENT))
}

// Wrapper para fetch que detecta 401 e dispara evento
async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options)

  // Se receber 401, dispara evento de bloqueio
  if (response.status === 401) {
    // Clona a response para poder ler o body
    const cloned = response.clone()
    try {
      const data = await cloned.json()
      if (data.error?.code === 'UNAUTHORIZED') {
        handleUnauthorized()
      }
    } catch {
      // Se não conseguir parsear, assume que é 401 genérico
      handleUnauthorized()
    }
  }

  return response
}

// ==================== Auth ====================

export async function getAuthStatus(): Promise<ApiResponse<AuthStatus>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_STATUS}`)
  return response.json()
}

export async function setup(password: string): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_SETUP}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return response.json()
}

export async function login(password: string): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return response.json()
}

export async function logout(): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_LOGOUT}`, {
    method: 'POST',
  })
  return response.json()
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_CHANGE_PASSWORD}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  return response.json()
}

export async function resetApp(confirmation: string): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_RESET}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmation }),
  })
  return response.json()
}

export async function completeOnboarding(): Promise<ApiResponse<{ message: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.AUTH_ONBOARDING_COMPLETE}`, {
    method: 'POST',
  })
  return response.json()
}

// ==================== Devices ====================

export async function listDevices(): Promise<ApiResponse<DeviceWithStatus[]>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICES}`)
  return response.json()
}

export async function createDevice(
  input: CreateDeviceInput
): Promise<ApiResponse<DeviceWithStatus>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICES}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function getDevice(id: string): Promise<ApiResponse<DeviceWithStatus>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE(id)}`)
  return response.json()
}

export async function updateDevice(
  id: string,
  input: UpdateDeviceInput
): Promise<ApiResponse<DeviceWithStatus>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function deleteDevice(id: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE(id)}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function toggleDeviceEnabled(
  id: string,
  enabled: boolean
): Promise<ApiResponse<DeviceWithStatus>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_ENABLED(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  })
  return response.json()
}

export async function connectDevice(id: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_CONNECT(id)}`, {
    method: 'POST',
  })
  return response.json()
}

export async function disconnectDevice(id: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_DISCONNECT(id)}`, {
    method: 'POST',
  })
  return response.json()
}

export async function getDeviceStatus(id: string): Promise<ApiResponse<DeviceStatusResponse>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_STATUS(id)}`)
  return response.json()
}

export async function changeDeviceMode(
  id: string,
  mode: 'local' | 'cloud'
): Promise<ApiResponse<DeviceWithStatus>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_MODE(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
  return response.json()
}

export async function retryDeviceConnection(
  id: string
): Promise<ApiResponse<{ message: string; connectionStatus: ConnectionStatus }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_RETRY(id)}`, {
    method: 'POST',
  })
  return response.json()
}

export async function getDeviceConnectionStatus(
  id: string
): Promise<ApiResponse<ConnectionStatus & { mode: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_CONNECTION_STATUS(id)}`)
  return response.json()
}

// ==================== Readings ====================

export async function getDeviceReadings(
  id: string,
  options?: { startDate?: string; endDate?: string; limit?: number }
): Promise<ApiResponse<Reading[]>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)
  if (options?.limit) params.set('limit', String(options.limit))

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DEVICE_READINGS(id)}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

export async function getLastDeviceReading(id: string): Promise<ApiResponse<Reading | null>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DEVICE_READINGS(id)}/last`)
  return response.json()
}

// ==================== Cloud ====================

export async function getCloudStatus(): Promise<ApiResponse<{ isConfigured: boolean }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_STATUS}`)
  return response.json()
}

export async function getCloudCredentials(): Promise<ApiResponse<unknown>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_CREDENTIALS}`)
  return response.json()
}

export async function saveCloudCredentials(
  accessId: string,
  accessSecret: string,
  region?: string
): Promise<ApiResponse<{ message: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_CREDENTIALS}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessId, accessSecret, region }),
  })
  return response.json()
}

export async function testCloudConnection(): Promise<ApiResponse<{ isValid: boolean }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_TEST}`, {
    method: 'POST',
  })
  return response.json()
}

export async function deleteCloudCredentials(): Promise<ApiResponse<{ message: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_CREDENTIALS}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function getCloudDevices(): Promise<ApiResponse<unknown[]>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.CLOUD_DEVICES}`)
  return response.json()
}

export async function refreshDeviceFromCloud(
  tuyaDeviceId: string
): Promise<ApiResponse<{ message: string; device: DeviceWithStatus }>> {
  const response = await apiFetch(
    `${SIDECAR_URL}${API_ENDPOINTS.CLOUD_DEVICE_REFRESH(tuyaDeviceId)}`,
    {
      method: 'POST',
    }
  )
  return response.json()
}

// ==================== Legacy (POC) ====================

export async function getHealth(): Promise<ApiResponse<{ status: string }>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.HEALTH}`)
  return response.json()
}

export async function getConfig(): Promise<ApiResponse<DeviceConfig>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CONFIG}`)
  return response.json()
}

export async function saveConfig(config: DeviceConfig): Promise<ApiResponse<DeviceConfig>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CONFIG}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return response.json()
}

export async function connect(): Promise<ApiResponse> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CONFIG}/connect`, {
    method: 'POST',
  })
  return response.json()
}

export async function disconnect(): Promise<ApiResponse> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.CONFIG}/disconnect`, {
    method: 'POST',
  })
  return response.json()
}

export async function getStatus(): Promise<ApiResponse<DeviceStatus>> {
  const response = await fetch(`${SIDECAR_URL}${API_ENDPOINTS.STATUS}`)
  return response.json()
}

export const OVERLAY_URL = `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY}`

// ==================== Overlay ====================

export function getOverlayUrl(deviceId?: string): string {
  if (deviceId) {
    return `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_DEVICE(deviceId)}`
  }
  return `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY}`
}

export async function getOverlayConfig(
  deviceId: string
): Promise<ApiResponse<OverlayConfigOutput>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_CONFIG(deviceId)}`)
  return response.json()
}

export async function updateOverlayConfig(
  deviceId: string,
  config: OverlayConfigInput
): Promise<ApiResponse<OverlayConfigOutput>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_CONFIG(deviceId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return response.json()
}

export async function listOverlayPresets(): Promise<ApiResponse<OverlayPresetOutput[]>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_PRESETS}`)
  return response.json()
}

export async function createOverlayPreset(
  input: OverlayPresetInput
): Promise<ApiResponse<OverlayPresetOutput>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_PRESETS}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function getOverlayPreset(id: string): Promise<ApiResponse<OverlayPresetOutput>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_PRESET(id)}`)
  return response.json()
}

export async function updateOverlayPreset(
  id: string,
  input: Partial<OverlayPresetInput>
): Promise<ApiResponse<OverlayPresetOutput>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_PRESET(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

export async function deleteOverlayPreset(id: string): Promise<ApiResponse<{ message: string }>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_PRESET(id)}`, {
    method: 'DELETE',
  })
  return response.json()
}

export async function createPresetFromConfig(
  deviceId: string,
  name: string
): Promise<ApiResponse<OverlayPresetOutput>> {
  const response = await apiFetch(
    `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_PRESET_FROM_CONFIG(deviceId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }
  )
  return response.json()
}

export async function applyPresetToConfig(
  deviceId: string,
  presetId: string
): Promise<ApiResponse<OverlayConfigOutput>> {
  const response = await apiFetch(
    `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_APPLY_PRESET(deviceId, presetId)}`,
    {
      method: 'POST',
    }
  )
  return response.json()
}

// ==================== Settings ====================

export async function getSettings(): Promise<ApiResponse<AppSettings>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.SETTINGS}`)
  return response.json()
}

export async function updateSettings(input: AppSettingsInput): Promise<ApiResponse<AppSettings>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.SETTINGS}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return response.json()
}

// ==================== Logs ====================

export async function getLogs(filters?: {
  types?: string[]
  deviceId?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}): Promise<ApiResponse<{ logs: LogEntry[]; total: number; limit: number; offset: number }>> {
  const params = new URLSearchParams()
  if (filters?.types?.length) params.set('types', filters.types.join(','))
  if (filters?.deviceId) params.set('deviceId', filters.deviceId)
  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.offset) params.set('offset', String(filters.offset))

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.LOGS}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

export async function getLogTypes(): Promise<ApiResponse<string[]>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.LOGS_TYPES}`)
  return response.json()
}

export async function cleanupLogs(
  daysToKeep?: number
): Promise<ApiResponse<{ deletedCount: number; message: string }>> {
  const url = daysToKeep
    ? `${SIDECAR_URL}${API_ENDPOINTS.LOGS_CLEANUP}?daysToKeep=${daysToKeep}`
    : `${SIDECAR_URL}${API_ENDPOINTS.LOGS_CLEANUP}`
  const response = await apiFetch(url, { method: 'DELETE' })
  return response.json()
}

export function getLogsExportUrl(filters?: {
  types?: string[]
  deviceId?: string
  startDate?: string
  endDate?: string
}): string {
  const params = new URLSearchParams()
  if (filters?.types?.length) params.set('types', filters.types.join(','))
  if (filters?.deviceId) params.set('deviceId', filters.deviceId)
  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)

  const queryString = params.toString()
  return `${SIDECAR_URL}${API_ENDPOINTS.LOGS_EXPORT}${queryString ? `?${queryString}` : ''}`
}

// ==================== Dashboard ====================

export async function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD}`)
  return response.json()
}

export async function getDeviceDashboard(
  id: string,
  options?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<unknown>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD_DEVICE(id)}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

export async function getDeviceStats(
  id: string,
  options?: { period?: string; startDate?: string; endDate?: string }
): Promise<ApiResponse<DeviceStats>> {
  const params = new URLSearchParams()
  if (options?.period) params.set('period', options.period)
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD_DEVICE_STATS(id)}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

export async function getDeviceChartData(
  id: string,
  options?: { startDate?: string; endDate?: string; interval?: number }
): Promise<ApiResponse<ReadingAggregation[]>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)
  if (options?.interval) params.set('interval', String(options.interval))

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD_DEVICE_CHART(id)}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

export async function getDeviceCosts(
  id: string,
  options?: { startDate?: string; endDate?: string }
): Promise<ApiResponse<HourlyCost[]>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD_DEVICE_COSTS(id)}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

// ==================== Dashboard Comparison ====================

export async function getComparisonChartData(options?: {
  startDate?: string
  endDate?: string
  interval?: number
  deviceIds?: string[]
}): Promise<ApiResponse<ComparisonChartData>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)
  if (options?.interval) params.set('interval', String(options.interval))
  if (options?.deviceIds?.length) params.set('deviceIds', options.deviceIds.join(','))

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD_COMPARE_CHART}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

export async function getComparisonRankings(options?: {
  startDate?: string
  endDate?: string
  deviceIds?: string[]
}): Promise<ApiResponse<ComparisonRankings>> {
  const params = new URLSearchParams()
  if (options?.startDate) params.set('startDate', options.startDate)
  if (options?.endDate) params.set('endDate', options.endDate)
  if (options?.deviceIds?.length) params.set('deviceIds', options.deviceIds.join(','))

  const queryString = params.toString()
  const url = `${SIDECAR_URL}${API_ENDPOINTS.DASHBOARD_COMPARE_RANKING}${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url)
  return response.json()
}

// ==================== Tools - Timer ====================

export async function getTimerState(): Promise<ApiResponse<TimerState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_TIMER}`)
  return response.json()
}

export async function startTimer(): Promise<ApiResponse<TimerState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_TIMER_START}`, {
    method: 'POST',
  })
  return response.json()
}

export async function pauseTimer(): Promise<ApiResponse<TimerState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_TIMER_PAUSE}`, {
    method: 'POST',
  })
  return response.json()
}

export async function stopTimer(): Promise<ApiResponse<TimerState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_TIMER_STOP}`, {
    method: 'POST',
  })
  return response.json()
}

export async function resetTimer(): Promise<ApiResponse<TimerState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_TIMER_RESET}`, {
    method: 'POST',
  })
  return response.json()
}

export async function updateTimerConfig(
  config: TimerConfigInput
): Promise<ApiResponse<TimerState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_TIMER}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return response.json()
}

// ==================== Tools - Counter ====================

export async function getCounterState(): Promise<ApiResponse<CounterState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_COUNTER}`)
  return response.json()
}

export async function incrementCounter(): Promise<ApiResponse<CounterState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_COUNTER_INCREMENT}`, {
    method: 'POST',
  })
  return response.json()
}

export async function decrementCounter(): Promise<ApiResponse<CounterState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_COUNTER_DECREMENT}`, {
    method: 'POST',
  })
  return response.json()
}

export async function resetCounter(): Promise<ApiResponse<CounterState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_COUNTER_RESET}`, {
    method: 'POST',
  })
  return response.json()
}

export async function updateCounterConfig(
  config: CounterConfigInput
): Promise<ApiResponse<CounterState>> {
  const response = await apiFetch(`${SIDECAR_URL}${API_ENDPOINTS.TOOLS_COUNTER}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return response.json()
}

// ==================== Tools - Overlay URLs ====================

export function getTimerOverlayUrl(): string {
  return `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_TIMER}`
}

export function getCounterOverlayUrl(): string {
  return `${SIDECAR_URL}${API_ENDPOINTS.OVERLAY_COUNTER}`
}

// ==================== System ====================

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  releaseUrl: string | null
  releaseNotes: string | null
  releaseName: string | null
  publishedAt: string | null
  lastChecked: string | null
}

export interface ChangelogEntry {
  version: string
  name: string
  body: string
  date: string
  url: string
}

export async function checkForUpdate(force = false): Promise<ApiResponse<UpdateInfo>> {
  const url = `${SIDECAR_URL}/api/system/version${force ? '?force=true' : ''}`
  const response = await apiFetch(url)
  return response.json()
}

export async function getChangelog(): Promise<ApiResponse<ChangelogEntry[]>> {
  const response = await apiFetch(`${SIDECAR_URL}/api/system/changelog`)
  return response.json()
}
