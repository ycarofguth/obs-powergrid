// Types

/** Configuracao legada de dispositivo (POC) - manter para compatibilidade */
export interface DeviceConfig {
  deviceId: string
  localKey: string
  ipAddress: string
}

/** Status atual de um dispositivo */
export interface DeviceStatus {
  switch: boolean
  power: number
  voltage: number
  current: number
  electricity?: number
}

/** Mapeamento de DP ID numerico → campo e conversao */
export interface DpsMappingEntry {
  field: 'switch' | 'power' | 'voltage' | 'current' | 'electricity'
  type: 'boolean' | 'number' | 'raw'
  scale: number // 0=raw, 1=÷10, 2=÷100, 3=÷1000
  code: string // Codigo Tuya original (ex: 'cur_power', 'cur_voltage_a')
}

/** Mapeamento DPS completo: dpId → entrada */
export type DpsMapping = Record<string, DpsMappingEntry>

/** Resposta padrao da API */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}

/** Status de autenticacao do app */
export interface AuthStatus {
  /** Se o app ja foi configurado (banco existe) */
  isSetUp: boolean
  /** Se o app esta desbloqueado (usuario logado) */
  isUnlocked: boolean
  /** Se o onboarding foi concluido (todos os passos do setup) */
  isOnboardingComplete: boolean
}

/** Dispositivo completo */
export interface Device {
  id: string
  name: string
  deviceId: string
  localKey: string
  ipAddress: string | null
  protocolVersion: string
  communicationMode: 'local' | 'cloud'
  category: string | null
  dpsMapping: DpsMapping | null
  enabled: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/** Dispositivo com status de conexao */
export interface DeviceWithStatus extends Device {
  isConnected: boolean
}

/** Input para criar dispositivo */
export interface CreateDeviceInput {
  name: string
  deviceId: string
  localKey?: string
  ipAddress?: string
  protocolVersion?: string
  communicationMode?: 'local' | 'cloud'
  category?: string
  dpsMapping?: DpsMapping
}

/** Input para atualizar dispositivo */
export interface UpdateDeviceInput {
  name?: string
  deviceId?: string
  localKey?: string
  ipAddress?: string
  protocolVersion?: string
  communicationMode?: 'local' | 'cloud'
  category?: string
  dpsMapping?: DpsMapping
}

/** Input para setup inicial */
export interface SetupInput {
  password: string
}

/** Input para login */
export interface LoginInput {
  password: string
}

/** Input para alterar senha */
export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/** Input para reset */
export interface ResetInput {
  confirmation: string
}

/** Leitura de energia */
export interface Reading {
  id: number
  deviceId: string
  timestamp: Date
  power: number | null
  voltage: number | null
  current: number | null
  switchState: boolean | null
}

/** Log de atividade */
export interface Log {
  id: number
  timestamp: Date
  type: string
  message: string
  deviceId: string | null
  metadata: Record<string, unknown> | null
}

// Cloud Integration Types

/** Input para salvar credenciais Cloud */
export interface CloudCredentialsInput {
  accessId: string
  accessSecret: string
  region?: string
}

/** Credenciais Cloud mascaradas para exibicao */
export interface CloudCredentialsMasked {
  accessId: string // Mascarado: abc1****xyz9
  accessSecret: string // Mascarado
  region: string
  updatedAt: Date
}

/** Status da configuracao Cloud */
export interface CloudStatus {
  isConfigured: boolean
}

/** Dispositivo da Tuya Cloud */
export interface CloudDevice {
  id: string
  name: string
  localKey: string
  category: string
  productId: string
  productName: string
  isOnline: boolean
  protocolVersion: string
  ip?: string
}

/** Resultado do teste de conexao Cloud */
export interface CloudTestResult {
  isValid: boolean
}

// Constants

export const SIDECAR_PORT = 47531
export const NEUTRALINO_PORT = 47532
export const VITE_DEV_PORT = 47533

export const SIDECAR_URL = `http://localhost:${SIDECAR_PORT}`

/** Status detalhado da conexao */
export interface ConnectionStatus {
  isConnected: boolean
  connectionAttempts: number
  maxAttempts: number
  lastError: string | null
  lastConnected: Date | null
  isReconnecting: boolean
}

/** Status completo do dispositivo com conexao */
export interface DeviceStatusResponse extends DeviceStatus {
  deviceId: string
  deviceName: string
  isConnected: boolean
  mode: 'local' | 'cloud'
  connectionStatus?: ConnectionStatus
  lastUpdate?: Date
}

// Overlay Types

/** ID especial para configuracao do overlay combinado */
export const COMBINED_OVERLAY_ID = 'combined'

/** Input para configuracao de overlay */
export interface OverlayConfigInput {
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  textStrokeEnabled?: boolean
  textStrokeColor?: string
  textStrokeWidth?: number
  textShadowEnabled?: boolean
  textShadowColor?: string
  textShadowBlur?: number
  textShadowOffsetX?: number
  textShadowOffsetY?: number
  layout?: 'horizontal' | 'vertical'
  backgroundColor?: string
  backgroundOpacity?: number
  borderRadius?: number
  padding?: number
  visibleMetrics?: string[]
  metricsOrder?: string[]
  showDeviceName?: boolean
  combinedLayout?: 'stacked' | 'side-by-side'
}

/** Configuracao de overlay completa */
export interface OverlayConfigOutput {
  id: string
  deviceId: string | null
  fontSize: number
  fontColor: string
  fontFamily: string
  textStrokeEnabled: boolean
  textStrokeColor: string
  textStrokeWidth: number
  textShadowEnabled: boolean
  textShadowColor: string
  textShadowBlur: number
  textShadowOffsetX: number
  textShadowOffsetY: number
  layout: 'horizontal' | 'vertical'
  backgroundColor: string
  backgroundOpacity: number
  borderRadius: number
  padding: number
  visibleMetrics: string[]
  metricsOrder: string[]
  showDeviceName: boolean
  combinedLayout: 'stacked' | 'side-by-side'
  createdAt: Date
  updatedAt: Date
}

/** Input para criar/atualizar preset */
export interface OverlayPresetInput {
  name: string
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  textStrokeEnabled?: boolean
  textStrokeColor?: string
  textStrokeWidth?: number
  textShadowEnabled?: boolean
  textShadowColor?: string
  textShadowBlur?: number
  textShadowOffsetX?: number
  textShadowOffsetY?: number
  layout?: 'horizontal' | 'vertical'
  backgroundColor?: string
  backgroundOpacity?: number
  borderRadius?: number
  padding?: number
  visibleMetrics?: string[]
  metricsOrder?: string[]
  showDeviceName?: boolean
}

/** Preset de overlay completo */
export interface OverlayPresetOutput {
  id: string
  name: string
  fontSize: number
  fontColor: string
  fontFamily: string
  textStrokeEnabled: boolean
  textStrokeColor: string
  textStrokeWidth: number
  textShadowEnabled: boolean
  textShadowColor: string
  textShadowBlur: number
  textShadowOffsetX: number
  textShadowOffsetY: number
  layout: 'horizontal' | 'vertical'
  backgroundColor: string
  backgroundOpacity: number
  borderRadius: number
  padding: number
  visibleMetrics: string[]
  metricsOrder: string[]
  showDeviceName: boolean
  createdAt: Date
  updatedAt: Date
}

// Settings Types (M5)

/** Configuracoes do app */
export interface AppSettings {
  kwhPrice: number
  currency: string
  dataRetentionDays: number
  logRetentionDays: number
  pollingIntervalSeconds: number
  minimizeToTray: boolean
  theme: 'light' | 'dark' | 'system'
}

/** Input para atualizar configuracoes */
export interface AppSettingsInput {
  kwhPrice?: number
  currency?: string
  dataRetentionDays?: number
  logRetentionDays?: number
  pollingIntervalSeconds?: number
  minimizeToTray?: boolean
  theme?: 'light' | 'dark' | 'system'
}

// Log Types (M5)

export const LOG_TYPES = {
  SYSTEM: 'system',
  CONNECTION: 'connection',
  CONFIG: 'config',
  ERROR: 'error',
  USER: 'user',
} as const

export type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES]

/** Log de atividade */
export interface LogEntry {
  id: number
  timestamp: Date
  type: string
  message: string
  deviceId: string | null
  metadata: Record<string, unknown> | null
}

/** Filtros para busca de logs */
export interface LogFilters {
  types?: LogType[]
  deviceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

// Dashboard Types (M5)

/** Card de dispositivo no dashboard */
export interface DashboardDeviceCard {
  id: string
  name: string
  enabled: boolean
  isConnected: boolean
  mode: 'local' | 'cloud'
  status: {
    switch: boolean
    power: number
    voltage: number
    current: number
  } | null
  sessionStartTime: Date | null
  sessionCost: number
}

/** Resumo do dashboard unificado */
export interface DashboardSummary {
  totalDevices: number
  enabledDevices: number
  connectedDevices: number
  totalPowerWatts: number
  averagePowerWatts: number
  sessionCost: number
  currency: string
  devices: DashboardDeviceCard[]
}

/** Estatisticas de um dispositivo */
export interface DeviceStats {
  period: string
  startDate: Date
  endDate: Date
  readingsCount: number
  avgPower: number
  maxPower: number
  minPower: number
  totalKwh: number
  avgVoltage: number
  avgCurrent: number
}

/** Resumo de custos */
export interface CostSummary {
  totalCost: number
  currency: string
  kwhPrice: number
  totalKwh: number
}

/** Dado agregado para graficos */
export interface ReadingAggregation {
  timestamp: Date
  avgPower: number
  avgVoltage: number
  avgCurrent: number
  count: number
}

/** Custo por hora */
export interface HourlyCost {
  hour: Date
  cost: number
  kwh: number
}

// Comparison Dashboard Types

/** Device data for comparison chart */
export interface ComparisonChartDevice {
  deviceId: string
  deviceName: string
  color: string
  readings: ReadingAggregation[]
}

/** Multi-device comparison chart data */
export interface ComparisonChartData {
  devices: ComparisonChartDevice[]
}

/** Device ranking entry */
export interface DeviceRanking {
  deviceId: string
  deviceName: string
  value: number
  percentage: number
  rank: number
}

/** Rankings across metrics */
export interface ComparisonRankings {
  rankings: {
    power: DeviceRanking[]
    cost: DeviceRanking[]
    voltage: DeviceRanking[]
    current: DeviceRanking[]
  }
  totals: {
    totalKwh: number
    totalCost: number
    currency: string
    kwhPrice: number
  }
}

// Timer Overlay Types

/** Timer state */
export interface TimerState {
  id: string
  status: 'stopped' | 'running' | 'paused'
  direction: 'up' | 'down'
  elapsedMs: number
  targetMs: number | null
  startedAt: number | null
  label: string
}

/** Input for timer configuration */
export interface TimerConfigInput {
  label?: string
  direction?: 'up' | 'down'
  targetMs?: number | null
}

// Counter Overlay Types

/** Counter state */
export interface CounterState {
  id: string
  value: number
  step: number
  label: string
  min: number | null
  max: number | null
}

/** Input for counter configuration */
export interface CounterConfigInput {
  label?: string
  step?: number
  min?: number | null
  max?: number | null
  value?: number
}

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH_STATUS: '/api/auth/status',
  AUTH_SETUP: '/api/auth/setup',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  AUTH_RESET: '/api/auth/reset',
  AUTH_ONBOARDING_COMPLETE: '/api/auth/onboarding-complete',

  // Devices
  DEVICES: '/api/devices',
  DEVICE: (id: string) => `/api/devices/${id}`,
  DEVICE_ENABLED: (id: string) => `/api/devices/${id}/enabled`,
  DEVICE_MODE: (id: string) => `/api/devices/${id}/mode`,
  DEVICE_CONNECT: (id: string) => `/api/devices/${id}/connect`,
  DEVICE_DISCONNECT: (id: string) => `/api/devices/${id}/disconnect`,
  DEVICE_RETRY: (id: string) => `/api/devices/${id}/retry`,
  DEVICE_STATUS: (id: string) => `/api/devices/${id}/status`,
  DEVICE_CONNECTION_STATUS: (id: string) => `/api/devices/${id}/connection-status`,
  DEVICE_READINGS: (id: string) => `/api/devices/${id}/readings`,

  // Cloud
  CLOUD_STATUS: '/api/cloud/status',
  CLOUD_CREDENTIALS: '/api/cloud/credentials',
  CLOUD_TEST: '/api/cloud/test',
  CLOUD_DEVICES: '/api/cloud/devices',
  CLOUD_DEVICE: (id: string) => `/api/cloud/devices/${id}`,
  CLOUD_DEVICE_REFRESH: (id: string) => `/api/cloud/devices/${id}/refresh`,

  // Overlay
  OVERLAY: '/overlay',
  OVERLAY_DEVICE: (deviceId: string) => `/overlay/${deviceId}`,
  OVERLAY_CONFIG: (deviceId: string) => `/overlay/api/config/${deviceId}`,
  OVERLAY_PRESETS: '/overlay/api/presets',
  OVERLAY_PRESET: (id: string) => `/overlay/api/presets/${id}`,
  OVERLAY_PRESET_FROM_CONFIG: (deviceId: string) => `/overlay/api/presets/from-config/${deviceId}`,
  OVERLAY_APPLY_PRESET: (deviceId: string, presetId: string) =>
    `/overlay/api/config/${deviceId}/apply-preset/${presetId}`,

  // Settings
  SETTINGS: '/api/settings',

  // Logs
  LOGS: '/api/logs',
  LOGS_TYPES: '/api/logs/types',
  LOGS_CLEANUP: '/api/logs/cleanup',
  LOGS_EXPORT: '/api/logs/export',

  // Dashboard
  DASHBOARD: '/api/dashboard',
  DASHBOARD_DEVICE: (id: string) => `/api/dashboard/devices/${id}`,
  DASHBOARD_DEVICE_STATS: (id: string) => `/api/dashboard/devices/${id}/stats`,
  DASHBOARD_DEVICE_CHART: (id: string) => `/api/dashboard/devices/${id}/chart`,
  DASHBOARD_DEVICE_COSTS: (id: string) => `/api/dashboard/devices/${id}/costs`,
  DASHBOARD_COMPARE_CHART: '/api/dashboard/compare/chart',
  DASHBOARD_COMPARE_RANKING: '/api/dashboard/compare/ranking',

  // Tools - Timer
  TOOLS_TIMER: '/api/tools/timer',
  TOOLS_TIMER_START: '/api/tools/timer/start',
  TOOLS_TIMER_PAUSE: '/api/tools/timer/pause',
  TOOLS_TIMER_STOP: '/api/tools/timer/stop',
  TOOLS_TIMER_RESET: '/api/tools/timer/reset',

  // Tools - Counter
  TOOLS_COUNTER: '/api/tools/counter',
  TOOLS_COUNTER_INCREMENT: '/api/tools/counter/increment',
  TOOLS_COUNTER_DECREMENT: '/api/tools/counter/decrement',
  TOOLS_COUNTER_RESET: '/api/tools/counter/reset',

  // Overlay - Tools
  OVERLAY_TIMER: '/overlay/timer',
  OVERLAY_COUNTER: '/overlay/counter',

  // Legacy (POC)
  HEALTH: '/api/health',
  CONFIG: '/api/config',
  STATUS: '/api/status',
} as const

// Error codes
export const ERROR_CODES = {
  // Auth errors
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ALREADY_SETUP: 'ALREADY_SETUP',
  NOT_SETUP: 'NOT_SETUP',
  SALT_NOT_FOUND: 'SALT_NOT_FOUND',
  SETUP_ERROR: 'SETUP_ERROR',
  INVALID_CONFIRMATION: 'INVALID_CONFIRMATION',
  RESET_ERROR: 'RESET_ERROR',

  // Device errors
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_DEVICE: 'DUPLICATE_DEVICE',
  DEVICE_DISABLED: 'DEVICE_DISABLED',
  NOT_CONNECTED: 'NOT_CONNECTED',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Cloud errors
  MISSING_FIELDS: 'MISSING_FIELDS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  CLOUD_ERROR: 'CLOUD_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',

  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
