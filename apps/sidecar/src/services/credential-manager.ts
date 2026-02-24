import { getDb, schema } from '../db/index.js'
import { encryptField, decryptField } from './crypto.js'
import { getFieldsKey } from './session.js'

export interface CloudCredentialsInput {
  accessId: string
  accessSecret: string
  region?: string
}

export interface CloudCredentialsOutput {
  accessId: string
  accessSecret: string
  region: string
  updatedAt: Date
}

export function hasCloudCredentials(): boolean {
  const db = getDb()
  const result = db.select().from(schema.cloudCredentials).limit(1).all()
  return result.length > 0
}

export function getCloudCredentials(): CloudCredentialsOutput | null {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const result = db.select().from(schema.cloudCredentials).limit(1).all()
  const row = result[0]
  if (!row) return null

  return {
    accessId: decryptField(row.accessId, fieldsKey),
    accessSecret: decryptField(row.accessSecret, fieldsKey),
    region: row.region || 'us',
    updatedAt: row.updatedAt,
  }
}

export function saveCloudCredentials(input: CloudCredentialsInput): void {
  const db = getDb()
  const fieldsKey = getFieldsKey()

  const encryptedAccessId = encryptField(input.accessId, fieldsKey)
  const encryptedAccessSecret = encryptField(input.accessSecret, fieldsKey)

  // Deletar credenciais existentes (so mantemos uma)
  db.delete(schema.cloudCredentials).run()

  // Inserir novas
  db.insert(schema.cloudCredentials)
    .values({
      accessId: encryptedAccessId,
      accessSecret: encryptedAccessSecret,
      region: input.region || 'us',
      updatedAt: new Date(),
    })
    .run()
}

export function deleteCloudCredentials(): void {
  const db = getDb()
  db.delete(schema.cloudCredentials).run()
}
