'use client'

const SESSION_KEYS = {
  address: 'ql7_wallet_address',
  addressLc: 'ql7_wallet_address_lc',
  accountId: 'ql7_wallet_account_id',
  token: 'ql7_wallet_session_token',
  expiresAt: 'ql7_wallet_session_expires_at',
  provider: 'ql7_wallet_session_provider',
}

const LEGACY_AUTH_KEYS = [
  'wallet',
  'account',
  'ql7_account',
  'asherId',
  'ql7_uid',
  'forum_user_id',
]

const WALLET_RUNTIME_KEYS = [
  'ql7_wallet_mobile_oauth_grace_until',
  'w3m-auth-provider',
  'W3M_CONNECTED_CONNECTOR',
  'WEB3_CONNECT_CACHED_PROVIDER',
  'wagmi.store',
  'wagmi.recentConnectorId',
  'wagmi.injected.connected',
  'wagmi.injected.disconnected',
]

const WALLET_RUNTIME_PREFIXES = [
  'w3m-',
  'W3M_',
  'wc@',
  'walletconnect',
  'WALLETCONNECT',
  '@w3m',
  'appkit',
  'reown',
]

function ls() {
  try { return typeof window !== 'undefined' ? window.localStorage : null } catch { return null }
}

function ss() {
  try { return typeof window !== 'undefined' ? window.sessionStorage : null } catch { return null }
}

function setItem(key, value) {
  try { ls()?.setItem(key, String(value || '')) } catch {}
}

function getItem(key) {
  try { return ls()?.getItem(key) || '' } catch { return '' }
}

function removeItem(key) {
  try { ls()?.removeItem(key) } catch {}
  try { ss()?.removeItem(key) } catch {}
}

export function isValidWalletAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(String(address || '').trim())
}

export function getStoredWalletSession() {
  const walletAddress = getItem(SESSION_KEYS.address) || ''
  const accountId = getItem(SESSION_KEYS.accountId) || walletAddress
  const token = getItem(SESSION_KEYS.token)
  const expiresAt = Number(getItem(SESSION_KEYS.expiresAt) || 0)
  const provider = getItem(SESSION_KEYS.provider) || 'wallet'
  return {
    walletAddress: String(walletAddress || '').trim(),
    accountId: String(accountId || '').trim(),
    token: String(token || '').trim(),
    expiresAt,
    provider,
  }
}

export function hydrateLegacyAuth(session) {
  if (typeof window === 'undefined') return
  const accountId = String(session?.accountId || session?.walletAddress || '').trim()
  const walletAddress = String(session?.walletAddress || accountId || '').trim()
  if (!accountId) return

  setItem(SESSION_KEYS.address, walletAddress)
  setItem(SESSION_KEYS.addressLc, walletAddress.toLowerCase())
  setItem(SESSION_KEYS.accountId, accountId)
  if (session?.token) setItem(SESSION_KEYS.token, session.token)
  if (session?.expiresAt) setItem(SESSION_KEYS.expiresAt, session.expiresAt)
  setItem(SESSION_KEYS.provider, session?.provider || 'wallet')

  for (const key of LEGACY_AUTH_KEYS) setItem(key, accountId)

  try {
    window.__AUTH_ACCOUNT__ = accountId
    window.__ASHER_ID__ = accountId
    window.__QL7_UID__ = accountId
    window.__FORUM_USER__ = accountId
    window.wallet = accountId
    window.account = accountId
  } catch {}
}

export function dispatchAuthReady(session, eventName = 'auth:ok') {
  try {
    const accountId = String(session?.accountId || session?.walletAddress || '').trim()
    if (!accountId || typeof window === 'undefined') return
    const detail = {
      accountId,
      asherId: accountId,
      walletAddress: session?.walletAddress || accountId,
      provider: session?.provider || 'wallet',
      walletSession: true,
      token: session?.token || getItem(SESSION_KEYS.token),
    }
    window.dispatchEvent(new CustomEvent(eventName, { detail }))
    window.dispatchEvent(new CustomEvent('wallet-session:verified', { detail }))
    window.dispatchEvent(new CustomEvent('qcoin:auth-ready', { detail }))
  } catch {}
}

export function clearWalletRuntimeCache() {
  const clearStore = (store) => {
    if (!store) return
    const keys = []
    try {
      for (let i = 0; i < store.length; i += 1) {
        const key = store.key(i)
        if (!key) continue
        if (WALLET_RUNTIME_KEYS.includes(key) || WALLET_RUNTIME_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          keys.push(key)
        }
      }
      WALLET_RUNTIME_KEYS.forEach((key) => keys.push(key))
      Array.from(new Set(keys)).forEach((key) => {
        try { store.removeItem(key) } catch {}
      })
    } catch {}
  }
  clearStore(ls())
  clearStore(ss())
}

export function clearWalletAuthStorage(options = {}) {
  const keepRuntime = !!options.keepRuntime
  Object.values(SESSION_KEYS).forEach(removeItem)
  LEGACY_AUTH_KEYS.forEach(removeItem)
  if (!keepRuntime) clearWalletRuntimeCache()
  try {
    delete window.__AUTH_ACCOUNT__
    delete window.__ASHER_ID__
    delete window.__QL7_UID__
    delete window.__FORUM_USER__
    delete window.wallet
    delete window.account
  } catch {
    try {
      window.__AUTH_ACCOUNT__ = undefined
      window.__ASHER_ID__ = undefined
      window.__QL7_UID__ = undefined
      window.__FORUM_USER__ = undefined
      window.wallet = undefined
      window.account = undefined
    } catch {}
  }
}

async function postWalletSession(payload) {
  const res = await fetch('/api/wallet-session', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.ok) {
    const err = new Error(data?.error || `wallet_session_${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export async function createWalletSession({ walletAddress, accountId, provider } = {}) {
  const address = String(walletAddress || accountId || '').trim()
  if (!isValidWalletAddress(address)) throw new Error('bad_wallet_address')
  const data = await postWalletSession({
    action: 'create',
    walletAddress: address,
    accountId: String(accountId || address).trim(),
    provider: provider || 'wallet',
  })
  const session = {
    walletAddress: data.walletAddress || address,
    accountId: data.accountId || accountId || address,
    token: data.token,
    expiresAt: data.expiresAt,
    provider: data.provider || provider || 'wallet',
  }
  hydrateLegacyAuth(session)
  dispatchAuthReady(session, 'auth:ok')
  return session
}

export async function verifyStoredWalletSession() {
  const stored = getStoredWalletSession()
  const address = stored.walletAddress || stored.accountId
  if (!stored.token || !isValidWalletAddress(address)) {
    clearWalletAuthStorage()
    return { ok: false, authorized: false, error: 'missing_session' }
  }
  try {
    const data = await postWalletSession({
      action: 'verify',
      token: stored.token,
      walletAddress: address,
      accountId: stored.accountId || address,
    })
    const session = {
      walletAddress: data.walletAddress || stored.walletAddress || address,
      accountId: data.accountId || stored.accountId || data.walletAddress || address,
      token: stored.token,
      expiresAt: data.expiresAt || stored.expiresAt,
      provider: data.provider || stored.provider || 'wallet',
    }
    hydrateLegacyAuth(session)
    dispatchAuthReady(session, 'auth:ok')
    return { ok: true, authorized: true, ...session }
  } catch (err) {
    clearWalletAuthStorage()
    try { window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: err?.message || 'verify_failed' } })) } catch {}
    return { ok: false, authorized: false, error: err?.message || 'verify_failed' }
  }
}

export async function logoutStoredWalletSession() {
  const stored = getStoredWalletSession()
  try {
    if (stored.token) {
      await postWalletSession({ action: 'logout', token: stored.token, walletAddress: stored.walletAddress || stored.accountId })
    }
  } catch {}
  clearWalletAuthStorage()
  try { window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'logout' } })) } catch {}
}

export const walletSessionStorageKeys = SESSION_KEYS
