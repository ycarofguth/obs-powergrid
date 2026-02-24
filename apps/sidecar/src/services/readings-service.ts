import { getDb, schema } from '../db/index.js'
import { desc, eq, and, gte, lte } from 'drizzle-orm'
import type { DeviceStatus } from '@obs-tuya/shared'

export interface ReadingInput {
  deviceId: string
  status: DeviceStatus
}

export interface ReadingOutput {
  id: number
  deviceId: string
  timestamp: Date
  power: number | null
  voltage: number | null
  current: number | null
  switchState: boolean | null
}

/**
 * Salva uma leitura no banco de dados
 */
export function saveReading(input: ReadingInput): void {
  const db = getDb()
  const now = new Date()

  db.insert(schema.readings)
    .values({
      deviceId: input.deviceId,
      timestamp: now,
      power: input.status.power ?? null,
      voltage: input.status.voltage ?? null,
      current: input.status.current ?? null,
      switchState: input.status.switch ?? null,
    })
    .run()
}

/**
 * Busca leituras de um dispositivo
 */
export function getReadings(
  deviceId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    limit?: number
  }
): ReadingOutput[] {
  const db = getDb()
  const { startDate, endDate, limit = 1000 } = options || {}

  let query = db
    .select()
    .from(schema.readings)
    .where(eq(schema.readings.deviceId, deviceId))
    .orderBy(desc(schema.readings.timestamp))
    .limit(limit)

  // Se tiver filtro de data, precisamos usar query builder diferente
  if (startDate || endDate) {
    const conditions = [eq(schema.readings.deviceId, deviceId)]

    if (startDate) {
      conditions.push(gte(schema.readings.timestamp, startDate))
    }
    if (endDate) {
      conditions.push(lte(schema.readings.timestamp, endDate))
    }

    query = db
      .select()
      .from(schema.readings)
      .where(and(...conditions))
      .orderBy(desc(schema.readings.timestamp))
      .limit(limit)
  }

  return query.all().map((row) => ({
    id: row.id,
    deviceId: row.deviceId,
    timestamp: row.timestamp,
    power: row.power,
    voltage: row.voltage,
    current: row.current,
    switchState: row.switchState,
  }))
}

/**
 * Retorna a ultima leitura de um dispositivo
 */
export function getLastReading(deviceId: string): ReadingOutput | null {
  const db = getDb()

  const rows = db
    .select()
    .from(schema.readings)
    .where(eq(schema.readings.deviceId, deviceId))
    .orderBy(desc(schema.readings.timestamp))
    .limit(1)
    .all()

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    deviceId: row.deviceId,
    timestamp: row.timestamp,
    power: row.power,
    voltage: row.voltage,
    current: row.current,
    switchState: row.switchState,
  }
}

/**
 * Remove leituras antigas (cleanup periodico)
 * Mantem apenas leituras dos ultimos N dias
 */
export function cleanupOldReadings(daysToKeep: number = 30): number {
  const db = getDb()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  const result = db.delete(schema.readings).where(lte(schema.readings.timestamp, cutoffDate)).run()

  return result.changes
}

/**
 * Conta total de leituras de um dispositivo
 */
export function countReadings(deviceId: string): number {
  const db = getDb()

  const result = db
    .select()
    .from(schema.readings)
    .where(eq(schema.readings.deviceId, deviceId))
    .all()

  return result.length
}
