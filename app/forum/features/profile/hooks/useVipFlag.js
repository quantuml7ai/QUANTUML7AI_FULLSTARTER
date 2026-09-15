import React from 'react'
import { vipFromHint, vipFromProfile } from '../utils/vip'
import {
  resolveProfileAccountId,
  safeReadProfile,
  mergeProfileCache,
} from '../utils/profileCache'

const VIP_PROBE_CACHE_LIMIT = 1000
const VIP_PROBE_TTL_MS = 60 * 1000
const VIP_BATCH_QUIET_MS = 120
const VIP_BATCH_MAX_WAIT_MS = 800
const VIP_BATCH_HIGH_WATER = 96
const VIP_BATCH_MAX = 250
const VIP_UNAVAILABLE_RETRY_DELAYS_MS = Object.freeze([5000, 15000, 30000, 60000])
const vipProbeOnce = new Map()
const vipConfirmedState = new Map()
const vipSubscribers = new Map()
const vipProbeQueue = new Set()
const vipProbeQueuedKeys = new Set()
const vipProbeInFlightKeys = new Set()
const vipUnavailableRetry = new Map()
let vipBatchTimer = 0
let vipBatchFirstQueuedAt = 0
let vipBatchInFlight = false
let vipExpiryTimer = 0
let vipUnavailableRetryTimer = 0
let vipBrokerListenersReady = false

function normalizeVipId(value) {
  return String(value || '').trim().toLowerCase()
}

function pruneBoundedMap(map, limit = VIP_PROBE_CACHE_LIMIT) {
  while (map.size > limit) {
    const firstKey = map.keys().next().value
    if (firstKey === undefined) break
    map.delete(firstKey)
  }
}

function pruneVipProbeCache(now = Date.now()) {
  vipProbeOnce.forEach((ts, key) => {
    if (!Number.isFinite(Number(ts)) || (now - Number(ts)) > VIP_PROBE_TTL_MS) vipProbeOnce.delete(key)
  })
  pruneBoundedMap(vipProbeOnce)
  pruneBoundedMap(vipConfirmedState)
}

function hasRecentVipProbe(uid, now = Date.now()) {
  pruneVipProbeCache(now)
  const ts = Number(vipProbeOnce.get(normalizeVipId(uid)) || 0)
  return ts > 0 && (now - ts) <= VIP_PROBE_TTL_MS
}

function markVipProbe(uid, checkedAt = Date.now()) {
  const key = normalizeVipId(uid)
  const ts = Number(checkedAt || 0) || Date.now()
  if (!key) return
  vipProbeOnce.delete(key)
  vipProbeOnce.set(key, ts)
  pruneVipProbeCache(Date.now())
}

function clearUnavailableVipRetry(uid) {
  const key = normalizeVipId(uid)
  if (!key) return
  vipUnavailableRetry.delete(key)
}

function vipUnavailableRetryPending(uid, now = Date.now()) {
  const key = normalizeVipId(uid)
  const state = key ? vipUnavailableRetry.get(key) : null
  return !!state && Number(state.nextAt || 0) > now
}

function scheduleNearestUnavailableVipRetry() {
  if (typeof window === 'undefined') return
  if (vipUnavailableRetryTimer) {
    window.clearTimeout(vipUnavailableRetryTimer)
    vipUnavailableRetryTimer = 0
  }

  const now = Date.now()
  let nearest = 0
  for (const [key, state] of Array.from(vipUnavailableRetry.entries())) {
    const nextAt = Number(state?.nextAt || 0) || 0
    if (!nextAt) continue
    const subscriber = vipSubscribers.get(key)
    if (!subscriber?.listeners?.size) continue
    if (!nearest || nextAt < nearest) nearest = nextAt
  }
  if (!nearest) return

  vipUnavailableRetryTimer = window.setTimeout(() => {
    vipUnavailableRetryTimer = 0
    const current = Date.now()
    const due = []
    for (const [key, state] of Array.from(vipUnavailableRetry.entries())) {
      if (Number(state?.nextAt || 0) > current) continue
      const subscriber = vipSubscribers.get(key)
      if (subscriber?.listeners?.size && subscriber?.uid) {
        vipUnavailableRetry.set(key, { ...state, nextAt: 0 })
        due.push(subscriber.uid)
      } else {
        vipUnavailableRetry.delete(key)
      }
    }
    if (due.length) queueVipProbes(due)
    scheduleNearestUnavailableVipRetry()
  }, Math.max(25, nearest - now))
}

function markUnavailableVipRetry(uid, now = Date.now()) {
  const key = normalizeVipId(uid)
  if (!key) return
  const previousAttempt = Math.max(0, Number(vipUnavailableRetry.get(key)?.attempt || 0) || 0)
  const attempt = Math.min(previousAttempt + 1, VIP_UNAVAILABLE_RETRY_DELAYS_MS.length)
  const delay = VIP_UNAVAILABLE_RETRY_DELAYS_MS[Math.max(0, attempt - 1)]
  vipUnavailableRetry.delete(key)
  vipUnavailableRetry.set(key, { attempt, nextAt: now + delay })
  pruneBoundedMap(vipUnavailableRetry)
  scheduleNearestUnavailableVipRetry()
}

function readVipUntil(profile = {}) {
  const value = Number(
    profile?.vipUntil ??
      profile?.vipExpiresAt ??
      profile?.vip_until ??
      profile?.vip_exp ??
      0,
  )
  return Number.isFinite(value) && value > 0 ? value : 0
}

function readProfileVipSnapshot(uid, now = Date.now()) {
  const profile = safeReadProfile(uid) || {}
  const checkedAt = Number(profile?.vipCheckedAt || 0) || 0
  const untilMs = readVipUntil(profile)
  const fresh = checkedAt > 0 && (now - checkedAt) <= VIP_PROBE_TTL_MS
  if (fresh) {
    const explicit = vipFromProfile(profile)
    const active = untilMs > 0 ? untilMs > now : explicit === true
    return { fresh: true, active, untilMs, checkedAt, profile }
  }
  const explicit = vipFromProfile(profile)
  return {
    fresh: false,
    active: untilMs > 0 ? untilMs > now : explicit === true,
    untilMs,
    checkedAt,
    profile,
  }
}

function readOptimisticVip(uid, hint, now = Date.now()) {
  const cached = readProfileVipSnapshot(uid, now)
  if (cached.checkedAt > 0 || cached.untilMs > 0) return cached.active
  const fromHint = vipFromHint(hint)
  if (fromHint !== null) return fromHint === true
  return cached.active === true
}

function notifyVipSubscribers(ids, active) {
  const keys = new Set((Array.isArray(ids) ? ids : [ids]).map(normalizeVipId).filter(Boolean))
  for (const key of keys) {
    const subscriber = vipSubscribers.get(key)
    if (!subscriber?.listeners?.size) continue
    for (const listener of Array.from(subscriber.listeners)) {
      try { listener(active) } catch {}
    }
  }
}

function scheduleNearestVipExpiry() {
  if (typeof window === 'undefined') return
  if (vipExpiryTimer) {
    window.clearTimeout(vipExpiryTimer)
    vipExpiryTimer = 0
  }

  const now = Date.now()
  let nearest = 0
  for (const state of vipConfirmedState.values()) {
    const untilMs = Number(state?.untilMs || 0) || 0
    if (!state?.active || untilMs <= now) continue
    if (!nearest || untilMs < nearest) nearest = untilMs
  }
  if (!nearest) return

  const delay = Math.max(25, Math.min(2_147_000_000, nearest - now + 25))
  vipExpiryTimer = window.setTimeout(() => {
    vipExpiryTimer = 0
    const current = Date.now()
    for (const [key, state] of Array.from(vipConfirmedState.entries())) {
      const untilMs = Number(state?.untilMs || 0) || 0
      if (!state?.active || !untilMs || untilMs > current) continue
      const next = { ...state, active: false }
      vipConfirmedState.set(key, next)
      try {
        mergeProfileCache(state.uid, {
          vipActive: false,
          isVip: false,
          vipUntil: untilMs,
          vipCheckedAt: Number(state.checkedAt || current) || current,
        })
      } catch {}
      notifyVipSubscribers([state.uid], false)
    }
    scheduleNearestVipExpiry()
  }, delay)
}

function commitVipState(uid, entry = {}, fallbackCheckedAt = Date.now()) {
  const rawUid = String(uid || '').trim()
  const key = normalizeVipId(rawUid)
  if (!rawUid || !key || entry?.available === false) return false

  const checkedAt = Number(entry?.checkedAt || fallbackCheckedAt || 0) || Date.now()
  const untilMs = Number(entry?.untilMs || (entry?.untilISO ? Date.parse(entry.untilISO) : 0) || 0) || 0
  const active = untilMs > 0 ? untilMs > Date.now() : !!entry?.active
  const current = vipConfirmedState.get(key)
  if (current && Number(current.checkedAt || 0) > checkedAt) return false

  markVipProbe(rawUid, Date.now())
  clearUnavailableVipRetry(rawUid)
  dropQueuedVipProbe(rawUid)
  vipConfirmedState.delete(key)
  vipConfirmedState.set(key, { uid: rawUid, active, untilMs, checkedAt })
  pruneBoundedMap(vipConfirmedState)
  try {
    mergeProfileCache(rawUid, {
      vipActive: active,
      isVip: active,
      vipUntil: untilMs,
      vipCheckedAt: checkedAt,
    })
  } catch {}
  notifyVipSubscribers([rawUid], active)
  scheduleNearestVipExpiry()
  return true
}

function handleVipReadyEvent(event) {
  const detail = event?.detail || {}
  const checkedAt = Number(detail?.checkedAt || Date.now()) || Date.now()
  if (detail?.map && typeof detail.map === 'object') {
    for (const [id, entry] of Object.entries(detail.map)) commitVipState(id, entry, checkedAt)
    return
  }

  const ids = Array.isArray(detail?.ids) ? detail.ids : []
  if (!ids.length) return
  const entry = {
    available: detail?.available !== false,
    active: !!(detail?.active ?? detail?.vipActive),
    untilMs: Number(detail?.vipUntil || detail?.untilMs || 0) || 0,
    checkedAt,
  }
  for (const id of ids) commitVipState(id, entry, checkedAt)
}

function clearVipBatchTimer() {
  if (typeof window === 'undefined' || !vipBatchTimer) return
  window.clearTimeout(vipBatchTimer)
  vipBatchTimer = 0
}

function dropQueuedVipProbe(uid) {
  const key = normalizeVipId(uid)
  if (!key) return
  for (const raw of Array.from(vipProbeQueue)) {
    if (normalizeVipId(raw) !== key) continue
    vipProbeQueue.delete(raw)
  }
  vipProbeQueuedKeys.delete(key)
  if (!vipProbeQueue.size) {
    vipBatchFirstQueuedAt = 0
    clearVipBatchTimer()
  }
}

function enqueueVipProbe(uid, now = Date.now()) {
  const rawUid = String(uid || '').trim()
  const key = normalizeVipId(rawUid)
  if (
    !rawUid ||
    !key ||
    hasRecentVipProbe(rawUid, now) ||
    vipUnavailableRetryPending(rawUid, now) ||
    vipProbeQueuedKeys.has(key) ||
    vipProbeInFlightKeys.has(key)
  ) return false

  if (!vipProbeQueue.size) vipBatchFirstQueuedAt = now
  vipProbeQueue.add(rawUid)
  vipProbeQueuedKeys.add(key)
  return true
}

function scheduleVipProbeFlush() {
  if (typeof window === 'undefined' || vipBatchInFlight || !vipProbeQueue.size) return

  const now = Date.now()
  if (!vipBatchFirstQueuedAt) vipBatchFirstQueuedAt = now
  const waitedMs = Math.max(0, now - vipBatchFirstQueuedAt)
  const maxWaitRemainingMs = Math.max(0, VIP_BATCH_MAX_WAIT_MS - waitedMs)
  const immediate = vipProbeQueue.size >= VIP_BATCH_HIGH_WATER || maxWaitRemainingMs <= 0

  clearVipBatchTimer()
  if (immediate) {
    vipBatchFirstQueuedAt = 0
    void flushVipProbeQueue()
    return
  }

  vipBatchTimer = window.setTimeout(() => {
    vipBatchTimer = 0
    vipBatchFirstQueuedAt = 0
    void flushVipProbeQueue()
  }, Math.min(VIP_BATCH_QUIET_MS, maxWaitRemainingMs))
}

export function queueVipProbes(ids) {
  if (typeof window === 'undefined') return 0
  ensureVipBrokerListeners()
  const now = Date.now()
  let added = 0
  for (const uid of (Array.isArray(ids) ? ids : [ids])) {
    const resolvedUid = String(resolveProfileAccountId(uid) || uid || '').trim()
    if (enqueueVipProbe(resolvedUid, now)) added += 1
  }
  if (added) scheduleVipProbeFlush()
  return added
}

function queueVipProbe(uid) {
  queueVipProbes([uid])
}

async function flushVipProbeQueue() {
  if (vipBatchInFlight || !vipProbeQueue.size || typeof window === 'undefined') return
  clearVipBatchTimer()

  const list = Array.from(vipProbeQueue).slice(0, VIP_BATCH_MAX)
  for (const id of list) {
    vipProbeQueue.delete(id)
    const key = normalizeVipId(id)
    vipProbeQueuedKeys.delete(key)
    if (key) vipProbeInFlightKeys.add(key)
  }
  if (!vipProbeQueue.size) vipBatchFirstQueuedAt = 0

  vipBatchInFlight = true
  try {
    const response = await fetch('/api/forum/vip/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({ ids: list }),
    })
    const json = await response.json().catch(() => null)
    if (!json?.ok) {
      for (const id of list) markUnavailableVipRetry(id)
      return
    }
    const map = json?.map && typeof json.map === 'object' ? json.map : {}
    const unavailableIds = new Set((Array.isArray(json?.unavailableIds) ? json.unavailableIds : []).map(normalizeVipId).filter(Boolean))
    const confirmedMap = {}
    for (const id of list) {
      const entry = map?.[id]
      if (!entry || entry?.available === false || unavailableIds.has(normalizeVipId(id))) {
        markUnavailableVipRetry(id)
        continue
      }
      confirmedMap[id] = entry
    }
    if (Object.keys(confirmedMap).length) {
      try {
        window.dispatchEvent(new CustomEvent('forum:vip-status-ready', {
          detail: {
            ids: Object.keys(confirmedMap),
            map: confirmedMap,
            source: 'forum-vip-batch-broker',
            checkedAt: Number(json?.checkedAt || Date.now()) || Date.now(),
          },
        }))
      } catch {
        for (const [id, entry] of Object.entries(confirmedMap)) {
          commitVipState(id, entry, Number(json?.checkedAt || Date.now()) || Date.now())
        }
      }
    }
  } catch {
    // Transport/read failures never become "not VIP". Back off the still-stale
    // identities so windowing/remount churn cannot hot-loop the server.
    for (const id of list) markUnavailableVipRetry(id)
  } finally {
    for (const id of list) vipProbeInFlightKeys.delete(normalizeVipId(id))
    vipBatchInFlight = false

    // A card may mount while this request is in flight. Re-filter the shared
    // queue before scheduling the next batch so a just-confirmed identity can
    // never cause a redundant follow-up invocation.
    for (const id of Array.from(vipProbeQueue)) {
      if (!hasRecentVipProbe(id)) continue
      vipProbeQueue.delete(id)
      vipProbeQueuedKeys.delete(normalizeVipId(id))
    }

    if (vipProbeQueue.size) scheduleVipProbeFlush()
    else vipBatchFirstQueuedAt = 0
  }
}

function queueObservedVipRefresh() {
  const now = Date.now()
  pruneVipProbeCache(now)
  const staleIds = []
  for (const subscriber of vipSubscribers.values()) {
    if (!hasRecentVipProbe(subscriber?.uid, now)) staleIds.push(subscriber?.uid)
  }
  if (staleIds.length) queueVipProbes(staleIds)
}

function ensureVipBrokerListeners() {
  if (vipBrokerListenersReady || typeof window === 'undefined') return
  vipBrokerListenersReady = true
  try { window.addEventListener('forum:vip-status-ready', handleVipReadyEvent) } catch {}
  try { window.addEventListener('focus', queueObservedVipRefresh) } catch {}
  try { window.addEventListener('pageshow', queueObservedVipRefresh) } catch {}
  try {
    document.addEventListener('visibilitychange', () => {
      try {
        if (document.visibilityState === 'visible') queueObservedVipRefresh()
      } catch {}
    })
  } catch {}
}

function subscribeVip(uid, listener) {
  const rawUid = String(uid || '').trim()
  const key = normalizeVipId(rawUid)
  if (!key || typeof listener !== 'function') return () => {}
  let subscriber = vipSubscribers.get(key)
  if (!subscriber) {
    subscriber = { uid: rawUid, listeners: new Set() }
    vipSubscribers.set(key, subscriber)
  }
  subscriber.uid = rawUid
  subscriber.listeners.add(listener)
  scheduleNearestUnavailableVipRetry()
  return () => {
    const current = vipSubscribers.get(key)
    current?.listeners?.delete(listener)
    if (!current?.listeners?.size) vipSubscribers.delete(key)
    scheduleNearestUnavailableVipRetry()
  }
}

export default function useVipFlag(userId, hint) {
  const uid = String(resolveProfileAccountId(userId) || '').trim()
  const [vip, setVip] = React.useState(() => readOptimisticVip(uid, hint))

  React.useEffect(() => {
    const resolvedUid = String(resolveProfileAccountId(userId) || '').trim()
    if (!resolvedUid) {
      setVip(false)
      return undefined
    }

    ensureVipBrokerListeners()
    const unsubscribe = subscribeVip(resolvedUid, setVip)
    const cached = readProfileVipSnapshot(resolvedUid)
    if (cached.fresh) {
      commitVipState(resolvedUid, {
        available: true,
        active: cached.active,
        untilMs: cached.untilMs,
        checkedAt: cached.checkedAt,
      }, cached.checkedAt)
      setVip(cached.active)
    } else {
      setVip(readOptimisticVip(resolvedUid, hint))
      queueVipProbe(resolvedUid)
    }

    return unsubscribe
  }, [userId, hint])

  return vip === true
}
