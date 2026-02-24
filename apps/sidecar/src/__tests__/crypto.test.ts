import { describe, it, expect } from 'vitest'
import {
  generateSalt,
  deriveMasterKey,
  deriveKeys,
  encryptField,
  decryptField,
  validatePassword,
  generateUUID,
} from '../services/crypto.js'

describe('crypto service', () => {
  describe('generateSalt', () => {
    it('should generate a 16-byte salt', () => {
      const salt = generateSalt()
      expect(salt).toBeInstanceOf(Buffer)
      expect(salt.length).toBe(16)
    })

    it('should generate unique salts', () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      expect(salt1.toString('hex')).not.toBe(salt2.toString('hex'))
    })
  })

  describe('deriveMasterKey', () => {
    it('should derive a 32-byte master key', async () => {
      const salt = generateSalt()
      const masterKey = await deriveMasterKey('testpassword', salt)
      expect(masterKey).toBeInstanceOf(Buffer)
      expect(masterKey.length).toBe(32)
    })

    it('should produce same key for same password and salt', async () => {
      const salt = generateSalt()
      const key1 = await deriveMasterKey('testpassword', salt)
      const key2 = await deriveMasterKey('testpassword', salt)
      expect(key1.toString('hex')).toBe(key2.toString('hex'))
    })

    it('should produce different keys for different passwords', async () => {
      const salt = generateSalt()
      const key1 = await deriveMasterKey('password1', salt)
      const key2 = await deriveMasterKey('password2', salt)
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'))
    })

    it('should produce different keys for different salts', async () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      const key1 = await deriveMasterKey('testpassword', salt1)
      const key2 = await deriveMasterKey('testpassword', salt2)
      expect(key1.toString('hex')).not.toBe(key2.toString('hex'))
    })
  })

  describe('deriveKeys', () => {
    it('should derive sqlCipherKey and fieldsKey', async () => {
      const salt = generateSalt()
      const masterKey = await deriveMasterKey('testpassword', salt)
      const keys = await deriveKeys(masterKey)

      expect(keys.sqlCipherKey).toBeDefined()
      expect(typeof keys.sqlCipherKey).toBe('string')
      expect(keys.sqlCipherKey.length).toBe(64) // 32 bytes in hex

      expect(keys.fieldsKey).toBeInstanceOf(Buffer)
      expect(keys.fieldsKey.length).toBe(32)
    })

    it('should produce same keys for same master key', async () => {
      const salt = generateSalt()
      const masterKey = await deriveMasterKey('testpassword', salt)
      const keys1 = await deriveKeys(masterKey)
      const keys2 = await deriveKeys(masterKey)

      expect(keys1.sqlCipherKey).toBe(keys2.sqlCipherKey)
      expect(keys1.fieldsKey.toString('hex')).toBe(keys2.fieldsKey.toString('hex'))
    })
  })

  describe('encryptField and decryptField', () => {
    it('should encrypt and decrypt a string', async () => {
      const salt = generateSalt()
      const masterKey = await deriveMasterKey('testpassword', salt)
      const keys = await deriveKeys(masterKey)

      const plaintext = 'my secret local key'
      const encrypted = encryptField(plaintext, keys.fieldsKey)
      const decrypted = decryptField(encrypted, keys.fieldsKey)

      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext', async () => {
      const salt = generateSalt()
      const masterKey = await deriveMasterKey('testpassword', salt)
      const keys = await deriveKeys(masterKey)

      const plaintext = 'my secret local key'
      const encrypted1 = encryptField(plaintext, keys.fieldsKey)
      const encrypted2 = encryptField(plaintext, keys.fieldsKey)

      // Different IVs should produce different ciphertexts
      expect(encrypted1.toString('hex')).not.toBe(encrypted2.toString('hex'))

      // But both should decrypt to the same plaintext
      expect(decryptField(encrypted1, keys.fieldsKey)).toBe(plaintext)
      expect(decryptField(encrypted2, keys.fieldsKey)).toBe(plaintext)
    })

    it('should fail to decrypt with wrong key', async () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      const masterKey1 = await deriveMasterKey('password1', salt1)
      const masterKey2 = await deriveMasterKey('password2', salt2)
      const keys1 = await deriveKeys(masterKey1)
      const keys2 = await deriveKeys(masterKey2)

      const plaintext = 'my secret local key'
      const encrypted = encryptField(plaintext, keys1.fieldsKey)

      expect(() => decryptField(encrypted, keys2.fieldsKey)).toThrow()
    })

    it('should re-encrypt field from old key to new key', async () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      const masterKey1 = await deriveMasterKey('oldpassword', salt1)
      const masterKey2 = await deriveMasterKey('newpassword', salt2)
      const oldKeys = await deriveKeys(masterKey1)
      const newKeys = await deriveKeys(masterKey2)

      const plaintext = 'my secret local key'

      // Criptografa com chave antiga
      const encryptedOld = encryptField(plaintext, oldKeys.fieldsKey)
      expect(decryptField(encryptedOld, oldKeys.fieldsKey)).toBe(plaintext)

      // Re-criptografa: decripta com chave antiga, criptografa com chave nova
      const decrypted = decryptField(encryptedOld, oldKeys.fieldsKey)
      const encryptedNew = encryptField(decrypted, newKeys.fieldsKey)

      // Chave nova decripta corretamente
      expect(decryptField(encryptedNew, newKeys.fieldsKey)).toBe(plaintext)

      // Chave antiga nao decripta o novo ciphertext
      expect(() => decryptField(encryptedNew, oldKeys.fieldsKey)).toThrow()
    })
  })

  describe('validatePassword', () => {
    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('1234567').valid).toBe(false)
      expect(validatePassword('1234567').error).toBeDefined()
    })

    it('should accept passwords with 8 or more characters', () => {
      expect(validatePassword('12345678').valid).toBe(true)
      expect(validatePassword('12345678').error).toBeUndefined()
    })
  })

  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })
})
