'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'

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

const __MAX_RESIDENT_VIDEO_ELEMENTS = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 3
    if (isIOS) return 2
    if (lowMem) return 2
    if (coarse) return 3
    return 4
  } catch {
    return 3
  }
})()

const __MEDIA_OWNER_SELECTOR = '[data-forum-media-owner="1"]'
const __MEDIA_NODE_SELECTOR = '[data-forum-media-node="1"]'

const __activeVideoEls = new Set()
const __activeVideoLRU = []
const __residentVideoOwners = new Set()
const __residentVideoOwnerLRU = []

function __getMediaOwnerEl(input) {
  try {
    if (!(input instanceof Element)) return null
    if (input.matches?.(__MEDIA_OWNER_SELECTOR)) return input
    const owner = input.closest?.(__MEDIA_OWNER_SELECTOR)
    if (owner instanceof Element) return owner
    if (input.matches?.('[data-forum-media="qcast"]')) return input
    const qcastOwner = input.closest?.('[data-forum-media="qcast"]')
    return qcastOwner instanceof Element ? qcastOwner : null
  } catch {
    return null
  }
}

function __getOwnedVideoLeaf(owner) {
  try {
    if (!(owner instanceof Element)) return null
    const leaf =
      owner.querySelector?.(`${__MEDIA_NODE_SELECTOR}[data-forum-media="video"]`) ||
      owner.querySelector?.('video[data-forum-media-node="1"]') ||
      owner.querySelector?.('video[data-forum-video="post"]') ||
      owner.querySelector?.('video')
    return leaf instanceof HTMLVideoElement ? leaf : null
  } catch {
    return null
  }
}

function __isOwnerNearViewport(owner, marginPx = 120) {
  try {
    if (!owner?.isConnected) return false
    const rect = owner.getBoundingClientRect?.()
    if (!rect) return false
    const vh = Number(window?.innerHeight || document?.documentElement?.clientHeight || 0) || 0
    if (vh <= 0) return false
    const topBound = 0 - marginPx
    const bottomBound = vh + marginPx
    return rect.bottom > topBound && rect.top < bottomBound
  } catch {
    return false
  }
}

function __ownerResidentLeaseActive(owner) {
  try {
    return Number(owner?.dataset?.__residentLeaseUntil || 0) > Date.now()
  } catch {
    return false
  }
}

function __dropResidentVideoOwner(input) {
  const owner = __getMediaOwnerEl(input)
  if (!owner) return
  __residentVideoOwners.delete(owner)
  const idx = __residentVideoOwnerLRU.indexOf(owner)
  if (idx !== -1) __residentVideoOwnerLRU.splice(idx, 1)
  try { delete owner.dataset.__residentLeaseUntil } catch {}
}

function __enforceResidentVideoCap(exceptOwner = null) {
  try {
    let guard = 0
    while (__residentVideoOwnerLRU.length > __MAX_RESIDENT_VIDEO_ELEMENTS && guard < 256) {
      guard += 1
      const victim = __residentVideoOwnerLRU[0]
      if (!(victim instanceof Element)) {
        __residentVideoOwnerLRU.shift()
        continue
      }
      const leaf = __getOwnedVideoLeaf(victim)
      const protectedResident =
        victim === exceptOwner ||
        String(victim?.dataset?.__active || '') === '1' ||
        __ownerResidentLeaseActive(victim) ||
        __isOwnerNearViewport(victim, 180) ||
        String(leaf?.dataset?.__playRequested || '') === '1' ||
        String(leaf?.dataset?.__loadPending || '') === '1'
      if (protectedResident) {
        __residentVideoOwnerLRU.shift()
        __residentVideoOwnerLRU.push(victim)
        continue
      }
      __residentVideoOwnerLRU.shift()
      __residentVideoOwners.delete(victim)
      try {
        victim.dataset.__resident = '0'
        victim.dataset.__prewarm = '0'
        delete victim.dataset.__residentLeaseUntil
      } catch {}
      if (leaf instanceof HTMLVideoElement) {
        try { leaf.dataset.__forceHardUnload = '1' } catch {}
        __unloadVideoEl(leaf)
      }
    }
  } catch {}
}

function __touchResidentVideoOwner(input, leaseMs = 2800) {
  const owner = __getMediaOwnerEl(input)
  if (!owner) return null
  if (!__residentVideoOwners.has(owner)) __residentVideoOwners.add(owner)
  const idx = __residentVideoOwnerLRU.indexOf(owner)
  if (idx !== -1) __residentVideoOwnerLRU.splice(idx, 1)
  __residentVideoOwnerLRU.push(owner)
  try {
    owner.dataset.__residentLeaseUntil = String(Date.now() + Math.max(600, Number(leaseMs || 0)))
  } catch {}
  __enforceResidentVideoCap(owner)
  return owner
}

export function __touchActiveVideoEl(el) {
  if (!el) return
  if (!__activeVideoEls.has(el)) __activeVideoEls.add(el)
  const idx = __activeVideoLRU.indexOf(el)
  if (idx !== -1) __activeVideoLRU.splice(idx, 1)
  __activeVideoLRU.push(el)
  try { __touchResidentVideoOwner(el, 3200) } catch {}
}

export function __dropActiveVideoEl(el) {
  if (!el) return
  __activeVideoEls.delete(el)
  const idx = __activeVideoLRU.indexOf(el)
  if (idx !== -1) __activeVideoLRU.splice(idx, 1)
}

export function __isVideoNearViewport(el, marginPx = 120) {
  try {
    const node = __getMediaOwnerEl(el) || el
    if (!node?.isConnected) return false
    const r = node.getBoundingClientRect?.()
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
      __unloadVideoEl(victim)
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

export function __unloadVideoEl(el) {
  if (!el) return
  const nowTs = __markMediaLifecycleTouch(el, 'unload')
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  const owner = __getMediaOwnerEl(el)
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
  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__active = '0'
    el.dataset.__playRequested = '0'
    el.dataset.__loadPending = '0'
    el.dataset.__warmReady = '0'
    el.dataset.__resident = '0'
    el.dataset.__prewarm = '0'
    el.dataset.__lastUnloadTs = String(nowTs)
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

const shouldKeepResidentPostVideo =
  isPostFeedVideo &&
  __SOFT_RESIDENT_POST_VIDEO &&
  !hardUnloadRequested &&
  (
    String(owner?.dataset?.__resident || '') === '1' ||
    __ownerResidentLeaseActive(owner) ||
    __isOwnerNearViewport(owner || el, 220)
  )

if (!canHardUnload || shouldKeepResidentPostVideo) {
  try { __touchResidentVideoOwner(owner || el, __isOwnerNearViewport(owner || el, 220) ? 3200 : 1800) } catch {}
  try {
    el.dataset.__resident = isPostFeedVideo ? '1' : '0'
    el.dataset.__prewarm = '0'
    el.preload = 'metadata'
  } catch {}
  return
}
  __dropResidentVideoOwner(owner || el)
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
  const nowTs = __markMediaLifecycleTouch(el, 'restore')
  const src = el.dataset.__src || el.getAttribute('data-src') || ''
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
  const owner = __getMediaOwnerEl(el)
  if (!src) return
  try {
    delete el.dataset.__forceHardUnload
  } catch {}
const canRestoreLoad = () => {
  try {
    const now = Date.now()
    const blockedUntil = Number(el.dataset?.__restoreLoadBlockedUntil || 0)
    if (blockedUntil > now) return false

const fastRestore = isPostFeedVideo
const minGap = fastRestore ? 1200 : 1500
const winMs = fastRestore ? 20000 : 16000
const burstLimit = fastRestore ? 4 : 5

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
      el.dataset.__restoreLoadBlockedUntil = String(now + (fastRestore ? 6000 : 10000))
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
    if (isPostFeedVideo) __touchResidentVideoOwner(owner || el, 3200)
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

  el.preload = shouldAutoPreload ? 'auto' : 'metadata'
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

  const shouldKickPostRestore =
    isPostFeedVideo &&
    (
      String(el.dataset?.__prewarm || '') === '1' ||
      String(el.dataset?.__active || '') === '1' ||
      String(el.dataset?.__resident || '') === '1'
    )

  if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()
  if (shouldKickPostRestore && !isLoading && canRestoreLoad()) {
    el.load?.()
  }
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
