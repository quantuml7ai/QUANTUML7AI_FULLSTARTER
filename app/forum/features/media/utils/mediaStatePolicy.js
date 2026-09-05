export function shouldPersistGlobalMute(source) {
  const next = String(source || '').trim()
  return (
    next === 'forum-coordinator' ||
    next === 'video' ||
    next === 'forum-ads-toggle' ||
    next === 'forum-ad-slot-toggle' ||
    next === 'forum-ad-surface-activate' ||
    next === 'site-ads-toggle' ||
    next === 'site-ads-surface-activate' ||
    next === 'ios-webkit-autoplay-fallback' ||
    next === 'forum-ads-autoplay-fallback' ||
    next === 'site-ads-autoplay-fallback'
  )
}

export function shouldKeepResidentPostVideo({
  isPostFeedVideo = false,
  hardUnloadRequested = false,
  recentTouchAgeMs = Number.POSITIVE_INFINITY,
  residentFlag = false,
  prewarmFlag = false,
} = {}) {
  if (!isPostFeedVideo) return false
  if (hardUnloadRequested) return false
  if (residentFlag || prewarmFlag) return true
  return Number(recentTouchAgeMs || Number.POSITIVE_INFINITY) <= 5000
}

export function computeSettlingUntil(currentUntil = 0, settleMs = 0, nowTs = Date.now()) {
  return Math.max(Number(currentUntil || 0), Number(nowTs || 0) + Math.max(0, Number(settleMs || 0)))
}
