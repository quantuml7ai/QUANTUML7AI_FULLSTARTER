export function shouldPersistGlobalMute(source) {
  const next = String(source || '').trim()
  return (
    next === 'forum-coordinator' ||
    next === 'video' ||
    next === 'forum-ads-toggle'
  )
}

export function shouldKeepResidentPostVideo({
  isPostFeedVideo = false,
  hardUnloadRequested = false,
  nearViewport = false,
  recentTouchAgeMs = Number.POSITIVE_INFINITY,
  residentFlag = false,
  prewarmFlag = false,
} = {}) {
  if (!isPostFeedVideo) return false
  if (hardUnloadRequested) return false
  if (nearViewport) return true
  if (residentFlag || prewarmFlag) return true
  return Number(recentTouchAgeMs || Number.POSITIVE_INFINITY) <= 5000
}

export function shouldHardUnloadPostVideo({
  isPostFeedVideo = false,
  hardUnloadRequested = false,
  isConnected = true,
  nearViewport = false,
  recentTouchAgeMs = Number.POSITIVE_INFINITY,
  residentFlag = false,
  prewarmFlag = false,
  activeFlag = false,
  playRequestedFlag = false,
} = {}) {
  if (!isPostFeedVideo) return true
  if (!hardUnloadRequested) return false
  if (!isConnected) return true
  if (nearViewport) return false
  if (activeFlag || playRequestedFlag) return false
  if (residentFlag || prewarmFlag) return false
  return Number(recentTouchAgeMs || Number.POSITIVE_INFINITY) > 12000
}

export function computeSettlingUntil(currentUntil = 0, settleMs = 0, nowTs = Date.now()) {
  return Math.max(Number(currentUntil || 0), Number(nowTs || 0) + Math.max(0, Number(settleMs || 0)))
}
