'use client'

export const MEDIA_LIFECYCLE_STATES = Object.freeze({
  PREWARM_CANDIDATE: 'prewarm_candidate',
  READY_PAUSED: 'ready_paused',
  ACTIVE_PLAYING: 'active_playing',
  INACTIVE_PAUSED_RESIDENT: 'inactive_paused_resident',
  FAR_EVICTION_PENDING: 'far_eviction_pending',
  HARD_UNLOADED: 'hard_unloaded',
  RESTORING: 'restoring',
})

export function resolveMediaLifecycleState(snapshot = {}) {
  const {
    active = false,
    playing = false,
    restoring = false,
    loadPending = false,
    prewarm = false,
    resident = false,
    inViewport = false,
    nearViewport = false,
    farAway = false,
    hasAttachedSource = false,
  } = snapshot

  if (restoring) return MEDIA_LIFECYCLE_STATES.RESTORING
  if (active && playing) return MEDIA_LIFECYCLE_STATES.ACTIVE_PLAYING
  if ((active || inViewport) && (hasAttachedSource || loadPending)) {
    return MEDIA_LIFECYCLE_STATES.READY_PAUSED
  }
  if (prewarm && !farAway) return MEDIA_LIFECYCLE_STATES.PREWARM_CANDIDATE
  if ((resident || nearViewport || loadPending) && !farAway) {
    return MEDIA_LIFECYCLE_STATES.INACTIVE_PAUSED_RESIDENT
  }
  if (farAway && !hasAttachedSource && !loadPending) {
    return MEDIA_LIFECYCLE_STATES.HARD_UNLOADED
  }
  return MEDIA_LIFECYCLE_STATES.FAR_EVICTION_PENDING
}

export function shouldDeferHardUnload(snapshot = {}) {
  const {
    state = resolveMediaLifecycleState(snapshot),
    isSettling = false,
    hasManualLease = false,
    blockedUntil = 0,
    now = Date.now(),
  } = snapshot

  if (blockedUntil > now) return true
  if (hasManualLease) return true
  if (isSettling) return true

  return (
    state === MEDIA_LIFECYCLE_STATES.PREWARM_CANDIDATE
    || state === MEDIA_LIFECYCLE_STATES.READY_PAUSED
    || state === MEDIA_LIFECYCLE_STATES.ACTIVE_PLAYING
    || state === MEDIA_LIFECYCLE_STATES.INACTIVE_PAUSED_RESIDENT
    || state === MEDIA_LIFECYCLE_STATES.RESTORING
  )
}
