import { getDb, schema } from '../db/index.js'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ID especial para configuracao do overlay combinado
export const COMBINED_OVERLAY_ID = 'combined'

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

// Valores padrao para overlay
const DEFAULT_CONFIG: Omit<OverlayConfigOutput, 'id' | 'deviceId' | 'createdAt' | 'updatedAt'> = {
  fontSize: 40,
  fontColor: '#FFFFFF',
  fontFamily: 'system-ui',
  textStrokeEnabled: false,
  textStrokeColor: '#000000',
  textStrokeWidth: 1,
  textShadowEnabled: true,
  textShadowColor: '#000000',
  textShadowBlur: 4,
  textShadowOffsetX: 2,
  textShadowOffsetY: 2,
  layout: 'vertical',
  backgroundColor: 'rgba(0,0,0,0.7)',
  backgroundOpacity: 70,
  borderRadius: 8,
  padding: 16,
  visibleMetrics: ['power', 'voltage', 'current'],
  metricsOrder: ['power', 'voltage', 'current'],
  showDeviceName: true,
  combinedLayout: 'stacked',
}

function rowToConfig(row: schema.OverlayConfig): OverlayConfigOutput {
  return {
    id: row.id,
    deviceId: row.deviceId,
    fontSize: row.fontSize ?? DEFAULT_CONFIG.fontSize,
    fontColor: row.fontColor ?? DEFAULT_CONFIG.fontColor,
    fontFamily: row.fontFamily ?? DEFAULT_CONFIG.fontFamily,
    textStrokeEnabled: row.textStrokeEnabled ?? DEFAULT_CONFIG.textStrokeEnabled,
    textStrokeColor: row.textStrokeColor ?? DEFAULT_CONFIG.textStrokeColor,
    textStrokeWidth: row.textStrokeWidth ?? DEFAULT_CONFIG.textStrokeWidth,
    textShadowEnabled: row.textShadowEnabled ?? DEFAULT_CONFIG.textShadowEnabled,
    textShadowColor: row.textShadowColor ?? DEFAULT_CONFIG.textShadowColor,
    textShadowBlur: row.textShadowBlur ?? DEFAULT_CONFIG.textShadowBlur,
    textShadowOffsetX: row.textShadowOffsetX ?? DEFAULT_CONFIG.textShadowOffsetX,
    textShadowOffsetY: row.textShadowOffsetY ?? DEFAULT_CONFIG.textShadowOffsetY,
    layout: (row.layout as 'horizontal' | 'vertical') ?? DEFAULT_CONFIG.layout,
    backgroundColor: row.backgroundColor ?? DEFAULT_CONFIG.backgroundColor,
    backgroundOpacity: row.backgroundOpacity ?? DEFAULT_CONFIG.backgroundOpacity,
    borderRadius: row.borderRadius ?? DEFAULT_CONFIG.borderRadius,
    padding: row.padding ?? DEFAULT_CONFIG.padding,
    visibleMetrics: row.visibleMetrics ?? DEFAULT_CONFIG.visibleMetrics,
    metricsOrder: row.metricsOrder ?? DEFAULT_CONFIG.metricsOrder,
    showDeviceName: row.showDeviceName ?? DEFAULT_CONFIG.showDeviceName,
    combinedLayout:
      (row.combinedLayout as 'stacked' | 'side-by-side') ?? DEFAULT_CONFIG.combinedLayout,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function rowToPreset(row: schema.OverlayPreset): OverlayPresetOutput {
  return {
    id: row.id,
    name: row.name,
    fontSize: row.fontSize ?? DEFAULT_CONFIG.fontSize,
    fontColor: row.fontColor ?? DEFAULT_CONFIG.fontColor,
    fontFamily: row.fontFamily ?? DEFAULT_CONFIG.fontFamily,
    textStrokeEnabled: row.textStrokeEnabled ?? DEFAULT_CONFIG.textStrokeEnabled,
    textStrokeColor: row.textStrokeColor ?? DEFAULT_CONFIG.textStrokeColor,
    textStrokeWidth: row.textStrokeWidth ?? DEFAULT_CONFIG.textStrokeWidth,
    textShadowEnabled: row.textShadowEnabled ?? DEFAULT_CONFIG.textShadowEnabled,
    textShadowColor: row.textShadowColor ?? DEFAULT_CONFIG.textShadowColor,
    textShadowBlur: row.textShadowBlur ?? DEFAULT_CONFIG.textShadowBlur,
    textShadowOffsetX: row.textShadowOffsetX ?? DEFAULT_CONFIG.textShadowOffsetX,
    textShadowOffsetY: row.textShadowOffsetY ?? DEFAULT_CONFIG.textShadowOffsetY,
    layout: (row.layout as 'horizontal' | 'vertical') ?? DEFAULT_CONFIG.layout,
    backgroundColor: row.backgroundColor ?? DEFAULT_CONFIG.backgroundColor,
    backgroundOpacity: row.backgroundOpacity ?? DEFAULT_CONFIG.backgroundOpacity,
    borderRadius: row.borderRadius ?? DEFAULT_CONFIG.borderRadius,
    padding: row.padding ?? DEFAULT_CONFIG.padding,
    visibleMetrics: row.visibleMetrics ?? DEFAULT_CONFIG.visibleMetrics,
    metricsOrder: row.metricsOrder ?? DEFAULT_CONFIG.metricsOrder,
    showDeviceName: row.showDeviceName ?? DEFAULT_CONFIG.showDeviceName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// ==================== Overlay Configs ====================

/**
 * Busca configuracao de overlay para um dispositivo
 * Se nao existir, retorna configuracao padrao
 */
export function getOverlayConfig(deviceId: string): OverlayConfigOutput {
  const db = getDb()

  const rows = db
    .select()
    .from(schema.overlayConfigs)
    .where(eq(schema.overlayConfigs.deviceId, deviceId))
    .limit(1)
    .all()

  const row = rows[0]
  if (row) {
    return rowToConfig(row)
  }

  // Retorna config padrao se nao existir
  const now = new Date()
  return {
    id: deviceId,
    deviceId,
    ...DEFAULT_CONFIG,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Busca configuracao do overlay combinado
 */
export function getCombinedOverlayConfig(): OverlayConfigOutput {
  const db = getDb()

  const rows = db
    .select()
    .from(schema.overlayConfigs)
    .where(eq(schema.overlayConfigs.id, COMBINED_OVERLAY_ID))
    .limit(1)
    .all()

  const row = rows[0]
  if (row) {
    return rowToConfig(row)
  }

  // Retorna config padrao se nao existir
  const now = new Date()
  return {
    id: COMBINED_OVERLAY_ID,
    deviceId: null,
    ...DEFAULT_CONFIG,
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Salva ou atualiza configuracao de overlay para um dispositivo
 */
export function saveOverlayConfig(
  deviceId: string,
  input: OverlayConfigInput
): OverlayConfigOutput {
  const db = getDb()
  const now = new Date()

  const existing = db
    .select()
    .from(schema.overlayConfigs)
    .where(eq(schema.overlayConfigs.deviceId, deviceId))
    .limit(1)
    .all()

  if (existing.length > 0) {
    // Atualiza existente
    db.update(schema.overlayConfigs)
      .set({
        ...input,
        updatedAt: now,
      })
      .where(eq(schema.overlayConfigs.deviceId, deviceId))
      .run()
  } else {
    // Cria novo
    db.insert(schema.overlayConfigs)
      .values({
        id: randomUUID(),
        deviceId,
        ...input,
        createdAt: now,
        updatedAt: now,
      })
      .run()
  }

  return getOverlayConfig(deviceId)
}

/**
 * Salva ou atualiza configuracao do overlay combinado
 */
export function saveCombinedOverlayConfig(input: OverlayConfigInput): OverlayConfigOutput {
  const db = getDb()
  const now = new Date()

  const existing = db
    .select()
    .from(schema.overlayConfigs)
    .where(eq(schema.overlayConfigs.id, COMBINED_OVERLAY_ID))
    .limit(1)
    .all()

  if (existing.length > 0) {
    // Atualiza existente
    db.update(schema.overlayConfigs)
      .set({
        ...input,
        updatedAt: now,
      })
      .where(eq(schema.overlayConfigs.id, COMBINED_OVERLAY_ID))
      .run()
  } else {
    // Cria novo
    db.insert(schema.overlayConfigs)
      .values({
        id: COMBINED_OVERLAY_ID,
        deviceId: null,
        ...input,
        createdAt: now,
        updatedAt: now,
      })
      .run()
  }

  return getCombinedOverlayConfig()
}

/**
 * Deleta configuracao de overlay de um dispositivo
 */
export function deleteOverlayConfig(deviceId: string): boolean {
  const db = getDb()

  const result = db
    .delete(schema.overlayConfigs)
    .where(eq(schema.overlayConfigs.deviceId, deviceId))
    .run()

  return result.changes > 0
}

// ==================== Overlay Presets ====================

/**
 * Lista todos os presets
 */
export function listOverlayPresets(): OverlayPresetOutput[] {
  const db = getDb()

  const rows = db.select().from(schema.overlayPresets).all()

  return rows.map(rowToPreset)
}

/**
 * Busca um preset por ID
 */
export function getOverlayPreset(id: string): OverlayPresetOutput | null {
  const db = getDb()

  const rows = db
    .select()
    .from(schema.overlayPresets)
    .where(eq(schema.overlayPresets.id, id))
    .limit(1)
    .all()

  const row = rows[0]
  return row ? rowToPreset(row) : null
}

/**
 * Cria um novo preset
 */
export function createOverlayPreset(input: OverlayPresetInput): OverlayPresetOutput {
  const db = getDb()
  const now = new Date()
  const id = randomUUID()

  db.insert(schema.overlayPresets)
    .values({
      id,
      name: input.name,
      fontSize: input.fontSize,
      fontColor: input.fontColor,
      fontFamily: input.fontFamily,
      textStrokeEnabled: input.textStrokeEnabled,
      textStrokeColor: input.textStrokeColor,
      textStrokeWidth: input.textStrokeWidth,
      textShadowEnabled: input.textShadowEnabled,
      textShadowColor: input.textShadowColor,
      textShadowBlur: input.textShadowBlur,
      textShadowOffsetX: input.textShadowOffsetX,
      textShadowOffsetY: input.textShadowOffsetY,
      layout: input.layout,
      backgroundColor: input.backgroundColor,
      backgroundOpacity: input.backgroundOpacity,
      borderRadius: input.borderRadius,
      padding: input.padding,
      visibleMetrics: input.visibleMetrics,
      metricsOrder: input.metricsOrder,
      showDeviceName: input.showDeviceName,
      createdAt: now,
      updatedAt: now,
    })
    .run()

  return getOverlayPreset(id)!
}

/**
 * Atualiza um preset existente
 */
export function updateOverlayPreset(
  id: string,
  input: Partial<OverlayPresetInput>
): OverlayPresetOutput | null {
  const db = getDb()
  const now = new Date()

  const existing = getOverlayPreset(id)
  if (!existing) return null

  db.update(schema.overlayPresets)
    .set({
      ...input,
      updatedAt: now,
    })
    .where(eq(schema.overlayPresets.id, id))
    .run()

  return getOverlayPreset(id)
}

/**
 * Deleta um preset
 */
export function deleteOverlayPreset(id: string): boolean {
  const db = getDb()

  const result = db.delete(schema.overlayPresets).where(eq(schema.overlayPresets.id, id)).run()

  return result.changes > 0
}

/**
 * Cria preset a partir de uma configuracao existente
 */
export function createPresetFromConfig(
  name: string,
  config: OverlayConfigOutput
): OverlayPresetOutput {
  return createOverlayPreset({
    name,
    fontSize: config.fontSize,
    fontColor: config.fontColor,
    fontFamily: config.fontFamily,
    textStrokeEnabled: config.textStrokeEnabled,
    textStrokeColor: config.textStrokeColor,
    textStrokeWidth: config.textStrokeWidth,
    textShadowEnabled: config.textShadowEnabled,
    textShadowColor: config.textShadowColor,
    textShadowBlur: config.textShadowBlur,
    textShadowOffsetX: config.textShadowOffsetX,
    textShadowOffsetY: config.textShadowOffsetY,
    layout: config.layout,
    backgroundColor: config.backgroundColor,
    backgroundOpacity: config.backgroundOpacity,
    borderRadius: config.borderRadius,
    padding: config.padding,
    visibleMetrics: config.visibleMetrics,
    metricsOrder: config.metricsOrder,
    showDeviceName: config.showDeviceName,
  })
}

/**
 * Aplica preset a uma configuracao
 */
export function applyPresetToConfig(
  deviceId: string,
  presetId: string
): OverlayConfigOutput | null {
  const preset = getOverlayPreset(presetId)
  if (!preset) return null

  return saveOverlayConfig(deviceId, {
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
}

// Exporta config padrao para uso externo
export { DEFAULT_CONFIG }
