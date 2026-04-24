'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'
import { shouldHardUnloadPostVideo, shouldKeepResidentPostVideo } from './mediaStatePolicy'

export const MEDIA_MUTED_KEY = 'forum:mediaMuted'
export const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
export const MEDIA_MUTED_EVENT = 'forum:media-mute'
;(() => {
  // На каждый новый перезапуск страницы стартуем в muted,
  // чтобы iPhone/Safari не блокировал autoplay из-за старого unmuted-состояния.
  try {
    if (typeof window === 'undefined') return
const defaultMutedPref = String(1)
localStorage.setItem(MEDIA_MUTED_KEY, defaultMutedPref)
localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, defaultMutedPref)
  } catch {}
})()

export function readMutedPrefFromStorage() {
  try {
    let v = localStorage.getItem(MEDIA_MUTED_KEY)
    if (v == null) v = localStorage.getItem(MEDIA_VIDEO_MUTED_KEY)
    if (v == null) return null
    return v === '1' || v === 'true'
  } catch {
    return null
  }
}

export const __MEDIA_VIS_MARGIN_PX = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    if (isIOS) return 360
    if (isAndroid || coarse) return 420
    return 320
  } catch {
    return 320
  }
})()

const __VIDEO_HARD_CAP_ENABLED = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
    if (isIOS) return false
    if (lowMem) return true
    return false
  } catch {
    return false
  }
})()

const __SOFT_RESIDENT_POST_VIDEO = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 3

    return !!isIOS || !!isAndroid || !!coarse || !!lowMem
  } catch {
    return true
  }
})()

const __MAX_ACTIVE_VIDEO_ELEMENTS = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
    if (isIOS) return 2
    if (lowMem) return 2
    if (coarse) return 3
    return 4
  } catch {
    return 3
  }
})()

const __activeVideoEls = new Set()
const __activeVideoLRU = []

function __ensureForumVideoLifecycleDiagRoot() {
  if (typeof window === 'undefined') return null
  try {
    const existing = window.__forumVideoLifecycleDiag
    if (existing && typeof existing === 'object') {
      if (!existing.counters || typeof existing.counters !== 'object') existing.counters = {}
      if (!Array.isArray(existing.events)) existing.events = []
      return existing
    }
  } catch {}
  const next = { counters: {}, events: [] }
  try {
    window.__forumVideoLifecycleDiag = next
    if (typeof window.dumpForumVideoLifecycleDiag !== 'function') {
      window.dumpForumVideoLifecycleDiag = () => {
        try {
          const root = window.__forumVideoLifecycleDiag || next
          return {
            counters: { ...(root.counters || {}) },
            events: Array.isArray(root.events) ? [...root.events] : [],
          }
        } catch {
          return { counters: {}, events: [] }
        }
      }
    }
  } catch {}
  return next
}

function __bumpForumVideoLifecycleCounter(name, amount = 1) {
  const root = __ensureForumVideoLifecycleDiagRoot()
  if (!root) return 0
  const key = String(name || '').trim()
  if (!key) return 0
  try {
    const next = Number(root.counters?.[key] || 0) + Number(amount || 0)
    root.counters[key] = next
    return next
  } catch {
    return 0
  }
}

function __pushForumVideoLifecycleEvent(event, el, extra = {}) {
  const root = __ensureForumVideoLifecycleDiagRoot()
  if (!root) return
  try {
    const record = {
      ts: Date.now(),
      event: String(event || 'unknown'),
      mediaId: String(el?.dataset?.__mid || ''),
      kind: String(el?.getAttribute?.('data-forum-media') || ''),
      forumVideo: String(el?.getAttribute?.('data-forum-video') || ''),
      src: String(
        el?.dataset?.__src ||
        el?.getAttribute?.('data-src') ||
        el?.currentSrc ||
        el?.getAttribute?.('src') ||
        ''
      ),
      hasSrc: !!String(el?.getAttribute?.('src') || el?.currentSrc || ''),
      hasPoster: !!String(el?.getAttribute?.('poster') || ''),
      readyState: Number(el?.readyState || 0),
      networkState: Number(el?.networkState || 0),
      active: String(el?.dataset?.__active || ''),
      prewarm: String(el?.dataset?.__prewarm || ''),
      resident: String(el?.dataset?.__resident || ''),
      loadPending: String(el?.dataset?.__loadPending || ''),
      warmReady: String(el?.dataset?.__warmReady || ''),
      ...extra,
    }
    root.events.push(record)
    while (root.events.length > 320) root.events.shift()
  } catch {}
}

function __isVisiblePostVideoShell(el) {
  try {
    return __isVideoNearViewport(el, 220)
  } catch {
    return false
  }
}

function __detectEmptyPostVideoShell(el, reason = 'runtime_check') {
  if (!(el instanceof HTMLVideoElement)) return false
  if (String(el?.getAttribute?.('data-forum-video') || '') !== 'post') return false
  try {
    const shellVisible = __isVisiblePostVideoShell(el)
    const hasSrc = !!String(el.getAttribute('src') || el.currentSrc || '')
    const hasPoster = !!String(el.getAttribute('poster') || '')
    const ownerActive =
      String(el?.dataset?.__active || '') === '1' ||
      String(el?.dataset?.__resident || '') === '1' ||
      String(el?.dataset?.__prewarm || '') === '1' ||
      String(el?.dataset?.__playRequested || '') === '1'
    if (!shellVisible || hasSrc || hasPoster || !ownerActive) return false
    const now = Date.now()
    const lastHit = Number(el?.dataset?.__lastEmptyShellDiagTs || 0)
    if (lastHit > 0 && (now - lastHit) < 1400) return true
    try { el.dataset.__lastEmptyShellDiagTs = String(now) } catch {}
    __bumpForumVideoLifecycleCounter('emptyShellDetectedCount')
    __pushForumVideoLifecycleEvent('orphan_shell_detected', el, {
      reason,
      shellVisible,
      hasSrc,
      hasPoster,
    })
    return true
  } catch {
    return false
  }
}

function __ensurePostVideoPoster(el) {
  if (!(el instanceof HTMLVideoElement)) return ''
  if (String(el?.getAttribute?.('data-forum-video') || '') !== 'post') return ''
  try {
    const poster = String(
      el.getAttribute('poster') ||
      el.dataset?.__posterOriginal ||
      el.dataset?.poster ||
      '',
    ).trim()
    if (!poster) return ''
    if (el.getAttribute('poster') !== poster) el.setAttribute('poster', poster)
    el.dataset.poster = poster
    el.dataset.__posterOriginal = poster
    return poster
  } catch {
    return ''
  }
}

function __getVideoSurfaceState(el) {
  const restoredPoster = __ensurePostVideoPoster(el)
  const storedSrc = String(el?.dataset?.__src || el?.getAttribute?.('data-src') || '')
  const attachedSrc = String(el?.getAttribute?.('src') || el?.currentSrc || '')
  const hasPoster = !!String(restoredPoster || el?.getAttribute?.('poster') || '')
  return {
    storedSrc,
    attachedSrc,
    hasAttachedSrc: !!attachedSrc,
    hasPoster,
  }
}

export function __touchActiveVideoEl(el) {
  if (!el) return
  if (!__activeVideoEls.has(el)) __activeVideoEls.add(el)
  const idx = __activeVideoLRU.indexOf(el)
  if (idx !== -1) __activeVideoLRU.splice(idx, 1)
  __activeVideoLRU.push(el)
}

export function __dropActiveVideoEl(el) {
  if (!el) return
  __activeVideoEls.delete(el)
  const idx = __activeVideoLRU.indexOf(el)
  if (idx !== -1) __activeVideoLRU.splice(idx, 1)
}

export function __isVideoNearViewport(el, marginPx = 120) {
  try {
    if (!el?.isConnected) return false
    const r = el.getBoundingClientRect?.()
    if (!r) return false
    const vh = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0
    if (vh <= 0) return false
    const topBound = 0 - marginPx
    const bottomBound = vh + marginPx
    return r.bottom > topBound && r.top < bottomBound
  } catch {
    return false
  }
}

export function __enforceActiveVideoCap(exceptEl) {
  try {
    let guard = 0
    while (__activeVideoLRU.length > __MAX_ACTIVE_VIDEO_ELEMENTS && guard < 128) {
      guard += 1
      const victim = __activeVideoLRU[0]
      if (!victim) break
      if (victim === exceptEl) {
        __activeVideoLRU.shift()
        __activeVideoLRU.push(victim)
        continue
      }
      if (
        String(victim?.dataset?.__playRequested || '') === '1' ||
        String(victim?.dataset?.__loadPending || '') === '1'
      ) {
        __activeVideoLRU.shift()
        __activeVideoLRU.push(victim)
        continue
      }      
      if (__isVideoNearViewport(victim, 140)) {
        __activeVideoLRU.shift()
        __activeVideoLRU.push(victim)
        continue
      }
      __activeVideoLRU.shift()
      __activeVideoEls.delete(victim)
      if (String(victim?.getAttribute?.('data-forum-video') || '') === 'post') {
        __softReleaseVideoEl(victim, 'active_cap')
      } else {
        __unloadVideoEl(victim)
      }
    }
  } catch {}
}

export function __readMediaMutedPref() {
  const v = readMutedPrefFromStorage()
  if (typeof v === 'boolean') return v
  return true
}

export function __writeMediaMutedPref(nextMuted) {
  try {
    const v = nextMuted ? '1' : '0'
    localStorage.setItem(MEDIA_MUTED_KEY, v)
    localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, v)
  } catch {}
}

export function __markMediaLifecycleTouch(el, reason = 'runtime_touch') {
  if (!el?.dataset) return 0
  const nowTs = Date.now()
  try {
    el.dataset.__lastLifecycleTouchTs = String(nowTs)
    el.dataset.__lastLifecycleTouchReason = String(reason || 'runtime_touch')
  } catch {}
  return nowTs
}

export function __softReleaseVideoEl(el, reason = 'soft_release') {
  if (!(el instanceof HTMLVideoElement)) return
  const prevTouchTs = Number(el?.dataset?.__lastLifecycleTouchTs || 0)
  const nowTs = __markMediaLifecycleTouch(el, reason)
  const residentFlag = String(el?.dataset?.__resident || '') === '1'
  const prewarmFlag = String(el?.dataset?.__prewarm || '') === '1'
  const nearViewport = __isVideoNearViewport(el, 420)
  const keepResident =
    String(el?.getAttribute?.('data-forum-video') || '') === 'post' &&
    shouldKeepResidentPostVideo({
      isPostFeedVideo: true,
      hardUnloadRequested: false,
      nearViewport,
      recentTouchAgeMs: prevTouchTs > 0 ? Math.max(0, nowTs - prevTouchTs) : Number.POSITIVE_INFINITY,
      residentFlag,
      prewarmFlag,
    })
  const restoredPoster = __ensurePostVideoPoster(el)
  try {
    el.pause?.()
  } catch {}
  try {
    __dropActiveVideoEl(el)
  } catch {}
  try {
    el.dataset.__active = '0'
    el.dataset.__playRequested = '0'
    el.dataset.__loadPending = '0'
    delete el.dataset.__loadPendingSince
    el.dataset.__warmReady = Number(el?.readyState || 0) >= 1 ? '1' : '0'
    el.dataset.__resident = keepResident ? '1' : '0'
    el.dataset.__prewarm = '0'
    el.dataset.__lastSoftReleaseTs = String(nowTs)
    el.dataset.__lastUnloadTs = String(nowTs)
    el.preload = 'metadata'
  } catch {}
  __bumpForumVideoLifecycleCounter('softReleaseCount')
  __bumpForumVideoLifecycleCounter('posterPreservedCount')
  __pushForumVideoLifecycleEvent('soft_release', el, {
    reason,
    nearViewport,
    keepResident,
    shellVisible: __isVisiblePostVideoShell(el),
    srcAttached: !!String(el?.getAttribute?.('src') || el?.currentSrc || ''),
    posterPreserved: !!String(restoredPoster || el?.getAttribute?.('poster') || ''),
  })
  __detectEmptyPostVideoShell(el, reason)
}

export function __unloadVideoEl(el) {
  if (!el) return
  const prevTouchTs = Number(el?.dataset?.__lastLifecycleTouchTs || 0)
  const nowTs = __markMediaLifecycleTouch(el, 'unload')
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  const activeFlag = String(el?.dataset?.__active || '') === '1'
  const playRequestedFlag = String(el?.dataset?.__playRequested || '') === '1'
  const residentFlag = String(el?.dataset?.__resident || '') === '1'
  const prewarmFlag = String(el?.dataset?.__prewarm || '') === '1'
  const nearViewport = __isVideoNearViewport(el, 420)
  __ensurePostVideoPoster(el)
  try {
    if (isPostFeedVideo) { 
      // Для feed-видео не переносим seek-позицию между unload/restore:
      // это снижает range-шторм и нестабильные "серые" перезапуски.
      delete el.dataset.__resumeTime
    } else {
      const cur = Number(el.currentTime || 0)
      const dur = Number(el.duration || 0)
      const hasMeaningfulTime = Number.isFinite(cur) && cur > 0.18
      const nearEnd = Number.isFinite(dur) && dur > 0 && cur >= Math.max(0, dur - 0.18)
      if (hasMeaningfulTime && !nearEnd) el.dataset.__resumeTime = String(cur)
      else delete el.dataset.__resumeTime
    }
  } catch {}
  const hardUnloadRequested = (() => {
    try {
      return String(el?.dataset?.__forceHardUnload || '') === '1'
    } catch {
      return false
    }
  })()

  const canHardUnload = (() => {
    try {
      if (__VIDEO_HARD_CAP_ENABLED) return true
      return hardUnloadRequested
    } catch {
      return __VIDEO_HARD_CAP_ENABLED
    }
  })()

  const keepResidentPostVideo =
    __SOFT_RESIDENT_POST_VIDEO &&
    shouldKeepResidentPostVideo({
      isPostFeedVideo,
      hardUnloadRequested,
      nearViewport,
      recentTouchAgeMs: prevTouchTs > 0 ? Math.max(0, nowTs - prevTouchTs) : Number.POSITIVE_INFINITY,
      residentFlag,
      prewarmFlag,
    })

  const allowHardUnloadPostVideo = shouldHardUnloadPostVideo({
    isPostFeedVideo,
    hardUnloadRequested,
    isConnected: !!el?.isConnected,
    nearViewport,
    recentTouchAgeMs: prevTouchTs > 0 ? Math.max(0, nowTs - prevTouchTs) : Number.POSITIVE_INFINITY,
    residentFlag,
    prewarmFlag,
    activeFlag,
    playRequestedFlag,
  })

  if (isPostFeedVideo && (!canHardUnload || keepResidentPostVideo || !allowHardUnloadPostVideo)) {
    __softReleaseVideoEl(el, hardUnloadRequested ? 'post_soft_release_forced' : 'post_soft_release')
    return
  }

  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__active = '0'
    el.dataset.__playRequested = '0'
    el.dataset.__loadPending = '0'
    delete el.dataset.__loadPendingSince
    el.dataset.__warmReady = '0'
    el.dataset.__resident = '0'
    el.dataset.__prewarm = '0'
    el.dataset.__lastUnloadTs = String(nowTs)
  } catch {}
  try {
    if (!el.dataset.__src && el.currentSrc) el.dataset.__src = el.currentSrc
    if (!el.dataset.__src && el.getAttribute('src')) el.dataset.__src = el.getAttribute('src')
    if (!el.dataset.__src && el.getAttribute('data-src')) el.dataset.__src = el.getAttribute('data-src')
  } catch {}
  const { storedSrc, hasAttachedSrc, hasPoster } = __getVideoSurfaceState(el)
  const networkEmpty =
    typeof HTMLMediaElement !== 'undefined' &&
    Number(el?.networkState || 0) === HTMLMediaElement.NETWORK_EMPTY
  if (storedSrc && !hasAttachedSrc && (Number(el?.readyState || 0) === 0 || networkEmpty)) {
    try {
      el.preload = 'none'
      el.dataset.__lastHardUnloadTs = String(nowTs)
    } catch {}
    __bumpForumVideoLifecycleCounter('hardUnloadCount')
    __pushForumVideoLifecycleEvent('hard_unload_skip_cold', el, {
      reason: 'already_detached',
      srcAttached: hasAttachedSrc,
      posterPreserved: hasPoster,
    })
    return
  }
  try {
    el.removeAttribute('src')
  } catch {}
  try {
    if (el.dataset?.__src) {
      el.setAttribute('data-src', String(el.dataset.__src))
    }
  } catch {}
  try {
    el.preload = 'none'
  } catch {}
  try {
    if (!isPostFeedVideo) {
      el.removeAttribute('poster')
      delete el.dataset.__posterOriginal
      delete el.dataset.__posterMediaKey
      delete el.dataset.__posterRevealed
      delete el.dataset.__needsPosterRestore
      __bumpForumVideoLifecycleCounter('posterRemovedCount')
    } else {
      __bumpForumVideoLifecycleCounter('posterPreservedCount')
    }
    el.dataset.__lastHardUnloadTs = String(nowTs)
  } catch {}
  __bumpForumVideoLifecycleCounter('hardUnloadCount')
  __pushForumVideoLifecycleEvent('hard_unload', el, {
    reason: hardUnloadRequested ? 'forced' : 'runtime',
    nearViewport,
    srcAttached: hasAttachedSrc,
    posterPreserved: isPostFeedVideo && hasPoster,
  })
  try {
    el.load?.()
  } catch {}
}

export function __restoreVideoEl(el) {
  if (!el) return
  const nowTs = __markMediaLifecycleTouch(el, 'restore')
  const src = el.dataset.__src || el.getAttribute('data-src') || ''
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  const restoredPoster = __ensurePostVideoPoster(el)
  if (!src) return
  __bumpForumVideoLifecycleCounter('restoreAttemptCount')
  __pushForumVideoLifecycleEvent('restore_attempt', el, {
    srcAttached: !!String(el?.getAttribute?.('src') || el?.currentSrc || ''),
    shellVisible: __isVisiblePostVideoShell(el),
    posterPreserved: !!String(restoredPoster || el?.getAttribute?.('poster') || ''),
  })
  try {
    delete el.dataset.__forceHardUnload
  } catch {}
  let lastRestoreAssessment = null
  const assessRestoreLoad = () => {
  try {
    const now = Date.now()
    const blockedUntil = Number(el.dataset?.__restoreLoadBlockedUntil || 0)
    if (blockedUntil > now) {
      return {
        allowed: false,
        reason: 'blocked_until',
        blockedForMs: blockedUntil - now,
      }
    }

    const fastRestore = isPostFeedVideo
    const minGap = fastRestore ? 1200 : 1500
    const winMs = fastRestore ? 20000 : 16000
    const burstLimit = fastRestore ? 4 : 5

    const lastTs = Number(el.dataset?.__lastRestoreLoadTs || 0)
    if (lastTs > 0 && (now - lastTs) < minGap) {
      return {
        allowed: false,
        reason: 'min_gap',
        blockedForMs: minGap - (now - lastTs),
      }
    }

    const winStart = Number(el.dataset?.__restoreLoadWindowStart || 0)
    const inWindow = winStart > 0 && (now - winStart) < winMs
    let count = Number(el.dataset?.__restoreLoadCount || 0)

    if (!inWindow) {
      el.dataset.__restoreLoadWindowStart = String(now)
      count = 0
    }

    count += 1
    el.dataset.__restoreLoadCount = String(count)

    if (count > burstLimit) {
      el.dataset.__restoreLoadBlockedUntil = String(now + (fastRestore ? 6000 : 10000))
      return {
        allowed: false,
        reason: 'burst_limit',
        blockedForMs: fastRestore ? 6000 : 10000,
      }
    }

    el.dataset.__lastRestoreLoadTs = String(now)
    el.dataset.__lastLoadKickTs = String(now)
    return { allowed: true, reason: 'ok', blockedForMs: 0 }
  } catch {
    return { allowed: true, reason: 'error_fallback', blockedForMs: 0 }
  }
}
  const canRestoreLoad = () => {
    lastRestoreAssessment = assessRestoreLoad()
    return !!lastRestoreAssessment?.allowed
  }
  try {
    el.dataset.__lastRestoreTs = String(nowTs)
  } catch {}
  try {
    if (!el.getAttribute('data-src')) el.setAttribute('data-src', String(src))
  } catch {}
  const cur = el.getAttribute('src') || ''
  if (cur === src) {
    try {
      const readyStateNow = Number(el.readyState || 0)
      const networkStateNow = Number(el.networkState || 0)
      const isNetworkEmpty =
        typeof HTMLMediaElement !== 'undefined' &&
        networkStateNow === HTMLMediaElement.NETWORK_EMPTY
      if (readyStateNow === 0 || isNetworkEmpty) {
        const restoreLoad = assessRestoreLoad()
        if (!restoreLoad.allowed) {
          __bumpForumVideoLifecycleCounter('restoreBlockedCount')
          __pushForumVideoLifecycleEvent('restore_blocked', el, restoreLoad)
          __detectEmptyPostVideoShell(el, `restore_blocked:${restoreLoad.reason}`)
          return
        }
        el.dataset.__loadPending = '1'
        el.dataset.__loadPendingSince = String(nowTs)
        el.dataset.__warmReady = '0'
        __bumpForumVideoLifecycleCounter('loadKickCount')
        el.load?.()
      }
    } catch {}
    return
  }
try {
  const shouldAutoPreload = 
    String(el.dataset?.__prewarm || '') === '1' ||
    String(el.dataset?.__active || '') === '1' ||
    String(el.dataset?.__resident || '') === '1'

  el.preload = shouldAutoPreload ? 'auto' : 'metadata'
} catch {}
  try {
    if (!isPostFeedVideo) {
      el.removeAttribute('poster')
      delete el.dataset.__posterOriginal
      delete el.dataset.__posterMediaKey
      delete el.dataset.__posterRevealed
      delete el.dataset.__needsPosterRestore
      __bumpForumVideoLifecycleCounter('posterRemovedCount')
    } else {
      __bumpForumVideoLifecycleCounter('posterPreservedCount')
    }
  } catch {}
  try {
    el.dataset.__loadPending = '1'
    el.dataset.__loadPendingSince = String(nowTs)
    el.dataset.__warmReady = '0'
    el.dataset.__lastSrcAttachTs = String(nowTs)
    el.setAttribute('src', src)
  } catch {}
  try {
    const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
    if (!isPostFeedVideo) {
      const resumeTo = Number(el.dataset?.__resumeTime || 0)
      if (Number.isFinite(resumeTo) && resumeTo > 0.18) {
        const seekToResume = () => {
          try {
            const duration = Number(el.duration || 0)
            const safeTarget = Number.isFinite(duration) && duration > 0
              ? Math.max(0, Math.min(resumeTo, duration - 0.12))
              : resumeTo
            if (Number.isFinite(safeTarget) && safeTarget > 0.05 && Math.abs(Number(el.currentTime || 0) - safeTarget) > 0.05) {
              el.currentTime = safeTarget
            }
          } catch {}
        }
        try { el.addEventListener('loadedmetadata', seekToResume, { once: true }) } catch {}
        try { el.addEventListener('canplay', seekToResume, { once: true }) } catch {}
      }
    }
  } catch {}
try {
  const networkState = Number(el.networkState || 0)
  const isLoading =
    typeof HTMLMediaElement !== 'undefined' &&
    networkState === HTMLMediaElement.NETWORK_LOADING

  if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()
  if (!isPostFeedVideo && !isLoading && lastRestoreAssessment?.allowed) {
      __bumpForumVideoLifecycleCounter('loadKickCount')
  } else if (!isPostFeedVideo && !isLoading) {
    const restoreLoad = lastRestoreAssessment || assessRestoreLoad()
    __bumpForumVideoLifecycleCounter('restoreBlockedCount')
    __pushForumVideoLifecycleEvent('restore_blocked', el, restoreLoad)
  }
} catch {}
  __detectEmptyPostVideoShell(el, 'restore_complete')
}

export function __hasLazyVideoSourceWithoutSrc(el) {
  if (!(el instanceof HTMLVideoElement)) return false
  try {
    const hasSrc = !!el.getAttribute('src')
    const lazySrc = el.dataset?.__src || el.getAttribute('data-src') || ''
    return !hasSrc && !!lazySrc
  } catch {
    return false
  }
}

export function __rearmPooledFxNode(el) {
  if (!el?.isConnected) return false
  try {
    el.classList.remove('isLive')
    el.style.animation = 'none'
    el.style.webkitAnimation = 'none'
    void el.offsetHeight
    el.style.animation = ''
    el.style.webkitAnimation = ''
    el.classList.add('isLive')
    return true
  } catch {
    return false
  }
}

export function VideoMedia(props) {
  return (
    <VideoMediaLeaf
      {...props}
      readMutedPref={__readMediaMutedPref}
      writeMutedPref={__writeMediaMutedPref}
      mutedEventName={MEDIA_MUTED_EVENT}
      restoreVideoEl={__restoreVideoEl}
      touchActiveVideo={__touchActiveVideoEl}
      enforceActiveVideoCap={__enforceActiveVideoCap}
      isVideoNearViewport={__isVideoNearViewport}
      mediaVisMarginPx={__MEDIA_VIS_MARGIN_PX}
      dropActiveVideo={__dropActiveVideoEl}
      unloadVideoEl={__unloadVideoEl}
    />
  )
}

export function QCastPlayer(props) {
  return (
    <QCastPlayerLeaf
      {...props}
      readMutedPrefFromStorage={readMutedPrefFromStorage}
      writeMutedPref={__writeMediaMutedPref}
      mutedEventName={MEDIA_MUTED_EVENT}
      rearmPooledFxNode={__rearmPooledFxNode}
    />
  )
}

export const enableVideoControlsOnTap = createEnableVideoControlsOnTap({
  hasLazyVideoSourceWithoutSrc: __hasLazyVideoSourceWithoutSrc,
  restoreVideoEl: __restoreVideoEl,
  touchActiveVideoEl: __touchActiveVideoEl,
  enforceActiveVideoCap: __enforceActiveVideoCap,
})
