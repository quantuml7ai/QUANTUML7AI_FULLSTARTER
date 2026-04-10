import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { mergeProfileCache, writeProfileAlias } from '../../profile/utils/profileCache'

const INITIAL_STATE = {
  activeFeedContextKey: '',
  activeRotationKey: '',
  seed: 0,
  ttlSec: 0,
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

function sanitizeBatchUsers(users, limit) {
  const seenIds = new Set()
  const out = []

  ;(Array.isArray(users) ? users : []).forEach((user) => {
    const canonicalAccountId = normalizeId(user?.canonicalAccountId || user?.userId)
    const nickname = normalizeId(user?.nickname)
    const avatar = normalizeId(user?.avatar)
    const followersCount = Number(user?.followersCount || 0)

    if (!canonicalAccountId || seenIds.has(canonicalAccountId)) return
    if (!nickname || !avatar || followersCount < 1) return

    seenIds.add(canonicalAccountId)
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
      if (state.activeFeedContextKey === nextContextKey) return state
      return {
        ...state,
        activeFeedContextKey: nextContextKey,
        loading: false,
        error: null,
        prefetchInFlight: false,
        generationId: Number(action.generationId || 0),
        slotAssignments: {},
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

      return {
        ...state,
        loading: false,
        prefetchInFlight: false,
        error: null,
        activeRotationKey: normalizeId(action.rotationKey || state.activeRotationKey),
        seed: Number(action.seed || state.seed || 0),
        ttlSec: Number(action.ttlSec || state.ttlSec || 0),
        batchesById,
        batchOrder,
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

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

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
    generationRef.current += 1
    dispatch({
      type: 'sync_context',
      feedContextKey: recommendationFeedContextKey,
      generationId: generationRef.current,
    })
  }, [recommendationFeedContextKey])

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

  const requestSignature = useMemo(() => {
    return [
      recommendationFeedContextKey,
      normalizeId(feedSort || 'random') || 'random',
      desiredRailSlotKeys.join(','),
      String(batchSize),
      String(batchesPerRequest),
      String(prefetchRailsAhead),
      normalizeId(state.activeRotationKey),
    ].join('|')
  }, [
    recommendationFeedContextKey,
    feedSort,
    desiredRailSlotKeys,
    batchSize,
    batchesPerRequest,
    prefetchRailsAhead,
    state.activeRotationKey,
  ])

  useEffect(() => {
    if (!enabled) return
    if (!videoFeedOpen) return
    if (!desiredRailSlotKeys.length) return
    if (state.prefetchInFlight) return
    if (desiredMissingCount <= 0 && unusedBufferedBatchCount >= prefetchRailsAhead) return
    if (state.lastRequestSignature === requestSignature) return

    const currentGenerationId = generationRef.current
    const requestBatchCount = Math.max(
      batchesPerRequest,
      desiredMissingCount + prefetchRailsAhead,
    )

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
    if (state.activeRotationKey) params.set('rotationKey', state.activeRotationKey)

    const headers = viewerId
      ? { 'x-forum-user-id': normalizeId(viewerId) }
      : undefined

    apiFetchRecommendations(`/api/forum/recommendations/users?${params.toString()}`, headers)
      .then((payload) => {
        if (!mountedRef.current) return
        if (generationRef.current !== currentGenerationId) return

        const nextBatches = Array.isArray(payload?.batches)
          ? payload.batches
            .map((batch) => ({
              ...batch,
              users: sanitizeBatchUsers(batch?.users, batchSize),
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

        dispatch({
          type: 'request_success',
          batches: nextBatches,
          rotationKey: normalizeId(payload?.rotationKey),
          ttlSec: Number(payload?.ttlSec || 0),
          seed: Number(payload?.seed || 0),
          replaceBuffer,
        })

        try {
          emitDiag?.('user_recommendations_prefetch_success', {
            receivedBatches: nextBatches.length,
            rotationKey: normalizeId(payload?.rotationKey),
            contextKey: recommendationFeedContextKey,
          }, { force: true })
        } catch {}
      })
      .catch((error) => {
        if (!mountedRef.current) return
        if (generationRef.current !== currentGenerationId) return
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
    desiredMissingCount,
    desiredRailSlotKeys,
    enabled,
    feedSort,
    prefetchRailsAhead,
    recommendationFeedContextKey,
    state.activeRotationKey,
    state.batchOrder.length,
    state.lastRequestSignature,
    state.prefetchInFlight,
    unusedBufferedBatchCount,
    videoFeedOpen,
    viewerId,
    emitDiag,
    requestSignature,
  ])

  const slotStatesByKey = useMemo(() => {
    const out = {}
    railSlots.forEach((slot) => {
      const batchId = normalizeId(state.slotAssignments?.[slot.slotKey])
      const batch = batchId ? state.batchesById?.[batchId] : null
      const users = Array.isArray(batch?.users) ? batch.users : []

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

async function apiFetchRecommendations(url, headers) {
  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    headers,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `HTTP ${response.status}`)
  }
  return payload
}
