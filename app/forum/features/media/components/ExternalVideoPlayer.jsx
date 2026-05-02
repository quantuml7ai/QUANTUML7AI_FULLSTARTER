'use client'

import React from 'react'
import { MEDIA_MUTED_EVENT } from '../utils/mediaLifecycleRuntime'
import {
  EXTERNAL_VIDEO_STATE_EVENT,
  commandExternalVideo,
  emitExternalVideoState,
} from '../utils/externalVideoBridge'
import {
  acquireTelegramVerticalSwipeLock,
  isTelegramMiniAppRuntime,
} from '../utils/telegramMiniAppSwipeLock'

const GOOD_EMOJIS = ['🔥', '✨', '🚀', '💎', '⚡', '👏', '🤩', '💯', '🫶', '🎉']
const BAD_EMOJIS = ['😶', '🤨', '🙈', '😴', '💤', '🫠', '😵', '🙃', '😬', '🧊']

// Telegram Mini App swipe guard for YouTube/TikTok iframe cards.
// Important: Telegram starts the collapse gesture before our first direction threshold can be reached,
// so the lock is armed on touchstart, then released if the gesture is clearly not a downward pull.
// Mouse, wheel, hover and desktop Chrome are untouched: this runs only from real touch events.
const TELEGRAM_EXTERNAL_TOUCH_SWIPE_GUARD_ENABLED = true
const TELEGRAM_EXTERNAL_TOUCH_SWIPE_DIRECTION_RELEASE_PX = 16
const TELEGRAM_EXTERNAL_TOUCH_SWIPE_UNLOCK_DELAY_MS = 420

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
  const surfaceRef = React.useRef(null)
  const telegramSwipeReleaseRef = React.useRef(null)
  const telegramSwipeLockKeyRef = React.useRef(Symbol('ql7-external-video-touch-swipe'))
  const touchStartPointRef = React.useRef({ x: 0, y: 0 })
  const touchSwipeLockedRef = React.useRef(false)  
  const hudTimerRef = React.useRef(0)
  const centerTimerRef = React.useRef(0)
  const fxTimersRef = React.useRef([])
  const fxSeqRef = React.useRef(0)
  const [hudVisible, setHudVisible] = React.useState(false)
  const [pausedState, setPausedState] = React.useState(true)
  const [mutedState, setMutedState] = React.useState(true)
  const [centerGlyph, setCenterGlyph] = React.useState('play')
  const [fxBursts, setFxBursts] = React.useState([])
  const [telegramTouchSwipeGuardActive, setTelegramTouchSwipeGuardActive] = React.useState(false)
  
  const normalizedKind = String(kind || '').toLowerCase()
  const isExternalProvider = normalizedKind === 'youtube' || normalizedKind === 'tiktok'
  const centerIsVisible = pausedState || !!centerGlyph || hudVisible
  const centerIcon = pausedState ? 'play' : (centerGlyph || 'pause')
  const providerShieldVisible = isExternalProvider && pausedState
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
    try { event?.stopPropagation?.() } catch {}
    revealHud(1800)
  }, [revealHud])

const handleSurfaceClick = React.useCallback((event) => {
  try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
  revealHud(1800)
}, [revealHud])

const stopControlPointer = React.useCallback((event) => {
  try { event?.preventDefault?.(); event?.stopPropagation?.() } catch {}
}, [])

const lockTelegramSwipeForTouchScroll = React.useCallback(() => {
  if (!TELEGRAM_EXTERNAL_TOUCH_SWIPE_GUARD_ENABLED) return
  if (!isExternalProvider) return
  if (!isTelegramMiniAppRuntime()) return
  if (telegramSwipeReleaseRef.current) return

  telegramSwipeReleaseRef.current = acquireTelegramVerticalSwipeLock(telegramSwipeLockKeyRef.current, {
    restoreDelayMs: TELEGRAM_EXTERNAL_TOUCH_SWIPE_UNLOCK_DELAY_MS,
  })
}, [isExternalProvider])

const releaseTelegramSwipeForTouchScroll = React.useCallback(() => {
  const release = telegramSwipeReleaseRef.current
  telegramSwipeReleaseRef.current = null
  try { release?.() } catch {}
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
  try {
    const release = telegramSwipeReleaseRef.current
    telegramSwipeReleaseRef.current = null
    release?.()
  } catch {}  
}, [])

  React.useEffect(() => {
    // Keep listeners mounted for external providers even if Telegram.WebApp arrives a little late.
    // The actual swipe lock still checks isTelegramMiniAppRuntime(), so normal browsers stay untouched.    
    setTelegramTouchSwipeGuardActive(
      TELEGRAM_EXTERNAL_TOUCH_SWIPE_GUARD_ENABLED && isExternalProvider
    )
  }, [isExternalProvider])

  React.useEffect(() => {
    const node = surfaceRef.current
    if (!node || !telegramTouchSwipeGuardActive) return undefined

const resetTouchGesture = () => {
  touchStartPointRef.current = { x: 0, y: 0 }
  touchSwipeLockedRef.current = false
  touchDirectionResolvedRef.current = false
  releaseTelegramSwipeForTouchScroll()
}

const onTouchStart = (event) => {
  const touch = event?.touches?.[0]
  if (!touch) return
  touchStartPointRef.current = { x: Number(touch.clientX) || 0, y: Number(touch.clientY) || 0 }
  touchSwipeLockedRef.current = true
  touchDirectionResolvedRef.current = false

  // Telegram decides whether to collapse Mini App immediately at the beginning of the gesture.
  // Waiting until touchmove/down-threshold is too late, so we arm the official Telegram lock here.
  // This is still touch-only and Telegram-only; it never handles mouse wheel or desktop hover.
  lockTelegramSwipeForTouchScroll()
}

const onTouchMove = (event) => {
  const touch = event?.touches?.[0]
  if (!touch || !touchSwipeLockedRef.current || touchDirectionResolvedRef.current) return

  const start = touchStartPointRef.current || { x: 0, y: 0 }
  const dx = Math.abs((Number(touch.clientX) || 0) - start.x)
  const dy = (Number(touch.clientY) || 0) - start.y
  const absDy = Math.abs(dy)
  const threshold = TELEGRAM_EXTERNAL_TOUCH_SWIPE_DIRECTION_RELEASE_PX

  if (Math.max(dx, absDy) < threshold) return

  touchDirectionResolvedRef.current = true
  // Keep the lock for a real downward pull.
  if (dy > 0 && dy > dx * 0.7) return

  // Not a downward pull: release immediately so ordinary Telegram gestures remain native.
  touchSwipeLockedRef.current = false
  releaseTelegramSwipeForTouchScroll()
}

    try { node.addEventListener('touchstart', onTouchStart, { passive: true }) } catch {}
    try { node.addEventListener('touchmove', onTouchMove, { passive: true }) } catch {}
    try { node.addEventListener('touchend', resetTouchGesture, { passive: true }) } catch {}
    try { node.addEventListener('touchcancel', resetTouchGesture, { passive: true }) } catch {}

    return () => {
      try { node.removeEventListener('touchstart', onTouchStart) } catch {}
      try { node.removeEventListener('touchmove', onTouchMove) } catch {}
      try { node.removeEventListener('touchend', resetTouchGesture) } catch {}
      try { node.removeEventListener('touchcancel', resetTouchGesture) } catch {}
     resetTouchGesture()
    }
  }, [lockTelegramSwipeForTouchScroll, releaseTelegramSwipeForTouchScroll, telegramTouchSwipeGuardActive])

React.useEffect(() => cleanupTimers, [cleanupTimers])

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
          if (Number(data.value) === 1) setPausedState(false)
          if (Number(data.value) === 2 || Number(data.value) === 0) setPausedState(true)
        }
        if (data.type === 'onMute' && typeof data.value === 'boolean') {
          setMutedState(!!data.value)
          emitExternalVideoState(frame, { muted: !!data.value })
        }
      }
    }
    window.addEventListener('message', onProviderMessage)
    return () => window.removeEventListener('message', onProviderMessage)
  }, [])

  return (
    <div
      ref={surfaceRef}
      className={`ql7VideoSurface ql7ExternalVideoSurface ${className || ''}`.trim()}
      data-forum-external-video="1"
      data-forum-external-kind={normalizedKind}
      data-tma-touch-swipe-guard={telegramTouchSwipeGuardActive ? '1' : undefined}
      onPointerDown={handleSurfacePointerDown}
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
  try {
    if (frame) {
      frame.setAttribute('data-forum-iframe-loaded', '1')
      frame.setAttribute('data-forum-loaded-src', frame.getAttribute('src') || frame.getAttribute('data-src') || '')
    }
  } catch {}
  emitExternalVideoState(frame, { ready: true, muted: mutedState, paused: pausedState })
}}
      />
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
