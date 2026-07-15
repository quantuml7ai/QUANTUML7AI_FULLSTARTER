'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useI18n } from './i18n'
import {
  NOTIFICATION_SOURCE_LIST,
  buildNotificationDescriptor,
  normalizeNotificationCounts,
  normalizeNotificationSource,
  totalNotificationCounts,
} from '../lib/notificationCenter'

const SOURCE_EVENT = 'ql7:notification-count'
const SERVICE_WORKER_URL = '/ql7-notification-sw.js'
const STORAGE_KEY = 'ql7_notification_counts_v1'
const READ_AT_STORAGE_KEY = 'ql7_notification_read_at_v1'
const NATIVE_LINK_STORAGE_KEY = 'ql7_native_push_linked_account_v1'
const NOTICE_PARAM = 'ql7Notice'
const NATIVE_LINK_RETRY_MS = 10 * 60 * 1000

function readCounts() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return normalizeNotificationCounts(value)
  } catch {
    return normalizeNotificationCounts({})
  }
}

function readReadAt() {
  try {
    const value = JSON.parse(localStorage.getItem(READ_AT_STORAGE_KEY) || '{}')
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

function totalCounts(counts) {
  return totalNotificationCounts(counts)
}

function readAccountId() {
  try {
    const cookieAccount = String(document.cookie || '')
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith('asherId='))
      ?.slice('asherId='.length) || ''
    return String(
      window.__AUTH_ACCOUNT__ ||
      localStorage.getItem('asherId') ||
      localStorage.getItem('ql7_uid') ||
      localStorage.getItem('ql7_account') ||
      localStorage.getItem('account') ||
      localStorage.getItem('wallet') ||
      cookieAccount ||
      '',
    ).trim()
  } catch {
    return ''
  }
}

function toApplicationServerKey(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

function isInstalledAndroidShell() {
  try {
    return /^android-app:\/\/com\.quantuml7ai\.app(?:\.debug)?(?:\/|$)/i.test(String(document.referrer || ''))
  } catch {
    return false
  }
}

function isMobileNotificationRuntime() {
  try {
    const userAgent = String(navigator.userAgent || '')
    const isIPadOSDesktopMode = /macintosh/i.test(userAgent) && Number(navigator.maxTouchPoints || 0) > 1
    return (
      /android|iphone|ipad|ipod|mobile|crios|fxios|edgios/i.test(userAgent) ||
      isIPadOSDesktopMode ||
      isInstalledAndroidShell() ||
      window.matchMedia?.('(display-mode: standalone)')?.matches === true
    )
  } catch {
    return false
  }
}

function nativeLinkAttemptIsFresh(accountId, lang) {
  try {
    const value = JSON.parse(localStorage.getItem(NATIVE_LINK_STORAGE_KEY) || 'null')
    const sameIdentity = String(value?.accountId || '') === String(accountId || '') &&
      String(value?.lang || '') === String(lang || '')
    if (sameIdentity && value?.linked === true) return true
    return (
      sameIdentity &&
      Date.now() - Number(value?.attemptedAt || 0) < NATIVE_LINK_RETRY_MS
    )
  } catch {
    return false
  }
}

export default function AndroidNotificationBadgeSync() {
  const { lang } = useI18n()
  const countsRef = useRef({})
  const readAtRef = useRef({})
  const registrationRef = useRef(null)
  const accountIdRef = useRef('')
  const langRef = useRef(lang)
  const lastRefreshAtRef = useRef(0)
  const eventRefreshRef = useRef(null)

  useEffect(() => { langRef.current = lang }, [lang])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || '')
    const result = String(params.get('ql7NativePush') || '').trim()
    if (!result) return
    window.__QL7_NATIVE_PUSH_LINK_RESULT__ = result
    const accountId = readAccountId()
    try {
      if (result === 'linked' && accountId) {
        localStorage.setItem(NATIVE_LINK_STORAGE_KEY, JSON.stringify({ accountId, lang, linked: true }))
      } else if (result !== 'linked') {
        localStorage.removeItem(NATIVE_LINK_STORAGE_KEY)
      }
      const url = new URL(window.location.href)
      url.searchParams.delete('ql7NativePush')
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {}
  }, [lang])

  useEffect(() => {
    const source = normalizeNotificationSource(
      new URLSearchParams(window.location.search || '').get(NOTICE_PARAM),
      '',
    )
    if (!source) return undefined

    const dispatchNotice = () => {
      window.__QL7_PENDING_NOTIFICATION_SOURCE__ = source
      if (source === 'metamarket_gifts') {
        window.dispatchEvent(new CustomEvent('metamarket:open', {
          detail: { source: 'notification', initialMode: 'collections' },
        }))
      } else if (source === 'messenger_messages' || source === 'messenger_replies') {
        window.dispatchEvent(new CustomEvent('ql7:open-notification', {
          detail: { source },
        }))
      }
    }

    window.__QL7_PENDING_NOTIFICATION_SOURCE__ = source
    // Открытие ветки еще не является прочтением: счетчик снимают observers конкретного контента.
    // Хосты глобальных поповеров и форумный runtime монтируются асинхронно.
    const timers = [120, 500, 1200].map((delay) => window.setTimeout(dispatchNotice, delay))
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete(NOTICE_PARAM)
      window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
    } catch {}
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])

  const apiPost = useCallback(async (url, userId, payload) => {
    if (!userId) return null
    return fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forum-user-id': userId,
        'x-auth-account-id': userId,
      },
      body: JSON.stringify({ accountId: userId, ...payload }),
      cache: 'no-store',
      keepalive: true,
    })
  }, [])

  const apiGet = useCallback(async (url, userId) => {
    if (!userId) return null
    return fetch(url, {
      headers: {
        'x-forum-user-id': userId,
        'x-auth-account-id': userId,
      },
      cache: 'no-store',
    })
  }, [])

  const ensureNativePushLink = useCallback(async (overrideAccountId = '') => {
    const accountId = String(overrideAccountId || readAccountId() || '').trim()
    if (!accountId || !isInstalledAndroidShell()) return false
    try {
      if (window.__QL7_NATIVE_PUSH_LINK_RESULT__ === 'linked') {
        localStorage.setItem(NATIVE_LINK_STORAGE_KEY, JSON.stringify({
          accountId,
          lang: langRef.current,
          linked: true,
        }))
        window.__QL7_NATIVE_PUSH_LINK_RESULT__ = ''
        return true
      }
      if (nativeLinkAttemptIsFresh(accountId, langRef.current)) return true
      const response = await apiPost('/api/push/native/link', accountId, { lang: langRef.current })
      const payload = await response?.json?.().catch(() => null)
      if (!response?.ok || !payload?.linkUrl?.startsWith('quantuml7ai://push-link?nonce=')) return false
      localStorage.setItem(NATIVE_LINK_STORAGE_KEY, JSON.stringify({
        accountId,
        lang: langRef.current,
        attemptedAt: Date.now(),
      }))
      window.location.assign(payload.linkUrl)
      return true
    } catch {
      return false
    }
  }, [apiPost])

  const ensurePushSubscription = useCallback(async (overrideAccountId = '') => {
    const registration = registrationRef.current
    const accountId = String(overrideAccountId || readAccountId() || '').trim()
    accountIdRef.current = accountId
    if (
      !registration?.pushManager ||
      !accountId ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    ) return null

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      const response = await fetch('/api/push/config', { cache: 'no-store' })
      const config = await response.json().catch(() => ({}))
      if (!config?.publicKey) return null
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: toApplicationServerKey(config.publicKey),
      })
    }
    await apiPost('/api/push/subscribe', accountId, {
      lang: langRef.current,
      nativeShell: isInstalledAndroidShell(),
      subscription: subscription.toJSON(),
    })
    return subscription
  }, [apiPost])

  const sync = useCallback(async () => {
    const counts = normalizeNotificationCounts(countsRef.current)
    const count = totalCounts(counts)
    const sources = NOTIFICATION_SOURCE_LIST.map((source) => (
      buildNotificationDescriptor(source, counts[source], langRef.current)
    ))
    try {
      if (typeof navigator.setAppBadge === 'function') {
        if (count > 0) await navigator.setAppBadge(count)
        else if (typeof navigator.clearAppBadge === 'function') await navigator.clearAppBadge()
      }
    } catch {}

    const registration = registrationRef.current
    const worker = registration?.active || registration?.waiting || registration?.installing
    if (worker && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      worker.postMessage({ type: 'ql7:badge-sync', sources, totalCount: count })
    }
  }, [])

  const applyServerState = useCallback((rawState) => {
    if (!rawState || rawState?.ok === false) return
    // Серверное состояние канонично: одинаковый аккаунт получает один badge на всех устройствах.
    countsRef.current = normalizeNotificationCounts(rawState?.counts || {})
    readAtRef.current = rawState?.readAt && typeof rawState.readAt === 'object'
      ? rawState.readAt
      : {}
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(countsRef.current))
      localStorage.setItem(READ_AT_STORAGE_KEY, JSON.stringify(readAtRef.current))
    } catch {}
    window.__QL7_NOTIFICATION_STATE__ = {
      counts: countsRef.current,
      readAt: readAtRef.current,
      readItems: rawState?.readItems && typeof rawState.readItems === 'object'
        ? rawState.readItems
        : {},
      totalCount: totalCounts(countsRef.current),
    }
    window.dispatchEvent(new CustomEvent('ql7:notification-state', {
      detail: window.__QL7_NOTIFICATION_STATE__,
    }))
    sync()
  }, [sync])

  const fetchServerState = useCallback(async (overrideAccountId = '') => {
    const accountId = String(overrideAccountId || accountIdRef.current || readAccountId() || '').trim()
    if (!accountId) return null
    accountIdRef.current = accountId
    const response = await apiGet('/api/push/sync', accountId)
    const state = await response?.json?.().catch(() => null)
    if (response?.ok && state?.ok) {
      lastRefreshAtRef.current = Date.now()
      applyServerState(state)
    }
    return state
  }, [apiGet, applyServerState])

  const refreshFromNotificationImpulse = useCallback(() => {
    const now = Date.now()
    if (now - Number(lastRefreshAtRef.current || 0) < 3000) return Promise.resolve(null)
    if (eventRefreshRef.current) return eventRefreshRef.current
    const request = fetchServerState()
      .finally(() => {
        if (eventRefreshRef.current === request) eventRefreshRef.current = null
      })
    eventRefreshRef.current = request
    return request
  }, [fetchServerState])

  const markSourceRead = useCallback(async (sourceRaw) => {
    const source = normalizeNotificationSource(sourceRaw, '')
    const accountId = accountIdRef.current || readAccountId()
    if (!source || !accountId) return null
    countsRef.current = normalizeNotificationCounts({ ...countsRef.current, [source]: 0 })
    sync()
    const response = await apiPost('/api/push/sync', accountId, {
      readSources: [source],
      readAt: Date.now(),
    })
    const state = await response?.json?.().catch(() => null)
    if (response?.ok && state?.ok) applyServerState(state)
    return state
  }, [apiPost, applyServerState, sync])

  useEffect(() => {
    const serviceWorkerSupported = 'serviceWorker' in navigator
    countsRef.current = readCounts()
    readAtRef.current = readReadAt()
    let cancelled = false
    let mobileStreamAbort = null
    let mobileStreamRetry = null
    let mobileStreamAttempt = 0

    const stopMobileImpulseStream = () => {
      if (mobileStreamRetry) window.clearTimeout(mobileStreamRetry)
      mobileStreamRetry = null
      mobileStreamAbort?.abort()
      mobileStreamAbort = null
    }

    const dispatchImpulseFallback = (payload) => {
      const source = normalizeNotificationSource(payload?.source, '')
      if (!source) return
      window.dispatchEvent(new CustomEvent(SOURCE_EVENT, {
        detail: {
          source,
          count: Math.max(0, Number(payload?.count) || 0),
          totalCount: Math.max(0, Number(payload?.totalCount) || 0),
          pushReceived: true,
        },
      }))
    }

    function scheduleMobileImpulseStream() {
      if (cancelled || !isMobileNotificationRuntime() || !readAccountId()) return
      if (mobileStreamRetry) window.clearTimeout(mobileStreamRetry)
      const delay = Math.min(15_000, 1_000 * (2 ** Math.min(mobileStreamAttempt, 4)))
      mobileStreamRetry = window.setTimeout(() => {
        mobileStreamRetry = null
        startMobileImpulseStream()
      }, delay)
    }

    function startMobileImpulseStream() {
      if (cancelled || !isMobileNotificationRuntime()) return
      const accountId = String(accountIdRef.current || readAccountId() || '').trim()
      if (!accountId || mobileStreamAbort) return

      const controller = new AbortController()
      mobileStreamAbort = controller
      fetch('/api/push/events', {
        headers: {
          accept: 'text/event-stream',
          'x-forum-user-id': accountId,
          'x-auth-account-id': accountId,
        },
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok || !response.body) throw new Error('push_event_stream_unavailable')
          mobileStreamAttempt = 0
          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          while (!cancelled && !controller.signal.aborted) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const packets = buffer.split('\n\n')
            buffer = packets.pop() || ''
            packets.forEach((packet) => {
              const data = packet
                .split('\n')
                .filter((line) => line.startsWith('data:'))
                .map((line) => line.slice(5).trim())
                .join('\n')
              if (!data) return
              try {
                const payload = JSON.parse(data)
                if (payload?.type === 'notification-state-changed') {
                  refreshFromNotificationImpulse()
                    .then((state) => { if (!state?.ok) dispatchImpulseFallback(payload) })
                    .catch(() => dispatchImpulseFallback(payload))
                }
              } catch {}
            })
          }
        })
        .catch(() => {})
        .finally(() => {
          if (mobileStreamAbort === controller) mobileStreamAbort = null
          if (!cancelled && !controller.signal.aborted) {
            mobileStreamAttempt += 1
            scheduleMobileImpulseStream()
          }
        })
    }

    startMobileImpulseStream()
    if (serviceWorkerSupported) {
      navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: '/' })
        .then((registration) => {
          if (cancelled) return
          registrationRef.current = registration
          registration.update().catch(() => {})
          accountIdRef.current = readAccountId()
          ensurePushSubscription().catch(() => {})
          ensureNativePushLink().catch(() => {})
          fetchServerState().catch(() => sync())
          startMobileImpulseStream()
        })
        .catch(() => {})
    }

    const onCount = (event) => {
      const source = normalizeNotificationSource(event?.detail?.source, '')
      if (!source) return
      const previousCount = Math.max(0, Number(countsRef.current?.[source]) || 0)
      const nextCount = Math.max(0, Number(event?.detail?.count) || 0)
      const explicitRead = event?.detail?.read === true
      if (nextCount === previousCount && !explicitRead && event?.detail?.forceSync !== true) return
      countsRef.current = normalizeNotificationCounts({
        ...countsRef.current,
        [source]: nextCount,
      })
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(countsRef.current)) } catch {}
      sync()
      const isCanonicalForumReplies = source === 'messenger_replies' && event?.detail?.canonicalForumUnread === true
      const isServerReplyReadSync = source === 'messenger_replies' && event?.detail?.serverItemsRead === true
      if (source === 'messenger_replies' && (isCanonicalForumReplies || isServerReplyReadSync)) {
        apiPost('/api/push/sync', accountIdRef.current || readAccountId(), {
          counts: { [source]: nextCount },
        })
          .then((response) => response?.json?.().catch(() => null))
          .then((state) => {
            if (state?.ok) applyServerState(state)
          })
          .catch(() => {})
        return
      }
      if (source === 'messenger_replies') return
      if ((nextCount <= 0 && previousCount > 0) || explicitRead) {
        markSourceRead(source).catch(() => {})
      } else {
        apiPost('/api/push/sync', accountIdRef.current || readAccountId(), {
          counts: { [source]: nextCount },
        })
          .then((response) => response?.json?.().catch(() => null))
          .then((state) => {
            if (state?.ok) applyServerState(state)
          })
          .catch(() => {})
      }
    }

    const onWorkerMessage = (event) => {
      if (event?.data?.type !== 'ql7:notification-received') return
      const source = normalizeNotificationSource(event?.data?.source, '')
      if (!source) return
      // Push is only an exact event impulse. The server remains canonical,
      // so read it once per event instead of polling mobile devices.
      refreshFromNotificationImpulse().then((state) => {
        if (state?.ok) return
        dispatchImpulseFallback(event.data)
      }).catch(() => dispatchImpulseFallback(event.data))
    }

    const requestPermissionOnce = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'default') return
      const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches
      const android = /Android/i.test(String(navigator.userAgent || ''))
      if (!standalone && !android) return
      if (!readAccountId()) return
      Notification.requestPermission()
        .then(() => ensurePushSubscription())
        .then(() => fetchServerState())
        .catch(() => {})
    }

    const onAuth = (event) => {
      const accountId = String(event?.detail?.accountId || readAccountId() || '').trim()
      accountIdRef.current = accountId
      const permissionRequest = (
        typeof Notification !== 'undefined' &&
        Notification.permission === 'default' &&
        (/Android/i.test(String(navigator.userAgent || '')) ||
          window.matchMedia?.('(display-mode: standalone)')?.matches)
      )
        ? Notification.requestPermission().catch(() => 'default')
        : Promise.resolve(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
      permissionRequest
        .then(() => ensurePushSubscription(accountId))
        .then(() => ensureNativePushLink(accountId))
        .then(() => fetchServerState(accountId))
        .then(() => startMobileImpulseStream())
        .catch(() => {})
    }
    const onLogout = () => {
      const accountId = accountIdRef.current || readAccountId()
      const registration = registrationRef.current
      countsRef.current = normalizeNotificationCounts({})
      readAtRef.current = {}
      try {
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(READ_AT_STORAGE_KEY)
        localStorage.removeItem(NATIVE_LINK_STORAGE_KEY)
      } catch {}
      window.__QL7_NOTIFICATION_STATE__ = {
        counts: countsRef.current,
        readAt: readAtRef.current,
        totalCount: 0,
      }
      window.dispatchEvent(new CustomEvent('ql7:notification-state', {
        detail: window.__QL7_NOTIFICATION_STATE__,
      }))
      sync()
      registration?.pushManager?.getSubscription?.()
        .then(async (subscription) => {
          if (!subscription) return
          await apiPost('/api/push/unsubscribe', accountId, { endpoint: subscription.endpoint }).catch(() => {})
          await subscription.unsubscribe().catch(() => {})
        })
        .catch(() => {})
      if (isInstalledAndroidShell()) {
        window.setTimeout(() => window.location.assign('quantuml7ai://push-unlink'), 0)
      }
      accountIdRef.current = ''
      stopMobileImpulseStream()
    }

    const refreshCanonicalState = () => {
      if (document.visibilityState && document.visibilityState !== 'visible') return
      const now = Date.now()
      if (now - lastRefreshAtRef.current < 5000) return
      lastRefreshAtRef.current = now
      // Chrome/MIUI может заменить или приостановить push-подписку в фоне.
      // При возвращении аккуратно восстанавливаем её и только затем читаем канонический счётчик.
      ensurePushSubscription()
        .then(() => ensureNativePushLink())
        .then(() => fetchServerState())
        .catch(() => fetchServerState().catch(() => {}))
    }

    window.addEventListener(SOURCE_EVENT, onCount)
    if (serviceWorkerSupported) navigator.serviceWorker.addEventListener('message', onWorkerMessage)
    window.addEventListener('auth:ok', onAuth)
    window.addEventListener('auth:success', onAuth)
    window.addEventListener('auth:logout', onLogout)
    window.addEventListener('focus', refreshCanonicalState)
    document.addEventListener('visibilitychange', refreshCanonicalState)
    window.addEventListener('pointerdown', requestPermissionOnce, { passive: true })
    return () => {
      cancelled = true
      stopMobileImpulseStream()
      window.removeEventListener(SOURCE_EVENT, onCount)
      if (serviceWorkerSupported) navigator.serviceWorker.removeEventListener('message', onWorkerMessage)
      window.removeEventListener('auth:ok', onAuth)
      window.removeEventListener('auth:success', onAuth)
      window.removeEventListener('auth:logout', onLogout)
      window.removeEventListener('focus', refreshCanonicalState)
      document.removeEventListener('visibilitychange', refreshCanonicalState)
      window.removeEventListener('pointerdown', requestPermissionOnce)
    }
  }, [apiPost, applyServerState, ensureNativePushLink, ensurePushSubscription, fetchServerState, markSourceRead, refreshFromNotificationImpulse, sync])

  return null
}
