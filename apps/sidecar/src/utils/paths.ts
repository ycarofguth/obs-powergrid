import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const APP_DIR_NAME = '.obs-tuya'
const DB_FILE_NAME = 'data.db'

/**
 * Retorna o diretorio base do app (~/.obs-tuya)
 */
export function getAppDir(): string {
  return join(homedir(), APP_DIR_NAME)
}

/**
 * Retorna o caminho do arquivo do banco de dados
 */
export function getDbPath(): string {
  return join(getAppDir(), DB_FILE_NAME)
}

/**
 * Garante que o diretorio do app existe
 */
export function ensureAppDir(): void {
  const appDir = getAppDir()
  if (!existsSync(appDir)) {
    mkdirSync(appDir, { recursive: true })
  }
}

/**
 * Verifica se o banco de dados existe (app ja foi configurado)
 */
export function databaseExists(): boolean {
  return existsSync(getDbPath())
}
