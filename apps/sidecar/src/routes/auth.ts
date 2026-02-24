import { Router, type Request, type Response } from 'express'
import { unlinkSync, existsSync, writeFileSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  generateSalt,
  deriveMasterKey,
  deriveKeys,
  validatePassword,
  encryptField,
  decryptField,
} from '../services/crypto.js'
import { setSession, clearSession, isUnlocked, getSession } from '../services/session.js'
import {
  initDatabase,
  closeDatabase,
  isDatabaseConnected,
  getRawDb,
  getDb,
  schema,
  setAppMeta,
  getAppMeta,
} from '../db/index.js'
import { databaseExists, getDbPath, ensureAppDir, getAppDir } from '../utils/paths.js'
import { autoConnectEnabledDevices, clearAllConnections } from '../services/connection-manager.js'

const SALT_FILE = 'salt'

function getSaltPath(): string {
  return join(getAppDir(), SALT_FILE)
}

function saveSalt(salt: Buffer): void {
  ensureAppDir()
  writeFileSync(getSaltPath(), salt.toString('base64'), 'utf8')
}

function loadSalt(): Buffer | null {
  const saltPath = getSaltPath()
  if (!existsSync(saltPath)) {
    return null
  }
  const saltBase64 = readFileSync(saltPath, 'utf8').trim()
  return Buffer.from(saltBase64, 'base64')
}

const router = Router()

/**
 * GET /api/auth/status
 * Retorna o status de autenticacao do app
 */
router.get('/status', (_req: Request, res: Response) => {
  const isSetUp = databaseExists()
  const unlocked = isUnlocked()

  let isOnboardingComplete = false
  if (isSetUp && unlocked) {
    try {
      isOnboardingComplete = getAppMeta('onboardingComplete') === 'true'
    } catch {
      // Database might not be ready
    }
  }

  res.json({
    success: true,
    data: {
      isSetUp,
      isUnlocked: unlocked,
      isOnboardingComplete,
    },
  })
})

/**
 * POST /api/auth/setup
 * Primeiro uso: cria a senha e inicializa o banco
 */
router.post('/setup', async (req: Request, res: Response) => {
  try {
    const { password } = req.body

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Password is required' },
      })
      return
    }

    // Verifica se ja foi configurado
    if (databaseExists()) {
      res.status(400).json({
        success: false,
        error: { code: 'ALREADY_SETUP', message: 'App is already set up. Use login instead.' },
      })
      return
    }

    // Valida a senha
    const validation = validatePassword(password)
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: validation.error },
      })
      return
    }

    // Gera salt e deriva chaves
    const salt = generateSalt()
    const masterKey = await deriveMasterKey(password, salt)
    const keys = await deriveKeys(masterKey)

    // Garante que o diretorio existe
    ensureAppDir()

    // Salva o salt em arquivo separado (necessario para login futuro)
    // O salt precisa estar fora do banco criptografado para poder derivar a chave
    saveSalt(salt)

    // Inicializa o banco com a chave derivada
    initDatabase(keys.sqlCipherKey)

    // Salva metadados no banco
    setAppMeta('version', '1')

    // Define a sessao
    setSession(keys)

    res.json({
      success: true,
      data: { message: 'Setup completed successfully' },
    })
  } catch (error) {
    console.error('Setup error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'SETUP_ERROR', message: 'Failed to setup app' },
    })
  }
})

/**
 * POST /api/auth/login
 * Desbloqueia o app com a senha
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = req.body

    if (!password || typeof password !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Password is required' },
      })
      return
    }

    // Verifica se o banco existe
    if (!databaseExists()) {
      res.status(400).json({
        success: false,
        error: { code: 'NOT_SETUP', message: 'App is not set up. Use setup first.' },
      })
      return
    }

    // Ja esta logado?
    if (isUnlocked()) {
      res.json({
        success: true,
        data: { message: 'Already logged in' },
      })
      return
    }

    // Carrega o salt do arquivo
    const salt = loadSalt()
    if (!salt) {
      res.status(500).json({
        success: false,
        error: {
          code: 'SALT_NOT_FOUND',
          message: 'Salt file not found. Database may be corrupted.',
        },
      })
      return
    }

    // Deriva as chaves
    const masterKey = await deriveMasterKey(password, salt)
    const keys = await deriveKeys(masterKey)

    // Tenta abrir o banco - se a senha estiver errada, vai falhar
    try {
      initDatabase(keys.sqlCipherKey)
    } catch {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Invalid password' },
      })
      return
    }

    // Define a sessao
    setSession(keys)

    // Auto-conecta dispositivos habilitados (NFR-104)
    autoConnectEnabledDevices().catch((err) => {
      console.error('[Auth] Erro no auto-connect:', err)
    })

    res.json({
      success: true,
      data: { message: 'Login successful' },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_PASSWORD', message: 'Invalid password' },
    })
  }
})

/**
 * POST /api/auth/logout
 * Bloqueia o app (limpa a sessao)
 */
router.post('/logout', (_req: Request, res: Response) => {
  clearAllConnections()
  closeDatabase()
  clearSession()

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  })
})

/**
 * POST /api/auth/change-password
 * Altera a senha do app
 */
router.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Current and new passwords are required' },
      })
      return
    }

    if (!isUnlocked()) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'App is locked' },
      })
      return
    }

    // Valida a nova senha
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: validation.error },
      })
      return
    }

    // Carrega o salt atual
    const currentSalt = loadSalt()
    if (!currentSalt) {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Salt not found' },
      })
      return
    }
    const currentMasterKey = await deriveMasterKey(currentPassword, currentSalt)
    const currentKeys = await deriveKeys(currentMasterKey)

    // Verifica se a senha atual esta correta
    const currentSession = getSession()
    if (currentKeys.sqlCipherKey !== currentSession?.sqlCipherKey) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
      })
      return
    }

    // Gera novo salt e deriva novas chaves
    const newSalt = generateSalt()
    const newMasterKey = await deriveMasterKey(newPassword, newSalt)
    const newKeys = await deriveKeys(newMasterKey)

    // Re-criptografa campos sensiveis e rekey do SQLCipher em uma transacao
    const rawDb = getRawDb()
    const db = getDb()
    const oldFieldsKey = currentKeys.fieldsKey
    const newFieldsKey = newKeys.fieldsKey

    const reEncrypt = rawDb.transaction(() => {
      // 1. Re-criptografar localKey de todos os devices
      const allDevices = db.select().from(schema.devices).all()
      for (const device of allDevices) {
        const plainLocalKey = decryptField(device.localKey, oldFieldsKey)
        const reEncrypted = encryptField(plainLocalKey, newFieldsKey)
        rawDb.prepare('UPDATE devices SET local_key = ? WHERE id = ?').run(reEncrypted, device.id)
      }

      // 2. Re-criptografar accessId e accessSecret das cloud credentials
      const allCreds = db.select().from(schema.cloudCredentials).all()
      for (const cred of allCreds) {
        const plainAccessId = decryptField(cred.accessId, oldFieldsKey)
        const plainAccessSecret = decryptField(cred.accessSecret, oldFieldsKey)
        const reEncryptedId = encryptField(plainAccessId, newFieldsKey)
        const reEncryptedSecret = encryptField(plainAccessSecret, newFieldsKey)
        rawDb
          .prepare('UPDATE cloud_credentials SET access_id = ?, access_secret = ? WHERE id = ?')
          .run(reEncryptedId, reEncryptedSecret, cred.id)
      }

      // 3. Rekey do SQLCipher (altera a chave do banco inteiro)
      rawDb.pragma(`rekey = "x'${newKeys.sqlCipherKey}'"`)
    })

    reEncrypt()

    // Atualiza o salt no arquivo
    saveSalt(newSalt)

    // Atualiza a sessao com as novas chaves
    setSession(newKeys)

    res.json({
      success: true,
      data: { message: 'Password changed successfully' },
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' },
    })
  }
})

/**
 * POST /api/auth/reset
 * Reset total: apaga todos os dados
 */
router.post('/reset', (req: Request, res: Response) => {
  try {
    const { confirmation } = req.body

    if (confirmation !== 'APAGAR DADOS') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CONFIRMATION',
          message: 'You must type "APAGAR DADOS" to confirm reset',
        },
      })
      return
    }

    // Fecha o banco se estiver aberto
    if (isDatabaseConnected()) {
      closeDatabase()
    }
    clearSession()

    // Deleta o arquivo do banco
    const dbPath = getDbPath()
    if (existsSync(dbPath)) {
      unlinkSync(dbPath)
    }

    // Deleta o arquivo de salt
    const saltPath = getSaltPath()
    if (existsSync(saltPath)) {
      unlinkSync(saltPath)
    }

    res.json({
      success: true,
      data: { message: 'All data has been deleted' },
    })
  } catch (error) {
    console.error('Reset error:', error)
    res.status(500).json({
      success: false,
      error: { code: 'RESET_ERROR', message: 'Failed to reset app' },
    })
  }
})

/**
 * POST /api/auth/onboarding-complete
 * Marca o onboarding como concluido
 */
router.post('/onboarding-complete', (_req: Request, res: Response) => {
  if (!isUnlocked()) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'App is locked' },
    })
    return
  }

  setAppMeta('onboardingComplete', 'true')
  res.json({
    success: true,
    data: { message: 'Onboarding completed' },
  })
})

export default router
