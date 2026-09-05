import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { mergeProfileCache, writeProfileAlias } from '../../profile/utils/profileCache'

const INITIAL_STATE = {
  activeFeedContextKey: '',
  activeRotationKey: '',
  seed: 0,
  ttlSec: 0,
  activePoolVersion: '',
  nextCursor: '',
  poolSize: 0,
  poolBuiltAt: '',
  loading: false,
  error: null,
  prefetchInFlight: false,
  generationId: 0,
  lastRequestSignature: '',
  batchesById: {},
  batchOrder: [],
  slotAssignments: {},
}

function normalizeId(value) {
  return String(value || '').trim()
}

function normalizeIdList(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeId(value))
        .filter(Boolean),
    ),
  )
}

function sanitizeBatchUsers(users, limit, excludedIds = []) {
  const seenIds = new Set()
  const excluded = new Set(normalizeIdList(excludedIds).map((id) => id.toLowerCase()))
  const out = []

  ;(Array.isArray(users) ? users : []).forEach((user) => {
    const canonicalAccountId = normalizeId(user?.canonicalAccountId || user?.userId)
    const canonicalKey = canonicalAccountId.toLowerCase()
    const nickname = normalizeId(user?.nickname)
    const avatar = normalizeId(user?.avatar)
    const followersCount = Number(user?.followersCount || 0)

    if (!canonicalAccountId || seenIds.has(canonicalKey) || excluded.has(canonicalKey)) return
    if (!nickname || !avatar || !Number.isFinite(followersCount) || followersCount < 1) return

    seenIds.add(canonicalKey)
    out.push({
      ...user,
      canonicalAccountId,
      userId: normalizeId(user?.userId || canonicalAccountId),
      nickname,
      avatar,
      followersCount,
      isVip: !!user?.isVip,
    })
  })

  const maxUsers = Math.max(1, Number(limit || 0) || out.length || 1)
  return out.slice(0, maxUsers)
}

function recommendationReducer(state, action) {
  switch (action.type) {
    case 'sync_context': {
      const nextContextKey = normalizeId(action.feedContextKey)
      const restoredPoolVersion = normalizeId(action.restoredPoolVersion)
      const restoredCursor = normalizeId(action.restoredCursor)
      if (state.activeFeedContextKey === nextContextKey && state.generationId === Number(action.generationId || 0)) return state
      // Viewer/auth/feed-context transitions are atomic boundaries. No guest/user-A
      // batch, cursor, request signature or slot assignment may survive into the
      // next identity context.
      return {
        ...INITIAL_STATE,
        activeFeedContextKey: nextContextKey,
        generationId: Number(action.generationId || 0),
        activePoolVersion: restoredPoolVersion,
        nextCursor: restoredCursor,
      }
    }
    case 'cleanup_slots': {
      const validSlotKeys = new Set(normalizeIdList(action.slotKeys))
      const nextAssignments = {}
      let changed = false

      Object.entries(state.slotAssignments || {}).forEach(([slotKey, batchId]) => {
        if (!validSlotKeys.has(slotKey)) {
          changed = true
          return
        }
        nextAssignments[slotKey] = batchId
      })

      if (!changed) return state
      return {
        ...state,
        slotAssignments: nextAssignments,
      }
    }
    case 'assign_slots': {
      const slotKeys = normalizeIdList(action.slotKeys)
      if (!slotKeys.length || !(state.batchOrder || []).length) return state

      const nextAssignments = { ...(state.slotAssignments || {}) }
      const usedBatchIds = new Set(
        Object.values(nextAssignments)
          .map((value) => normalizeId(value))
          .filter(Boolean),
      )
      let changed = false

      slotKeys.forEach((slotKey) => {
        const existingBatchId = normalizeId(nextAssignments[slotKey])
        if (existingBatchId && state.batchesById?.[existingBatchId]) return

        const nextBatchId = (state.batchOrder || []).find((batchId) => {
          const normalizedBatchId = normalizeId(batchId)
          if (!normalizedBatchId || usedBatchIds.has(normalizedBatchId)) return false
          return !!state.batchesById?.[normalizedBatchId]
        })

        if (!nextBatchId) return
        nextAssignments[slotKey] = nextBatchId
        usedBatchIds.add(nextBatchId)
        changed = true
      })

      if (!changed) return state
      return {
        ...state,
        slotAssignments: nextAssignments,
      }
    }
    case 'request_start': {
      return {
        ...state,
        loading: !(state.batchOrder || []).length,
        prefetchInFlight: true,
        error: null,
        lastRequestSignature: normalizeId(action.requestSignature),
      }
    }
    case 'request_success': {
      const nextBatches = Array.isArray(action.batches) ? action.batches : []
      const replaceBuffer = !!action.replaceBuffer
      const batchesById = replaceBuffer ? {} : { ...(state.batchesById || {}) }
      const batchOrder = replaceBuffer ? [] : [ ...(state.batchOrder || []) ]

      nextBatches.forEach((batch) => {
        const batchId = normalizeId(batch?.batchId)
        if (!batchId) return
        batchesById[batchId] = batch
        if (!batchOrder.includes(batchId)) batchOrder.push(batchId)
      })

      const nextPoolVersion = normalizeId(action.poolVersion || state.activePoolVersion)
      const poolChanged = !!(state.activePoolVersion && nextPoolVersion && state.activePoolVersion !== nextPoolVersion)
      if (poolChanged) {
        Object.keys(batchesById).forEach((key) => delete batchesById[key])
        batchOrder.splice(0, batchOrder.length)
        nextBatches.forEach((batch) => {
          const batchId = normalizeId(batch?.batchId)
          if (!batchId) return
          batchesById[batchId] = batch
          if (!batchOrder.includes(batchId)) batchOrder.push(batchId)
        })
      }
      return {
        ...state,
        loading: false,
        prefetchInFlight: false,
        error: null,
        activeRotationKey: normalizeId(action.rotationKey || state.activeRotationKey),
        activePoolVersion: nextPoolVersion,
        nextCursor: normalizeId(action.nextCursor || ''),
        poolSize: Number(action.poolSize || 0),
        poolBuiltAt: normalizeId(action.poolBuiltAt || ''),
        seed: Number(action.seed || state.seed || 0),
        ttlSec: Number(action.ttlSec || state.ttlSec || 0),
        batchesById,
        batchOrder,
        slotAssignments: poolChanged ? {} : state.slotAssignments,
      }
    }
    case 'cursor_restore': {
      return {
        ...state,
        activePoolVersion: normalizeId(action.poolVersion || state.activePoolVersion),
        nextCursor: normalizeId(action.cursor || state.nextCursor),
      }
    }
    case 'rebuild_complete': {
      return {
        ...state,
        lastRequestSignature: '',
      }
    }
    case 'request_error': {
      return {
        ...state,
        loading: false,
        prefetchInFlight: false,
        error: normalizeId(action.error || 'recommendations_failed'),
      }
    }
    default:
      return state
  }
}

function readSlotKey(slot) {
  return normalizeId(slot?.key || `recommendation:${slot?.railIndex || 0}`)
}

function cursorLatestKey(viewerId) {
  return `ql7:recommendations:${normalizeId(viewerId || 'guest')}:latest`
}

function cursorPoolKey(viewerId, poolVersion) {
  return `ql7:recommendations:${normalizeId(viewerId || 'guest')}:${normalizeId(poolVersion)}`
}

function readStoredCursor(viewerId) {
  if (typeof window === 'undefined') return null
  try {
    const latestVersion = normalizeId(window.sessionStorage.getItem(cursorLatestKey(viewerId)))
    if (!latestVersion) return null
    const cursor = normalizeId(window.sessionStorage.getItem(cursorPoolKey(viewerId, latestVersion)))
    return cursor ? { poolVersion: latestVersion, cursor } : null
  } catch {
    return null
  }
}

function writeStoredCursor(viewerId, poolVersion, cursor) {
  if (typeof window === 'undefined') return
  const version = normalizeId(poolVersion)
  const value = normalizeId(cursor)
  if (!version || !value) return
  try {
    window.sessionStorage.setItem(cursorLatestKey(viewerId), version)
    window.sessionStorage.setItem(cursorPoolKey(viewerId, version), value)
  } catch {}
}

export default function useUserRecommendationsRail({
  enabled,
  videoFeedOpen,
  viewerId,
  feedSort,
  feedContextKey,
  vfSlots,
  vfWin,
  runtimeConfig,
  emitDiag,
}) {
  const [state, dispatch] = useReducer(recommendationReducer, INITIAL_STATE)
  const stateRef = useRef(state)
  const generationRef = useRef(0)
  const mountedRef = useRef(true)
  const rebuildTriggerRef = useRef(new Set())
  const requestAbortRef = useRef(null)
  const activeViewerKeyRef = useRef('')
  const [cursorStorageViewer, setCursorStorageViewer] = useState('')

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      try { requestAbortRef.current?.abort() } catch {}
      requestAbortRef.current = null
    }
  }, [])

  const cursorStorageReady = cursorStorageViewer === normalizeId(viewerId || 'guest')

  const batchSize = Math.max(1, Number(runtimeConfig?.batchSize || 15) || 15)
  const batchesPerRequest = Math.max(1, Number(runtimeConfig?.batchesPerRequest || 4) || 4)
  const prefetchRailsAhead = Math.max(0, Number(runtimeConfig?.prefetchRailsAhead || 0) || 0)

  const recommendationFeedContextKey = useMemo(() => {
    return [
      'video',
      normalizeId(feedSort || 'random'),
      normalizeId(viewerId || 'guest'),
      normalizeId(feedContextKey || ''),
    ].join('|')
  }, [feedContextKey, feedSort, viewerId])

  const railSlots = useMemo(() => {
    return (Array.isArray(vfSlots) ? vfSlots : [])
      .filter((slot) => String(slot?.type || '') === 'recommendation_rail')
      .map((slot, railIndex) => ({
        ...slot,
        railIndex: Number(slot?.railIndex ?? railIndex),
        slotKey: readSlotKey(slot),
      }))
  }, [vfSlots])

  const railSlotKeys = useMemo(
    () => railSlots.map((slot) => slot.slotKey),
    [railSlots],
  )

  const visibleRailSlotKeys = useMemo(() => {
    if (!Array.isArray(vfSlots) || !vfSlots.length) return []
    const start = Math.max(0, Number(vfWin?.start || 0))
    const end = Math.max(start, Number(vfWin?.end || 0))
    return vfSlots
      .slice(start, end)
      .filter((slot) => String(slot?.type || '') === 'recommendation_rail')
      .map((slot) => readSlotKey(slot))
  }, [vfSlots, vfWin])

  const desiredRailSlotKeys = useMemo(() => {
    if (!railSlots.length) return []
    if (!videoFeedOpen) return []

    if (!visibleRailSlotKeys.length) {
      return railSlots
        .slice(0, Math.max(1, prefetchRailsAhead + 1))
        .map((slot) => slot.slotKey)
    }

    const firstVisibleIndex = railSlots.findIndex((slot) => slot.slotKey === visibleRailSlotKeys[0])
    const lastVisibleIndex = railSlots.findIndex(
      (slot) => slot.slotKey === visibleRailSlotKeys[visibleRailSlotKeys.length - 1],
    )
    const safeStart = firstVisibleIndex >= 0 ? firstVisibleIndex : 0
    const safeEnd = lastVisibleIndex >= 0 ? lastVisibleIndex : safeStart

    return railSlots
      .slice(safeStart, safeEnd + prefetchRailsAhead + 1)
      .map((slot) => slot.slotKey)
  }, [prefetchRailsAhead, railSlots, videoFeedOpen, visibleRailSlotKeys])

  useEffect(() => {
    const viewerKey = normalizeId(viewerId || 'guest')
    // guest -> user, user A -> user B, user -> guest, and feed-context changes
    // invalidate the whole old recommendation generation before any new fetch.
    try { requestAbortRef.current?.abort() } catch {}
    requestAbortRef.current = null
    generationRef.current += 1
    activeViewerKeyRef.current = viewerKey
    const stored = readStoredCursor(viewerId)
    dispatch({
      type: 'sync_context',
      feedContextKey: recommendationFeedContextKey,
      generationId: generationRef.current,
      restoredPoolVersion: stored?.poolVersion || '',
      restoredCursor: stored?.cursor || '',
    })
    setCursorStorageViewer(viewerKey)
  }, [recommendationFeedContextKey, viewerId])

  useEffect(() => {
    dispatch({ type: 'cleanup_slots', slotKeys: railSlotKeys })
  }, [railSlotKeys])

  useEffect(() => {
    if (!enabled || !desiredRailSlotKeys.length) return
    dispatch({ type: 'assign_slots', slotKeys: desiredRailSlotKeys })
  }, [desiredRailSlotKeys, enabled, state.batchOrder, state.batchesById, state.slotAssignments])

  const excludeRecentUserIds = useMemo(() => [], [])

  const desiredMissingCount = useMemo(() => {
    return desiredRailSlotKeys.reduce((count, slotKey) => {
      const assignedBatchId = normalizeId(state.slotAssignments?.[slotKey])
      if (assignedBatchId && state.batchesById?.[assignedBatchId]) return count
      return count + 1
    }, 0)
  }, [desiredRailSlotKeys, state.batchesById, state.slotAssignments])

  const unusedBufferedBatchCount = useMemo(() => {
    const usedBatchIds = new Set(
      Object.values(state.slotAssignments || {})
        .map((value) => normalizeId(value))
        .filter(Boolean),
    )

    return (state.batchOrder || []).reduce((count, batchId) => {
      const normalizedBatchId = normalizeId(batchId)
      if (!normalizedBatchId || usedBatchIds.has(normalizedBatchId)) return count
      if (!state.batchesById?.[normalizedBatchId]) return count
      return count + 1
    }, 0)
  }, [state.batchOrder, state.batchesById, state.slotAssignments])

  // desiredRailSlotKeys already contains the visible rails plus the configured
  // look-ahead. Buffered batches are supply for that demand, not decoration.
  // Counting prefetchRailsAhead again here made the bootstrap GET hydrate up to
  // seven 15-user rails before the first visible rail could render.
  const requiredAdditionalBatchCount = Math.max(
    0,
    desiredMissingCount - unusedBufferedBatchCount,
  )

  const hasAssignedBatch = useMemo(() => {
    return Object.values(state.slotAssignments || {}).some((batchId) => {
      const normalizedBatchId = normalizeId(batchId)
      return !!normalizedBatchId && !!state.batchesById?.[normalizedBatchId]
    })
  }, [state.batchesById, state.slotAssignments])

  const requestSignature = useMemo(() => {
    return [
      recommendationFeedContextKey,
      normalizeId(feedSort || 'random') || 'random',
      desiredRailSlotKeys.join(','),
      String(batchSize),
      String(batchesPerRequest),
      String(prefetchRailsAhead),
      normalizeId(state.activeRotationKey),
      normalizeId(state.activePoolVersion),
    ].join('|')
  }, [
    recommendationFeedContextKey,
    feedSort,
    desiredRailSlotKeys,
    batchSize,
    batchesPerRequest,
    prefetchRailsAhead,
    state.activeRotationKey,
    state.activePoolVersion,
  ])

  useEffect(() => {
    if (!enabled) return
    if (!cursorStorageReady) return
    if (!videoFeedOpen) return
    if (!desiredRailSlotKeys.length) return
    if (state.prefetchInFlight) return
    if (requiredAdditionalBatchCount <= 0) return
    if (state.lastRequestSignature === requestSignature) return
    // Let assign_slots publish the first buffered batch before starting the
    // background look-ahead request. This keeps a very fast response from
    // replacing the bootstrap buffer before users can see it.
    if (state.batchOrder.length && unusedBufferedBatchCount > 0 && !hasAssignedBatch) return

    const currentGenerationId = generationRef.current
    const requestViewerKey = normalizeId(viewerId || 'guest')
    const controller = new AbortController()
    try { requestAbortRef.current?.abort() } catch {}
    requestAbortRef.current = controller
    // First paint must wait for one 15-user rail, not for every prefetched rail.
    // Once that rail is assigned, the existing buffered prefetch policy resumes.
    const requestBatchCount = state.batchOrder.length === 0
      ? 1
      : Math.max(batchesPerRequest, requiredAdditionalBatchCount)

    dispatch({ type: 'request_start', requestSignature })

    try {
      emitDiag?.('user_recommendations_prefetch_start', {
        desiredRailCount: desiredRailSlotKeys.length,
        missingRailCount: desiredMissingCount,
        requestBatchCount,
        contextKey: recommendationFeedContextKey,
      }, { force: true })
    } catch {}

    const params = new URLSearchParams()
    params.set('feedMode', 'video')
    params.set('sort', normalizeId(feedSort || 'random') || 'random')
    params.set('batchSize', String(batchSize))
    params.set('batches', String(requestBatchCount))
    if (state.nextCursor) params.set('cursor', state.nextCursor)

    const headers = viewerId
      ? { 'x-forum-user-id': normalizeId(viewerId) }
      : undefined

    apiFetchRecommendations(`/api/forum/recommendations/users?${params.toString()}`, headers, controller.signal)
      .then((payload) => {
        if (!mountedRef.current) return
        if (generationRef.current !== currentGenerationId) return
        if (activeViewerKeyRef.current !== requestViewerKey) return
        if (controller.signal.aborted) return

        const responseViewerCanonicalId = normalizeId(payload?.viewerCanonicalId)
        const clientExcludedIds = normalizeIdList([viewerId, responseViewerCanonicalId])
        const nextBatches = Array.isArray(payload?.batches)
          ? payload.batches
            .map((batch) => ({
              ...batch,
              users: sanitizeBatchUsers(batch?.users, batchSize, clientExcludedIds),
            }))
            .filter((batch) => batch.users.length > 0)
          : []
        nextBatches.forEach((batch) => {
          ;(batch?.users || []).forEach((user) => {
            const canonicalAccountId = normalizeId(user?.canonicalAccountId)
            const userId = normalizeId(user?.userId || canonicalAccountId)
            if (!canonicalAccountId) return
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

        const prevState = stateRef.current
        const hasAssignedSlots = Object.keys(prevState.slotAssignments || {}).length > 0
        const replaceBuffer =
          !prevState.batchOrder.length ||
          !hasAssignedSlots ||
          prevState.activeFeedContextKey !== recommendationFeedContextKey

        const poolVersion = normalizeId(payload?.poolVersion)
        const nextCursor = normalizeId(payload?.nextCursor)
        dispatch({
          type: 'request_success',
          batches: nextBatches,
          rotationKey: normalizeId(payload?.rotationKey),
          poolVersion,
          nextCursor,
          poolSize: Number(payload?.poolSize || 0),
          poolBuiltAt: normalizeId(payload?.poolBuiltAt),
          ttlSec: Number(payload?.ttlSec || 0),
          seed: Number(payload?.seed || 0),
          replaceBuffer: replaceBuffer || (!!prevState.activePoolVersion && !!poolVersion && prevState.activePoolVersion !== poolVersion),
        })
        writeStoredCursor(viewerId, poolVersion, nextCursor)
        if (requestAbortRef.current === controller) requestAbortRef.current = null

        if (payload?.rebuildDue) {
          const rebuildKey = poolVersion || 'bootstrap'
          if (!rebuildTriggerRef.current.has(rebuildKey)) {
            rebuildTriggerRef.current.add(rebuildKey)
            apiTriggerRecommendationRebuild(headers)
              .then((result) => {
                if (!mountedRef.current) return
                if (result?.rebuilt) dispatch({ type: 'rebuild_complete' })
              })
              .catch(() => {})
          }
        }

        try {
          emitDiag?.('user_recommendations_prefetch_success', {
            receivedBatches: nextBatches.length,
            rotationKey: normalizeId(payload?.rotationKey),
            contextKey: recommendationFeedContextKey,
          }, { force: true })
        } catch {}
      })
      .catch((error) => {
        if (requestAbortRef.current === controller) requestAbortRef.current = null
        if (!mountedRef.current) return
        if (controller.signal.aborted || error?.name === 'AbortError') return
        if (generationRef.current !== currentGenerationId) return
        if (activeViewerKeyRef.current !== requestViewerKey) return
        dispatch({
          type: 'request_error',
          error: String(error?.message || error || 'recommendations_failed'),
        })
        try {
          emitDiag?.('user_recommendations_prefetch_error', {
            message: String(error?.message || error || 'recommendations_failed'),
            contextKey: recommendationFeedContextKey,
          }, { force: true })
        } catch {}
      })
  }, [
    batchSize,
    batchesPerRequest,
    cursorStorageReady,
    desiredRailSlotKeys,
    enabled,
    feedSort,
    hasAssignedBatch,
    prefetchRailsAhead,
    recommendationFeedContextKey,
    state.activeRotationKey,
    state.activePoolVersion,
    state.nextCursor,
    state.batchOrder.length,
    state.lastRequestSignature,
    state.prefetchInFlight,
    requiredAdditionalBatchCount,
    desiredMissingCount,
    unusedBufferedBatchCount,
    videoFeedOpen,
    viewerId,
    emitDiag,
    requestSignature,
  ])

  const slotStatesByKey = useMemo(() => {
    const out = {}
    const contextIsCurrent = state.activeFeedContextKey === recommendationFeedContextKey
    railSlots.forEach((slot) => {
      const batchId = contextIsCurrent ? normalizeId(state.slotAssignments?.[slot.slotKey]) : ''
      const batch = batchId ? state.batchesById?.[batchId] : null
      // A viewer/auth change is visible in recommendationFeedContextKey during render,
      // before the reset effect runs. Never paint a stale guest/user-A batch into the
      // new viewer context even for one frame.
      const users = contextIsCurrent && Array.isArray(batch?.users) ? batch.users : []

      out[slot.slotKey] = {
        slot,
        slotKey: slot.slotKey,
        batchId,
        batch,
        users,
        loading: !!state.prefetchInFlight && !users.length,
        empty: !users.length && !state.prefetchInFlight && !state.loading,
        error: state.error,
      }
    })
    return out
  }, [
    railSlots,
    recommendationFeedContextKey,
    state.activeFeedContextKey,
    state.batchesById,
    state.loading,
    state.prefetchInFlight,
    state.slotAssignments,
    state.error,
  ])

  const getSlotState = useCallback(
    (slotKey) => slotStatesByKey[normalizeId(slotKey)] || null,
    [slotStatesByKey],
  )

  return {
    enabled: !!enabled,
    activeFeedContextKey: state.activeFeedContextKey,
    activeRotationKey: state.activeRotationKey,
    seed: state.seed,
    ttlSec: state.ttlSec,
    poolVersion: state.activePoolVersion,
    nextCursor: state.nextCursor,
    poolSize: state.poolSize,
    poolBuiltAt: state.poolBuiltAt,
    loading: state.loading,
    error: state.error,
    prefetchInFlight: state.prefetchInFlight,
    generationId: state.generationId,
    excludeRecentUserIds,
    slotAssignments: state.slotAssignments,
    slotStatesByKey,
    getSlotState,
  }
}

async function apiFetchRecommendations(url, headers, signal) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers,
    signal,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`)
  }
  return payload
}

async function apiTriggerRecommendationRebuild(headers) {
  const response = await fetch('/api/forum/recommendations/users', {
    method: 'POST',
    cache: 'no-store',
    headers,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
  return payload
}
