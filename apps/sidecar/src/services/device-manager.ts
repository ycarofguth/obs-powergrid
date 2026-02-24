import { eq, asc } from 'drizzle-orm'
import { getDb, schema } from '../db/index.js'
import { encryptField, decryptField, generateUUID } from './crypto.js'
import { getFieldsKey } from './session.js'
import type { DpsMapping } from '@obs-tuya/shared'

export interface DeviceInput {
  name: string
  deviceId: string
  localKey?: string
  ipAddress?: string
  protocolVersion?: string
  communicationMode?: 'local' | 'cloud'
  category?: string
  dpsMapping?: DpsMapping
}

export interface DeviceOutput {
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

/**
 * Cria um novo dispositivo
 */
export function createDevice(input: DeviceInput): DeviceOutput {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const id = generateUUID()
  const now = new Date()

  // Criptografa o localKey (pode ser vazio no modo cloud)
  const encryptedLocalKey = input.localKey ? encryptField(input.localKey, fieldsKey) : Buffer.alloc(0)

  const device = {
    id,
    name: input.name,
    deviceId: input.deviceId,
    localKey: encryptedLocalKey,
    ipAddress: input.ipAddress ?? null,
    protocolVersion: input.protocolVersion ?? '3.4',
    communicationMode: input.communicationMode ?? 'local',
    category: input.category ?? null,
    dpsMapping: input.dpsMapping ?? null,
    enabled: true,
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  }

  db.insert(schema.devices).values(device).run()

  return {
    ...device,
    localKey: input.localKey || '',
    communicationMode: device.communicationMode as 'local' | 'cloud',
    dpsMapping: (device.dpsMapping ?? null) as DpsMapping | null,
  }
}

function rowToOutput(device: typeof schema.devices.$inferSelect, fieldsKey: Buffer): DeviceOutput {
  return {
    id: device.id,
    name: device.name,
    deviceId: device.deviceId,
    localKey: device.localKey && device.localKey.length > 0 ? decryptField(device.localKey, fieldsKey) : '',
    ipAddress: device.ipAddress,
    protocolVersion: device.protocolVersion ?? '3.4',
    communicationMode: (device.communicationMode ?? 'local') as 'local' | 'cloud',
    category: device.category ?? null,
    dpsMapping: (device.dpsMapping ?? null) as DpsMapping | null,
    enabled: device.enabled ?? true,
    sortOrder: device.sortOrder ?? 0,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  }
}

/**
 * Lista todos os dispositivos
 */
export function listDevices(): DeviceOutput[] {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const devices = db.select().from(schema.devices).orderBy(asc(schema.devices.sortOrder)).all()

  return devices.map((device) => rowToOutput(device, fieldsKey))
}

/**
 * Busca um dispositivo por ID
 */
export function getDevice(id: string): DeviceOutput | null {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const device = db.select().from(schema.devices).where(eq(schema.devices.id, id)).get()

  if (!device) {
    return null
  }

  return rowToOutput(device, fieldsKey)
}

/**
 * Busca um dispositivo pelo deviceId da Tuya
 */
export function getDeviceByTuyaId(deviceId: string): DeviceOutput | null {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const device = db.select().from(schema.devices).where(eq(schema.devices.deviceId, deviceId)).get()

  if (!device) {
    return null
  }

  return rowToOutput(device, fieldsKey)
}

/**
 * Atualiza um dispositivo
 */
export function updateDevice(id: string, input: Partial<DeviceInput>): DeviceOutput | null {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const existing = db.select().from(schema.devices).where(eq(schema.devices.id, id)).get()

  if (!existing) {
    return null
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) {
    updates.name = input.name
  }

  if (input.deviceId !== undefined) {
    updates.deviceId = input.deviceId
  }

  if (input.localKey !== undefined) {
    updates.localKey = encryptField(input.localKey, fieldsKey)
  }

  if (input.ipAddress !== undefined) {
    updates.ipAddress = input.ipAddress
  }

  if (input.protocolVersion !== undefined) {
    updates.protocolVersion = input.protocolVersion
  }

  if (input.communicationMode !== undefined) {
    updates.communicationMode = input.communicationMode
  }

  if (input.category !== undefined) {
    updates.category = input.category
  }

  if (input.dpsMapping !== undefined) {
    updates.dpsMapping = input.dpsMapping
  }

  db.update(schema.devices).set(updates).where(eq(schema.devices.id, id)).run()

  return getDevice(id)
}

/**
 * Deleta um dispositivo
 */
export function deleteDevice(id: string): boolean {
  const db = getDb()

  const result = db.delete(schema.devices).where(eq(schema.devices.id, id)).run()

  return result.changes > 0
}

/**
 * Habilita ou desabilita um dispositivo
 */
export function toggleDeviceEnabled(id: string, enabled: boolean): DeviceOutput | null {
  const db = getDb()

  const existing = db.select().from(schema.devices).where(eq(schema.devices.id, id)).get()

  if (!existing) {
    return null
  }

  db.update(schema.devices)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(schema.devices.id, id))
    .run()

  return getDevice(id)
}

/**
 * Atualiza a ordem de um dispositivo
 */
export function updateDeviceOrder(id: string, sortOrder: number): DeviceOutput | null {
  const db = getDb()

  const existing = db.select().from(schema.devices).where(eq(schema.devices.id, id)).get()

  if (!existing) {
    return null
  }

  db.update(schema.devices)
    .set({ sortOrder, updatedAt: new Date() })
    .where(eq(schema.devices.id, id))
    .run()

  return getDevice(id)
}

/**
 * Conta o numero total de dispositivos
 */
export function countDevices(): number {
  const db = getDb()
  const result = db.select().from(schema.devices).all()
  return result.length
}
