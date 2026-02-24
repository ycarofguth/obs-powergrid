/**
 * dev-neu.ts — Orchestration script for Neutralino + Vite + Sidecar dev mode.
 *
 * Strategy: Patch neutralino.config.json to set url to Vite's dev server.
 * Neutralino opens a WebView pointing at Vite, so everything is same-origin.
 * The app/index.html includes __neutralino_globals.js from Neutralino's
 * internal server (classic script, no CORS restriction) to inject NL_PORT etc.
 *
 * Steps:
 * 1. Start Sidecar (tsx watch) in background
 * 2. Start Vite dev server in background
 * 3. Wait for both services to be ready
 * 4. Patch neutralino.config.json (url → Vite URL)
 * 5. Run `npx neu run`
 * 6. On exit, restore neutralino.config.json and kill child processes
 *
 * Recovery: If the script is killed without cleanup, the backup file
 * (.neutralino.config.json.bak) is detected and restored on the next run.
 */

import { spawn, ChildProcess } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
  existsSync,
  copyFileSync,
  unlinkSync,
  mkdirSync,
} from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CONFIG_PATH = resolve(ROOT, 'neutralino.config.json')
const CONFIG_BACKUP = resolve(ROOT, '.neutralino.config.json.bak')
const DIST_DIR = resolve(ROOT, 'apps/desktop/dist')
const VITE_URL = 'http://localhost:47533'
const SIDECAR_URL = 'http://localhost:47531'
const POLL_INTERVAL_MS = 500
const POLL_TIMEOUT_MS = 30_000

const children: ChildProcess[] = []

function log(msg: string) {
  console.log(`[dev-neu] ${msg}`)
}

function restoreFromBackup() {
  if (existsSync(CONFIG_BACKUP)) {
    copyFileSync(CONFIG_BACKUP, CONFIG_PATH)
    unlinkSync(CONFIG_BACKUP)
    log('Restored neutralino.config.json from backup')
  }
}

function ensureDistAssets() {
  if (!existsSync(DIST_DIR)) {
    mkdirSync(DIST_DIR, { recursive: true })
  }
  const assets = ['icon.png', 'neutralino.js']
  for (const file of assets) {
    const src = resolve(ROOT, 'apps/desktop/public', file)
    const dst = resolve(DIST_DIR, file)
    if (existsSync(src) && !existsSync(dst)) {
      copyFileSync(src, dst)
    }
  }
}

function killChildren() {
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill('SIGTERM')
    }
  }
}

function cleanup() {
  restoreFromBackup()
  killChildren()
}

// Ensure cleanup on any exit path
process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})
process.on('SIGTERM', () => {
  cleanup()
  process.exit(0)
})
process.on('exit', () => {
  cleanup()
})

// --- Recovery: restore from previous crash ---
restoreFromBackup()

// --- Ensure icon.png and neutralino.js exist in app/dist ---
ensureDistAssets()

// --- Step 1: Start Sidecar ---
log('Starting Sidecar...')
const sidecar = spawn('pnpm', ['--filter', '@obs-tuya/sidecar', 'dev'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
})
children.push(sidecar)

sidecar.on('error', (err) => {
  console.error('[dev-neu] Sidecar process error:', err)
  cleanup()
  process.exit(1)
})

// --- Step 2: Start Vite dev server ---
log('Starting Vite dev server...')
const vite = spawn('pnpm', ['--filter', '@obs-tuya/desktop', 'dev'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
})
children.push(vite)

vite.on('error', (err) => {
  console.error('[dev-neu] Vite process error:', err)
  cleanup()
  process.exit(1)
})

// --- Step 3: Wait for services to be ready ---
async function waitForService(name: string, url: string): Promise<void> {
  const start = Date.now()
  log(`Waiting for ${name} at ${url}...`)

  while (Date.now() - start < POLL_TIMEOUT_MS) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status < 500) {
        log(`${name} is ready.`)
        return
      }
    } catch {
      // Not ready yet
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }

  throw new Error(`${name} did not start within ${POLL_TIMEOUT_MS / 1000}s`)
}

async function main() {
  // Wait for both services in parallel
  await Promise.all([
    waitForService('Sidecar', `${SIDECAR_URL}/api/health`),
    waitForService('Vite', VITE_URL),
  ])

  // --- Step 4: Patch neutralino.config.json ---
  copyFileSync(CONFIG_PATH, CONFIG_BACKUP)

  const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'))
  config.url = VITE_URL
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8')
  log(`Patched neutralino.config.json: url → ${VITE_URL}`)

  // --- Step 5: Run neu ---
  log('Starting Neutralino...')
  const neu = spawn('npx', ['neu', 'run'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true,
  })
  children.push(neu)

  neu.on('error', (err) => {
    console.error('[dev-neu] Neutralino process error:', err)
    cleanup()
    process.exit(1)
  })

  neu.on('close', (code) => {
    log(`Neutralino exited with code ${code}`)
    cleanup()
    process.exit(code ?? 0)
  })
}

main().catch((err) => {
  console.error('[dev-neu]', err.message || err)
  cleanup()
  process.exit(1)
})
