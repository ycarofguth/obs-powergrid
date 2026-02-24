import argon2 from 'argon2'
import { hkdf, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { promisify } from 'node:util'

const hkdfAsync = promisify(hkdf)

// Parametros Argon2id (OWASP recommendations)
const ARGON2_MEMORY = 65536 // 64 MB
const ARGON2_ITERATIONS = 3
const ARGON2_PARALLELISM = 1
const ARGON2_HASH_LENGTH = 32

const SALT_LENGTH = 16
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

export interface DerivedKeys {
  sqlCipherKey: string
  fieldsKey: Buffer
}

/**
 * Gera um salt aleatorio para derivacao de chave
 */
export function generateSalt(): Buffer {
  return randomBytes(SALT_LENGTH)
}

/**
 * Deriva a master key a partir da senha usando Argon2id
 * Esta funcao e propositalmente lenta para dificultar ataques de forca bruta
 */
export async function deriveMasterKey(password: string, salt: Buffer): Promise<Buffer> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: ARGON2_MEMORY,
    timeCost: ARGON2_ITERATIONS,
    parallelism: ARGON2_PARALLELISM,
    hashLength: ARGON2_HASH_LENGTH,
    salt,
    raw: true,
  })
}

/**
 * Deriva as chaves especificas (SQLCipher e campos) a partir da master key
 * usando HKDF para separacao de dominios
 */
export async function deriveKeys(masterKey: Buffer): Promise<DerivedKeys> {
  const sqlCipherKeyBuffer = await hkdfAsync('sha256', masterKey, '', 'sqlcipher', 32)
  const fieldsKey = await hkdfAsync('sha256', masterKey, '', 'fields', 32)

  return {
    sqlCipherKey: Buffer.from(sqlCipherKeyBuffer).toString('hex'),
    fieldsKey: Buffer.from(fieldsKey),
  }
}

/**
 * Criptografa um campo sensivel usando AES-256-GCM
 * Formato do output: [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext]
 */
export function encryptField(plaintext: string, key: Buffer): Buffer {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv('aes-256-gcm', key, iv)

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, ciphertext])
}

/**
 * Decriptografa um campo usando AES-256-GCM
 * Espera o formato: [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext]
 */
export function decryptField(encrypted: Buffer, key: Buffer): string {
  const iv = encrypted.subarray(0, IV_LENGTH)
  const authTag = encrypted.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = encrypted.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

/**
 * Verifica se uma senha atende aos requisitos minimos
 * Requisitos: minimo 8 caracteres
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'A senha deve ter no minimo 8 caracteres' }
  }
  return { valid: true }
}

/**
 * Gera um UUID v4 para identificadores unicos
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}
