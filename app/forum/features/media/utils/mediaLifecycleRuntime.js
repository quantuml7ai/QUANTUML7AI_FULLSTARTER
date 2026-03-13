'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'

export const MEDIA_MUTED_KEY = 'forum:mediaMuted'
export const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
export const MEDIA_MUTED_EVENT = 'forum:media-mute'

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
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    return !!lowMem || !!coarse
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
  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__active = '0'
  } catch {}
  const canHardUnload = (() => {
    try {
      if (__VIDEO_HARD_CAP_ENABLED) return true
      if (document?.documentElement?.getAttribute?.('data-video-feed') === '1') return true
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
    if (!el.dataset.__src && el.getAttribute('src')) el.dataset.__src = el.getAttribute('src')
    if (!el.dataset.__src && el.getAttribute('data-src')) el.dataset.__src = el.getAttribute('data-src')
  } catch {}
  try {
    el.removeAttribute('src')
  } catch {}
  try {
    el.removeAttribute('data-src')
  } catch {}
  try {
    el.preload = 'none'
  } catch {}
  try {
    const poster = el.dataset?.__posterOriginal || ''
    if (poster) el.setAttribute('poster', poster)
    el.dataset.__posterRevealed = '0'
    el.dataset.__needsPosterRestore = '1'
  } catch {}
  try {
    el.load?.()
  } catch {}
}

export function __restoreVideoEl(el) {
  if (!el) return
  const src = el.dataset.__src || el.getAttribute('data-src') || ''
  if (!src) return
  const cur = el.getAttribute('src') || ''
  if (cur === src) return
  try {
    el.preload = (el.dataset?.__prewarm === '1') ? 'auto' : 'metadata'
  } catch {}
  try {
    const shouldRestorePoster = String(el.dataset?.__needsPosterRestore || '') === '1'
    if (shouldRestorePoster) {
      const poster = el.dataset?.__posterOriginal || ''
      if (poster && !el.getAttribute('poster')) el.setAttribute('poster', poster)
      el.dataset.__posterRevealed = '0'
      el.dataset.__needsPosterRestore = '0'
    }
  } catch {}
  try {
    el.setAttribute('src', src)
  } catch {}
  try {
    el.load?.()
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
