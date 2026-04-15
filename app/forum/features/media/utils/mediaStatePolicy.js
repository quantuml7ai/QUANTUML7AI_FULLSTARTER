'use client'

export function shouldPersistGlobalMute(source = 'forum-coordinator') {
  const normalized = String(source || '').trim().toLowerCase()
  if (!normalized) return true
  return (
    normalized === 'forum-coordinator' ||
    normalized === 'video' ||
    normalized === 'user' ||
    normalized === 'forum-ads-toggle'
  )
}

export function shouldKeepResidentPostVideo({
  isPostFeedVideo = false,
  hardUnloadRequested = false,
  recentTouchAgeMs = Number.POSITIVE_INFINITY,
  residentFlag = false,
  prewarmFlag = false,
}) {
  if (!isPostFeedVideo) return false
  if (hardUnloadRequested) return false
  if (residentFlag) return true
  if (prewarmFlag) return true
  return Number.isFinite(recentTouchAgeMs) && recentTouchAgeMs >= 0 && recentTouchAgeMs < 12000
}

export function computeSettlingUntil(prevUntilTs = 0, ms = 0, now = Date.now()) {
  const base = Number.isFinite(prevUntilTs) ? prevUntilTs : 0
  const delta = Math.max(200, Number(ms || 0))
  return Math.max(base, now + delta)
}