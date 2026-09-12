const IMMEDIATE_EVENTS = new Set(['error', 'unhandledrejection'])

const FRESH_MEDIA_EVENTS = new Set([
  'mount',
  'unmount',
  'error',
  'unhandledrejection',
  'beforeunload',
  'pagehide',
  'media_coordinator_init',
  'media_coordinator_cleanup',
  'media_focus_switch',
  'iframe_play',
  'iframe_hard_unload',
  'iframe_resident_cap',
])

export function getDiagMinGapMs(event) {
  if (event === 'scroll') return 3800
  if (event === 'tick') return 5200
  return 1800
}

export function shouldThrottleDiagEvent(event, now, lastSentTs, force) {
  if (force || IMMEDIATE_EVENTS.has(event)) {
    return { skip: false, nextLastSentTs: lastSentTs }
  }
  const minGapMs = getDiagMinGapMs(event)
  if (now - Number(lastSentTs || 0) < minGapMs) {
    return { skip: true, nextLastSentTs: lastSentTs }
  }
  return { skip: false, nextLastSentTs: now }
}

export function shouldRefreshDiagMediaSnapshot(event, now, snapshot, force) {
  if (force) return true
  if (FRESH_MEDIA_EVENTS.has(event)) return true
  if (!snapshot?.media) return true
  return now - Number(snapshot?.ts || 0) > 5000
}

export function emptyDiagMediaSnapshot() {
  return {
    videos: 0,
    videosPlaying: 0,
    audios: 0,
    audiosPlaying: 0,
    qcastAudios: 0,
    qcastPlaying: 0,
    iframes: 0,
    iframesLoaded: 0,
    iframesActive: 0,
    ytIframes: 0,
    ttIframes: 0,
    genericIframes: 0,
  }
}
