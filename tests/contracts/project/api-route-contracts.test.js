import { describe, expect, it, vi } from 'vitest'
import { listProjectFiles, readRepoFile } from '../../support/projectSurface.js'

const routeFiles = listProjectFiles(
  'app/api',
  (relPath) => /\/route\.js$/i.test(relPath),
)

const handlerExportRx =
  /\bexport\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b|\bexport\s+const\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b|\bexport\s*\{[^}]*\b(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b[^}]*\}/m

describe('API route contracts', () => {
  it('discovers the repository route surface', () => {
    expect(routeFiles.length).toBeGreaterThan(25)
  })

  it.each(routeFiles)('%s exports at least one HTTP handler', (routeFile) => {
    const source = readRepoFile(routeFile)
    expect(source).toMatch(handlerExportRx)
  })

  it('keeps profile save route wired for one-time gender and birth-year persistence', () => {
    const source = readRepoFile('app/api/profile/save-nick/route.js')

    expect(source).toContain('gender')
    expect(source).toContain('birthYear')
    expect(source).toContain('invalid_gender')
    expect(source).toContain('invalid_birth_year')
  })

  it('keeps profile get route returning private identity fields only for the same account', () => {
    const source = readRepoFile('app/api/profile/get-profile/route.js')

    expect(source).toContain('includePrivateIdentity')
    expect(source).toContain('gender:')
    expect(source).toContain('birthYear:')
  })

  it('keeps the forum diagnostics route inert behind the master flag', () => {
    const source = readRepoFile('app/api/debug/forum-diag/route.js')

    expect(source).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED')
    expect(source).toContain('FORUM_DIAG_MASTER_ENABLED')
    expect(source).toContain('diag_master_disabled')
  })

  it('keeps wallet sessions bound to the latest account token and hard logout cleanup', () => {
    const route = readRepoFile('app/api/wallet-session/route.js')
    const client = readRepoFile('lib/walletSessionClient.js')
    const topBar = readRepoFile('components/TopBar.js')
    const runtime = readRepoFile('components/WalletRuntimeBridge.jsx')
    const authNav = readRepoFile('components/AuthNavClient.jsx')

    expect(route).toContain('LATEST_SESSION_PREFIX')
    expect(route).toContain('latestSessionKey')
    expect(route).toContain('ensureSessionIsLatest')
    expect(route).toContain('stale_session')
    expect(route).toContain('markLatestLoggedOutIfCurrent')

    expect(client).toContain('dispatchWalletLogout')
    expect(client).toContain('AUTHORITATIVE_SESSION_ERRORS')
    expect(client).toContain('transient: !authoritative')
    expect(client).toContain("'ql7_vip'")
    expect(topBar).toContain("'ql7_wallet_session_token'")

    expect(runtime).toContain('RUNTIME_OPEN_DELAY_MS')
    expect(runtime).toContain('prev.mode === nextMode')
    expect(authNav).toContain('checking || opening')
    expect(authNav).toContain('result?.transient')
    expect(authNav).toContain('WALLET_SESSION_REVERIFY_MS')
    expect(authNav).toContain('verifySession({ silent: true })')
  })

  it('executes wallet-session latest-token replacement without killing the newest session', async () => {
    const envKeys = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
      'WALLET_SESSION_TTL_SECONDS',
    ]
    const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))

    try {
      for (const key of envKeys) delete process.env[key]
      globalThis.__QL7_WALLET_SESSION_MEMORY__ = new Map()
      vi.resetModules()

      const { POST } = await import('../../../app/api/wallet-session/route.js')
      const walletAddress = '0x1111111111111111111111111111111111111111'
      const post = async (payload) => {
        const response = await POST(new Request('https://example.test/api/wallet-session', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }))
        return {
          status: response.status,
          json: await response.json(),
        }
      }

      const first = await post({ action: 'create', walletAddress, provider: 'metamask' })
      expect(first.status).toBe(200)
      expect(first.json.authorized).toBe(true)

      const firstVerify = await post({ action: 'verify', token: first.json.token, walletAddress })
      expect(firstVerify.status).toBe(200)
      expect(firstVerify.json.authorized).toBe(true)

      const second = await post({ action: 'create', walletAddress, provider: 'walletconnect' })
      expect(second.status).toBe(200)
      expect(second.json.authorized).toBe(true)
      expect(second.json.token).not.toBe(first.json.token)

      const staleFirst = await post({ action: 'verify', token: first.json.token, walletAddress })
      expect(staleFirst.status).toBe(401)
      expect(staleFirst.json).toMatchObject({ authorized: false, error: 'stale_session' })

      const oldLogout = await post({ action: 'logout', token: first.json.token, walletAddress })
      expect(oldLogout.status).toBe(200)
      expect(oldLogout.json.loggedOut).toBe(true)

      const newestStillValid = await post({ action: 'verify', token: second.json.token, walletAddress })
      expect(newestStillValid.status).toBe(200)
      expect(newestStillValid.json.authorized).toBe(true)
    } finally {
      for (const key of envKeys) {
        if (typeof previousEnv[key] === 'undefined') delete process.env[key]
        else process.env[key] = previousEnv[key]
      }
      vi.resetModules()
    }
  })
})
