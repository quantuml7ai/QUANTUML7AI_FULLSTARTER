'use client'

// Dormant legacy implementation: intentionally not mounted in production.
import { useEffect } from 'react'

const GLOBAL_MEDIA_SUSPEND_EVENT = 'ql7:global-media-suspend'
const EXTERNAL_VIDEO_STATE_EVENT = 'forum:external-video-state'

const YOUTUBE_RE = /(^|\.)youtube(?:-nocookie)?\.com$|(^|\.)youtu\.be$/i
const TIKTOK_RE = /(^|\.)tiktok\.com$/i

function safeUrl(raw) {
  try {
    return new URL(String(raw || ''), window.location.href)
  } catch {
    return null
  }
}

function markSystemPause(media) {
  try {
    media.dataset.__systemPause = '1'
    media.dataset.__systemPauseUntil = String(Date.now() + 60_000)
    media.dataset.__ql7VisibilityPaused = '1'
  } catch {}
}

function clearSystemPause(media) {
  try {
    if (media.dataset.__ql7VisibilityPaused !== '1') return
    delete media.dataset.__ql7VisibilityPaused
    delete media.dataset.__systemPause
    delete media.dataset.__systemPauseUntil
  } catch {}
}

function pauseHtmlMedia(root) {
  if (!root?.querySelectorAll) return

  try {
    root.querySelectorAll('audio,video').forEach((media) => {
      if (!media || typeof media.pause !== 'function') return
      markSystemPause(media)
      try { media.pause() } catch {}
    })
  } catch {}

}

function clearHtmlMediaSystemPause(root) {
  if (!root?.querySelectorAll) return

  try {
    root.querySelectorAll('audio,video').forEach((media) => {
      if (media && typeof media.pause === 'function') clearSystemPause(media)
    })
  } catch {}

}

function frameKind(frame) {
  const attr = String(
    frame.getAttribute('data-forum-media') ||
    frame.getAttribute('data-ad-media-kind') ||
    frame.getAttribute('data-kind') ||
    '',
  ).trim().toLowerCase()

  if (attr) return attr

  const src =
    frame.getAttribute('src') ||
    frame.getAttribute('data-src') ||
    ''
  const url = safeUrl(src)
  const host = String(url?.hostname || '').toLowerCase()

  if (YOUTUBE_RE.test(host)) return 'youtube'
  if (TIKTOK_RE.test(host)) return 'tiktok'
  return 'iframe'
}

function isMediaFrame(frame) {
  if (!(frame instanceof HTMLIFrameElement)) return false

  if (
    frame.hasAttribute('data-forum-media') ||
    frame.hasAttribute('data-ad-media-kind') ||
    frame.hasAttribute('data-ql7-media-iframe')
  ) {
    return true
  }

  const allow = String(frame.getAttribute('allow') || '').toLowerCase()
  return (
    allow.includes('autoplay')
  )
}

function emitExternalPaused(frame) {
  try {
    window.dispatchEvent(new CustomEvent(EXTERNAL_VIDEO_STATE_EVENT, {
      detail: { frame, paused: true },
    }))
  } catch {}
}

function pauseKnownProviderFrame(frame, kind) {
  if (!(frame instanceof HTMLIFrameElement)) return false

  if (kind === 'youtube') {
    try {
      const player = window.__forumYtPlayers?.get?.(frame)
      player?.pauseVideo?.()
    } catch {}

    try {
      frame.contentWindow?.postMessage?.(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*',
      )
    } catch {}

    emitExternalPaused(frame)
    return true
  }

  if (kind === 'tiktok') {
    try {
      frame.contentWindow?.postMessage?.(
        { type: 'pause', 'x-tiktok-player': true },
        '*',
      )
    } catch {}

    emitExternalPaused(frame)
    return true
  }

  return false
}

function pauseSameOriginFrame(frame) {
  try {
    const doc = frame.contentDocument
    if (!doc) return false
    pauseHtmlMedia(doc)
    return true
  } catch {
    return false
  }
}

export default function GlobalMediaVisibilityRuntime() {
  useEffect(() => {
    let disposed = false
    const hardSuspendedFrames = new Map()

    const hardSuspendUnknownMediaFrame = (frame) => {
      if (!(frame instanceof HTMLIFrameElement)) return
      if (hardSuspendedFrames.has(frame)) return

      const src = String(frame.getAttribute('src') || '').trim()
      if (!src || src === 'about:blank') return

      hardSuspendedFrames.set(frame, src)

      try {
        frame.dataset.__ql7VisibilitySuspended = '1'
        frame.setAttribute('src', 'about:blank')
      } catch {}
    }

    const suspendFrame = (frame) => {
      if (!(frame instanceof HTMLIFrameElement) || !isMediaFrame(frame)) return

      const kind = frameKind(frame)

      if (pauseKnownProviderFrame(frame, kind)) return
      if (pauseSameOriginFrame(frame)) return

      // A top-level page cannot directly pause arbitrary cross-origin iframe
      // media. For unknown media embeds, unloading is the only deterministic
      // way to guarantee that audio cannot continue behind a locked screen.
      hardSuspendUnknownMediaFrame(frame)
    }

    const suspendAll = (reason = 'hidden') => {
      if (disposed) return

      pauseHtmlMedia(document)

      try {
        document.querySelectorAll('iframe').forEach(suspendFrame)
      } catch {}

      try {
        window.dispatchEvent(new CustomEvent(GLOBAL_MEDIA_SUSPEND_EVENT, {
          detail: { reason, ts: Date.now() },
        }))
      } catch {}
    }

    const restoreHardSuspendedFrames = () => {
      if (disposed || document.visibilityState !== 'visible') return

      for (const [frame, src] of hardSuspendedFrames) {
        hardSuspendedFrames.delete(frame)

        if (!(frame instanceof HTMLIFrameElement) || !frame.isConnected) continue

        try {
          if (frame.dataset.__ql7VisibilitySuspended === '1') {
            delete frame.dataset.__ql7VisibilitySuspended
            frame.setAttribute('src', src)
          }
        } catch {}
      }

      clearHtmlMediaSystemPause(document)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        suspendAll('visibility-hidden')
        return
      }

      restoreHardSuspendedFrames()
    }

    const onPageHide = () => {
      suspendAll('pagehide')
    }

    const onPageShow = () => {
      restoreHardSuspendedFrames()
    }

    const onFreeze = () => {
      suspendAll('freeze')
    }

    const onPlayCapture = (event) => {
      if (document.visibilityState !== 'hidden') return

      const target = event?.target
      if (!(target instanceof HTMLMediaElement)) return

      markSystemPause(target)
      try { target.pause() } catch {}
    }

    const onSiteMediaPlay = (event) => {
      if (document.visibilityState !== 'hidden') return

      const element = event?.detail?.element

      if (element instanceof HTMLMediaElement) {
        markSystemPause(element)
        try { element.pause() } catch {}
        return
      }

      if (element instanceof HTMLIFrameElement) {
        suspendFrame(element)
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange, true)
    window.addEventListener('pagehide', onPageHide, true)
    window.addEventListener('pageshow', onPageShow, true)
    document.addEventListener('freeze', onFreeze, true)
    document.addEventListener('play', onPlayCapture, true)
    window.addEventListener('site-media-play', onSiteMediaPlay, true)

    return () => {
      disposed = true

      document.removeEventListener('visibilitychange', onVisibilityChange, true)
      window.removeEventListener('pagehide', onPageHide, true)
      window.removeEventListener('pageshow', onPageShow, true)
      document.removeEventListener('freeze', onFreeze, true)
      document.removeEventListener('play', onPlayCapture, true)
      window.removeEventListener('site-media-play', onSiteMediaPlay, true)

      hardSuspendedFrames.clear()
      clearHtmlMediaSystemPause(document)
    }
  }, [])

  return null
}
