'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'

export const MEDIA_MUTED_KEY = 'forum:mediaMuted'
export const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
export const MEDIA_MUTED_EVENT = 'forum:media-mute'

function isForumBootSplashActive() {
  try {
    return !!window.__forumBootSplashActive
  } catch {
    return false
  }
}

;(() => {
  // На новый реальный заход страницы форума стартуем в muted,
  // но не перетираем preference повторными eval этого модуля в рамках той же вкладки.
  try {
    if (typeof window === 'undefined') return
    if (window.__forumBootMutedApplied === 1) return

    window.__forumBootMutedApplied = 1 
    localStorage.setItem(MEDIA_MUTED_KEY, '1')
    localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, '1')
  } catch {}
})()

export function readMutedPrefFromStorage() {
  try {
    if (isForumBootSplashActive()) return true
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
    const ua = String(
      (typeof navigator !== 'undefined' ? navigator.userAgent : '') || ''
    )
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const coarse = !!(
      typeof window !== 'undefined' &&
      window?.matchMedia?.('(pointer: coarse)')?.matches
    )

    if (isIOS) return 360
    if (isAndroid || coarse) return 420
    return 320
  } catch {
    return 320
  }
})()

const __VIDEO_HARD_CAP_ENABLED = (() => {
  try {
    const ua = String(
      (typeof navigator !== 'undefined' ? navigator.userAgent : '') || ''
    )
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

const __MAX_ACTIVE_VIDEO_ELEMENTS = (() => {
  try {
    const ua = String(
      (typeof navigator !== 'undefined' ? navigator.userAgent : '') || ''
    )
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const coarse = !!(
      typeof window !== 'undefined' &&
      window?.matchMedia?.('(pointer: coarse)')?.matches
    )
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

export function __touchActiveVideoEl(el) {
  if (!el) return

  if (!__activeVideoEls.has(el)) __activeVideoEls.add(el)

  try {
    el.dataset.__lastManagedActiveTs = String(Date.now())
  } catch {}

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

    const vh =
      Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0
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
    if (__activeVideoLRU.length <= __MAX_ACTIVE_VIDEO_ELEMENTS) return

    const keepMargin = Math.max(280, Math.round(Number(__MEDIA_VIS_MARGIN_PX || 320) * 1.4))
    const recentKeepMs = (() => {
      try {
        const coarse = !!(
          typeof window !== 'undefined' &&
          window?.matchMedia?.('(pointer: coarse)')?.matches
        )
        return coarse ? 3600 : 2800
      } catch {
        return 2800
      }
    })()

    let guard = 0

    while (
      __activeVideoLRU.length > __MAX_ACTIVE_VIDEO_ELEMENTS &&
      guard < 64
    ) {
      guard += 1

      let victimIndex = -1

      for (let i = 0; i < __activeVideoLRU.length; i += 1) {
        const candidate = __activeVideoLRU[i]
        if (!candidate) continue
        if (candidate === exceptEl) continue
        if (String(candidate?.dataset?.__loadPending || '') === '1') continue
        if (String(candidate?.dataset?.__prewarm || '') === '1') continue
        if (String(candidate?.dataset?.__resident || '') === '1') continue
        const lastManagedActiveTs = Number(candidate?.dataset?.__lastManagedActiveTs || 0)
        if (lastManagedActiveTs > 0 && (Date.now() - lastManagedActiveTs) < recentKeepMs) continue
        if (__isVideoNearViewport(candidate, keepMargin)) continue

        victimIndex = i
        break
      }

      if (victimIndex < 0) break

      const victim = __activeVideoLRU[victimIndex]
      __activeVideoLRU.splice(victimIndex, 1)
      __activeVideoEls.delete(victim)

      try {
        __unloadVideoEl(victim)
      } catch {}
    }
  } catch {}
}

export function __readMediaMutedPref() {
  const v = readMutedPrefFromStorage()
  if (typeof v === 'boolean') return v
  return null
}

export function __writeMediaMutedPref(nextMuted) {
  try {
    const v = nextMuted ? '1' : '0'
    localStorage.setItem(MEDIA_MUTED_KEY, v)
    localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, v)
  } catch {}
}

export function __unloadVideoEl(el) {
  if (!el) return

  const nowTs = Date.now()

  try {
    const isPostFeedVideo =
      String(el?.getAttribute?.('data-forum-video') || '') === 'post'

    if (isPostFeedVideo) {
      // Для feed-видео не переносим seek-позицию между unload/restore.
      delete el.dataset.__resumeTime
    } else {
      const cur = Number(el.currentTime || 0)
      const dur = Number(el.duration || 0)
      const hasMeaningfulTime = Number.isFinite(cur) && cur > 0.18
      const nearEnd =
        Number.isFinite(dur) &&
        dur > 0 &&
        cur >= Math.max(0, dur - 0.18)

      if (hasMeaningfulTime && !nearEnd) {
        el.dataset.__resumeTime = String(cur)
      } else {
        delete el.dataset.__resumeTime
      }
    }
  } catch {}

  try {
    el.pause?.()
  } catch {}

  try {
    el.dataset.__active = '0'
    el.dataset.__loadPending = '0'
    el.dataset.__warmReady = '0'
    el.dataset.__resident = '0'
    el.dataset.__prewarm = '0'
    delete el.dataset.__loadPendingSince
    delete el.dataset.__readyRetryCount
    el.dataset.__lastUnloadTs = String(nowTs)
  } catch {}

  const canHardUnload = (() => {
    try {
      if (__VIDEO_HARD_CAP_ENABLED) return true
      return String(el?.dataset?.__forceHardUnload || '') === '1'
    } catch {
      return __VIDEO_HARD_CAP_ENABLED
    }
  })()

  if (!canHardUnload) {
    try {
      el.preload = 'metadata'
    } catch {}
    return
  }

  try {
    if (!el.dataset.__src && el.currentSrc) el.dataset.__src = el.currentSrc
    if (!el.dataset.__src && el.getAttribute('src')) {
      el.dataset.__src = el.getAttribute('src')
    }
    if (!el.dataset.__src && el.getAttribute('data-src')) {
      el.dataset.__src = el.getAttribute('data-src')
    }
  } catch {}

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
    el.dataset.__lastHardUnloadTs = String(nowTs)
  } catch {}

  try {
    el.load?.()
  } catch {}
}

export function __restoreVideoEl(el) {
  if (!el) return

  const nowTs = Date.now()
  const src = el.dataset.__src || el.getAttribute('data-src') || ''
  if (!src) return

  try {
    delete el.dataset.__forceHardUnload
  } catch {}

  const canRestoreLoad = () => {
    try {
      const now = Date.now()
      const blockedUntil = Number(el.dataset?.__restoreLoadBlockedUntil || 0)
      if (blockedUntil > now) return false

      const minGap = 1500
      const lastTs = Number(el.dataset?.__lastRestoreLoadTs || 0)
      if (lastTs > 0 && now - lastTs < minGap) return false

      const winMs = 16000
      const burstLimit = 5
      const winStart = Number(el.dataset?.__restoreLoadWindowStart || 0)
      const inWindow = winStart > 0 && now - winStart < winMs

      let count = Number(el.dataset?.__restoreLoadCount || 0)

      if (!inWindow) {
        el.dataset.__restoreLoadWindowStart = String(now)
        count = 0
      }

      count += 1
      el.dataset.__restoreLoadCount = String(count)

      if (count > burstLimit) {
        el.dataset.__restoreLoadBlockedUntil = String(now + 10000)
        return false
      }

      el.dataset.__lastRestoreLoadTs = String(now)
      return true
    } catch {
      return true
    }
  }

  try {
    el.dataset.__lastRestoreTs = String(nowTs)
  } catch {}

  try {
    if (!el.getAttribute('data-src')) {
      el.setAttribute('data-src', String(src))
    }
  } catch {}

  try {
    const mutedPref = __readMediaMutedPref()
    if (typeof mutedPref === 'boolean') {
      el.muted = mutedPref
      el.defaultMuted = mutedPref

      if (mutedPref) el.setAttribute('muted', '')
      else el.removeAttribute('muted')
    }
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
        if (!canRestoreLoad()) return

        el.dataset.__loadPending = '1'
        el.dataset.__loadPendingSince = String(Date.now())
        el.dataset.__warmReady = '0'
        el.load?.()
      }
    } catch {}

    return
  }

  try {
    el.preload = el.dataset?.__prewarm === '1' ? 'auto' : 'metadata'
  } catch {} 

  try {
    el.dataset.__loadPending = '1'
    el.dataset.__loadPendingSince = String(Date.now())
    el.dataset.__warmReady = '0'
    el.setAttribute('src', src)
  } catch {}

  try {
    const isPostFeedVideo =
      String(el?.getAttribute?.('data-forum-video') || '') === 'post'

    if (!isPostFeedVideo) {
      const resumeTo = Number(el.dataset?.__resumeTime || 0)

      if (Number.isFinite(resumeTo) && resumeTo > 0.18) {
        const seekToResume = () => {
          try {
            const duration = Number(el.duration || 0)
            const safeTarget =
              Number.isFinite(duration) && duration > 0
                ? Math.max(0, Math.min(resumeTo, duration - 0.12))
                : resumeTo

            if (
              Number.isFinite(safeTarget) &&
              safeTarget > 0.05 &&
              Math.abs(Number(el.currentTime || 0) - safeTarget) > 0.05
            ) {
              el.currentTime = safeTarget
            }
          } catch {}
        }

        try {
          el.addEventListener('loadedmetadata', seekToResume, { once: true })
        } catch {}

        try {
          el.addEventListener('canplay', seekToResume, { once: true })
        } catch {}
      }
    }
  } catch {}

  try {
    const networkState = Number(el.networkState || 0)
    const isLoading =
      typeof HTMLMediaElement !== 'undefined' &&
      networkState === HTMLMediaElement.NETWORK_LOADING

    if (!isLoading && canRestoreLoad()) el.load?.()
  } catch {}
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
