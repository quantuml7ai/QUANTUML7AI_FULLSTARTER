'use client'

const DEFAULT_AUTH_TIMEOUT_MS = 120000
const AUTH_RUNTIME_SETTLE_TIMEOUT_MS = 4000
const AUTH_FALLBACK_CLICK_DELAY_MS = 120

let pendingAuthPromise = null
const pendingActionPromises = new Map()

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, Number(ms) || 0)))
}

function nextPaint() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0)
      return
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(resolve))
  })
}

function readStorageValue(key) {
  try {
    return String(window.localStorage?.getItem(key) || '').trim()
  } catch {
    return ''
  }
}

export function readAuthorizedAccountId() {
  if (typeof window === 'undefined') return ''

  try {
    const globalAccount = String(
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ID__ ||
      window.__QL7_UID__ ||
      window.__FORUM_USER__ ||
      window.account ||
      window.wallet ||
      ''
    ).trim()
    if (globalAccount) return globalAccount
  } catch {}

  for (const key of [
    'ql7_wallet_account_id',
    'ql7_account',
    'account',
    'wallet',
    'asherId',
    'ql7_uid',
    'forum_user_id',
  ]) {
    const value = readStorageValue(key)
    if (value) return value
  }

  return ''
}

function readAccountFromEvent(event) {
  return String(
    event?.detail?.accountId ||
    event?.detail?.asherId ||
    event?.detail?.walletAddress ||
    readAuthorizedAccountId() ||
    ''
  ).trim()
}

function openStandardAuthorization(source) {
  if (typeof window === 'undefined') return

  try {
    window.dispatchEvent(new CustomEvent('open-auth', {
      detail: {
        source: String(source || 'protected-action'),
        reason: 'authorization_required',
      },
    }))
  } catch {
    try { window.dispatchEvent(new Event('open-auth')) } catch {}
  }

  window.setTimeout(() => {
    try {
      const status = typeof window.__QL7_WALLET_RUNTIME_STATUS__ === 'function'
        ? window.__QL7_WALLET_RUNTIME_STATUS__()
        : null
      if (status?.runtimeMounted || status?.runtimeActive || status?.modalOpen) return

      const trigger =
        document.querySelector('[data-auth-open]') ||
        document.querySelector('.nav-auth-btn') ||
        document.querySelector('#nav-auth-btn') ||
        document.querySelector('[data-testid="auth-open"]')

      trigger?.click?.()
    } catch {}
  }, AUTH_FALLBACK_CLICK_DELAY_MS)
}

function waitForAuthorization({ source, timeoutMs = DEFAULT_AUTH_TIMEOUT_MS } = {}) {
  const existing = readAuthorizedAccountId()
  if (existing) return Promise.resolve(existing)
  if (pendingAuthPromise) return pendingAuthPromise

  pendingAuthPromise = new Promise((resolve) => {
    let settled = false
    let timer = null
    let authRuntimeMonitor = null
    let sawAuthRuntime = false

    const cleanup = () => {
      try { window.removeEventListener('auth:ok', onSuccess) } catch {}
      try { window.removeEventListener('auth:success', onSuccess) } catch {}
      try { window.removeEventListener('wallet-session:verified', onSuccess) } catch {}
      try { window.removeEventListener('auth:cancel', onCancel) } catch {}
      try { window.removeEventListener('auth:fail', onCancel) } catch {}
      try { window.removeEventListener('auth:logout', onCancel) } catch {}
      if (timer) clearTimeout(timer)
      if (authRuntimeMonitor) clearInterval(authRuntimeMonitor)
    }

    const finish = (accountId) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(String(accountId || '').trim())
    }

    const onSuccess = (event) => {
      const accountId = readAccountFromEvent(event)
      if (accountId) finish(accountId)
    }

    const onCancel = () => finish('')

    try {
      window.addEventListener('auth:ok', onSuccess)
      window.addEventListener('auth:success', onSuccess)
      window.addEventListener('wallet-session:verified', onSuccess)
      window.addEventListener('auth:cancel', onCancel)
      window.addEventListener('auth:fail', onCancel)
      window.addEventListener('auth:logout', onCancel)
    } catch {
      finish('')
      return
    }

    timer = setTimeout(() => finish(readAuthorizedAccountId()), Math.max(1000, Number(timeoutMs) || DEFAULT_AUTH_TIMEOUT_MS))
    authRuntimeMonitor = setInterval(() => {
      const accountId = readAuthorizedAccountId()
      if (accountId) {
        finish(accountId)
        return
      }

      let status = null
      try {
        status = typeof window.__QL7_WALLET_RUNTIME_STATUS__ === 'function'
          ? window.__QL7_WALLET_RUNTIME_STATUS__()
          : null
      } catch {}

      const runtimeActive = !!(
        status?.runtimeMounted ||
        status?.runtimeActive ||
        status?.reactProvidersMounted ||
        status?.modalOpen
      )
      if (runtimeActive) sawAuthRuntime = true
      else if (sawAuthRuntime) finish('')
    }, 100)
    openStandardAuthorization(source)
  }).finally(() => {
    pendingAuthPromise = null
  })

  return pendingAuthPromise
}

async function waitForAuthorizationOverlayToClose() {
  if (typeof window === 'undefined') return

  const statusReader = window.__QL7_WALLET_RUNTIME_STATUS__
  if (typeof statusReader !== 'function') {
    await delay(180)
    await nextPaint()
    return
  }

  const deadline = Date.now() + AUTH_RUNTIME_SETTLE_TIMEOUT_MS
  while (Date.now() < deadline) {
    let status = null
    try { status = statusReader() } catch {}

    const active = !!(
      status?.runtimeMounted ||
      status?.runtimeActive ||
      status?.reactProvidersMounted ||
      status?.modalOpen
    )

    if (!active) {
      await nextPaint()
      return
    }

    await delay(40)
  }

  await delay(180)
  await nextPaint()
}

export function runAuthorizedClientAction({
  actionKey,
  source,
  action,
  timeoutMs = DEFAULT_AUTH_TIMEOUT_MS,
} = {}) {
  if (typeof window === 'undefined' || typeof action !== 'function') {
    return Promise.resolve({ ok: false, reason: 'unavailable', accountId: '' })
  }

  const key = String(actionKey || source || 'protected-action').trim() || 'protected-action'
  if (pendingActionPromises.has(key)) return pendingActionPromises.get(key)

  const task = (async () => {
    const before = readAuthorizedAccountId()
    const accountId = before || await waitForAuthorization({ source, timeoutMs })
    if (!accountId) return { ok: false, reason: 'authorization_not_completed', accountId: '' }

    if (!before) await waitForAuthorizationOverlayToClose()
    await action(accountId)
    return { ok: true, reason: before ? 'already_authorized' : 'authorized', accountId }
  })().finally(() => {
    pendingActionPromises.delete(key)
  })

  pendingActionPromises.set(key, task)
  return task
}
