import { getDb, schema } from '../db/index.js'
import { eq } from 'drizzle-orm'

// Chaves de configuracao
export const SETTING_KEYS = {
  KWH_PRICE: 'kwh_price',
  CURRENCY: 'currency',
  DATA_RETENTION_DAYS: 'data_retention_days',
  LOG_RETENTION_DAYS: 'log_retention_days',
  POLLING_INTERVAL_SECONDS: 'polling_interval_seconds',
  MINIMIZE_TO_TRAY: 'minimize_to_tray',
  THEME: 'theme',
} as const

// Valores padrao
const DEFAULT_VALUES: Record<string, string> = {
  [SETTING_KEYS.KWH_PRICE]: '0.75',
  [SETTING_KEYS.CURRENCY]: 'R$',
  [SETTING_KEYS.DATA_RETENTION_DAYS]: '90',
  [SETTING_KEYS.LOG_RETENTION_DAYS]: '30',
  [SETTING_KEYS.POLLING_INTERVAL_SECONDS]: '5',
  [SETTING_KEYS.MINIMIZE_TO_TRAY]: 'true',
  [SETTING_KEYS.THEME]: 'dark',
}

export interface AppSettings {
  kwhPrice: number
  currency: string
  dataRetentionDays: number
  logRetentionDays: number
  pollingIntervalSeconds: number
  minimizeToTray: boolean
  theme: 'light' | 'dark' | 'system'
}

export interface AppSettingsInput {
  kwhPrice?: number
  currency?: string
  dataRetentionDays?: number
  logRetentionDays?: number
  pollingIntervalSeconds?: number
  minimizeToTray?: boolean
  theme?: 'light' | 'dark' | 'system'
}

/**
 * Busca um valor de configuracao
 */
export function getSetting(key: string): string {
  const db = getDb()

  const rows = db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1).all()

  const row = rows[0]
  return row?.value ?? DEFAULT_VALUES[key] ?? ''
}

/**
 * Salva um valor de configuracao
 */
export function setSetting(key: string, value: string): void {
  const db = getDb()

  const existing = db
    .select()
    .from(schema.settings)
    .where(eq(schema.settings.key, key))
    .limit(1)
    .all()

  if (existing.length > 0) {
    db.update(schema.settings).set({ value }).where(eq(schema.settings.key, key)).run()
  } else {
    db.insert(schema.settings).values({ key, value }).run()
  }
}

/**
 * Busca todas as configuracoes
 */
export function getSettings(): AppSettings {
  return {
    kwhPrice: parseFloat(getSetting(SETTING_KEYS.KWH_PRICE)) || 0,
    currency: getSetting(SETTING_KEYS.CURRENCY) || 'R$',
    dataRetentionDays: parseInt(getSetting(SETTING_KEYS.DATA_RETENTION_DAYS), 10) || 90,
    logRetentionDays: parseInt(getSetting(SETTING_KEYS.LOG_RETENTION_DAYS), 10) || 30,
    pollingIntervalSeconds: parseInt(getSetting(SETTING_KEYS.POLLING_INTERVAL_SECONDS), 10) || 5,
    minimizeToTray: getSetting(SETTING_KEYS.MINIMIZE_TO_TRAY) !== 'false',
    theme: (getSetting(SETTING_KEYS.THEME) as 'light' | 'dark' | 'system') || 'dark',
  }
}

/**
 * Atualiza configuracoes
 */
export function updateSettings(input: AppSettingsInput): AppSettings {
  if (input.kwhPrice !== undefined) {
    setSetting(SETTING_KEYS.KWH_PRICE, String(input.kwhPrice))
  }
  if (input.currency !== undefined) {
    setSetting(SETTING_KEYS.CURRENCY, input.currency)
  }
  if (input.dataRetentionDays !== undefined) {
    setSetting(SETTING_KEYS.DATA_RETENTION_DAYS, String(input.dataRetentionDays))
  }
  if (input.logRetentionDays !== undefined) {
    setSetting(SETTING_KEYS.LOG_RETENTION_DAYS, String(input.logRetentionDays))
  }
  if (input.pollingIntervalSeconds !== undefined) {
    setSetting(SETTING_KEYS.POLLING_INTERVAL_SECONDS, String(input.pollingIntervalSeconds))
  }
  if (input.minimizeToTray !== undefined) {
    setSetting(SETTING_KEYS.MINIMIZE_TO_TRAY, String(input.minimizeToTray))
  }
  if (input.theme !== undefined) {
    setSetting(SETTING_KEYS.THEME, input.theme)
  }

  return getSettings()
}

/**
 * Calcula custo baseado em potencia e tempo
 * @param powerWatts Potencia em watts
 * @param durationMs Duracao em milissegundos
 * @returns Custo calculado
 */
export function calculateCost(powerWatts: number, durationMs: number): number {
  const settings = getSettings()
  const hours = durationMs / (1000 * 60 * 60)
  const kWh = (powerWatts / 1000) * hours
  return kWh * settings.kwhPrice
}

/**
 * Formata valor monetario
 */
export function formatCurrency(value: number): string {
  const settings = getSettings()
  return `${settings.currency} ${value.toFixed(2)}`
}
