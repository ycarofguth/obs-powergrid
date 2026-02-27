import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const GITHUB_OWNER = 'ycarofguth'
const GITHUB_REPO = 'obs-powergrid'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

interface GitHubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
  prerelease: boolean
  draft: boolean
}

interface UpdateInfo {
  currentVersion: string
  latestVersion: string | null
  updateAvailable: boolean
  releaseUrl: string | null
  releaseNotes: string | null
  releaseName: string | null
  publishedAt: string | null
  lastChecked: string | null
}

let cachedRelease: GitHubRelease | null = null
let lastFetchTime = 0

function getCurrentVersion(): string {
  try {
    const rootPkg = join(process.cwd(), 'package.json')
    const pkg = JSON.parse(readFileSync(rootPkg, 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

function compareVersions(current: string, latest: string): boolean {
  const normalize = (v: string) => v.replace(/^v/, '')
  const c = normalize(current).split('.').map(Number)
  const l = normalize(latest).split('.').map(Number)

  for (let i = 0; i < 3; i++) {
    const cv = c[i] || 0
    const lv = l[i] || 0
    if (lv > cv) return true
    if (lv < cv) return false
  }
  return false
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  const now = Date.now()
  if (cachedRelease && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedRelease
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'obs-powergrid',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      console.log(`[UpdateChecker] GitHub API returned ${response.status}`)
      return cachedRelease
    }

    const data = (await response.json()) as GitHubRelease
    cachedRelease = data
    lastFetchTime = now
    return data
  } catch (err) {
    console.log('[UpdateChecker] Failed to fetch release:', (err as Error).message)
    return cachedRelease
  }
}

export async function checkForUpdate(forceRefresh = false): Promise<UpdateInfo> {
  const currentVersion = getCurrentVersion()

  if (forceRefresh) {
    lastFetchTime = 0
  }

  const release = await fetchLatestRelease()

  if (!release) {
    return {
      currentVersion,
      latestVersion: null,
      updateAvailable: false,
      releaseUrl: null,
      releaseNotes: null,
      releaseName: null,
      publishedAt: null,
      lastChecked: lastFetchTime ? new Date(lastFetchTime).toISOString() : null,
    }
  }

  const latestVersion = release.tag_name.replace(/^v/, '')
  const updateAvailable = compareVersions(currentVersion, latestVersion)

  return {
    currentVersion,
    latestVersion,
    updateAvailable,
    releaseUrl: release.html_url,
    releaseNotes: release.body,
    releaseName: release.name,
    publishedAt: release.published_at,
    lastChecked: new Date(lastFetchTime).toISOString(),
  }
}

export async function getChangelog(): Promise<
  Array<{ version: string; name: string; body: string; date: string; url: string }>
> {
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases?per_page=10`
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'obs-powergrid',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return []

    const releases = (await response.json()) as GitHubRelease[]
    return releases
      .filter((r) => !r.draft)
      .map((r) => ({
        version: r.tag_name,
        name: r.name,
        body: r.body || '',
        date: r.published_at,
        url: r.html_url,
      }))
  } catch {
    return []
  }
}
