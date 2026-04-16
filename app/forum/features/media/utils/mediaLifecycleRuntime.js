'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'

export const MEDIA_MUTED_KEY = 'forum:mediaMuted'
// Legacy mirror-only key. Public ownership stays on MEDIA_MUTED_KEY.
export const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
export const MEDIA_MUTED_EVENT = 'forum:media-mute'

export function readMutedPrefFromStorage() {
  try {
    let value = localStorage.getItem(MEDIA_MUTED_KEY)
    if (value == null) value = localStorage.getItem(MEDIA_VIDEO_MUTED_KEY)
    if (value == null) return null
    return value === '1' || value === 'true'
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

export function __markMediaLifecycleTouch(el, reason = 'touch') {
  if (!el?.dataset) return
  try {
    el.dataset.__lifecycleTouchTs = String(Date.now())
    el.dataset.__lifecycleTouchReason = String(reason || 'touch')
  } catch {}
}

export function __isVideoNearViewport(el, marginPx = 120) {
  try {
    if (!el?.isConnected) return false
    const rect = el.getBoundingClientRect?.()
    if (!rect) return false
    const viewportH = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0
    if (viewportH <= 0) return false
    const topBound = 0 - marginPx
    const bottomBound = viewportH + marginPx
    return rect.bottom > topBound && rect.top < bottomBound
  } catch {
    return false
  }
}

export function shouldKeepResidentPostVideo(el, marginPx = __MEDIA_VIS_MARGIN_PX) {
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  if (!isPostFeedVideo) return false
  try {
    if (String(el?.dataset?.__active || '') === '1') return true
    if (String(el?.dataset?.__prewarm || '') === '1') return true
    if (String(el?.dataset?.__resident || '') === '1') return true
    if (String(el?.dataset?.__loadPending || '') === '1') return true
  } catch {}
  return __isVideoNearViewport(el, marginPx)
}

export function __touchActiveVideoEl(el) {
  if (!el) return
  __markMediaLifecycleTouch(el, 'active_touch')
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
      if (shouldKeepResidentPostVideo(victim, Math.max(220, __MEDIA_VIS_MARGIN_PX))) {
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
      __unloadVideoEl(victim)
    }
  } catch {}
}

export function __readMediaMutedPref() {
  const value = readMutedPrefFromStorage()
  if (typeof value === 'boolean') return value
  return null
}

export function __writeMediaMutedPref(nextMuted) {
  try {
    const value = nextMuted ? '1' : '0'
    localStorage.setItem(MEDIA_MUTED_KEY, value)
    localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, value)
  } catch {}
}

export function __unloadVideoEl(el) {
  if (!el) return
  const nowTs = Date.now()
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  __markMediaLifecycleTouch(el, 'hard_unload')
  try {
    if (isPostFeedVideo) {
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
  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__active = '0'
    el.dataset.__loadPending = '0'
    el.dataset.__warmReady = '0'
    el.dataset.__resident = '0'
    el.dataset.__prewarm = '0'
    el.dataset.__lastUnloadTs = String(nowTs)
    delete el.dataset.__loadPendingSince
    delete el.dataset.__readyRetryCount
    delete el.dataset.__bootAttachedSrc
    delete el.dataset.__bootMetadataPrimed
  } catch {}
  try {
    if (!el.dataset.__src && el.currentSrc) el.dataset.__src = el.currentSrc
    if (!el.dataset.__src && el.getAttribute('src')) el.dataset.__src = el.getAttribute('src')
    if (!el.dataset.__src && el.getAttribute('data-src')) el.dataset.__src = el.getAttribute('data-src')
  } catch {}
  try {
    el.removeAttribute('src')
  } catch {}
  try {
    if (el.dataset?.__src) el.setAttribute('data-src', String(el.dataset.__src))
  } catch {}
  try {
    el.preload = 'none'
  } catch {}
  try {
    el.removeAttribute('poster')
    delete el.dataset.__posterOriginal
    delete el.dataset.__posterMediaKey
    delete el.dataset.__posterRevealed
    delete el.dataset.__needsPosterRestore
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
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  if (!src) return
  __markMediaLifecycleTouch(el, 'restore')
  try {
    delete el.dataset.__forceHardUnload
  } catch {}
  const canRestoreLoad = () => {
    try {
      const now = Date.now()
      const blockedUntil = Number(el.dataset?.__restoreLoadBlockedUntil || 0)
      if (blockedUntil > now) return false

      const fastRestore = isPostFeedVideo
      const minGap = fastRestore ? 320 : 1500
      const winMs = fastRestore ? 8000 : 16000
      const burstLimit = fastRestore ? 14 : 5

      const lastTs = Number(el.dataset?.__lastRestoreLoadTs || 0)
      if (lastTs > 0 && (now - lastTs) < minGap) return false

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
        el.dataset.__restoreLoadBlockedUntil = String(now + (fastRestore ? 1200 : 10000))
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
      if (!isPostFeedVideo && (readyStateNow === 0 || isNetworkEmpty)) {
        if (!canRestoreLoad()) return
        el.dataset.__loadPending = '1'
        el.dataset.__warmReady = '0'
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

    el.preload = shouldAutoPreload ? 'auto' : 'none'
  } catch {}
  try {
    el.removeAttribute('poster')
    delete el.dataset.__posterOriginal
    delete el.dataset.__posterMediaKey
    delete el.dataset.__posterRevealed
    delete el.dataset.__needsPosterRestore
  } catch {}
  try {
    el.dataset.__loadPending = '1'
    el.dataset.__warmReady = '0'
    el.setAttribute('src', src)
  } catch {}
  try {
    if (!isPostFeedVideo) {
      const resumeTo = Number(el.dataset?.__resumeTime || 0)
      if (Number.isFinite(resumeTo) && resumeTo > 0.18) {
        const seekToResume = () => {
          try {
            const duration = Number(el.duration || 0)
            const safeTarget = Number.isFinite(duration) && duration > 0
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
