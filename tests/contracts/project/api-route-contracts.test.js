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
    expect(route).toContain('__QL7_WALLET_SESSION_READ_CACHE__')
    expect(route).toContain('WALLET_SESSION_PROCESS_CACHE_MS')
    expect(route).toContain('redisReadInflight')
    expect(route).toContain('readCacheDelete(key)')
    expect(route).toContain('canPersistReadCache')

    expect(client).toContain('dispatchWalletLogout')
    expect(client).toContain('AUTHORITATIVE_SESSION_ERRORS')
    expect(client).toContain('transient: !authoritative')
    expect(client).toContain("'ql7_vip'")
    expect(client).toContain('AUTH_LOGOUT_LOCK_KEY')
    expect(client).toContain('markAuthLogoutLock()')
    expect(client).toContain('__QL7_AUTH_LOGGED_OUT__')
    expect(client).toContain('__QL7_AUTH_LOGOUT_RELOAD_SCHEDULED__')
    expect(topBar).toContain("'ql7_wallet_session_token'")

    expect(runtime).toContain('RUNTIME_OPEN_DELAY_MS')
    expect(runtime).toContain('prev.mode === nextMode')
    expect(runtime).toContain('openedRef.current = true')
    expect(runtime).toContain('openAttemptedRef')
    expect(runtime).toContain('modalWasOpenRef')
    expect(runtime).toContain('MODAL_OPEN_BOOTSTRAP_TIMEOUT_MS')
    expect(runtime).toContain('modal_open_timeout')
    expect(authNav).toContain('checking || opening')
    expect(authNav).toContain('result?.transient')
    expect(runtime).toContain('WALLET_SESSION_WATCHDOG_MS = 60 * 1000')
    expect(runtime).toContain('verifyStoredWalletSession')
    expect(runtime).toContain('sessionWatchdogInFlightRef')
    expect(runtime).toContain('window.setInterval')
    expect(runtime).toContain("window.addEventListener('pageshow', onPageShow)")
    expect(runtime).toContain("document.addEventListener('visibilitychange', onVisibilityChange)")
    expect(authNav).toContain('WALLET_SESSION_FOCUS_REVERIFY_MS')
    expect(authNav).toContain('verifyInFlightRef')
    expect(authNav).toContain('lastVerifyAtRef')
    expect(authNav).toContain('verifySession({ force: true })')
    expect(authNav).toContain('verifySession({ minAgeMs: WALLET_SESSION_FOCUS_REVERIFY_MS })')
    expect(authNav).toContain("window.addEventListener('pageshow', refreshAfterReturn)")
    expect(authNav).toContain("document.addEventListener('visibilitychange', refreshAfterReturn)")
    expect(authNav).toContain('void refreshTgLinkStatus()')
    expect(authNav).toContain('if (!stored.token) return')
    expect(authNav).toContain('effectiveAccountId')
  })

  it('requires a matching active wallet session before issuing a Telegram link nonce', () => {
    const route = readRepoFile('app/api/telegram/link/start/route.js')
    const authNav = readRepoFile('components/AuthNavClient.jsx')
    expect(route).toContain('VERIFIED_WALLET_SESSION_REQUIRED')
    expect(route).toContain('latestWalletSessionKey')
    expect(route).toContain('latestToken(record) !== token')
    expect(route).toContain("new Redis({ url, token })")
    expect(authNav).toContain('walletSessionToken: stored.token')
    expect(authNav).toContain('walletAddress: stored.walletAddress || account')
  })

  it('rejects forged and stale wallet proofs before Telegram link nonce storage', async () => {
    const envKeys = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
    ]
    const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
    const walletAddress = '0x2222222222222222222222222222222222222222'
    const forgedWallet = '0x3333333333333333333333333333333333333333'
    const token = 'ql7ws_contract_active_wallet_proof'
    const expiresAt = Date.now() + 60_000

    try {
      for (const key of envKeys) delete process.env[key]
      globalThis.__QL7_WALLET_SESSION_MEMORY__ = new Map([
        [`wallet_session:${token}`, {
          value: { token, status: 'active', accountId: walletAddress, walletAddress, expiresAt },
          expiresAt,
        }],
        [`wallet_session_latest:${walletAddress.toLowerCase()}`, {
          value: { token, status: 'active', accountId: walletAddress, walletAddress, expiresAt },
          expiresAt,
        }],
      ])
      vi.resetModules()
      const { POST } = await import('../../../app/api/telegram/link/start/route.js')
      const post = async (payload) => {
        const response = await POST(new Request('https://example.test/api/telegram/link/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        }))
        return { status: response.status, json: await response.json() }
      }

      const verified = await post({ accountId: walletAddress, walletAddress, walletSessionToken: token })
      expect(verified).toMatchObject({ status: 503, json: { error: 'LINK_STORAGE_UNAVAILABLE' } })

      const forged = await post({ accountId: forgedWallet, walletAddress: forgedWallet, walletSessionToken: token })
      expect(forged).toMatchObject({ status: 401, json: { error: 'VERIFIED_WALLET_SESSION_REQUIRED' } })

      globalThis.__QL7_WALLET_SESSION_MEMORY__.set(
        `wallet_session_latest:${walletAddress.toLowerCase()}`,
        {
          value: { token: 'ql7ws_newer_session', status: 'active', accountId: walletAddress, walletAddress, expiresAt },
          expiresAt,
        },
      )
      const stale = await post({ accountId: walletAddress, walletAddress, walletSessionToken: token })
      expect(stale).toMatchObject({ status: 401, json: { error: 'VERIFIED_WALLET_SESSION_REQUIRED' } })
    } finally {
      for (const key of envKeys) {
        if (typeof previousEnv[key] === 'undefined') delete process.env[key]
        else process.env[key] = previousEnv[key]
      }
      delete globalThis.__QL7_WALLET_SESSION_MEMORY__
      vi.resetModules()
    }
  })

  it('binds account deletion to the verified Wallet or Telegram side', () => {
    const route = readRepoFile('app/api/profile/delete-account/route.js')
    const telegramProof = route.indexOf('const verifiedTelegramSession = await requireVerifiedTelegramSession')
    const walletProof = route.indexOf('verifiedTelegramSession || await requireVerifiedWalletSession')

    expect(telegramProof).toBeGreaterThanOrEqual(0)
    expect(walletProof).toBeGreaterThan(telegramProof)
    expect(route).toContain("identityScope = verifiedSession.provider === 'telegram-mini-app' ? 'telegram' : 'wallet'")
    expect(route).toContain('latestWalletSessionKey(session.walletAddress)')
    expect(route).toContain('latestSessionToken(record) !== token')
    expect(route).toContain('accountId: deletionSubjectId')
    expect(route).toContain('identityScope,')
    expect(route).toContain('canonicalAccountId: actorAccountId')
  })

  it('rejects a superseded Wallet session before account deletion reaches Mongo', async () => {
    const envKeys = [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
    ]
    const previousEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
    const walletAddress = '0x4444444444444444444444444444444444444444'
    const token = 'ql7ws_superseded_delete_contract'
    const expiresAt = Date.now() + 60_000

    try {
      for (const key of envKeys) delete process.env[key]
      globalThis.__QL7_WALLET_SESSION_MEMORY__ = new Map([
        [`wallet_session:${token}`, {
          value: { token, status: 'active', accountId: walletAddress, walletAddress, expiresAt },
          expiresAt,
        }],
        [`wallet_session_latest:${walletAddress.toLowerCase()}`, {
          value: { token: 'ql7ws_replacement_delete_contract', status: 'active', accountId: walletAddress, walletAddress, expiresAt },
          expiresAt,
        }],
      ])
      vi.resetModules()
      const { POST } = await import('../../../app/api/profile/delete-account/route.js')
      const response = await POST(new Request('https://example.test/api/profile/delete-account', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          confirm: 'DELETE_ACCOUNT',
          accountId: walletAddress,
          walletAddress,
          walletSessionToken: token,
        }),
      }))
      expect(response.status).toBe(401)
      await expect(response.json()).resolves.toMatchObject({ ok: false, error: 'verified_session_required' })
    } finally {
      for (const key of envKeys) {
        if (typeof previousEnv[key] === 'undefined') delete process.env[key]
        else process.env[key] = previousEnv[key]
      }
      delete globalThis.__QL7_WALLET_SESSION_MEMORY__
      vi.resetModules()
    }
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
