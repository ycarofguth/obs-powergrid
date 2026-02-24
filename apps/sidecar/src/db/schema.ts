import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core'

// Metadados do app (salt, status do onboarding)
export const appMeta = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

// Dispositivos
export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  deviceId: text('device_id').notNull().unique(),
  localKey: blob('local_key', { mode: 'buffer' }).notNull(), // Criptografado AES-256-GCM
  ipAddress: text('ip_address'),
  protocolVersion: text('protocol_version').default('3.4'),
  communicationMode: text('communication_mode', { enum: ['local', 'cloud'] }).default('local'),
  category: text('category'),
  dpsMapping: text('dps_mapping', { mode: 'json' }),
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Leituras históricas (FR-306)
export const readings = sqliteTable('readings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deviceId: text('device_id')
    .notNull()
    .references(() => devices.id, { onDelete: 'cascade' }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  power: real('power'),
  voltage: real('voltage'),
  current: real('current'),
  switchState: integer('switch_state', { mode: 'boolean' }),
})

// Logs de atividade (schema para M5)
export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  deviceId: text('device_id').references(() => devices.id, { onDelete: 'set null' }),
  metadata: text('metadata', { mode: 'json' }),
})

// Credenciais Cloud (schema para M2)
export const cloudCredentials = sqliteTable('cloud_credentials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accessId: blob('access_id', { mode: 'buffer' }).notNull(), // Criptografado
  accessSecret: blob('access_secret', { mode: 'buffer' }).notNull(), // Criptografado
  region: text('region').default('us'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Configuracoes do app
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

// Configuracoes de overlay por dispositivo (M4)
export const overlayConfigs = sqliteTable('overlay_configs', {
  id: text('id').primaryKey(), // UUID ou 'combined' para overlay combinado
  deviceId: text('device_id').references(() => devices.id, { onDelete: 'cascade' }), // null para combinado
  // Fonte
  fontSize: integer('font_size').default(24),
  fontColor: text('font_color').default('#FFFFFF'),
  fontFamily: text('font_family').default('system-ui'),
  // Borda do texto
  textStrokeEnabled: integer('text_stroke_enabled', { mode: 'boolean' }).default(false),
  textStrokeColor: text('text_stroke_color').default('#000000'),
  textStrokeWidth: integer('text_stroke_width').default(1),
  // Sombra do texto
  textShadowEnabled: integer('text_shadow_enabled', { mode: 'boolean' }).default(true),
  textShadowColor: text('text_shadow_color').default('#000000'),
  textShadowBlur: integer('text_shadow_blur').default(4),
  textShadowOffsetX: integer('text_shadow_offset_x').default(2),
  textShadowOffsetY: integer('text_shadow_offset_y').default(2),
  // Layout
  layout: text('layout', { enum: ['horizontal', 'vertical'] }).default('horizontal'),
  // Background
  backgroundColor: text('background_color').default('rgba(0,0,0,0.7)'),
  backgroundOpacity: integer('background_opacity').default(70), // 0-100
  borderRadius: integer('border_radius').default(8),
  padding: integer('padding').default(16),
  // Dados exibidos (JSON array de strings: ['power', 'voltage', 'current', 'name'])
  visibleMetrics: text('visible_metrics', { mode: 'json' })
    .$type<string[]>()
    .default(['power', 'voltage', 'current']),
  metricsOrder: text('metrics_order', { mode: 'json' })
    .$type<string[]>()
    .default(['power', 'voltage', 'current']),
  showDeviceName: integer('show_device_name', { mode: 'boolean' }).default(false),
  // Combinado: disposicao das tomadas
  combinedLayout: text('combined_layout', { enum: ['stacked', 'side-by-side'] }).default('stacked'),
  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Presets de overlay (M4)
export const overlayPresets = sqliteTable('overlay_presets', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  // Copia das configuracoes de overlay
  fontSize: integer('font_size').default(24),
  fontColor: text('font_color').default('#FFFFFF'),
  fontFamily: text('font_family').default('system-ui'),
  textStrokeEnabled: integer('text_stroke_enabled', { mode: 'boolean' }).default(false),
  textStrokeColor: text('text_stroke_color').default('#000000'),
  textStrokeWidth: integer('text_stroke_width').default(1),
  textShadowEnabled: integer('text_shadow_enabled', { mode: 'boolean' }).default(true),
  textShadowColor: text('text_shadow_color').default('#000000'),
  textShadowBlur: integer('text_shadow_blur').default(4),
  textShadowOffsetX: integer('text_shadow_offset_x').default(2),
  textShadowOffsetY: integer('text_shadow_offset_y').default(2),
  layout: text('layout', { enum: ['horizontal', 'vertical'] }).default('horizontal'),
  backgroundColor: text('background_color').default('rgba(0,0,0,0.7)'),
  backgroundOpacity: integer('background_opacity').default(70),
  borderRadius: integer('border_radius').default(8),
  padding: integer('padding').default(16),
  visibleMetrics: text('visible_metrics', { mode: 'json' })
    .$type<string[]>()
    .default(['power', 'voltage', 'current']),
  metricsOrder: text('metrics_order', { mode: 'json' })
    .$type<string[]>()
    .default(['power', 'voltage', 'current']),
  showDeviceName: integer('show_device_name', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

// Tipos inferidos para uso no codigo
export type AppMeta = typeof appMeta.$inferSelect
export type NewAppMeta = typeof appMeta.$inferInsert

export type Device = typeof devices.$inferSelect
export type NewDevice = typeof devices.$inferInsert

export type Reading = typeof readings.$inferSelect
export type NewReading = typeof readings.$inferInsert

export type Log = typeof logs.$inferSelect
export type NewLog = typeof logs.$inferInsert

export type CloudCredentials = typeof cloudCredentials.$inferSelect
export type NewCloudCredentials = typeof cloudCredentials.$inferInsert

export type Setting = typeof settings.$inferSelect
export type NewSetting = typeof settings.$inferInsert

export type OverlayConfig = typeof overlayConfigs.$inferSelect
export type NewOverlayConfig = typeof overlayConfigs.$inferInsert

export type OverlayPreset = typeof overlayPresets.$inferSelect
export type NewOverlayPreset = typeof overlayPresets.$inferInsert
