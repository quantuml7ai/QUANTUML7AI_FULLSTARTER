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
    if (isIOS) return 320
    if (isAndroid || coarse) return 360
    return 280
  } catch {
    return 280
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

const __MAX_RESIDENT_VIDEO_ELEMENTS = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
    if (isIOS) return 3
    if (lowMem) return 3
    if (coarse) return 4
    return 6
  } catch {
    return 4
  }
})()

const __activeVideoEls = new Set()
const __activeVideoLRU = []
const __residentVideoEls = new Set()
const __residentVideoLRU = []

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

export function __touchResidentVideoEl(el) {
  if (!el) return
  if (!__residentVideoEls.has(el)) __residentVideoEls.add(el)
  const idx = __residentVideoLRU.indexOf(el)
  if (idx !== -1) __residentVideoLRU.splice(idx, 1)
  __residentVideoLRU.push(el)
}

export function __dropResidentVideoEl(el) {
  if (!el) return
  __residentVideoEls.delete(el)
  const idx = __residentVideoLRU.indexOf(el)
  if (idx !== -1) __residentVideoLRU.splice(idx, 1)
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

export function __enforceResidentVideoCap(exceptEl) {
  try {
    if (__residentVideoLRU.length <= __MAX_RESIDENT_VIDEO_ELEMENTS) return
    let attempts = __residentVideoLRU.length + 4
    while (__residentVideoLRU.length > __MAX_RESIDENT_VIDEO_ELEMENTS && attempts > 0) {
      attempts -= 1
      const victim = __residentVideoLRU.shift()
      if (!victim) break
      if (victim === exceptEl) {
        __residentVideoLRU.push(victim)
        continue
      }
      if (!victim?.isConnected) {
        __residentVideoEls.delete(victim)
        continue
      }
      if (__isVideoNearViewport(victim, Math.max(520, Math.round(__MEDIA_VIS_MARGIN_PX * 2.1)))) {
        __residentVideoLRU.push(victim)
        continue
      }
      if (!victim.paused) {
        __residentVideoLRU.push(victim)
        continue
      }
      __residentVideoEls.delete(victim)
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
  __dropResidentVideoEl(el)
  __dropActiveVideoEl(el)
  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__active = '0'
  } catch {}
  try {
    delete el.dataset.__prewarm
    delete el.dataset.__warmLoading
    delete el.dataset.__warmReady
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
      el.setAttribute('preload', 'metadata')
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
    el.setAttribute('preload', 'none')
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
    el.setAttribute('preload', (el.dataset?.__prewarm === '1') ? 'auto' : 'metadata')
  } catch {}
  try {
    el.setAttribute('src', src)
  } catch {}
  try {
    el.dataset.__active = '1'
  } catch {}
  try {
    el.load?.()
  } catch {}
}

export function __primeVideoForWarmStart(el) {
  if (!(el instanceof HTMLVideoElement)) return
  __touchResidentVideoEl(el)
  __enforceResidentVideoCap(el)
  try {
    el.dataset.__prewarm = '1'
    el.preload = 'auto'
    el.setAttribute('preload', 'auto')
  } catch {}

  if (el.readyState >= 2 && el.currentSrc) {
    try {
      el.dataset.__warmReady = '1'
      delete el.dataset.__warmLoading
    } catch {}
    return
  }

  const finish = () => {
    try {
      el.dataset.__warmReady = '1'
      delete el.dataset.__warmLoading
    } catch {}
    try { el.removeEventListener('loadeddata', finish) } catch {}
    try { el.removeEventListener('canplay', finish) } catch {}
    try { el.removeEventListener('error', fail) } catch {}
  }

  const fail = () => {
    try { delete el.dataset.__warmLoading } catch {}
    try { el.removeEventListener('loadeddata', finish) } catch {}
    try { el.removeEventListener('canplay', finish) } catch {}
    try { el.removeEventListener('error', fail) } catch {}
  }

  if (el.dataset.__warmLoading === '1') return
  try {
    el.dataset.__warmLoading = '1'
    el.addEventListener('loadeddata', finish, { once: true })
    el.addEventListener('canplay', finish, { once: true })
    el.addEventListener('error', fail, { once: true })
  } catch {}

  if (__hasLazyVideoSourceWithoutSrc(el)) {
    __restoreVideoEl(el)
    return
  }

  try {
    if (el.paused && (el.readyState < 2 || !el.currentSrc)) el.load?.()
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
      touchResidentVideo={__touchResidentVideoEl}
      enforceResidentVideoCap={__enforceResidentVideoCap}
      isVideoNearViewport={__isVideoNearViewport}
      mediaVisMarginPx={__MEDIA_VIS_MARGIN_PX}
      dropActiveVideo={__dropActiveVideoEl}
      dropResidentVideo={__dropResidentVideoEl}
      unloadVideoEl={__unloadVideoEl}
      primeVideoForWarmStart={__primeVideoForWarmStart}
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
