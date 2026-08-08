'use client'

import { isQl7SupportActive } from '../../../../../lib/ql7-support/featureFlag.js'

const QL7_SUPPORT_ID = 'ql7-support'
const REJECTED_AUTH_COOLDOWN_MS = 30000
let rejectedAuthKey = ''
let rejectedAuthAt = 0

const SUPPORT_AUTH_EVENTS = Object.freeze([
  'wallet-session:verified',
  'auth:ok',
  'auth:success',
  'forum:post-auth-ready',
  'qcoin:auth-ready',
])

function str(value) { return String(value ?? '').trim() }
function readStorage(key) { try { return str(window?.localStorage?.getItem?.(key)) } catch { return '' } }
function readNumber(key) { const value = Number(readStorage(key) || 0); return Number.isFinite(value) ? value : 0 }


export function resetQl7SupportAuthCircuit() {
  rejectedAuthKey = ''
  rejectedAuthAt = 0
}

function markQl7SupportAuthRejected(auth = {}) {
  rejectedAuthKey = str(auth?.key)
  rejectedAuthAt = Date.now()
}

function isQl7SupportAuthRejected(auth = {}) {
  const key = str(auth?.key)
  if (!key || key !== rejectedAuthKey) return false
  if (Date.now() - rejectedAuthAt > REJECTED_AUTH_COOLDOWN_MS) {
    resetQl7SupportAuthCircuit()
    return false
  }
  return true
}

export function isQl7SupportPeerId(value = '') {
  return str(value).toLowerCase() === QL7_SUPPORT_ID
}

export function readQl7SupportAuthSnapshot() {
  if (typeof window === 'undefined') return { ready: false, mode: 'server', key: '' }
  const initData = str(window?.Telegram?.WebApp?.initData)
  if (initData) {
    return {
      ready: true,
      mode: 'telegram_tma',
      initData,
      token: '',
      walletAddress: '',
      accountId: '',
      expiresAt: 0,
      key: `tma:${initData.length}:${initData.slice(-16)}`,
    }
  }
  const token = readStorage('ql7_wallet_session_token')
  const walletAddress = readStorage('ql7_wallet_address')
  const accountId = readStorage('ql7_wallet_account_id') || walletAddress
  const expiresAt = readNumber('ql7_wallet_session_expires_at')
  const notExpired = !expiresAt || expiresAt > Date.now() + 1500
  const ready = Boolean(token && walletAddress && accountId && notExpired)
  return {
    ready,
    mode: 'wallet_session',
    token,
    walletAddress,
    accountId,
    expiresAt,
    key: ready ? `wallet:${token.slice(-18)}:${accountId}` : '',
    failureCode: !token
      ? 'wallet_session_token_missing'
      : (!walletAddress ? 'wallet_address_missing' : (!accountId ? 'account_id_missing' : (!notExpired ? 'wallet_session_expired' : 'support_auth_not_ready'))),
  }
}

export function isQl7SupportAuthReady() {
  return readQl7SupportAuthSnapshot().ready === true
}

export function buildQl7SupportAuthHeaders(snapshot = null) {
  const auth = snapshot && typeof snapshot === 'object' ? snapshot : readQl7SupportAuthSnapshot()
  const headers = {}
  if (auth.mode === 'telegram_tma' && auth.initData) headers['x-telegram-init-data'] = auth.initData
  if (auth.token) headers['x-wallet-session-token'] = auth.token
  if (auth.walletAddress) headers['x-wallet-address'] = auth.walletAddress
  if (auth.accountId) headers['x-auth-account-id'] = auth.accountId
  return headers
}

export function buildQl7SupportRouteContext() {
  if (typeof window === 'undefined') return {}
  const preferredLocale = str(window.localStorage?.getItem?.('ql7_lang') || document?.documentElement?.lang || navigator?.language || '')
  return {
    pathname: str(window.location?.pathname).slice(0, 240),
    feature: 'quantum_messenger_support',
    preferredLocale: preferredLocale.slice(0, 24),
    documentLang: str(document?.documentElement?.lang || '').slice(0, 24),
    browserTimeZone: (() => { try { return str(Intl.DateTimeFormat().resolvedOptions().timeZone).slice(0, 80) } catch { return '' } })(),
  }
}

export function waitForQl7SupportAuthReady({ timeoutMs = 12000, signal = null } = {}) {
  const initial = readQl7SupportAuthSnapshot()
  if (initial.ready) return Promise.resolve(initial)
  if (typeof window === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    let timer = null
    let poll = null

    const cleanup = () => {
      for (const eventName of SUPPORT_AUTH_EVENTS) {
        try { window.removeEventListener(eventName, onCandidate) } catch {}
      }
      try { window.removeEventListener('storage', onStorage) } catch {}
      try { window.removeEventListener('auth:logout', onAbort) } catch {}
      signal?.removeEventListener?.('abort', onAbort)
      if (timer) clearTimeout(timer)
      if (poll) clearInterval(poll)
    }
    const finish = (value) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(value || null)
    }
    const inspect = () => {
      const next = readQl7SupportAuthSnapshot()
      if (next.ready) finish(next)
    }
    const onCandidate = () => inspect()
    const onStorage = (event) => {
      const key = str(event?.key)
      if (!key || key.startsWith('ql7_wallet_')) inspect()
    }
    const onAbort = () => finish(null)

    for (const eventName of SUPPORT_AUTH_EVENTS) {
      try { window.addEventListener(eventName, onCandidate) } catch {}
    }
    try { window.addEventListener('storage', onStorage) } catch {}
    try { window.addEventListener('auth:logout', onAbort) } catch {}
    signal?.addEventListener?.('abort', onAbort, { once: true })
    poll = setInterval(inspect, 120)
    timer = setTimeout(() => finish(readQl7SupportAuthSnapshot().ready ? readQl7SupportAuthSnapshot() : null), Math.max(800, Number(timeoutMs || 12000)))
    inspect()
  })
}

export async function fetchQl7SupportAuthenticated(input, init = {}, {
  waitTimeoutMs = 12000,
  signal = init?.signal || null,
  retryOnFreshAuth = true,
  fetchImpl = fetch,
} = {}) {
  if (!isQl7SupportActive()) return { response: null, data: { ok: false, error: 'ql7_support_disabled', supportActive: false }, auth: readQl7SupportAuthSnapshot(), deferred: false, retried: false }
  const auth = await waitForQl7SupportAuthReady({ timeoutMs: waitTimeoutMs, signal })
  if (!auth?.ready) {
    return {
      response: null,
      data: { ok: false, error: 'support_auth_not_ready', deferred: true },
      auth: auth || readQl7SupportAuthSnapshot(),
      deferred: true,
      retried: false,
    }
  }
  if (isQl7SupportAuthRejected(auth)) {
    return {
      response: null,
      data: { ok: false, error: 'verified_session_required', authBlocked: true, deferred: true },
      auth,
      deferred: true,
      retried: false,
      authBlocked: true,
    }
  }

  const request = async (snapshot) => {
    const response = await fetchImpl(input, {
      ...init,
      cache: init?.cache || 'no-store',
      headers: {
        ...(init?.headers && typeof init.headers === 'object' ? init.headers : {}),
        ...buildQl7SupportAuthHeaders(snapshot),
      },
      signal,
    })
    const data = await response.json().catch(() => null)
    return { response, data, auth: snapshot }
  }
  const first = await request(auth)
  if (first.response?.status !== 401 || !retryOnFreshAuth || signal?.aborted) {
    if (first.response?.status === 401) markQl7SupportAuthRejected(auth)
    else if (first.response?.ok) resetQl7SupportAuthCircuit()
    return { ...first, deferred: false, retried: false }
  }

  const refreshed = await waitForQl7SupportAuthReady({ timeoutMs: Math.min(4500, waitTimeoutMs), signal })
  if (!refreshed?.ready || refreshed.key === auth.key) {
    markQl7SupportAuthRejected(auth)
    return { ...first, deferred: false, retried: false }
  }
  const second = await request(refreshed)
  if (second.response?.status === 401) markQl7SupportAuthRejected(refreshed)
  else if (second.response?.ok) resetQl7SupportAuthCircuit()
  return { ...second, deferred: false, retried: true }
}

export async function fetchQl7SupportRuntimeState({ correlationId = '', signal } = {}) {
  const qs = new URLSearchParams()
  if (correlationId) qs.set('correlationId', str(correlationId))
  const result = await fetchQl7SupportAuthenticated(`/api/dm/support-state?${qs.toString()}`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  }, { signal, waitTimeoutMs: 12000, retryOnFreshAuth: true })
  if (!result.response?.ok || !result.data?.ok) return null
  return result.data.state || null
}

export async function translateQl7SupportCard({ card = null, targetLocale = '', signal = null } = {}) {
  if (!card || typeof card !== 'object') return null
  const targetLang = String(targetLocale || 'en').split(/[-_]/)[0] || 'en'
  const result = await fetchQl7SupportAuthenticated('/api/dm/support-card-translate', {
    method: 'POST',
    cache: 'no-store',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ card, targetLang }),
    signal,
  }, { signal, waitTimeoutMs: 12000, retryOnFreshAuth: true })
  if (!result.response?.ok || !result.data?.ok || !result.data?.card) return null
  return result.data
}
