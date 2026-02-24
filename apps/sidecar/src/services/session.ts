import type { DerivedKeys } from './crypto.js'

interface SessionData {
  keys: DerivedKeys
  unlockedAt: Date
}

let currentSession: SessionData | null = null

/**
 * Define a sessao atual com as chaves derivadas
 */
export function setSession(keys: DerivedKeys): void {
  currentSession = {
    keys,
    unlockedAt: new Date(),
  }
}

/**
 * Retorna as chaves da sessao atual ou null se nao estiver logado
 */
export function getSession(): DerivedKeys | null {
  return currentSession?.keys ?? null
}

/**
 * Retorna a chave de criptografia de campos ou lanca erro se nao estiver logado
 */
export function getFieldsKey(): Buffer {
  if (!currentSession) {
    throw new Error('Session not initialized')
  }
  return currentSession.keys.fieldsKey
}

/**
 * Retorna a chave do SQLCipher ou lanca erro se nao estiver logado
 */
export function getSqlCipherKey(): string {
  if (!currentSession) {
    throw new Error('Session not initialized')
  }
  return currentSession.keys.sqlCipherKey
}

/**
 * Limpa a sessao atual (logout)
 */
export function clearSession(): void {
  currentSession = null
}

/**
 * Verifica se o app esta desbloqueado (usuario logado)
 */
export function isUnlocked(): boolean {
  return currentSession !== null
}

/**
 * Retorna quando a sessao foi desbloqueada
 */
export function getUnlockedAt(): Date | null {
  return currentSession?.unlockedAt ?? null
}
