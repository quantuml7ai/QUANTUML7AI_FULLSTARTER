'use client'

import React from 'react'
import { MEDIA_MUTED_EVENT } from '../utils/mediaLifecycleRuntime'
import {
  EXTERNAL_VIDEO_STATE_EVENT,
  commandExternalVideo,
  emitExternalVideoState,
} from '../utils/externalVideoBridge'

const GOOD_EMOJIS = ['🔥', '✨', '🚀', '💎', '⚡', '👏', '🤩', '💯', '🫶', '🎉']
const BAD_EMOJIS = ['😶', '🤨', '🙈', '😴', '💤', '🫠', '😵', '🙃', '😬', '🧊']

function IconPlay() {
  return (
    <svg
      className="ql7Glyph ql7Glyph--play"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <path d="M9 7.2 17 12l-8 4.8V7.2Z" fill="currentColor" />
      <path d="M6.8 4.8h10.4l2.1 2.1v10.2l-2.1 2.1H6.8l-2.1-2.1V6.9l2.1-2.1Z" stroke="currentColor" strokeWidth="1.25" opacity=".72" />
    </svg>
  )
}

function IconPause() {
  return (
    <svg
      className="ql7Glyph ql7Glyph--pause"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <circle cx="12" cy="12" r="7.8" stroke="currentColor" strokeWidth="1.25" opacity=".72" />
      <rect x="8.2" y="7.4" width="2.8" height="9.2" rx="1.2" fill="currentColor" />
      <rect x="13" y="7.4" width="2.8" height="9.2" rx="1.2" fill="currentColor" />
    </svg>
  )
}

function IconVolume({ muted }) {
  return (
    <svg className="ql7Glyph ql7Glyph--sound" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 9.6h3.4l4.2-3.4c.75-.6 1.9-.08 1.9.9v9.8c0 .98-1.15 1.5-1.9.9l-4.2-3.4H4.5V9.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      {muted ? (
        <path d="M17.1 9.1 21 13m0-3.9L17.1 13" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      ) : (
        <>
          <path d="M17.1 9.2c.85.78 1.25 1.7 1.25 2.8s-.4 2.02-1.25 2.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M19.4 7.1c1.38 1.32 2.08 2.94 2.08 4.9s-.7 3.58-2.08 4.9" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" opacity=".78" />
        </>
      )}
    </svg>
  )
}

function IconGood() {
  return (
    <svg className="ql7Glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.7 14.4 9l5.8.6-4.35 3.9 1.2 5.7L12 16.25 6.95 19.2l1.2-5.7L3.8 9.6 9.6 9 12 3.7Z" fill="currentColor" />
    </svg>
  )
}

function IconBad() {
  return (
    <svg className="ql7Glyph" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3.8 20.2 12 12 20.2 3.8 12 12 3.8Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.6 8.6 15.4 15.4M15.4 8.6 8.6 15.4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function isIosSafariBrowserRuntime() {
  try {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
    const ua = String(navigator.userAgent || '')
    const classicIOS = /iP(hone|ad|od)/i.test(ua)
    const desktopModeIPad = /Macintosh/i.test(ua) && Number(navigator.maxTouchPoints || 0) > 1
    const ios = classicIOS || desktopModeIPad
    const otherIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA|YaBrowser/i.test(ua)
    const telegram = /Telegram/i.test(ua) || !!window.Telegram?.WebApp
    return !!(ios && /Safari/i.test(ua) && !otherIosBrowser && !telegram)
  } catch {
    return false
  }
}

export default function ExternalVideoPlayer({
  kind,
  src,
  title,
  id,
  videoId,
  ownerId,
  lifecycleState = 'shell',
  className = 'mediaBoxItem',
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
}) {
  const frameRef = React.useRef(null)
  const safariGestureButtonRef = React.useRef(null)
  const hudTimerRef = React.useRef(0)
  const centerTimerRef = React.useRef(0)
  const fxTimersRef = React.useRef([])
  const fxSeqRef = React.useRef(0)
  const surfaceTouchRef = React.useRef({ x: 0, y: 0, moved: false, touchHandledAt: 0 })
  const [hudVisible, setHudVisible] = React.useState(false)
  const [isIosSafariBrowser, setIsIosSafariBrowser] = React.useState(false)
  const [pausedState, setPausedState] = React.useState(true)
  const [mutedState, setMutedState] = React.useState(true)
  const [centerGlyph, setCenterGlyph] = React.useState('play')
  const [fxBursts, setFxBursts] = React.useState([])
  
  const normalizedKind = String(kind || '').toLowerCase()
  const isExternalProvider = normalizedKind === 'youtube' || normalizedKind === 'tiktok'
  const centerIsVisible = pausedState || !!centerGlyph || hudVisible
  const centerIcon = pausedState ? 'play' : (centerGlyph || 'pause')
  const providerShieldVisible = isExternalProvider && pausedState

  React.useEffect(() => {
    setIsIosSafariBrowser(isIosSafariBrowserRuntime())
  }, [])
  const revealHud = React.useCallback((ms = 2200) => {
    setHudVisible(true)
    try { if (hudTimerRef.current) clearTimeout(hudTimerRef.current) } catch {}
    hudTimerRef.current = window.setTimeout(() => {
      hudTimerRef.current = 0
      setHudVisible(false)
    }, ms)
  }, [])

  const showCenterGlyph = React.useCallback((glyph, ms = 760) => {
    setCenterGlyph(glyph)
    try { if (centerTimerRef.current) clearTimeout(centerTimerRef.current) } catch {}
    centerTimerRef.current = window.setTimeout(() => {
      centerTimerRef.current = 0
      setCenterGlyph('')
    }, ms)
  }, [])

  const armManualIntent = React.useCallback(() => {
    const frame = frameRef.current
    if (!frame) return
    const until = Date.now() + 4200
    try { frame.dataset.__userGestureIntentUntil = String(until) } catch {}
    try { frame.dataset.__manualLeaseUntil = String(until) } catch {}
    try { frame.dataset.__persistMuteUntil = String(until) } catch {}
  }, [])

  const spawnEmojiBurst = React.useCallback((mood) => {
    const set = mood === 'good' ? GOOD_EMOJIS : BAD_EMOJIS
    const count = 12
    const next = Array.from({ length: count }).map((_, index) => {
      const idKey = `${Date.now()}_${fxSeqRef.current++}_${index}`
      const drift = (Math.random() * 2 - 1).toFixed(3)
      return {
        id: idKey,
        char: pick(set),
        left: Math.round(window.innerWidth * (0.2 + Math.random() * 0.6)),
        top: Math.round(window.innerHeight * (0.48 + Math.random() * 0.22)),
        dx: Math.round((Math.random() * 2 - 1) * 160),
        dy: Math.round(-190 - Math.random() * 220),
        drift,
        dur: Math.round(1050 + Math.random() * 760),
        delay: Math.round(Math.random() * 120),
        size: Math.round(34 + Math.random() * 24),
      }
    })
    setFxBursts((prev) => [...prev, ...next].slice(-48))
    const timer = window.setTimeout(() => {
      setFxBursts((prev) => prev.filter((item) => !next.some((n) => n.id === item.id)))
    }, 2200)
    fxTimersRef.current.push(timer)
  }, [])

  const play = React.useCallback((manual = false) => {
    const frame = frameRef.current
    if (!frame) return
    if (manual) armManualIntent()
    try { frame.setAttribute('data-forum-iframe-active', '1') } catch {}
    commandExternalVideo(frame, 'play', { muted: mutedState })
    setPausedState(false)
    showCenterGlyph('pause')
    revealHud(1800)
    try {
      window.dispatchEvent(new CustomEvent('site-media-play', {
        detail: { source: normalizedKind || 'iframe', element: frame, manual: !!manual },
      }))
    } catch {}
  }, [armManualIntent, mutedState, normalizedKind, revealHud, showCenterGlyph])

  const pause = React.useCallback((manual = false) => {
    const frame = frameRef.current
    if (!frame) return
    if (manual) armManualIntent()
    commandExternalVideo(frame, 'pause')
    setPausedState(true)
    showCenterGlyph('play')
    revealHud(2600)
  }, [armManualIntent, revealHud, showCenterGlyph])

  const togglePlayPause = React.useCallback((event) => {
    try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
    if (pausedState) play(true)
    else pause(true)
  }, [pause, pausedState, play])

  const toggleMute = React.useCallback((event) => {
    try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
    const frame = frameRef.current
    if (!frame) return
    armManualIntent()
    const nextMuted = !mutedState
    setMutedState(nextMuted)
    commandExternalVideo(frame, nextMuted ? 'mute' : 'unmute')
    revealHud(2200)
    try {
      window.dispatchEvent(new CustomEvent(MEDIA_MUTED_EVENT, {
        detail: { muted: nextMuted, source: normalizedKind || 'external' },
      }))
    } catch {}
  }, [armManualIntent, mutedState, normalizedKind, revealHud])

  const isExternalControlTarget = React.useCallback((target) => {
    try { return !!target?.closest?.('button, input, a, textarea, select, [role="button"]') } catch { return false }
  }, [])

  const playWithSoundFromSurface = React.useCallback((gestureType = 'click') => {
    const frame = frameRef.current
    if (!frame) return false
    armManualIntent()
    const now = Date.now()
    try {
      frame.dataset.__surfaceGestureEvent = String(gestureType || 'unknown')
      frame.dataset.__surfaceGestureAt = String(now)
      try { frame.dataset.__surfaceGestureUserActive = navigator?.userActivation?.isActive ? '1' : '0' } catch {}
      frame.dataset.__audibleGestureUntil = String(now + 5200)
      frame.dataset.__manualLeaseUntil = String(now + 5200)
      frame.dataset.__persistMuteUntil = String(now + 4200)
      delete frame.dataset.__audibleAutoplayBlocked
      delete frame.dataset.__audibleAutoplayFallbackAt
      delete frame.dataset.__audibleAutoplayFallbackUntil
      delete frame.dataset.__audibleAutoplayFallbackPending
      delete frame.dataset.__autoplayFallbackMuted
    } catch {}
    const unmuted = commandExternalVideo(frame, 'unmute')
    const played = commandExternalVideo(frame, 'play', { muted: false })
    setMutedState(false)
    try { frame.dataset.__surfacePlayResult = unmuted && played ? 'commanded' : 'command-failed' } catch {}
    setPausedState(false)
    showCenterGlyph('pause')
    revealHud(1800)
    try {
      window.__FORUM_MEDIA_SOUND_UNLOCKED__ = true
      window.__SITE_MEDIA_SOUND_UNLOCKED__ = true
      document.documentElement.dataset.forumMediaSoundUnlocked = '1'
    } catch {}
    try { window.dispatchEvent(new CustomEvent(MEDIA_MUTED_EVENT, { detail: { muted: false, source: normalizedKind || 'external' } })) } catch {}
    try { window.dispatchEvent(new CustomEvent('site-media-play', { detail: { source: normalizedKind || 'iframe', element: frame, manual: true, gestureType } })) } catch {}
    return !!(unmuted && played)
  }, [armManualIntent, normalizedKind, revealHud, showCenterGlyph])

  const handleSurfaceTouchStart = React.useCallback((event) => {
    if (isExternalControlTarget(event?.target)) return
    const touch = event?.touches?.[0] || event?.changedTouches?.[0]
    if (!touch) return
    surfaceTouchRef.current.x = Number(touch.clientX || 0)
    surfaceTouchRef.current.y = Number(touch.clientY || 0)
    surfaceTouchRef.current.moved = false
  }, [isExternalControlTarget])

  const handleSurfaceTouchMove = React.useCallback((event) => {
    const touch = event?.touches?.[0] || event?.changedTouches?.[0]
    if (!touch) return
    const dx = Number(touch.clientX || 0) - Number(surfaceTouchRef.current.x || 0)
    const dy = Number(touch.clientY || 0) - Number(surfaceTouchRef.current.y || 0)
    if ((dx * dx) + (dy * dy) > 14 * 14) surfaceTouchRef.current.moved = true
  }, [])

  const handleSurfaceTouchEnd = React.useCallback((event) => {
    if (isExternalControlTarget(event?.target) || surfaceTouchRef.current.moved) return
    try { event?.stopPropagation?.() } catch {}
    surfaceTouchRef.current.touchHandledAt = Date.now()
    playWithSoundFromSurface('touchend')
  }, [isExternalControlTarget, playWithSoundFromSurface])

  React.useEffect(() => {
    if (!isIosSafariBrowser) return undefined
    const node = safariGestureButtonRef.current
    if (!(node instanceof HTMLElement)) return undefined

    const onTouchStart = (event) => {
      const touch = event?.touches?.[0] || event?.changedTouches?.[0]
      if (!touch) return
      surfaceTouchRef.current.x = Number(touch.clientX || 0)
      surfaceTouchRef.current.y = Number(touch.clientY || 0)
      surfaceTouchRef.current.moved = false
    }
    const onTouchMove = (event) => {
      const touch = event?.touches?.[0] || event?.changedTouches?.[0]
      if (!touch) return
      const dx = Number(touch.clientX || 0) - Number(surfaceTouchRef.current.x || 0)
      const dy = Number(touch.clientY || 0) - Number(surfaceTouchRef.current.y || 0)
      if ((dx * dx) + (dy * dy) > 14 * 14) surfaceTouchRef.current.moved = true
    }
    const onTouchEnd = (event) => {
      if (surfaceTouchRef.current.moved) return
      try { event?.stopPropagation?.() } catch {}
      surfaceTouchRef.current.touchHandledAt = Date.now()
      playWithSoundFromSurface('safari-native-touchend')
    }
    const onClick = (event) => {
      try { event?.stopPropagation?.() } catch {}
      if (Date.now() - Number(surfaceTouchRef.current.touchHandledAt || 0) < 900) return
      playWithSoundFromSurface('safari-native-click')
    }

    node.addEventListener('touchstart', onTouchStart, { passive: true })
    node.addEventListener('touchmove', onTouchMove, { passive: true })
    node.addEventListener('touchend', onTouchEnd, { passive: true })
    node.addEventListener('click', onClick)
    return () => {
      node.removeEventListener('touchstart', onTouchStart)
      node.removeEventListener('touchmove', onTouchMove)
      node.removeEventListener('touchend', onTouchEnd)
      node.removeEventListener('click', onClick)
    }
  }, [isIosSafariBrowser, playWithSoundFromSurface])

  const onGoodEmoji = React.useCallback((event) => {
    try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
    armManualIntent()
    revealHud(2300)
    spawnEmojiBurst('good')
  }, [armManualIntent, revealHud, spawnEmojiBurst])

  const onBadEmoji = React.useCallback((event) => {
    try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
    armManualIntent()
    revealHud(2300)
    spawnEmojiBurst('bad')
  }, [armManualIntent, revealHud, spawnEmojiBurst])

  const handleSurfacePointerDown = React.useCallback((event) => {
    if (isExternalControlTarget(event?.target)) return
    try { event?.stopPropagation?.() } catch {}
    revealHud(1800)
  }, [isExternalControlTarget, revealHud])

const handleSurfaceClick = React.useCallback((event) => {
  if (isExternalControlTarget(event?.target)) return
  try { event?.stopPropagation?.() } catch {}
  playWithSoundFromSurface('click')
}, [isExternalControlTarget, playWithSoundFromSurface])

const stopControlPointer = React.useCallback((event) => {
  try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
}, [])

const cleanupTimers = React.useCallback(() => {
  try {
    if (hudTimerRef.current) {
      clearTimeout(hudTimerRef.current)
      hudTimerRef.current = 0
    }
  } catch {}
  try {
    if (centerTimerRef.current) {
      clearTimeout(centerTimerRef.current)
      centerTimerRef.current = 0
    }
  } catch {}
  try {
    const timers = fxTimersRef.current.splice(0)
    timers.forEach((timer) => clearTimeout(timer))
  } catch {}
}, [])

React.useEffect(() => cleanupTimers, [cleanupTimers])

  React.useEffect(() => {
    const frame = frameRef.current
    return () => {
      const doomed = frame
      try {
        const release = () => {
          try {
            if (!(doomed instanceof HTMLIFrameElement)) return
            if (doomed.isConnected) return
            const currentSrc = doomed.getAttribute('src') || ''
            const storedSrc = doomed.getAttribute('data-src') || currentSrc
            if (storedSrc && !doomed.getAttribute('data-src')) doomed.setAttribute('data-src', storedSrc)
            doomed.removeAttribute('data-forum-iframe-active')
            doomed.removeAttribute('data-forum-iframe-loaded')
            doomed.removeAttribute('data-forum-loaded-src')
            if (currentSrc) doomed.setAttribute('src', '')
          } catch {}
        }
        window.setTimeout(release, normalizedKind === 'youtube' ? 180 : 320)
      } catch {}
    }
  }, [normalizedKind])

  React.useEffect(() => {
    const onState = (event) => {
      const detail = event?.detail || {}
      if (detail.frame !== frameRef.current) return
      if (typeof detail.paused === 'boolean') setPausedState(detail.paused)
      if (typeof detail.muted === 'boolean') setMutedState(detail.muted)
    }
    window.addEventListener(EXTERNAL_VIDEO_STATE_EVENT, onState)
    return () => window.removeEventListener(EXTERNAL_VIDEO_STATE_EVENT, onState)
  }, [])

  React.useEffect(() => {
    const onProviderMessage = (event) => {
      const frame = frameRef.current
      if (!frame || event.source !== frame.contentWindow) return
      const data = event.data
      if (data && typeof data === 'object' && data['x-tiktok-player']) {
        if (data.type === 'onStateChange') {
          if (Number(data.value) === 1) {
            setPausedState(false)
            try { frame.dataset.__externalActualPlaying = '1' } catch {}
          }
          if (Number(data.value) === 2 || Number(data.value) === 0) {
            setPausedState(true)
            try { frame.dataset.__externalActualPlaying = '0' } catch {}
          }
        }
        if (data.type === 'onMute' && typeof data.value === 'boolean') {
          setMutedState(!!data.value)
          try { frame.dataset.__externalActualMuted = data.value ? '1' : '0' } catch {}
          emitExternalVideoState(frame, { muted: !!data.value })
        }
      }
    }
    window.addEventListener('message', onProviderMessage)
    return () => window.removeEventListener('message', onProviderMessage)
  }, [])

  return (
    <div
      className={`ql7VideoSurface ql7ExternalVideoSurface ${className || ''}`.trim()}
      data-forum-external-video="1"
      data-forum-external-kind={normalizedKind}
      data-windowing-keepalive="media"
      data-forum-windowing-stable="1"
      data-stable-shell="1"
      onPointerDown={handleSurfacePointerDown}
      onTouchStartCapture={handleSurfaceTouchStart}
      onTouchMoveCapture={handleSurfaceTouchMove}
      onTouchEndCapture={handleSurfaceTouchEnd}
      onClick={handleSurfaceClick}
    >
      <iframe
        ref={frameRef}
        title={title || (normalizedKind === 'tiktok' ? 'TikTok video' : 'YouTube video')}
        id={id}
        data-yt-id={normalizedKind === 'youtube' ? videoId : undefined}
        data-tt-id={normalizedKind === 'tiktok' ? videoId : undefined}
        data-forum-media={normalizedKind}
        data-owner-id={ownerId}
        data-forum-embed-kind={normalizedKind}
        data-lifecycle-state={lifecycleState}
        data-stable-shell="1"
        data-provider-controls-disabled="1"
        data-src={src}
        loading="lazy"
        frameBorder="0"
        allow={allow}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        tabIndex={-1}
        className="ql7ExternalFrame"
onLoad={() => {
  const frame = frameRef.current
  const activeFrame = frame?.getAttribute?.('data-forum-iframe-active') === '1'
  try {
    if (frame) {
      frame.setAttribute('data-forum-iframe-loaded', '1')
      frame.setAttribute('data-forum-loaded-src', frame.getAttribute('src') || frame.getAttribute('data-src') || '')
    }
  } catch {}
  emitExternalVideoState(frame, { ready: true, muted: mutedState, paused: activeFrame ? false : pausedState })
}}
      />
      {isIosSafariBrowser ? (
        <button
          ref={safariGestureButtonRef}
          type="button"
          aria-label="Play video with sound"
          data-ios-safari-media-gesture="external"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'block',
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            border: 0,
            borderRadius: 0,
            background: 'transparent',
            appearance: 'none',
            WebkitAppearance: 'none',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'pan-y',
          }}
        />
      ) : null}

      <div
        className={`ql7ExternalProviderShield ${providerShieldVisible ? 'isVisible' : ''}`}
        aria-hidden="true"
      />

      <div className={`ql7VideoHud ${hudVisible ? 'isVisible' : ''}`}>
        <button
          type="button"
          className={`ql7VideoCenter ${centerIsVisible ? 'isVisible' : ''}`}
          onPointerDown={stopControlPointer}
          onClick={togglePlayPause}
          aria-label={pausedState ? 'Play video' : 'Pause video'}
        >
          {centerIcon === 'play' ? <IconPlay /> : <IconPause />}
        </button>

        <div className={`ql7VideoRail ${hudVisible ? 'isVisible' : ''}`}>
          <button type="button" className="ql7VideoRailBtn ql7VideoRailBtn--good" onPointerDown={stopControlPointer} onClick={onGoodEmoji} aria-label="Good reaction">
            <IconGood />
          </button>
          <button type="button" className="ql7VideoRailBtn ql7VideoRailBtn--bad" onPointerDown={stopControlPointer} onClick={onBadEmoji} aria-label="Bad reaction">
            <IconBad />
          </button>
          <button
            type="button"
            className="ql7VideoRailBtn ql7VideoRailBtn--sound"
            onPointerDown={stopControlPointer}
            onClick={toggleMute}
            aria-label={mutedState ? 'Unmute video' : 'Mute video'}
          >
            <IconVolume muted={mutedState} />
          </button>
        </div>
      </div>

      {fxBursts.length > 0 && (
        <div className="ql7VideoFxLayer" aria-hidden="true">
          {fxBursts.map((fx) => (
            <span
              key={fx.id}
              className="ql7VideoFx"
              style={{
                left: `${fx.left}px`,
                top: `${fx.top}px`,
                '--dx': `${fx.dx}px`,
                '--dy': `${fx.dy}px`,
                '--drift': fx.drift,
                '--dur': `${fx.dur}ms`,
                '--delay': `${fx.delay}ms`,
                '--size': `${fx.size}px`,
              }}
            >
              {fx.char}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
