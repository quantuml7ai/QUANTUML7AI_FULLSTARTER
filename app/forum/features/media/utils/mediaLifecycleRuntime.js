'use client'

import React from 'react'
import VideoMediaLeaf from '../components/VideoMedia'
import QCastPlayerLeaf from '../components/QCastPlayer'
import { createEnableVideoControlsOnTap } from './videoControls'

export const MEDIA_MUTED_KEY = 'forum:mediaMuted'
export const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
export const MEDIA_MUTED_EVENT = 'forum:media-mute'
function normalizeMutedRaw(raw) {
  if (raw == null || raw === '') return null
  const s = String(raw).trim().toLowerCase()
  if (s === '1' || s === 'true' || s === 'yes' || s === 'muted') return true
  if (s === '0' || s === 'false' || s === 'no' || s === 'unmuted') return false
  return null
}

export function readMutedPrefFromDocument() {
  try {
    if (typeof window !== 'undefined' && typeof window.__FORUM_MEDIA_MUTED__ === 'boolean') {
      return window.__FORUM_MEDIA_MUTED__
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && typeof window.__SITE_MEDIA_MUTED__ === 'boolean') {
      return window.__SITE_MEDIA_MUTED__
    }
  } catch {}
  try {
    if (typeof document === 'undefined') return null
    const root = document?.documentElement
    const body = document?.body
    return normalizeMutedRaw(
      root?.dataset?.forumMediaMuted ??
      root?.dataset?.mediaMuted ??
      body?.dataset?.forumMediaMuted ??
      body?.dataset?.mediaMuted ??
      null
    )
  } catch {
    return null
  }
}

export function writeMutedPrefToDocument(nextMuted, userSet = false) {
  try {
    if (typeof window === 'undefined') return
    const nextBool = !!nextMuted
    const nextStr = nextBool ? '1' : '0'
    try { window.__FORUM_MEDIA_MUTED__ = nextBool } catch {}
    try { window.__SITE_MEDIA_MUTED__ = nextBool } catch {}
    try { window.__FORUM_MEDIA_SOUND_UNLOCKED__ = !nextBool } catch {}
    try { window.__SITE_MEDIA_SOUND_UNLOCKED__ = !nextBool } catch {}
    if (userSet) {
      try { window.__FORUM_MEDIA_SOUND_USER_SET__ = true } catch {}
      try { window.__SITE_MEDIA_SOUND_USER_SET__ = true } catch {}
    }    
    try {
      const root = document?.documentElement
      if (root?.dataset) {
        root.dataset.forumMediaMuted = nextStr
        root.dataset.mediaMuted = nextStr
        root.dataset.forumMediaSoundUnlocked = nextBool ? '0' : '1'
        if (userSet) root.dataset.forumMediaSoundUserSet = '1'
      }
    } catch {}
    try {
      const body = document?.body
      if (body?.dataset) {
        body.dataset.forumMediaMuted = nextStr
        body.dataset.mediaMuted = nextStr
        body.dataset.forumMediaSoundUnlocked = nextBool ? '0' : '1'
        if (userSet) body.dataset.forumMediaSoundUserSet = '1'
      }
    } catch {}
  } catch {}
}

export function writeMutedPrefToStorage(nextMuted) {
  try {
    const v = nextMuted ? '1' : '0'
    localStorage.setItem(MEDIA_MUTED_KEY, v)
    localStorage.setItem(MEDIA_VIDEO_MUTED_KEY, v)
  } catch {}
}
;(() => {
  // Session boot policy for the forum media layer:
  // every fresh page load starts muted, so splash/BG audio is not covered by feed media.
  // A user's sound choice is authoritative only inside the current runtime document
  // and is mirrored to storage for legacy components until the next reload.
  try {
    if (typeof window === 'undefined') return
    writeMutedPrefToDocument(true, false)
    writeMutedPrefToStorage(true)
  } catch {}
})()

export function readMutedPrefFromStorage() {
  try {
    let v = localStorage.getItem(MEDIA_MUTED_KEY)
    if (v == null) v = localStorage.getItem(MEDIA_VIDEO_MUTED_KEY)
    return normalizeMutedRaw(v)
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
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 3
    if (isIOS) return true
    if (lowMem) return true
    return false
  } catch {
    return true
  }
})()

const __SOFT_RESIDENT_POST_VIDEO = true

const __MEDIA_RUNTIME_PROFILE = (() => {
  try {
    const ua = String((typeof navigator !== 'undefined' ? navigator.userAgent : '') || '')
    const isIOS = /iP(hone|ad|od)/i.test(ua)
    const isAndroid = /Android/i.test(ua)
    const coarse = !!(typeof window !== 'undefined' && window?.matchMedia?.('(pointer: coarse)')?.matches)
    const dm = Number((typeof navigator !== 'undefined' ? navigator?.deviceMemory : 0) || 0)
    const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 3
    return { isIOS, isAndroid, coarse: coarse || isIOS || isAndroid, lowMem }
  } catch {
    return { isIOS: false, isAndroid: false, coarse: true, lowMem: true }
  }
})()

const __MAX_ACTIVE_VIDEO_ELEMENTS = (() => {
  try {
    if (__MEDIA_RUNTIME_PROFILE.isIOS) return 1
    if (__MEDIA_RUNTIME_PROFILE.lowMem) return 1
    if (__MEDIA_RUNTIME_PROFILE.coarse) return 2
    return 5
  } catch {
    return 2
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

      const victimIsPostFeedVideo =
        String(victim?.getAttribute?.('data-forum-video') || '') === 'post'
      const protectMargin = victimIsPostFeedVideo ? 700 : 180

      if (victim === exceptEl) {
        __activeVideoLRU.shift()
        __activeVideoLRU.push(victim)
        continue
      }
      const victimNearProtected = __isVideoNearViewport(victim, protectMargin)
      const victimLoadPending = String(victim?.dataset?.__loadPending || '') === '1'

      if (
        String(victim?.dataset?.__playRequested || '') === '1' ||
        (victimLoadPending && victimNearProtected)
      ) {
        __activeVideoLRU.shift()
        __activeVideoLRU.push(victim)
        continue
      }
      if (victimNearProtected) {
        __activeVideoLRU.shift()
        __activeVideoLRU.push(victim)
        continue
      }

      __activeVideoLRU.shift()
      __activeVideoEls.delete(victim)

      if (victimIsPostFeedVideo) {
        try {
          victim.pause?.()
        } catch {}
        try {
          victim.dataset.__active = '0'
          victim.dataset.__prewarm = '0'
          victim.dataset.__resident = '1'
          victim.preload = 'metadata'
        } catch {}
      } else {
        __unloadVideoEl(victim)
      }
    }
  } catch {}
}

export function __readMediaMutedPref() {
  const fromDocument = readMutedPrefFromDocument()
  if (typeof fromDocument === 'boolean') return fromDocument
  const fromStorage = readMutedPrefFromStorage()
  if (typeof fromStorage === 'boolean') return fromStorage
  return true
}

export function __writeMediaMutedPref(nextMuted, source = 'media_element', emit = true) {
  const next = !!nextMuted
  writeMutedPrefToDocument(next, true)
  writeMutedPrefToStorage(next)

  if (!emit || typeof window === 'undefined') return

  try {
    window.dispatchEvent(new CustomEvent(MEDIA_MUTED_EVENT, {
      detail: {
        muted: next,
        source: String(source || 'media_element'),
      },
    }))
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

const shellVisible = isPostFeedVideo ? __isVideoNearViewport(el, 220) : false
const nearViewport = __isVideoNearViewport(el, isPostFeedVideo ? 560 : 420)

const shouldKeepResidentPostVideo =
  isPostFeedVideo &&
  __SOFT_RESIDENT_POST_VIDEO &&
  !hardUnloadRequested &&
  (nearViewport || shellVisible)
if (!canHardUnload || shouldKeepResidentPostVideo) {
  try {
    el.pause?.()
  } catch {}
  try {
    el.dataset.__resident = isPostFeedVideo ? '1' : '0'
    el.dataset.__prewarm = '0'
    el.preload = 'metadata'
    el.dataset.__lastUnloadTs = String(nowTs)
  } catch {}

  if (isPostFeedVideo) {
    try {
      const posterSrc = String(
        el?.getAttribute?.('poster') ||
        el?.getAttribute?.('data-poster') ||
        el?.dataset?.poster ||
        ''
      )
      if (posterSrc) {
        el.setAttribute('data-poster', posterSrc)
        if (!el.getAttribute('poster')) el.setAttribute('poster', posterSrc)
      }
    } catch {}
  }

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
    el.preload = isPostFeedVideo ? 'metadata' : 'none'
  } catch {}
try {
  if (!isPostFeedVideo) {
    el.removeAttribute('poster')
    delete el.dataset.__posterOriginal
    delete el.dataset.__posterMediaKey
    delete el.dataset.__posterRevealed
    delete el.dataset.__needsPosterRestore
  } else {
    const posterSrc = String(
      el?.getAttribute?.('poster') ||
      el?.getAttribute?.('data-poster') ||
      el?.dataset?.poster ||
      ''
    )
    if (posterSrc) {
      el.setAttribute('data-poster', posterSrc)
      if (!el.getAttribute('poster')) el.setAttribute('poster', posterSrc)
    }
  }
  el.dataset.__lastHardUnloadTs = String(nowTs)
} catch {}
  if (!isPostFeedVideo) {
    try {
      el.load?.()
    } catch {}
  }
}

export function __restoreVideoEl(el) {
  if (!el) return
  const nowTs = __markMediaLifecycleTouch(el, 'restore')
  const src = el.dataset.__src || el.getAttribute('data-src') || ''
  const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'
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

    if (isPostFeedVideo) {
      const shouldKickLoad =
        (readyStateNow === 0 || isNetworkEmpty) &&
        (
          String(el.dataset?.__active || '') === '1' ||
          String(el.dataset?.__prewarm || '') === '1' ||
          String(el.dataset?.__resident || '') === '1' ||
          __isVideoNearViewport(el, 900)
        )

      if (shouldKickLoad && canRestoreLoad()) {
        el.dataset.__loadPending = '1'
        el.dataset.__loadPendingSince = String(Date.now())
        el.dataset.__warmReady = '0'
        try { el.load?.() } catch {}
      } else {
        el.dataset.__loadPending = '0'
        delete el.dataset.__loadPendingSince
        el.dataset.__warmReady = readyStateNow >= 2 && !isNetworkEmpty ? '1' : '0'
      }
      return
    }

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
  const shouldAutoPreload =
    !isPostFeedVideo &&
    (
      String(el.dataset?.__prewarm || '') === '1' ||
      String(el.dataset?.__active || '') === '1' ||
      String(el.dataset?.__resident || '') === '1'
    )

  // Feed native video is network-started only by the coordinator.
  // Restore may put src back, but must not make an offscreen video preload auto.
  el.preload = shouldAutoPreload ? 'auto' : 'metadata'
} catch {}
try {
  if (!isPostFeedVideo) {
    el.removeAttribute('poster')
    delete el.dataset.__posterOriginal
    delete el.dataset.__posterMediaKey
    delete el.dataset.__posterRevealed
    delete el.dataset.__needsPosterRestore
  } else {
    const posterSrc = String(
      el?.getAttribute?.('poster') ||
      el?.getAttribute?.('data-poster') ||
      el?.dataset?.poster ||
      ''
    )
    if (posterSrc) {
      el.setAttribute('data-poster', posterSrc)
      if (!el.getAttribute('poster')) el.setAttribute('poster', posterSrc)
    }
  }
} catch {}
try {
  if (isPostFeedVideo) {
    el.dataset.__loadPending = '0'
    delete el.dataset.__loadPendingSince
    el.dataset.__warmReady = Number(el.readyState || 0) >= 2 ? '1' : '0'
  } else {
    el.dataset.__loadPending = '1'
    el.dataset.__loadPendingSince = String(Date.now())
    el.dataset.__warmReady = '0'
  }
  el.setAttribute('src', src)
  el.dataset.__attachedSrc = String(src)
  el.dataset.__attachedSrcTs = String(Date.now())
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

// Для post-video restore — только DOM/surface restore.
// Сетевой kickoff остаётся у coordinator.
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
      readMutedPrefFromStorage={__readMediaMutedPref}
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
