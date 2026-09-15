import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mergeProfileCache, writeProfileAlias } from '../../profile/utils/profileCache'

const CLIENT_SNAPSHOT_CACHE_MS = 5 * 60 * 1000
const completedSnapshotCache = new Map()
const requestedBuildWeeks = new Set()

function normalizeId(value) {
  return String(value || '').trim()
}

function normalizeIdList(values) {
  return Array.from(new Set(
    (Array.isArray(values) ? values : []).map(normalizeId).filter(Boolean),
  ))
}

function hash32(input) {
  let hash = 0x811c9dc5
  const value = String(input || '')
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function stableShuffle(values, seedValue) {
  const out = Array.isArray(values) ? values.slice() : []
  let seed = (Number(seedValue) >>> 0) || 1
  for (let index = out.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const swapIndex = seed % (index + 1)
    ;[out[index], out[swapIndex]] = [out[swapIndex], out[index]]
  }
  return out
}

function sessionSeed() {
  try {
    const values = new Uint32Array(1)
    globalThis.crypto?.getRandomValues?.(values)
    if (values[0]) return values[0]
  } catch {}
  return hash32(`${Date.now()}|${Math.random()}`)
}

export function clientWeeklyBuildKey(nowMs = Date.now()) {
  const date = new Date(nowMs)
  const daysSinceMonday = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - daysSinceMonday)
  date.setUTCHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

export function nextRecommendationWeekBoundaryMs(nowMs = Date.now()) {
  return Date.parse(`${clientWeeklyBuildKey(nowMs)}T00:00:00.000Z`) + (7 * 24 * 60 * 60 * 1000)
}

export function sanitizeRecommendationSnapshot(users, excludedIds = []) {
  const excluded = new Set(normalizeIdList(excludedIds).map((id) => id.toLowerCase()))
  const seen = new Set()
  const out = []
  for (const user of Array.isArray(users) ? users : []) {
    const canonicalAccountId = normalizeId(user?.canonicalAccountId || user?.userId)
    const key = canonicalAccountId.toLowerCase()
    const nickname = normalizeId(user?.nickname)
    const avatar = normalizeId(user?.avatar)
    const followersCount = Number(user?.followersCount || 0)
    if (!canonicalAccountId || seen.has(key) || excluded.has(key)) continue
    if (!nickname || !avatar || !Number.isFinite(followersCount) || followersCount < 1) continue
    seen.add(key)
    out.push({
      ...user,
      userId: normalizeId(user?.userId || canonicalAccountId),
      canonicalAccountId,
      nickname,
      avatar,
      followersCount,
      isVip: !!user?.isVip,
    })
  }
  return out
}

export function buildRecommendationRailBatches(users, slots, {
  batchSize = 15,
  poolVersion = '',
  sessionSeed: railSessionSeed = 1,
} = {}) {
  const source = Array.isArray(users) ? users : []
  const railSlots = Array.isArray(slots) ? slots : []
  const size = Math.max(1, Math.trunc(Number(batchSize) || 15))
  const batches = {}
  if (!source.length) return batches

  if (source.length <= size) {
    const usedOrders = new Set()
    railSlots.forEach((slot, railIndex) => {
      const slotKey = readSlotKey(slot)
      let selected = source.slice()
      for (let attempt = 0; attempt < 32; attempt += 1) {
        selected = stableShuffle(
          source,
          hash32(`${poolVersion}|${railSessionSeed}|small|${railIndex}|${attempt}`),
        )
        const signature = selected.map((user) => normalizeId(user?.canonicalAccountId || user?.userId)).join('|')
        if (!usedOrders.has(signature) || source.length < 2) {
          usedOrders.add(signature)
          break
        }
      }
      batches[slotKey] = selected
    })
    return batches
  }

  let cycle = 0
  let cursor = 0
  let shuffled = stableShuffle(source, hash32(`${poolVersion}|${railSessionSeed}|cycle:0`))
  railSlots.forEach((slot) => {
    const selected = []
    const selectedIds = new Set()
    let guard = 0
    while (selected.length < size && guard < (source.length * 3)) {
      if (cursor >= shuffled.length) {
        cycle += 1
        cursor = 0
        shuffled = stableShuffle(source, hash32(`${poolVersion}|${railSessionSeed}|cycle:${cycle}`))
      }
      const user = shuffled[cursor]
      cursor += 1
      guard += 1
      const id = normalizeId(user?.canonicalAccountId || user?.userId).toLowerCase()
      if (!id || selectedIds.has(id)) continue
      selectedIds.add(id)
      selected.push(user)
    }
    batches[readSlotKey(slot)] = selected
  })
  return batches
}

function readSlotKey(slot) {
  return normalizeId(slot?.key || `recommendation:${slot?.railIndex || 0}`)
}

function emptyState(viewerKey, generationId, railSessionSeed) {
  return {
    viewerKey,
    generationId,
    sessionSeed: railSessionSeed,
    users: [],
    poolVersion: '',
    poolSize: 0,
    poolBuiltAt: '',
    buildWeek: '',
    targetBuildWeek: '',
    nextBuildAt: '',
    rebuildDue: false,
    poolReady: false,
    viewerCanonicalId: '',
    loading: false,
    error: null,
  }
}

export function __resetUserRecommendationsRailForTests() {
  completedSnapshotCache.clear()
  requestedBuildWeeks.clear()
}

export default function useUserRecommendationsRail({
  enabled,
  videoFeedOpen,
  viewerId,
  vfSlots,
  runtimeConfig,
  emitDiag,
}) {
  const viewerKey = normalizeId(viewerId || 'guest')
  const generationRef = useRef(0)
  const abortRef = useRef(null)
  const mountedRef = useRef(true)
  const primedProfilesRef = useRef(new Set())
  const emitDiagRef = useRef(emitDiag)
  emitDiagRef.current = emitDiag
  const [weekPulse, setWeekPulse] = useState(0)
  const [state, setState] = useState(() => emptyState(viewerKey, 0, sessionSeed()))

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      try { abortRef.current?.abort() } catch {}
      abortRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!enabled || !videoFeedOpen || typeof window === 'undefined') return undefined
    const nowMs = Date.now()
    const delay = Math.max(25, nextRecommendationWeekBoundaryMs(nowMs) - nowMs + 25)
    const timer = window.setTimeout(() => setWeekPulse((value) => value + 1), delay)
    return () => window.clearTimeout(timer)
  }, [enabled, videoFeedOpen, state.targetBuildWeek, state.rebuildDue])

  useEffect(() => {
    if (!enabled || !videoFeedOpen) {
      try { abortRef.current?.abort() } catch {}
      abortRef.current = null
      return undefined
    }

    const currentWeek = clientWeeklyBuildKey(Date.now())
    const cached = completedSnapshotCache.get(viewerKey)
    const cacheFresh = cached
      && (Date.now() - cached.cachedAt) < CLIENT_SNAPSHOT_CACHE_MS
      && cached.targetBuildWeek === currentWeek
      && cached.rebuildDue !== true

    generationRef.current += 1
    const generationId = generationRef.current
    const railSessionSeed = sessionSeed()
    try { abortRef.current?.abort() } catch {}
    const controller = new AbortController()
    abortRef.current = controller
    primedProfilesRef.current = new Set()

    const isCurrent = () => mountedRef.current
      && !controller.signal.aborted
      && generationRef.current === generationId

    const commit = (payload, cachedAt = Date.now()) => {
      if (!isCurrent()) return
      const responseViewerCanonicalId = normalizeId(payload?.viewerCanonicalId)
      const users = sanitizeRecommendationSnapshot(payload?.users, [viewerId, responseViewerCanonicalId])
      const next = {
        viewerKey,
        generationId,
        sessionSeed: railSessionSeed,
        users,
        poolVersion: normalizeId(payload?.poolVersion),
        poolSize: Number(payload?.poolSize || 0),
        poolBuiltAt: normalizeId(payload?.poolBuiltAt),
        buildWeek: normalizeId(payload?.buildWeek),
        targetBuildWeek: normalizeId(payload?.targetBuildWeek || currentWeek),
        nextBuildAt: normalizeId(payload?.nextBuildAt),
        rebuildDue: payload?.rebuildDue === true,
        poolReady: payload?.poolReady === true,
        viewerCanonicalId: responseViewerCanonicalId,
        loading: false,
        error: null,
      }
      setState(next)
      if (!next.rebuildDue && next.targetBuildWeek === currentWeek) {
        completedSnapshotCache.set(viewerKey, { ...payload, users, cachedAt })
      }
      try {
        emitDiagRef.current?.('user_recommendations_snapshot_ready', {
          poolVersion: next.poolVersion,
          poolSize: next.poolSize,
          deliveredUsers: users.length,
          buildWeek: next.buildWeek,
          rebuildDue: next.rebuildDue,
        }, { force: true })
      } catch {}
    }

    if (cacheFresh) {
      commit(cached, cached.cachedAt)
      abortRef.current = null
      return () => controller.abort()
    }

    setState({ ...emptyState(viewerKey, generationId, railSessionSeed), loading: true })
    const headers = viewerId ? { 'x-forum-user-id': normalizeId(viewerId) } : undefined

    const run = async () => {
      try {
        let payload = await apiFetchRecommendationSnapshot(headers, controller.signal)
        commit(payload)
        const targetBuildWeek = normalizeId(payload?.targetBuildWeek)
        if (payload?.rebuildDue && targetBuildWeek && !requestedBuildWeeks.has(targetBuildWeek)) {
          requestedBuildWeeks.add(targetBuildWeek)
          let result
          try {
            result = await apiTriggerRecommendationRebuild(headers, targetBuildWeek, controller.signal)
          } catch (error) {
            requestedBuildWeeks.delete(targetBuildWeek)
            throw error
          }
          if (result?.rebuilt || result?.reason === 'already_built_this_week') {
            payload = await apiFetchRecommendationSnapshot(headers, controller.signal)
            commit(payload)
          }
        }
      } catch (error) {
        if (!isCurrent()) return
        setState((current) => ({
          ...current,
          loading: false,
          error: normalizeId(error?.message || error || 'recommendations_failed'),
        }))
        try {
          emitDiagRef.current?.('user_recommendations_snapshot_error', {
            message: normalizeId(error?.message || error || 'recommendations_failed'),
          }, { force: true })
        } catch {}
      } finally {
        if (abortRef.current === controller) abortRef.current = null
      }
    }
    run()
    return () => controller.abort()
  }, [enabled, videoFeedOpen, viewerId, viewerKey, weekPulse])

  const railSlots = useMemo(() => (Array.isArray(vfSlots) ? vfSlots : [])
    .filter((slot) => String(slot?.type || '') === 'recommendation_rail')
    .map((slot, railIndex) => ({ ...slot, railIndex, slotKey: readSlotKey(slot) })), [vfSlots])

  const stateIsCurrent = state.viewerKey === viewerKey
  const users = useMemo(() => (stateIsCurrent ? state.users : []), [state.users, stateIsCurrent])
  const usersBySlot = useMemo(() => buildRecommendationRailBatches(users, railSlots, {
    batchSize: Number(runtimeConfig?.batchSize || 15),
    poolVersion: state.poolVersion,
    sessionSeed: state.sessionSeed,
  }), [railSlots, runtimeConfig?.batchSize, state.poolVersion, state.sessionSeed, users])

  const slotStatesByKey = useMemo(() => {
    const out = {}
    railSlots.forEach((slot, index) => {
      const slotUsers = usersBySlot[slot.slotKey] || []
      const batchId = slotUsers.length ? `${state.poolVersion || 'empty'}:local:${index}` : ''
      out[slot.slotKey] = {
        slot,
        slotKey: slot.slotKey,
        batchId,
        batch: batchId ? { batchId, users: slotUsers } : null,
        users: slotUsers,
        loading: stateIsCurrent && state.loading && !slotUsers.length,
        empty: !slotUsers.length && !(stateIsCurrent && state.loading),
        error: stateIsCurrent ? state.error : null,
      }
    })
    return out
  }, [railSlots, state.error, state.loading, state.poolVersion, stateIsCurrent, usersBySlot])

  useEffect(() => {
    Object.values(slotStatesByKey).forEach((slotState) => {
      ;(slotState?.users || []).forEach((user) => {
        const canonicalAccountId = normalizeId(user?.canonicalAccountId)
        const userId = normalizeId(user?.userId || canonicalAccountId)
        if (!canonicalAccountId || primedProfilesRef.current.has(canonicalAccountId)) return
        primedProfilesRef.current.add(canonicalAccountId)
        try { writeProfileAlias(userId, canonicalAccountId) } catch {}
        try {
          mergeProfileCache(canonicalAccountId, {
            nickname: normalizeId(user?.nickname),
            icon: normalizeId(user?.avatar),
            vipActive: !!user?.isVip,
            updatedAt: Date.now(),
          })
        } catch {}
      })
    })
  }, [slotStatesByKey])

  const getSlotState = useCallback(
    (slotKey) => slotStatesByKey[normalizeId(slotKey)] || null,
    [slotStatesByKey],
  )
  const slotAssignments = useMemo(() => Object.fromEntries(
    Object.entries(slotStatesByKey).map(([key, value]) => [key, value.batchId]),
  ), [slotStatesByKey])

  return {
    enabled: !!enabled,
    activeFeedContextKey: viewerKey,
    activeRotationKey: stateIsCurrent ? state.poolVersion : '',
    seed: stateIsCurrent ? state.sessionSeed : 0,
    ttlSec: Math.trunc(CLIENT_SNAPSHOT_CACHE_MS / 1000),
    poolVersion: stateIsCurrent ? state.poolVersion : '',
    nextCursor: '',
    poolSize: stateIsCurrent ? state.poolSize : 0,
    poolBuiltAt: stateIsCurrent ? state.poolBuiltAt : '',
    buildWeek: stateIsCurrent ? state.buildWeek : '',
    targetBuildWeek: stateIsCurrent ? state.targetBuildWeek : '',
    rebuildDue: stateIsCurrent && state.rebuildDue,
    poolReady: stateIsCurrent && state.poolReady,
    loading: stateIsCurrent && state.loading,
    error: stateIsCurrent ? state.error : null,
    prefetchInFlight: stateIsCurrent && state.loading,
    generationId: state.generationId,
    excludeRecentUserIds: [],
    slotAssignments,
    slotStatesByKey,
    getSlotState,
  }
}

async function apiFetchRecommendationSnapshot(headers, signal) {
  const response = await fetch('/api/forum/recommendations/users', {
    method: 'GET',
    cache: 'no-store',
    headers,
    signal,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
  return payload
}

async function apiTriggerRecommendationRebuild(headers, targetBuildWeek, signal) {
  const response = await fetch('/api/forum/recommendations/users', {
    method: 'POST',
    cache: 'no-store',
    headers: { ...(headers || {}), 'content-type': 'application/json' },
    body: JSON.stringify({ targetBuildWeek }),
    signal,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
  return payload
}
