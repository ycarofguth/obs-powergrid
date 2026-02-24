import Database from 'better-sqlite3-multiple-ciphers'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from './schema.js'
import { getDbPath, ensureAppDir } from '../utils/paths.js'

let db: BetterSQLite3Database<typeof schema> | null = null
let sqliteDb: Database.Database | null = null

/**
 * Inicializa o banco de dados com a chave SQLCipher
 */
export function initDatabase(sqlCipherKey: string): void {
  ensureAppDir()
  const dbPath = getDbPath()

  sqliteDb = new Database(dbPath)

  // Configura SQLCipher
  sqliteDb.pragma(`key = "x'${sqlCipherKey}'"`)
  sqliteDb.pragma('cipher_compatibility = 4')

  // Verifica se o banco foi aberto corretamente tentando uma query
  try {
    sqliteDb.exec('SELECT 1')
  } catch {
    sqliteDb.close()
    sqliteDb = null
    throw new Error('Invalid password or corrupted database')
  }

  db = drizzle(sqliteDb, { schema })

  // Cria as tabelas se nao existirem
  createTables()
}

/**
 * Cria as tabelas do banco se nao existirem
 */
function createTables(): void {
  if (!sqliteDb) throw new Error('Database not initialized')

  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      device_id TEXT NOT NULL UNIQUE,
      local_key BLOB NOT NULL,
      ip_address TEXT,
      protocol_version TEXT DEFAULT '3.4',
      communication_mode TEXT DEFAULT 'local',
      enabled INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      timestamp INTEGER NOT NULL,
      power REAL,
      voltage REAL,
      current REAL,
      switch_state INTEGER
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      device_id TEXT REFERENCES devices(id) ON DELETE SET NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS cloud_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      access_id BLOB NOT NULL,
      access_secret BLOB NOT NULL,
      region TEXT DEFAULT 'us',
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS overlay_configs (
      id TEXT PRIMARY KEY,
      device_id TEXT REFERENCES devices(id) ON DELETE CASCADE,
      font_size INTEGER DEFAULT 24,
      font_color TEXT DEFAULT '#FFFFFF',
      font_family TEXT DEFAULT 'system-ui',
      text_stroke_enabled INTEGER DEFAULT 0,
      text_stroke_color TEXT DEFAULT '#000000',
      text_stroke_width INTEGER DEFAULT 1,
      text_shadow_enabled INTEGER DEFAULT 1,
      text_shadow_color TEXT DEFAULT '#000000',
      text_shadow_blur INTEGER DEFAULT 4,
      text_shadow_offset_x INTEGER DEFAULT 2,
      text_shadow_offset_y INTEGER DEFAULT 2,
      layout TEXT DEFAULT 'horizontal',
      background_color TEXT DEFAULT 'rgba(0,0,0,0.7)',
      background_opacity INTEGER DEFAULT 70,
      border_radius INTEGER DEFAULT 8,
      padding INTEGER DEFAULT 16,
      visible_metrics TEXT DEFAULT '["power","voltage","current"]',
      metrics_order TEXT DEFAULT '["power","voltage","current"]',
      show_device_name INTEGER DEFAULT 0,
      combined_layout TEXT DEFAULT 'stacked',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS overlay_presets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      font_size INTEGER DEFAULT 24,
      font_color TEXT DEFAULT '#FFFFFF',
      font_family TEXT DEFAULT 'system-ui',
      text_stroke_enabled INTEGER DEFAULT 0,
      text_stroke_color TEXT DEFAULT '#000000',
      text_stroke_width INTEGER DEFAULT 1,
      text_shadow_enabled INTEGER DEFAULT 1,
      text_shadow_color TEXT DEFAULT '#000000',
      text_shadow_blur INTEGER DEFAULT 4,
      text_shadow_offset_x INTEGER DEFAULT 2,
      text_shadow_offset_y INTEGER DEFAULT 2,
      layout TEXT DEFAULT 'horizontal',
      background_color TEXT DEFAULT 'rgba(0,0,0,0.7)',
      background_opacity INTEGER DEFAULT 70,
      border_radius INTEGER DEFAULT 8,
      padding INTEGER DEFAULT 16,
      visible_metrics TEXT DEFAULT '["power","voltage","current"]',
      metrics_order TEXT DEFAULT '["power","voltage","current"]',
      show_device_name INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_readings_device_id ON readings(device_id);
    CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_device_id ON logs(device_id);
    CREATE INDEX IF NOT EXISTS idx_overlay_configs_device_id ON overlay_configs(device_id);
  `)

  // Migracao: adicionar category e dps_mapping a devices (para bancos existentes)
  try {
    sqliteDb.exec(`ALTER TABLE devices ADD COLUMN category TEXT`)
  } catch {
    // Coluna ja existe
  }
  try {
    sqliteDb.exec(`ALTER TABLE devices ADD COLUMN dps_mapping TEXT`)
  } catch {
    // Coluna ja existe
  }
}

/**
 * Retorna a instancia do Drizzle ORM
 */
export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!db) throw new Error('Database not initialized')
  return db
}

/**
 * Retorna a instancia raw do better-sqlite3 (para operacoes especiais)
 */
export function getRawDb(): Database.Database {
  if (!sqliteDb) throw new Error('Database not initialized')
  return sqliteDb
}

/**
 * Fecha a conexao com o banco
 */
export function closeDatabase(): void {
  if (sqliteDb) {
    sqliteDb.close()
    sqliteDb = null
    db = null
  }
}

/**
 * Verifica se o banco esta conectado
 */
export function isDatabaseConnected(): boolean {
  return db !== null && sqliteDb !== null
}

/**
 * Salva um valor na tabela app_meta
 */
export function setAppMeta(key: string, value: string): void {
  const database = getDb()
  database
    .insert(schema.appMeta)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.appMeta.key, set: { value } })
    .run()
}

/**
 * Busca um valor da tabela app_meta
 */
export function getAppMeta(key: string): string | null {
  const database = getDb()
  const result = database.select().from(schema.appMeta).where(eq(schema.appMeta.key, key)).get()
  return result?.value ?? null
}

export { schema }
