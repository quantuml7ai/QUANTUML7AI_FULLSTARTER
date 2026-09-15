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

export function selectNativeSrcBudgetSurvivors(rows = [], cap = 2) {
  const limit = Math.max(0, Math.floor(Number(cap || 0)))
  if (!Array.isArray(rows) || limit <= 0) return []

  const finite = (value, fallback = Number.POSITIVE_INFINITY) => {
    const next = Number(value)
    return Number.isFinite(next) ? next : fallback
  }

  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aRow = a.row || {}
      const bRow = b.row || {}
      const aPlayback = aRow.active || aRow.playing ? 1 : 0
      const bPlayback = bRow.active || bRow.playing ? 1 : 0
      if (aPlayback !== bPlayback) return bPlayback - aPlayback

      const aKeep = aRow.isKeep ? 1 : 0
      const bKeep = bRow.isKeep ? 1 : 0
      if (aKeep !== bKeep) return bKeep - aKeep

      const aPrewarm = aRow.nativePrewarm ? 1 : 0
      const bPrewarm = bRow.nativePrewarm ? 1 : 0
      if (aPrewarm !== bPrewarm) return bPrewarm - aPrewarm

      const aVisible = Math.max(0, finite(aRow.visiblePx, 0))
      const bVisible = Math.max(0, finite(bRow.visiblePx, 0))
      const aInViewport = aVisible > 0 ? 1 : 0
      const bInViewport = bVisible > 0 ? 1 : 0
      if (aInViewport !== bInViewport) return bInViewport - aInViewport
      if (aVisible !== bVisible) return bVisible - aVisible

      const aGap = Math.max(0, finite(aRow.gapPx))
      const bGap = Math.max(0, finite(bRow.gapPx))
      if (aGap !== bGap) return aGap - bGap

      const aCenter = Math.max(0, finite(aRow.centerDist))
      const bCenter = Math.max(0, finite(bRow.centerDist))
      if (aCenter !== bCenter) return aCenter - bCenter

      const aReady = aRow.ready ? 1 : 0
      const bReady = bRow.ready ? 1 : 0
      if (aReady !== bReady) return bReady - aReady

      return a.index - b.index
    })
    .slice(0, limit)
    .map(({ row }) => row)
}

export function computeSettlingUntil(currentUntil = 0, settleMs = 0, nowTs = Date.now()) {
  return Math.max(Number(currentUntil || 0), Number(nowTs || 0) + Math.max(0, Number(settleMs || 0)))
}
