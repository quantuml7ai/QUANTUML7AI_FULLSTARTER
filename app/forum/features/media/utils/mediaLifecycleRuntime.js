'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'
import { __appendForumMediaTrace } from './mediaDebugRuntime'
import {
  MEDIA_MUTED_KEY,
  MEDIA_VIDEO_MUTED_KEY,
  MEDIA_MUTED_EVENT,
  readMutedPrefFromStorage,
  __writeMediaMutedPref,
} from './mediaMutePrefs'

export {
  MEDIA_MUTED_KEY,
  MEDIA_VIDEO_MUTED_KEY,
  MEDIA_MUTED_EVENT,
  readMutedPrefFromStorage,
  __writeMediaMutedPref,
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
const __restoreKickTimers = new WeakMap()

function __markMediaLoadPending(el) {
  if (!el) return
  try {
    el.dataset.__loadPending = '1'
    el.dataset.__warmReady = '0'
    el.dataset.__loadPendingSince = String(Date.now())
  } catch {}
}

function __clearMediaLoadPending(el, { warmReady = false } = {}) {
  if (!el) return
  try {
    el.dataset.__loadPending = '0'
    if (warmReady) el.dataset.__warmReady = '1'
    delete el.dataset.__loadPendingSince
  } catch {}
}

function __isMobileRestoreKickClient() {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    return isIOS || isAndroid || coarse
  } catch {
    return false
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

export function __unloadVideoEl(el) {
  if (!el) return
  const nowTs = Date.now()
  try {
    const restoreTimer = __restoreKickTimers.get(el)
    if (restoreTimer) clearTimeout(restoreTimer)
    __restoreKickTimers.delete(el)
  } catch {}
  __appendForumMediaTrace('html_media_unload', {
    id: String(el?.dataset?.__mid || ''),
    src: String(
      el?.dataset?.__src ||
      el?.getAttribute?.('data-src') ||
      el?.currentSrc ||
      el?.getAttribute?.('src') ||
      ''
    ),
    reason: String(el?.dataset?.__coordinatorUnloadReason || ''),
  })
  try {
    const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
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
  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__active = '0'
    __clearMediaLoadPending(el, { warmReady: false })
    el.dataset.__warmReady = '0'
    el.dataset.__resident = '0'
    el.dataset.__prewarm = '0'
    el.dataset.__lastUnloadTs = String(nowTs)
  } catch {}
  const canHardUnload = (() => {
    try {
      const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
      const lastRestoreTs = Number(el?.dataset?.__lastRestoreTs || 0)
      const lastLoadKickTs = Number(el?.dataset?.__lastLoadKickTs || 0)
      const restoreCooldownMs = isPostFeedVideo ? 18000 : 0
      const loadKickCooldownMs = isPostFeedVideo ? 12000 : 0
      const restoredRecently = lastRestoreTs > 0 && (nowTs - lastRestoreTs) < restoreCooldownMs
      const kickedRecently = lastLoadKickTs > 0 && (nowTs - lastLoadKickTs) < loadKickCooldownMs
      if (__VIDEO_HARD_CAP_ENABLED) return true
      if (isPostFeedVideo && (restoredRecently || kickedRecently)) return false
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
    if (el.dataset?.__src) {
      el.setAttribute('data-src', String(el.dataset.__src))
    }
  } catch {}
  try {
    el.preload = 'none'
  } catch {}
  try {
    const poster = el.dataset?.__posterOriginal || ''
    if (poster) el.setAttribute('poster', poster)
    el.dataset.__posterRevealed = '0'
    el.dataset.__needsPosterRestore = '1'
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
  __appendForumMediaTrace('html_media_restore', {
    id: String(el?.dataset?.__mid || ''),
    src: String(src || ''),
  })
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
      if (lastTs > 0 && (now - lastTs) < minGap) return false
      const winMs = 16000
      const burstLimit = 5
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
        if (!canRestoreLoad()) return
        __markMediaLoadPending(el)
        el.load?.()
      }
    } catch {}
    return
  }
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
    __markMediaLoadPending(el)
    el.setAttribute('src', src)
  } catch {}
  try {
    const prevTimer = __restoreKickTimers.get(el)
    if (prevTimer) clearTimeout(prevTimer)
  } catch {}
  if (__isMobileRestoreKickClient()) {
    const kickDelayMs = 180
    const timer = setTimeout(() => {
      try {
        __restoreKickTimers.delete(el)
        if (!el?.isConnected) return
        const readyStateNow = Number(el.readyState || 0)
        const networkStateNow = Number(el.networkState || 0)
        const currentSrcNow = String(el.currentSrc || el.getAttribute('src') || '').trim()
        const stillCold =
          readyStateNow < 2 &&
          (
            !currentSrcNow ||
            (
              typeof HTMLMediaElement !== 'undefined' &&
              (
                networkStateNow === HTMLMediaElement.NETWORK_EMPTY ||
                networkStateNow === HTMLMediaElement.NETWORK_NO_SOURCE
              )
            )
          )
        if (!stillCold) return
        if (!canRestoreLoad()) return
        __markMediaLoadPending(el)
        __appendForumMediaTrace('html_media_restore_load_kick', {
          id: String(el?.dataset?.__mid || ''),
          src: String(src || ''),
        })
        el.load?.()
      } catch {}
    }, kickDelayMs)
    try { __restoreKickTimers.set(el, timer) } catch {}
  }
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
  // setAttribute('src') уже запускает стандартный resource selection path браузера.
  // Дополнительный immediate load() здесь провоцировал лишние 206/cancel циклы.
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
