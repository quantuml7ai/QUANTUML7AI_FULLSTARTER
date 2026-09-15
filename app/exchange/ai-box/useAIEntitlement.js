'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AI_ACCESS_MODE,
  AI_ENTITLEMENT_LIMIT_SEC,
  AI_ENTITLEMENT_STORAGE_KEY,
  canAnalyzeWithEntitlement,
  createUnknownEntitlement,
  getQuotaReconciliationDelta,
  hydrateEntitlementSnapshot,
  mergeAuthoritativeEntitlement,
  normalizeAccountMarker,
  shouldPersistEntitlement,
  tickEntitlementSnapshot,
  toPersistedEntitlement,
} from '../../../lib/exchange/aiEntitlementState'

const AIQ_API = '/api/aiquota/usage'
const STATUS_REFRESH_MS = 60_000
const TICK_INTERVAL_MS = 1000
const METER_PERSIST_MIN_INTERVAL_MS = 5000
const METER_PERSIST_IDLE_TIMEOUT_MS = 2000

function getAccountMarkerSafe() {
  if (typeof window === 'undefined') return null
  try {
    return normalizeAccountMarker(
      window.__AUTH_ACCOUNT__ ||
      window.__ASHER_ACCOUNT__ ||
      window.__ASHER_ID__ ||
      localStorage.getItem('wallet') ||
      localStorage.getItem('asherId') ||
      localStorage.getItem('account') ||
      localStorage.getItem('ql7_uid'),
    )
  } catch {
    return null
  }
}

function localDayKey() {
  try {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `aiQuota:${year}-${month}-${day}`
  } catch {
    return 'aiQuota'
  }
}

function readJson(key) {
  if (typeof window === 'undefined') return null
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

function readLegacyUsedSec() {
  if (typeof window === 'undefined') return 0
  try {
    const key = localDayKey()
    const localUsed = Number(localStorage.getItem(key))
    const serverCached = readJson(`aiQuotaSrv:${key}`)
    return Math.max(
      Number.isFinite(localUsed) ? localUsed : 0,
      Number.isFinite(Number(serverCached?.usedSec))
        ? Number(serverCached.usedSec)
        : 0,
    )
  } catch {
    return 0
  }
}

function readInitialEntitlement() {
  if (typeof window === 'undefined') return createUnknownEntitlement()
  return hydrateEntitlementSnapshot({
    stored: readJson(AI_ENTITLEMENT_STORAGE_KEY),
    legacyUsedSec: readLegacyUsedSec(),
    accountMarker: getAccountMarkerSafe(),
    now: Date.now(),
  })
}

function writeLegacyUsedSec(usedSec) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(localDayKey(), String(Math.max(0, Math.floor(usedSec))))
  } catch {}
}

function persistEntitlementSnapshot(snapshot) {
  if (typeof window === 'undefined' || !snapshot) return
  if (shouldPersistEntitlement(snapshot)) {
    try {
      localStorage.setItem(
        AI_ENTITLEMENT_STORAGE_KEY,
        JSON.stringify(toPersistedEntitlement(snapshot)),
      )
    } catch {}
  }
  if (!snapshot.isVip && Number.isFinite(snapshot.usedSec)) {
    writeLegacyUsedSec(snapshot.usedSec)
  }
}

export function useAIEntitlement() {
  // Keep SSR and the browser's first hydration render structurally identical.
  // Cached quota/VIP state is restored after hydration, then merged with the server.
  const [entitlement, setEntitlement] = useState(() => createUnknownEntitlement(0))
  const entitlementRef = useRef(entitlement)
  const initialHydrationRef = useRef(false)
  const requestGenerationRef = useRef(0)
  const refreshAbortRef = useRef(null)
  const postAbortRef = useRef(null)
  const batchSecRef = useRef(0)
  const accumulatedMsRef = useRef(0)
  const lastTickMsRef = useRef(0)
  const lastSyncAtRef = useRef(0)
  const flushInFlightRef = useRef(false)
  const meterPersistTimerRef = useRef(0)
  const meterPersistIdleRef = useRef(0)
  const lastMeterPersistAtRef = useRef(0)

  const cancelScheduledMeterPersist = useCallback(() => {
    if (meterPersistTimerRef.current) {
      window.clearTimeout(meterPersistTimerRef.current)
      meterPersistTimerRef.current = 0
    }
    if (meterPersistIdleRef.current) {
      try {
        window.cancelIdleCallback?.(meterPersistIdleRef.current)
      } catch {}
      meterPersistIdleRef.current = 0
    }
  }, [])

  const persistMeterSnapshotNow = useCallback(() => {
    cancelScheduledMeterPersist()
    persistEntitlementSnapshot(entitlementRef.current)
    lastMeterPersistAtRef.current = Date.now()
  }, [cancelScheduledMeterPersist])

  const scheduleMeterPersist = useCallback(() => {
    if (typeof window === 'undefined') return
    if (meterPersistTimerRef.current || meterPersistIdleRef.current) return

    const elapsed = Date.now() - lastMeterPersistAtRef.current
    const delay = Math.max(0, METER_PERSIST_MIN_INTERVAL_MS - elapsed)
    meterPersistTimerRef.current = window.setTimeout(() => {
      meterPersistTimerRef.current = 0
      const persistLatest = () => {
        meterPersistIdleRef.current = 0
        persistEntitlementSnapshot(entitlementRef.current)
        lastMeterPersistAtRef.current = Date.now()
      }

      if (typeof window.requestIdleCallback === 'function') {
        meterPersistIdleRef.current = window.requestIdleCallback(
          persistLatest,
          { timeout: METER_PERSIST_IDLE_TIMEOUT_MS },
        )
      } else {
        persistLatest()
      }
    }, delay)
  }, [])

  const commitEntitlement = useCallback((nextOrReducer) => {
    const current = entitlementRef.current
    const next = typeof nextOrReducer === 'function'
      ? nextOrReducer(current)
      : nextOrReducer
    entitlementRef.current = next
    setEntitlement(next)
    persistEntitlementSnapshot(next)
    lastMeterPersistAtRef.current = Date.now()
    return next
  }, [])

  const readEntitlement = useCallback(() => entitlementRef.current, [])

  useEffect(() => {
    entitlementRef.current = entitlement
  }, [entitlement])

  const flushQuota = useCallback(async ({
    keepalive = false,
    reason = 'manual',
    forceIdentitySync = false,
  } = {}) => {
    if (flushInFlightRef.current) return entitlementRef.current
    const current = entitlementRef.current

    if (current.isVip || current.mode === AI_ACCESS_MODE.VIP) {
      batchSecRef.current = 0
      return current
    }

    const pending = Math.max(0, Math.floor(batchSecRef.current))
    if (pending <= 0 && !forceIdentitySync) return current

    flushInFlightRef.current = true
    batchSecRef.current = 0
    lastSyncAtRef.current = Date.now()
    postAbortRef.current?.abort()
    const controller = new AbortController()
    postAbortRef.current = controller
    const accountMarker = getAccountMarkerSafe()

    try {
      const response = await fetch(AIQ_API, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-ql7-ai-quota-sync': reason,
        },
        credentials: 'include',
        cache: 'no-store',
        keepalive,
        signal: controller.signal,
        body: JSON.stringify({
          op: 'tick',
          deltaSec: pending > 0
            ? Math.min(pending, AI_ENTITLEMENT_LIMIT_SEC)
            : 0,
          accountId: accountMarker || undefined,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.ok !== true) {
        batchSecRef.current = Math.max(batchSecRef.current, pending)
        return entitlementRef.current
      }
      return commitEntitlement((latest) =>
        mergeAuthoritativeEntitlement(latest, payload, {
          accountMarker,
          localUsedSec: latest.usedSec,
          now: Date.now(),
        }),
      )
    } catch (error) {
      batchSecRef.current = Math.max(batchSecRef.current, pending)
      if (error?.name !== 'AbortError') {
        console.warn('[Exchange AI entitlement] quota flush failed', error)
      }
      return entitlementRef.current
    } finally {
      flushInFlightRef.current = false
    }
  }, [commitEntitlement])

  const refresh = useCallback(async ({ reason = 'manual' } = {}) => {
    const generation = requestGenerationRef.current + 1
    requestGenerationRef.current = generation
    refreshAbortRef.current?.abort()
    const controller = new AbortController()
    refreshAbortRef.current = controller
    const accountMarker = getAccountMarkerSafe()

    try {
      const params = new URLSearchParams()
      if (accountMarker) params.set('accountId', accountMarker)
      const url = params.size ? `${AIQ_API}?${params.toString()}` : AIQ_API
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'x-ql7-ai-entitlement-refresh': reason },
      })
      const payload = await response.json().catch(() => null)
      if (controller.signal.aborted || generation !== requestGenerationRef.current) {
        return entitlementRef.current
      }
      if (!response.ok || payload?.ok !== true) return entitlementRef.current

      const now = Date.now()
      const current = entitlementRef.current
      const reconcileDelta = getQuotaReconciliationDelta(current, payload, now)
      const identitySyncNeeded = Boolean(
        accountMarker && payload.identitySyncNeeded === true,
      )
      if (reconcileDelta > 0) {
        batchSecRef.current = Math.max(batchSecRef.current, reconcileDelta)
      }

      const merged = commitEntitlement(
        mergeAuthoritativeEntitlement(current, payload, {
          accountMarker,
          localUsedSec: current.usedSec,
          now,
        }),
      )

      if (reconcileDelta > 0 || identitySyncNeeded) {
        void flushQuota({
          keepalive: false,
          reason: reconcileDelta > 0
            ? 'authoritative-reconcile'
            : 'identity-bind',
          forceIdentitySync: identitySyncNeeded && reconcileDelta <= 0,
        })
      }
      return merged
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.warn('[Exchange AI entitlement] refresh failed', error)
      }
      return entitlementRef.current
    }
  }, [commitEntitlement, flushQuota])

  useEffect(() => {
    if (!initialHydrationRef.current) {
      initialHydrationRef.current = true
      commitEntitlement(readInitialEntitlement())
    }

    void refresh({ reason: 'mount' })
    return () => {
      refreshAbortRef.current?.abort()
      postAbortRef.current?.abort()
    }
  }, [commitEntitlement, refresh])

  useEffect(() => {
    const isMetered =
      entitlement.mode === AI_ACCESS_MODE.FREE ||
      entitlement.mode === AI_ACCESS_MODE.FREE_URGENT
    if (!isMetered) {
      accumulatedMsRef.current = 0
      lastTickMsRef.current = 0
      if (entitlement.mode === AI_ACCESS_MODE.VIP) {
        batchSecRef.current = 0
      }
      return undefined
    }

    lastTickMsRef.current = performance.now()
    let timerId = 0

    const tick = () => {
      const nowPerf = performance.now()
      if (document.visibilityState !== 'visible') {
        lastTickMsRef.current = nowPerf
        timerId = window.setTimeout(tick, TICK_INTERVAL_MS)
        return
      }

      const deltaMs = Math.max(0, nowPerf - lastTickMsRef.current)
      lastTickMsRef.current = nowPerf
      accumulatedMsRef.current += deltaMs
      const wholeSeconds = Math.floor(accumulatedMsRef.current / 1000)

      if (wholeSeconds > 0) {
        accumulatedMsRef.current -= wholeSeconds * 1000
        const current = entitlementRef.current
        const next = tickEntitlementSnapshot(current, wholeSeconds, Date.now())
        entitlementRef.current = next
        batchSecRef.current += wholeSeconds
        scheduleMeterPersist()

        // Publish only semantic access boundaries. The second-by-second clock stays
        // in the ref and is painted by the tiny QuotaBadge leaf without rerendering
        // ExchangePage / AIWorkbench or synchronously writing storage every second.
        if (next.mode !== current.mode || next.exhausted !== current.exhausted) {
          setEntitlement(next)
        }

        if (next.mode === AI_ACCESS_MODE.EXHAUSTED) {
          accumulatedMsRef.current = 0
          persistMeterSnapshotNow()
          void flushQuota({ keepalive: false, reason: 'terminal-exhausted' })
          return
        }

        if (
          batchSecRef.current > 0 &&
          Date.now() - lastSyncAtRef.current >= STATUS_REFRESH_MS
        ) {
          void flushQuota({ keepalive: false, reason: 'metered-interval' })
        }
      }

      timerId = window.setTimeout(tick, TICK_INTERVAL_MS)
    }

    timerId = window.setTimeout(tick, TICK_INTERVAL_MS)
    return () => window.clearTimeout(timerId)
  }, [entitlement.mode, flushQuota, persistMeterSnapshotNow, scheduleMeterPersist])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refresh({ reason: 'interval' })
      void flushQuota({ keepalive: false, reason: 'status-interval' })
    }, STATUS_REFRESH_MS)

    const refreshVisible = () => {
      if (document.visibilityState === 'visible') {
        void refresh({ reason: 'visibility' })
      }
    }
    const refreshFocus = () => void refresh({ reason: 'focus' })
    const refreshVip = () => void refresh({ reason: 'vip-refresh' })
    const refreshAuth = () => {
      const accountMarker = getAccountMarkerSafe()
      commitEntitlement((current) => {
        if (
          current.isVip &&
          current.vipAccountMarker &&
          current.vipAccountMarker !== accountMarker
        ) {
          return {
            ...current,
            mode: current.exhausted
              ? AI_ACCESS_MODE.EXHAUSTED
              : AI_ACCESS_MODE.UNKNOWN,
            isVip: false,
            vipUntil: null,
            daysLeft: 0,
            vipAccountMarker: null,
            authoritative: current.exhausted,
          }
        }
        return current
      })
      void refresh({ reason: 'auth' })
    }
    const onLogout = () => {
      commitEntitlement((current) => ({
        ...current,
        mode: current.exhausted
          ? AI_ACCESS_MODE.EXHAUSTED
          : AI_ACCESS_MODE.UNKNOWN,
        isVip: false,
        vipUntil: null,
        daysLeft: 0,
        vipAccountMarker: null,
        authoritative: current.exhausted,
      }))
      void refresh({ reason: 'logout' })
    }
    const flushOnHide = () => {
      if (document.visibilityState === 'hidden') {
        persistMeterSnapshotNow()
        void flushQuota({ keepalive: true, reason: 'visibility-hide' })
      }
    }
    const flushOnPageHide = () => {
      persistMeterSnapshotNow()
      void flushQuota({ keepalive: true, reason: 'pagehide' })
    }

    window.addEventListener('focus', refreshFocus)
    window.addEventListener('vip:refresh', refreshVip)
    window.addEventListener('auth:ok', refreshAuth)
    window.addEventListener('auth:success', refreshAuth)
    window.addEventListener('auth:logout', onLogout)
    window.addEventListener('pagehide', flushOnPageHide)
    document.addEventListener('visibilitychange', refreshVisible)
    document.addEventListener('visibilitychange', flushOnHide)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshFocus)
      window.removeEventListener('vip:refresh', refreshVip)
      window.removeEventListener('auth:ok', refreshAuth)
      window.removeEventListener('auth:success', refreshAuth)
      window.removeEventListener('auth:logout', onLogout)
      window.removeEventListener('pagehide', flushOnPageHide)
      document.removeEventListener('visibilitychange', refreshVisible)
      document.removeEventListener('visibilitychange', flushOnHide)
    }
  }, [commitEntitlement, flushQuota, persistMeterSnapshotNow, refresh])

  useEffect(() => () => cancelScheduledMeterPersist(), [cancelScheduledMeterPersist])

  return {
    entitlement,
    readEntitlement,
    refresh,
    flushQuota,
    canAnalyze: canAnalyzeWithEntitlement(entitlement.mode),
  }
}
