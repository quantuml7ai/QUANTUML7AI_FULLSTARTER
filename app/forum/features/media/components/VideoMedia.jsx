'use client'

import React from 'react'

const GOOD_EMOJIS = ['🔥', '✨', '🚀', '💎', '⚡', '👏', '🤩', '💯', '🫶', '🎉']
const BAD_EMOJIS = ['😶', '🤨', '🙈', '😴', '💤', '🫠', '😵', '🙃', '😬', '🧊']

function Ql7IconPlay(props) {
  return (
    <svg className="ql7Glyph ql7Glyph--play" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <style>{`
        .ql7Glyph--play .triWrap,
        .ql7Glyph--play .wordWrap,
        .ql7Glyph--play .dust{ transform-box: fill-box; transform-origin: center; }
        .ql7Glyph--play .triWrap{ animation: ql7TriPhase 2.7s ease-in-out infinite; }
        .ql7Glyph--play .triFill{
          animation: ql7TriShake 2.7s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ql7Glyph--play .triStroke{ animation: ql7TriStrokePulse 2.7s ease-in-out infinite; }
        .ql7Glyph--play .wordWrap{ animation: ql7WordPhase 2.7s ease-in-out infinite; }
        .ql7Glyph--play .dust circle{
          animation: ql7DustBurst 2.7s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .ql7Glyph--play .dust circle:nth-child(2){ animation-delay: .05s; }
        .ql7Glyph--play .dust circle:nth-child(3){ animation-delay: .09s; }
        .ql7Glyph--play .dust circle:nth-child(4){ animation-delay: .13s; }
        @keyframes ql7TriPhase {
          0%,38% { opacity:1; transform: translateY(0) scale(1); }
          10% { transform: translateY(-0.5px) scale(1.03); }
          16% { transform: translateY(0.4px) translateX(-0.16px) scale(.99); }
          22% { transform: translateY(-0.35px) translateX(0.15px) scale(1.01); }
          40% { opacity:0; transform: scale(.72) rotate(-12deg); }
          100% { opacity:0; transform: scale(.72) rotate(-12deg); }
        }
        @keyframes ql7TriShake {
          0%,6%,34%,100% { transform: translate(0,0); }
          8% { transform: translate(-0.18px,-0.32px) rotate(-0.8deg); }
          12% { transform: translate(0.16px,0.14px) rotate(0.8deg); }
          18% { transform: translate(-0.14px,0.22px) rotate(-0.7deg); }
          24% { transform: translate(0.2px,-0.22px) rotate(0.9deg); }
        }
        @keyframes ql7TriStrokePulse {
          0%,38% { opacity:.95; }
          18% { opacity:1; }
          40%,100% { opacity:0; }
        }
        @keyframes ql7WordPhase {
          0%,36% { opacity:0; transform: scale(.84) translateY(1px); }
          46%,78% { opacity:1; transform: scale(1) translateY(0); }
          88%,100% { opacity:0; transform: scale(1.06) translateY(-.4px); }
        }
        @keyframes ql7DustBurst {
          0%,34% { opacity:0; transform: translate(0,0) scale(.4); }
          42% { opacity:.9; transform: translate(0,0) scale(1); }
          54% { opacity:.65; }
          70%,100% { opacity:0; transform: translate(var(--dx), var(--dy)) scale(.2); }
        }
      `}</style>
      <g className="dust" opacity="0.92">
        <circle cx="12" cy="12" r="0.8" fill="rgba(130,220,255,.96)" style={{ '--dx': '-4px', '--dy': '-3px' }} />
        <circle cx="12" cy="12" r="0.6" fill="rgba(255,128,220,.92)" style={{ '--dx': '4px', '--dy': '-2px' }} />
        <circle cx="12" cy="12" r="0.56" fill="rgba(255,255,255,.84)" style={{ '--dx': '-3px', '--dy': '3px' }} />
        <circle cx="12" cy="12" r="0.48" fill="rgba(122,236,255,.96)" style={{ '--dx': '3px', '--dy': '2px' }} />
      </g>
      <g className="triWrap">
        <path
          className="triStroke"
          d="M10.7 10.2L15.2 12L10.7 13.8Z"
          fill="none"
          stroke="rgba(227,248,255,.98)"
          strokeWidth="1"
          transform="translate(12 12) scale(2) translate(-12 -12)"
        />
        <path
          className="triFill"
          d="M10.7 10.2L15.2 12L10.7 13.8Z"
          fill="currentColor"
          opacity="0.93"
          transform="translate(12 12) scale(1.82) translate(-12 -12)"
        />
      </g>
      <g className="wordWrap" aria-hidden="true">
        <text x="12" y="13.4" textAnchor="middle" fill="rgba(255,255,255,.96)" fontSize="4.25" fontWeight="800" letterSpacing=".8">
          PLAY
        </text>
      </g>
    </svg>
  )
}

function Ql7IconPause(props) {
  return (
    <svg className="ql7Glyph ql7Glyph--pause" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <style>{`
        .ql7Glyph--pause .ring{
          stroke: currentColor;
          stroke-width: 1.2;
          animation: ql7PauseRing 1.9s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ql7Glyph--pause .bar{
          fill: currentColor;
          animation: ql7PauseBar 1.4s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ql7Glyph--pause .bar.r{ animation-delay: .17s; }
        .ql7Glyph--pause .spark{
          fill: rgba(130,220,255,.95);
          animation: ql7PauseSpark 1.9s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes ql7PauseRing{
          0%,100%{ opacity:.55; transform: scale(.92); }
          50%{ opacity:.95; transform: scale(1.04); }
        }
        @keyframes ql7PauseBar{
          0%,100%{ opacity:.72; transform: scaleY(.9); }
          50%{ opacity:1; transform: scaleY(1.08); }
        }
        @keyframes ql7PauseSpark{
          0%,100%{ opacity:.2; transform: scale(.68); }
          50%{ opacity:1; transform: scale(1.12); }
        }
      `}</style>
      <circle className="ring" cx="12" cy="12" r="7.2" />
      <rect className="bar l" x="8.1" y="7.2" width="2.6" height="9.6" rx="1.3" />
      <rect className="bar r" x="13.3" y="7.2" width="2.6" height="9.6" rx="1.3" />
      <circle className="spark" cx="18.4" cy="7" r="0.75" />
    </svg>
  )
}

function Ql7IconVolume({ muted = false, ...props }) {
  return (
    <svg className="ql7Glyph ql7Glyph--sound" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <style>{`
        .ql7Glyph--sound .speaker{
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linejoin: round;
          fill: none;
        }
        .ql7Glyph--sound .wave{
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          animation: ql7SoundWave 1.65s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        .ql7Glyph--sound .wave.w2{ animation-delay: .1s; }
        .ql7Glyph--sound .muteX{
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          animation: ql7MuteX .9s ease-out;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes ql7SoundWave{
          0%,100%{ opacity:.34; transform: scaleY(.84); }
          50%{ opacity:1; transform: scaleY(1.08); }
        }
        @keyframes ql7MuteX{
          0%{ opacity:0; transform: scale(.65) rotate(-12deg); }
          100%{ opacity:1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
      <path
        className="speaker"
        d="M4.4 9.8C4.4 9.14 4.94 8.6 5.6 8.6H8.45L12.42 5.4C13.12 4.82 14.2 5.32 14.2 6.23V17.76C14.2 18.68 13.12 19.17 12.42 18.6L8.45 15.4H5.6C4.94 15.4 4.4 14.86 4.4 14.2V9.8Z"
      />
      {!muted && (
        <>
          <path className="wave w1" d="M16.7 9.45C17.55 10.12 18.1 11.1 18.1 12.2C18.1 13.29 17.55 14.28 16.7 14.95" />
          <path className="wave w2" d="M19 7.3C20.43 8.42 21.35 10.22 21.35 12.2C21.35 14.18 20.43 15.98 19 17.1" />
        </>
      )}
      {muted && (
        <>
          <path className="muteX" d="M18.2 9.7L21.8 13.3" />
          <path className="muteX" d="M21.8 9.7L18.2 13.3" />
        </>
      )}
    </svg>
  )
}

function Ql7IconGood(props) {
  return (
    <svg className="ql7Glyph ql7Glyph--good" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <style>{`
        .ql7Glyph--good .ring{
          stroke: currentColor;
          stroke-width: 1.3;
          animation: ql7GoodRing 2.1s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ql7Glyph--good .core{
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          animation: ql7GoodPulse 1.5s ease-in-out infinite;
        }
        .ql7Glyph--good .beam{
          stroke: rgba(130,220,255,.95);
          stroke-width: 1.8;
          stroke-linecap: round;
          animation: ql7GoodBeam 1.9s linear infinite;
        }
        @keyframes ql7GoodRing{
          0%,100%{ opacity:.44; transform: scale(.9); }
          50%{ opacity:.98; transform: scale(1.04); }
        }
        @keyframes ql7GoodPulse{
          0%,100%{ opacity:.78; transform: scale(.95); }
          50%{ opacity:1; transform: scale(1.08); }
        }
        @keyframes ql7GoodBeam{
          0%{ opacity:0; transform: translateX(-7px); }
          28%{ opacity:.95; }
          100%{ opacity:0; transform: translateX(7px); }
        }
      `}</style>
      <circle className="ring" cx="12" cy="12" r="7.6" />
      <path className="core" d="M9.1 13.2L12 10.2L14.9 13.2M12 16.1V10.3" />
      <path className="beam" d="M6.3 7.35H9.2" />
    </svg>
  )
}

function Ql7IconBad(props) {
  return (
    <svg className="ql7Glyph ql7Glyph--bad" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <style>{`
        .ql7Glyph--bad .hex{
          stroke: currentColor;
          stroke-width: 1.3;
          animation: ql7BadHex 2.05s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ql7Glyph--bad .cross{
          stroke: currentColor;
          stroke-width: 1.9;
          stroke-linecap: round;
          animation: ql7BadCross 1.35s ease-in-out infinite;
          transform-box: fill-box;
          transform-origin: center;
        }
        .ql7Glyph--bad .spark{
          fill: rgba(255,136,220,.92);
          animation: ql7BadSpark 2.05s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes ql7BadHex{
          0%,100%{ opacity:.46; transform: scale(.9); }
          50%{ opacity:.97; transform: scale(1.03); }
        }
        @keyframes ql7BadCross{
          0%,100%{ opacity:.72; transform: scale(.9) rotate(-6deg); }
          50%{ opacity:1; transform: scale(1.08) rotate(0deg); }
        }
        @keyframes ql7BadSpark{
          0%,100%{ opacity:.16; transform: scale(.72); }
          48%{ opacity:.98; transform: scale(1.14); }
        }
      `}</style>
      <path className="hex" d="M8 5.9H16L20 12L16 18.1H8L4 12L8 5.9Z" />
      <path className="cross" d="M9.2 9.2L14.8 14.8M14.8 9.2L9.2 14.8" />
      <circle className="spark" cx="17.8" cy="6.7" r="0.78" />
    </svg>
  )
}

export default function VideoMedia({
  src,
  poster,
  className,
  style,
  preload = 'none',
  playsInline = true,
  controlsList,
  disablePictureInPicture,
  controls,
  autoPlay,
  loop,
  defaultMuted: defaultMutedProp,
  onError: onErrorProp,
  onPointerDown: onPointerDownProp,
  'data-forum-media': dataForumMedia,
  'data-forum-video': dataForumVideo,
  readMutedPref,
  writeMutedPref,
  mutedEventName,
  restoreVideoEl,
  touchActiveVideo,
  enforceActiveVideoCap,
  isVideoNearViewport,
  mediaVisMarginPx,
  dropActiveVideo,
  unloadVideoEl,
  ...rest
}) {
  const ref = React.useRef(null)
  const recoverTimerRef = React.useRef(0)
  const mediaKeyRef = React.useRef('')
  const controlsTimerRef = React.useRef(0)
  const centerIconTimerRef = React.useRef(0)
  const fxTimersRef = React.useRef([])
  const fxIdRef = React.useRef(0)
  const [hudVisible, setHudVisible] = React.useState(false)
  const [pausedState, setPausedState] = React.useState(true)
  const [mutedState, setMutedState] = React.useState(true)
  const [centerGlyph, setCenterGlyph] = React.useState('')
  const [fxBursts, setFxBursts] = React.useState([])
  const mutedEvent = String(mutedEventName || 'forum:media-mute')
  const mediaVisMargin = Number.isFinite(Number(mediaVisMarginPx)) ? Number(mediaVisMarginPx) : 380
  const preloadMode = String(preload || 'none').trim().toLowerCase() || 'none'
const isPostVideo = String(dataForumVideo || '') === 'post'
const coordinatorOwnsLifecycle = !!String(dataForumMedia || '').trim()
const coordinatorOwnsPostLifecycle = isPostVideo && coordinatorOwnsLifecycle
const posterSrc = typeof poster === 'string' ? poster.trim() : ''
const renderControls = isPostVideo ? false : controls
const renderPreload = isPostVideo ? 'metadata' : preload

  const readMuted = React.useCallback(() => {
    try {
      return typeof readMutedPref === 'function' ? readMutedPref() : null
    } catch {
      return null
    }
  }, [readMutedPref])

const writeMuted = React.useCallback(
  (nextMuted, source = 'video', emit = true) => {
    try {
      if (typeof writeMutedPref === 'function') writeMutedPref(!!nextMuted, source, emit)
    } catch {}
  },
  [writeMutedPref],
)

  const restoreVideoElFn = React.useCallback(
    (el) => {
      try {
        if (typeof restoreVideoEl === 'function') restoreVideoEl(el)
      } catch {}
    },
    [restoreVideoEl],
  )

  const touchActiveVideoFn = React.useCallback(
    (el) => {
      try {
        if (typeof touchActiveVideo === 'function') touchActiveVideo(el)
      } catch {}
    },
    [touchActiveVideo],
  )

  const enforceActiveVideoCapFn = React.useCallback(
    (el) => {
      try {
        if (typeof enforceActiveVideoCap === 'function') enforceActiveVideoCap(el)
      } catch {}
    },
    [enforceActiveVideoCap],
  )

  const isVideoNearViewportFn = React.useCallback(
    (el, marginPx) => {
      try {
        if (typeof isVideoNearViewport === 'function') return !!isVideoNearViewport(el, marginPx)
      } catch {}
      return false
    },
    [isVideoNearViewport],
  )

  const dropActiveVideoFn = React.useCallback(
    (el) => {
      try {
        if (typeof dropActiveVideo === 'function') dropActiveVideo(el)
      } catch {}
    },
    [dropActiveVideo],
  )

  const unloadVideoElFn = React.useCallback(
    (el) => {
      try {
        if (typeof unloadVideoEl === 'function') unloadVideoEl(el)
      } catch {}
    },
    [unloadVideoEl],
  )

  const clearUiTimers = React.useCallback(() => {
    try {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    } catch {}
    controlsTimerRef.current = 0
    try {
      if (centerIconTimerRef.current) clearTimeout(centerIconTimerRef.current)
    } catch {}
    centerIconTimerRef.current = 0
    try {
      fxTimersRef.current.forEach((id) => {
        try { clearTimeout(id) } catch {}
      })
    } catch {}
    fxTimersRef.current = []
  }, [])

  const clearNativeControlsForPost = React.useCallback(() => {
    if (!isPostVideo) return
    const el = ref.current
    if (!el) return
    try { el.controls = false } catch {}
    try { el.removeAttribute('controls') } catch {}
    try { el.disablePictureInPicture = true } catch {}
    try { el.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback nofullscreen') } catch {}
  }, [isPostVideo])

  const armUserIntentLease = React.useCallback((leaseMs = 2600) => {
    const el = ref.current
    if (!el?.dataset) return
    const now = Date.now()
    try { el.dataset.__userGestureUntil = String(now + Math.max(1000, Number(leaseMs || 0))) } catch {}
    try { el.dataset.__manualLeaseUntil = String(now + Math.max(2200, Number(leaseMs || 0) + 600)) } catch {}
    try { delete el.dataset.__userPaused } catch {}
    try { delete el.dataset.__suppressedPlayUntil } catch {}
  }, [])

  const revealHud = React.useCallback((ms = 2100) => {
    setHudVisible(true)
    try {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    } catch {}
    controlsTimerRef.current = window.setTimeout(() => {
      controlsTimerRef.current = 0
      const el = ref.current
      if (!el) return
      if (!el.paused) setHudVisible(false)
    }, Math.max(700, Number(ms || 0)))
  }, [])

  const showCenterGlyph = React.useCallback((kind, ms = 760) => {
    setCenterGlyph(String(kind || ''))
    try {
      if (centerIconTimerRef.current) clearTimeout(centerIconTimerRef.current)
    } catch {}
    centerIconTimerRef.current = window.setTimeout(() => {
      centerIconTimerRef.current = 0
      const el = ref.current
      if (el && el.paused) {
        setCenterGlyph('play')
        return
      }
      setCenterGlyph('')
    }, Math.max(300, Number(ms || 0)))
  }, [])

  const spawnEmojiBurst = React.useCallback((kind) => {
    const source = kind === 'good' ? GOOD_EMOJIS : BAD_EMOJIS
    const count = 30
    const vw = Number(window?.innerWidth || 0)
    const vh = Number(window?.innerHeight || 0)
    const safeVw = Math.max(360, vw)
    const safeVh = Math.max(520, vh)
    const minX = safeVw * 0.08
    const maxX = safeVw * 0.92
    const minY = safeVh * 0.22
    const maxY = safeVh * 0.86
    const next = Array.from({ length: count }).map((_, idx) => {
      const id = `fx_${Date.now()}_${fxIdRef.current++}_${idx}`
      const dx = Math.round((Math.random() - 0.5) * (safeVw * 0.95))
      const dy = -Math.round((safeVh * 0.32) + Math.random() * (safeVh * 0.66))
      const drift = (Math.random() - 0.5).toFixed(3)
      const delay = Math.round(Math.random() * 260)
      const dur = 980 + Math.round(Math.random() * 1420)
      const size = 30 + Math.round(Math.random() * 34)
      return {
        id,
        char: source[Math.floor(Math.random() * source.length)],
        left: Math.round(minX + Math.random() * (maxX - minX)),
        top: Math.round(minY + Math.random() * (maxY - minY)),
        dx,
        dy,
        drift,
        delay,
        dur,
        size,
      }
    })
    setFxBursts((prev) => [...prev, ...next])
    next.forEach((item) => {
      const tid = window.setTimeout(() => {
        setFxBursts((prev) => prev.filter((fx) => fx.id !== item.id))
      }, item.dur + item.delay + 140)
      fxTimersRef.current.push(tid)
    })
  }, [])

React.useLayoutEffect(() => {
  const el = ref.current
  if (!el) return

  const s = String(src || '')
  const mediaKey = s
  const prevMediaKey = String(mediaKeyRef.current || '')
  const isNewMediaNode = prevMediaKey !== mediaKey

  mediaKeyRef.current = mediaKey
  el.dataset.__src = s

  try {
    if (s) el.setAttribute('data-src', s)
    else el.removeAttribute('data-src')
  } catch {}

  try {
    const wantsWarm =
      el.dataset?.__prewarm === '1' ||
      el.dataset?.__active === '1' ||
      el.dataset?.__resident === '1'

    const effectivePreload =
      isPostVideo
        ? (wantsWarm ? 'auto' : 'metadata')
        : (wantsWarm && preloadMode === 'none' ? 'auto' : preloadMode)

    el.preload = effectivePreload
  } catch {}

  clearNativeControlsForPost()

  try {
    if (playsInline) {
      el.setAttribute('playsinline', '')
      el.setAttribute('webkit-playsinline', '')
    }
  } catch {}

  try {
    const initialMuted = readMuted()
    const fallbackMuted =
      typeof defaultMutedProp === 'boolean'
        ? defaultMutedProp
        : (isPostVideo ? true : !!autoPlay)

    const nextMuted = typeof initialMuted === 'boolean' ? initialMuted : fallbackMuted

    el.muted = !!nextMuted
    el.defaultMuted = !!nextMuted
    if (nextMuted) el.setAttribute('muted', '')
    else el.removeAttribute('muted')
    setMutedState(!!nextMuted)
  } catch {}

  if (isNewMediaNode) {
    try {
      delete el.dataset.__resumeTime
      delete el.dataset.__candidateBoostTs
      delete el.dataset.__recoverTry
      delete el.dataset.__readyRetryCount
      delete el.dataset.__loadPendingSince
      delete el.dataset.__userPaused
      delete el.dataset.__userPausedAt
      delete el.dataset.__suppressedPlayUntil
      delete el.dataset.__manualLeaseUntil
      delete el.dataset.__userGestureUntil
      delete el.dataset.__autoplayFallbackMuted
      delete el.dataset.__skipMutePersistUntil
      delete el.dataset.__persistMuteUntil
      delete el.dataset.__lastManualMuteTs
      delete el.dataset.__bootAttachedSrc
      delete el.dataset.__bootMetadataPrimed
    } catch {}
  }

try {
  // Для post-video больше НЕ делаем eager attach/load на mount.
  // Единственный владелец lifecycle — coordinator.
  if (isNewMediaNode && isPostVideo) {
    try { el.removeAttribute('src') } catch {}
    try { delete el.dataset.__bootAttachedSrc } catch {}
    try { delete el.dataset.__bootMetadataPrimed } catch {}
    try { el.dataset.__loadPending = '0' } catch {}
    try { el.dataset.__warmReady = '0' } catch {}
    try { el.dataset.__active = '0' } catch {}
    try { el.dataset.__prewarm = '0' } catch {}
    try { el.dataset.__resident = '0' } catch {}
    try { delete el.dataset.__loadPendingSince } catch {}
    try { el.preload = 'metadata' } catch {}

    try {
      if (posterSrc) {
        el.setAttribute('data-poster', posterSrc)
        if (!el.getAttribute('poster')) el.setAttribute('poster', posterSrc)
      }
    } catch {}
  }
} catch {}
}, [
  autoPlay,
  clearNativeControlsForPost,
  defaultMutedProp,
  isPostVideo,
  playsInline,
  posterSrc,
  preloadMode,
  readMuted,
  src,
])
React.useEffect(() => {
  const el = ref.current
  if (!el) return undefined

  const syncFromMedia = () => {
    const isPausedNow = !!el.paused
    setPausedState(isPausedNow)
    if (isPausedNow) {
      setHudVisible(true)
      setCenterGlyph('play')
    } else if (!hudVisible) {
      setCenterGlyph('')
    }
  }

  const onPlay = () => {
    clearNativeControlsForPost()

    if (!coordinatorOwnsPostLifecycle) {
      try {
        el.dataset.__loadPending = '0'
        el.dataset.__warmReady = '1'
        delete el.dataset.__loadPendingSince
      } catch {}
    }

    if (!coordinatorOwnsLifecycle) {
      try { touchActiveVideoFn(el) } catch {}
      try { enforceActiveVideoCapFn(el) } catch {}
      try {
        el.dataset.__active = '1'
        el.dataset.__prewarm = '1'
        el.dataset.__resident = '1'
        el.preload = 'auto'
      } catch {}
    }

    setPausedState(false)
    showCenterGlyph('pause', 620)
    revealHud(1800)
  }

  const onPause = () => {
    clearNativeControlsForPost()
    setPausedState(true)
    setHudVisible(true)
    setCenterGlyph('play')
  }

  const onEnded = () => {
    setPausedState(true)
    setHudVisible(true)
    setCenterGlyph('play')
  }

  syncFromMedia()
  try { el.addEventListener('play', onPlay) } catch {}
  try { el.addEventListener('pause', onPause) } catch {}
  try { el.addEventListener('ended', onEnded) } catch {}

  return () => {
    try { el.removeEventListener('play', onPlay) } catch {}
    try { el.removeEventListener('pause', onPause) } catch {}
    try { el.removeEventListener('ended', onEnded) } catch {}
  }
}, [
  clearNativeControlsForPost,
  coordinatorOwnsLifecycle,
  coordinatorOwnsPostLifecycle,
  enforceActiveVideoCapFn,
  hudVisible,
  revealHud,
  showCenterGlyph,
  touchActiveVideoFn,
])

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

const initial = readMuted()
const fallbackMuted =
  typeof defaultMutedProp === 'boolean'
    ? defaultMutedProp
    : (isPostVideo ? true : !!autoPlay)
const nextMuted = typeof initial === 'boolean' ? initial : fallbackMuted
    try {
      el.muted = !!nextMuted
      el.defaultMuted = !!nextMuted
      if (nextMuted) el.setAttribute('muted', '')
      else el.removeAttribute('muted')
      setMutedState(!!nextMuted)
    } catch {}

const onVol = () => {
  try {
    const m = !!el.muted
    setMutedState(m)
    const skipPersistUntil = Number(el?.dataset?.__skipMutePersistUntil || 0)
    const persistUntil = Number(el?.dataset?.__persistMuteUntil || 0)
    const now = Date.now()
    if (skipPersistUntil <= now && persistUntil > now) {
      writeMuted(m, 'video', true)
    }
  } catch {}
}

    const onMutedEvent = (e) => {
      try {
        if (!ref.current) return
        const m = e?.detail?.muted
        if (typeof m !== 'boolean') return
        try { ref.current.dataset.__skipMutePersistUntil = String(Date.now() + 1500) } catch {}
        if (ref.current.muted !== m) ref.current.muted = m
        ref.current.defaultMuted = m
        if (m) ref.current.setAttribute('muted', '')
        else ref.current.removeAttribute('muted')
        setMutedState(m)
      } catch {}
    }

    try {
      el.dataset.__mid = el.dataset.__mid || `v_${Math.random().toString(36).slice(2)}`
    } catch {}

    try {
      el.addEventListener('volumechange', onVol)
    } catch {}
    window.addEventListener(mutedEvent, onMutedEvent)

    return () => {
      try {
        el.removeEventListener('volumechange', onVol)
      } catch {}
      window.removeEventListener(mutedEvent, onMutedEvent)
    }
  }, [autoPlay, defaultMutedProp, isPostVideo, mutedEvent, readMuted, writeMuted])

React.useEffect(() => {
  const el = ref.current
  if (!el) return

  const leafMayWriteLifecycle = !coordinatorOwnsPostLifecycle

  const markPending = () => {
    if (!leafMayWriteLifecycle) return
    try {
      el.dataset.__loadPending = '1'
      el.dataset.__warmReady = '0'
      el.dataset.__loadPendingSince = String(Date.now())
    } catch {}
  }

  const markReady = () => {
    if (!leafMayWriteLifecycle) return
    try {
      const hasAttachedSrc = !!String(el.getAttribute('src') || el.currentSrc || '')
      el.dataset.__loadPending = '0'
      el.dataset.__warmReady = hasAttachedSrc ? '1' : '0'
      delete el.dataset.__loadPendingSince
      delete el.dataset.__readyRetryCount
    } catch {}
  }

  const markCold = () => {
    if (!leafMayWriteLifecycle) return
    try {
      el.dataset.__loadPending = '0'
      el.dataset.__warmReady = '0'
      delete el.dataset.__loadPendingSince
    } catch {}
  }

  try { el.addEventListener('loadstart', markPending) } catch {}
  try { el.addEventListener('loadeddata', markReady) } catch {}
  try { el.addEventListener('canplay', markReady) } catch {}
  try { el.addEventListener('playing', markReady) } catch {}
  try { el.addEventListener('abort', markCold) } catch {}
  try { el.addEventListener('emptied', markCold) } catch {}
  try { el.addEventListener('error', markCold) } catch {}

  return () => {
    try { el.removeEventListener('loadstart', markPending) } catch {}
    try { el.removeEventListener('loadeddata', markReady) } catch {}
    try { el.removeEventListener('canplay', markReady) } catch {}
    try { el.removeEventListener('playing', markReady) } catch {}
    try { el.removeEventListener('abort', markCold) } catch {}
    try { el.removeEventListener('emptied', markCold) } catch {}
    try { el.removeEventListener('error', markCold) } catch {}
  }
}, [coordinatorOwnsPostLifecycle])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    let io = null
    if (dataForumVideo === 'post' || coordinatorOwnsLifecycle) {
      return () => {
        try {
          if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current)
        } catch {}
        recoverTimerRef.current = 0
      }
    }

    let active = false
    let unloadTimer = null
    const warmKeepMargin = Math.max(760, Math.round(mediaVisMargin * 2.45))
    const runtimeProfile = (() => {
      try {
        const ua = String(navigator?.userAgent || '')
        const isIOS = /iP(hone|ad|od)/i.test(ua)
        const isAndroid = /Android/i.test(ua)
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
        const dm = Number(navigator?.deviceMemory || 0)
        const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
        if (isIOS) return { unloadDelayMs: 3800, hardUnloadOnInactive: false }
        if (lowMem) return { unloadDelayMs: 2800, hardUnloadOnInactive: true }
        if (isAndroid || coarse) return { unloadDelayMs: 4400, hardUnloadOnInactive: false }
        return { unloadDelayMs: 5200, hardUnloadOnInactive: false }
      } catch {
        return { unloadDelayMs: 3800, hardUnloadOnInactive: false }
      }
    })()

    const shouldKeepWarmResident = () => {
      try {
        if (!el?.isConnected) return false
        const warmFlag = el.dataset?.__prewarm === '1'
        if (warmFlag) return true
        if (el.dataset?.__loadPending === '1') return true
        return isVideoNearViewportFn(el, warmKeepMargin)
      } catch {
        return false
      }
    }

    const setActive = (v) => {
      const next = !!v
      if (next === active) return
      active = next
      if (active) {
        if (unloadTimer) {
          try {
            clearTimeout(unloadTimer)
          } catch {}
          unloadTimer = null
        }

        restoreVideoElFn(el)
        touchActiveVideoFn(el)
        enforceActiveVideoCapFn(el)
        try {
          el.dataset.__active = '1'
          el.dataset.__prewarm = '1'
          el.preload = 'auto'
          if (
            (el.readyState === 0 || !el.currentSrc) &&
            el.dataset?.__loadPending !== '1' &&
            el.paused &&
            (el.currentTime === 0)
          ) {
            el.load?.()
          }
        } catch {}
      } else {
        if (unloadTimer) {
          try {
            clearTimeout(unloadTimer)
          } catch {}
          unloadTimer = null
        }
        unloadTimer = setTimeout(() => {
          unloadTimer = null
          if (active) return
          if (shouldKeepWarmResident()) {
            try {
              el.dataset.__active = '0'
              el.preload = el.dataset?.__prewarm === '1' ? 'auto' : 'metadata'
            } catch {}
            return
          }
          dropActiveVideoFn(el)
          if (!runtimeProfile.hardUnloadOnInactive) {
            try {
              el.pause?.()
            } catch {}
            try {
              el.dataset.__active = '0'
              el.dataset.__prewarm = '0'
            } catch {}
            try {
              el.preload = 'metadata'
            } catch {}
            return
          }
          unloadVideoElFn(el)
        }, runtimeProfile.unloadDelayMs)
      }
    }

    try {
      io = new IntersectionObserver(
        (entries) => {
          const ent = entries && entries[0]
          const isOn = !!ent && (ent.isIntersecting || (ent.intersectionRatio || 0) > 0)
          setActive(isOn)
        },
        {
          root: null,
          rootMargin: `${mediaVisMargin}px 0px ${mediaVisMargin}px 0px`,
          threshold: 0.01,
        },
      )
      io.observe(el)
      if (isVideoNearViewportFn(el, Math.round(mediaVisMargin * 0.8))) {
        setActive(true)
      }
    } catch {}

    return () => {
      try {
        if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current)
      } catch {}
      recoverTimerRef.current = 0
      try {
        io?.disconnect?.()
      } catch {}
      if (unloadTimer) {
        try {
          clearTimeout(unloadTimer)
        } catch {}
        unloadTimer = null
      }
      dropActiveVideoFn(el)
      unloadVideoElFn(el)
    }
  }, [
    coordinatorOwnsLifecycle,
    dataForumVideo,
    dropActiveVideoFn,
    enforceActiveVideoCapFn,
    isVideoNearViewportFn,
    mediaVisMargin,
    restoreVideoElFn,
    touchActiveVideoFn,
    unloadVideoElFn,
  ])

  React.useEffect(() => {
    return () => {
      clearUiTimers()
    }
  }, [clearUiTimers])

  React.useEffect(() => {
    if (!isPostVideo || typeof MutationObserver === 'undefined') return undefined
    const el = ref.current
    if (!el) return undefined
    const scrub = () => {
      clearNativeControlsForPost()
    }
    scrub()
    let mo = null
    try {
      mo = new MutationObserver(() => scrub())
      mo.observe(el, { attributes: true, attributeFilter: ['controls', 'src', 'class'] })
    } catch {}
    return () => {
      try {
        mo?.disconnect?.()
      } catch {}
    }
  }, [clearNativeControlsForPost, isPostVideo])

  const onVideoError = React.useCallback(
    (e) => {
      const el = ref.current
      if (!el) {
        try {
          onErrorProp?.(e)
        } catch {}
        return
      }
      // Для пост-видео восстановление делает единый coordinator.
      // Локальный remove(src)+load() здесь создаёт лишние 206/cancel-циклы.
      if (String(dataForumVideo || '') === 'post' || coordinatorOwnsLifecycle) {
        try {
          onErrorProp?.(e)
        } catch {}
        return
      }
      try {
        const tried = Number(el.dataset.__recoverTry || 0)
        if (tried < 1) {
          const srcSafe = String(el.dataset.__src || el.getAttribute('data-src') || '')
          if (srcSafe) {
            el.dataset.__recoverTry = String(tried + 1)
            try {
              el.pause?.()
            } catch {}
            try {
              el.removeAttribute('src')
            } catch {}
            try {
              el.preload = 'metadata'
            } catch {}
            try {
              if (recoverTimerRef.current) clearTimeout(recoverTimerRef.current)
            } catch {}
            recoverTimerRef.current = setTimeout(() => {
              recoverTimerRef.current = 0
              try {
                if (!el.isConnected) return
                if (!el.getAttribute('src')) el.setAttribute('src', srcSafe)
                el.load?.()
              } catch {}
            }, 180)
          }
        }
      } catch {}
      try {
        onErrorProp?.(e)
      } catch {}
    },
    [coordinatorOwnsLifecycle, dataForumVideo, onErrorProp],
  )

const onVideoLoaded = React.useCallback(() => {
  try {
    const el = ref.current
    if (!el) return

    clearNativeControlsForPost()

    if (!coordinatorOwnsPostLifecycle) {
      try {
        el.dataset.__recoverTry = '0'
        el.dataset.__loadPending = '0'
        el.dataset.__warmReady = '1'
        delete el.dataset.__loadPendingSince
      } catch {}
    }

    if (!coordinatorOwnsLifecycle) {
      try { touchActiveVideoFn(el) } catch {}
      try { enforceActiveVideoCapFn(el) } catch {}
      try {
        el.dataset.__active = '1'
        el.dataset.__prewarm = '1'
        el.dataset.__resident = '1'
        el.preload = 'auto'
      } catch {}
    }
  } catch {}
}, [
  clearNativeControlsForPost,
  coordinatorOwnsLifecycle,
  coordinatorOwnsPostLifecycle,
  enforceActiveVideoCapFn,
  touchActiveVideoFn,
])

  const handleRootPointerDown = React.useCallback((e) => {
    try { onPointerDownProp?.(e) } catch {}
    try { e.stopPropagation?.() } catch {}
    armUserIntentLease(2200)
    clearNativeControlsForPost()
    revealHud(2100)
  }, [armUserIntentLease, clearNativeControlsForPost, onPointerDownProp, revealHud])

  const handleSurfaceClick = React.useCallback((e) => {
    try { e?.preventDefault?.() } catch {}
    try { e?.stopPropagation?.() } catch {}
    armUserIntentLease(1700)
    clearNativeControlsForPost()
    revealHud(2100)
  }, [armUserIntentLease, clearNativeControlsForPost, revealHud])

  const toggleMute = React.useCallback((e) => {
    try { e?.stopPropagation?.() } catch {}
    const el = ref.current
    if (!el) return
    armUserIntentLease(2200)
    clearNativeControlsForPost()
    revealHud(1900)
    try {
      const nextMuted = !el.muted
      el.muted = nextMuted
      el.defaultMuted = nextMuted
      el.dataset.__persistMuteUntil = String(Date.now() + 2600)
      el.dataset.__lastManualMuteTs = String(Date.now())
      if (nextMuted) el.setAttribute('muted', '')
      else el.removeAttribute('muted')
      setMutedState(!!nextMuted)
    } catch {}
  }, [armUserIntentLease, clearNativeControlsForPost, revealHud])

  const togglePlayPause = React.useCallback((e) => {
    try { e?.stopPropagation?.() } catch {}
    const el = ref.current
    if (!el) return
    armUserIntentLease(3200)
    clearNativeControlsForPost()
    revealHud(2200)
    if (el.paused) {
      showCenterGlyph('play', 760)

      if (isPostVideo) {
        const hasSrc = !!String(el.getAttribute('src') || el.currentSrc || '').trim()

        if (!hasSrc) {
          restoreVideoElFn(el)
        }

        try { el.playsInline = true } catch {}
        try { el.preload = 'auto' } catch {}

        try {
          if (el.muted !== mutedState) el.muted = !!mutedState
        } catch {}

        if ((el.readyState || 0) < 2 && String(el.dataset?.__loadPending || '') !== '1') {
          try {
            el.dataset.__loadPending = '1'
            el.dataset.__loadPendingSince = String(Date.now())
            el.load?.()
          } catch {}
        }
      }

      try {
        const p = el.play?.()
        if (p && typeof p.catch === 'function') {
          p.catch(() => {})
        }
      } catch {}
      return
    }
    showCenterGlyph('pause', 760)
    try { el.pause?.() } catch {}
  }, [
    armUserIntentLease,
    clearNativeControlsForPost,
    isPostVideo,
    mutedState,
    restoreVideoElFn,
    revealHud,
    showCenterGlyph,
  ])

  const onGoodEmoji = React.useCallback((e) => {
    try { e?.stopPropagation?.() } catch {}
    armUserIntentLease(2400)
    revealHud(2300)
    spawnEmojiBurst('good')
  }, [armUserIntentLease, revealHud, spawnEmojiBurst])

  const onBadEmoji = React.useCallback((e) => {
    try { e?.stopPropagation?.() } catch {}
    armUserIntentLease(2400)
    revealHud(2300)
    spawnEmojiBurst('bad')
  }, [armUserIntentLease, revealHud, spawnEmojiBurst])

const videoNode = (
  <video
    ref={ref}
    data-forum-media={dataForumMedia}
    data-forum-video={dataForumVideo}
    data-poster={posterSrc || undefined}
    poster={posterSrc || undefined}
    playsInline={playsInline}
    disableRemotePlayback
    preload={renderPreload}
    muted={isPostVideo ? mutedState : undefined}
    data-default-muted={isPostVideo ? '1' : undefined}
    controls={isPostVideo ? undefined : renderControls}
    autoPlay={isPostVideo ? true : autoPlay}
    loop={loop}
    controlsList={controlsList}
    disablePictureInPicture={disablePictureInPicture}
    referrerPolicy="no-referrer"
    className={className}
    style={style}
    onPointerDown={handleRootPointerDown}
    onClick={isPostVideo ? handleSurfaceClick : undefined}
    onLoadedData={onVideoLoaded}
    onCanPlay={onVideoLoaded}
    onError={onVideoError}
    {...rest}
  />
)

  if (!isPostVideo) return videoNode

  const mutedNow = !!mutedState
  const centerIsVisible = pausedState || !!centerGlyph || hudVisible
  const centerIcon = pausedState ? 'play' : (centerGlyph || 'pause')

  return (
    <div
      className="ql7VideoSurface mediaBoxItem"
      data-forum-video-surface="1"
      onPointerDown={handleRootPointerDown}
      onClick={handleSurfaceClick}
    >
      {videoNode}

      <div className={`ql7VideoHud ${hudVisible ? 'isVisible' : ''}`}>
        <button
          type="button"
          className={`ql7VideoCenter ${centerIsVisible ? 'isVisible' : ''}`}
          onClick={togglePlayPause}
          aria-label={pausedState ? 'Play video' : 'Pause video'}
        >
          {centerIcon === 'play' ? <Ql7IconPlay /> : <Ql7IconPause />}
        </button>

        <div className={`ql7VideoRail ${hudVisible ? 'isVisible' : ''}`}>
          <button type="button" className="ql7VideoRailBtn ql7VideoRailBtn--good" onClick={onGoodEmoji} aria-label="Good reaction">
            <Ql7IconGood />
          </button>
          <button type="button" className="ql7VideoRailBtn ql7VideoRailBtn--bad" onClick={onBadEmoji} aria-label="Bad reaction">
            <Ql7IconBad />
          </button>
          <button
            type="button"
            className="ql7VideoRailBtn ql7VideoRailBtn--sound"
            onClick={toggleMute}
            aria-label={mutedNow ? 'Unmute video' : 'Mute video'}
          >
            <Ql7IconVolume muted={mutedNow} />
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
