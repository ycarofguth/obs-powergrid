import { getDb, schema } from '../db/index.js'
import { desc, eq, and, gte, lte, inArray } from 'drizzle-orm'

// Tipos de log
export const LOG_TYPES = {
  SYSTEM: 'system',
  CONNECTION: 'connection',
  CONFIG: 'config',
  ERROR: 'error',
  USER: 'user',
} as const

export type LogType = (typeof LOG_TYPES)[keyof typeof LOG_TYPES]

export interface LogInput {
  type: LogType
  message: string
  deviceId?: string | null
  metadata?: Record<string, unknown> | null
}

export interface LogOutput {
  id: number
  timestamp: Date
  type: string
  message: string
  deviceId: string | null
  metadata: Record<string, unknown> | null
}

export interface LogFilters {
  types?: LogType[]
  deviceId?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

/**
 * Adiciona um log ao sistema
 */
export function addLog(input: LogInput): LogOutput {
  const db = getDb()
  const now = new Date()

  const result = db
    .insert(schema.logs)
    .values({
      timestamp: now,
      type: input.type,
      message: input.message,
      deviceId: input.deviceId ?? null,
      metadata: input.metadata ?? null,
    })
    .returning()
    .get()

  return {
    id: result.id,
    timestamp: result.timestamp,
    type: result.type,
    message: result.message,
    deviceId: result.deviceId,
    metadata: result.metadata as Record<string, unknown> | null,
  }
}

/**
 * Busca logs com filtros
 */
export function getLogs(filters?: LogFilters): LogOutput[] {
  const db = getDb()
  const { types, deviceId, startDate, endDate, limit = 500, offset = 0 } = filters || {}

  const conditions = []

  if (types && types.length > 0) {
    conditions.push(inArray(schema.logs.type, types))
  }

  if (deviceId) {
    conditions.push(eq(schema.logs.deviceId, deviceId))
  }

  if (startDate) {
    conditions.push(gte(schema.logs.timestamp, startDate))
  }

  if (endDate) {
    conditions.push(lte(schema.logs.timestamp, endDate))
  }

  const rows =
    conditions.length > 0
      ? db
          .select()
          .from(schema.logs)
          .where(and(...conditions))
          .orderBy(desc(schema.logs.timestamp))
          .limit(limit)
          .offset(offset)
          .all()
      : db
          .select()
          .from(schema.logs)
          .orderBy(desc(schema.logs.timestamp))
          .limit(limit)
          .offset(offset)
          .all()

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    type: row.type,
    message: row.message,
    deviceId: row.deviceId,
    metadata: row.metadata as Record<string, unknown> | null,
  }))
}

/**
 * Conta logs com filtros
 */
export function countLogs(filters?: Omit<LogFilters, 'limit' | 'offset'>): number {
  const db = getDb()
  const { types, deviceId, startDate, endDate } = filters || {}

  const conditions = []

  if (types && types.length > 0) {
    conditions.push(inArray(schema.logs.type, types))
  }

  if (deviceId) {
    conditions.push(eq(schema.logs.deviceId, deviceId))
  }

  if (startDate) {
    conditions.push(gte(schema.logs.timestamp, startDate))
  }

  if (endDate) {
    conditions.push(lte(schema.logs.timestamp, endDate))
  }

  const rows =
    conditions.length > 0
      ? db
          .select()
          .from(schema.logs)
          .where(and(...conditions))
          .all()
      : db.select().from(schema.logs).all()

  return rows.length
}

/**
 * Remove logs antigos
 */
export function cleanupOldLogs(daysToKeep: number = 30): number {
  const db = getDb()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = db.delete(schema.logs).where(lte(schema.logs.timestamp, cutoffDate)).run()

  return result.changes
}

// Funcoes de conveniencia para logging

export function logSystem(message: string, metadata?: Record<string, unknown>): void {
  addLog({ type: LOG_TYPES.SYSTEM, message, metadata })
}

export function logConnection(
  message: string,
  deviceId?: string,
  metadata?: Record<string, unknown>
): void {
  addLog({ type: LOG_TYPES.CONNECTION, message, deviceId, metadata })
}

export function logConfig(
  message: string,
  deviceId?: string,
  metadata?: Record<string, unknown>
): void {
  addLog({ type: LOG_TYPES.CONFIG, message, deviceId, metadata })
}

export function logError(
  message: string,
  deviceId?: string,
  metadata?: Record<string, unknown>
): void {
  addLog({ type: LOG_TYPES.ERROR, message, deviceId, metadata })
}

export function logUser(message: string, metadata?: Record<string, unknown>): void {
  addLog({ type: LOG_TYPES.USER, message, metadata })
}
