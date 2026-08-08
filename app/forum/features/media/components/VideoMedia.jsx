'use client'

import React from 'react'
import AndroidChromiumVideoCanvas from '../../../../../components/AndroidChromiumVideoCanvas'

const GOOD_EMOJIS = ['🔥', '✨', '🚀', '💎', '⚡', '👏', '🤩', '💯', '🫶', '🎉']
const BAD_EMOJIS = ['😶', '🤨', '🙈', '😴', '💤', '🫠', '😵', '🙃', '😬', '🧊']

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

function formatNativeSafeVideoTime(value) {
  const total = Math.max(0, Math.floor(Number(value || 0)))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

function setVideoRef(targetRef, node) {
  try {
    if (typeof targetRef === 'function') {
      targetRef(node)
      return
    }
    if (targetRef && typeof targetRef === 'object') targetRef.current = node
  } catch {}
}

export const NativeSafeVideoPlayer = React.forwardRef(function NativeSafeVideoPlayer(
  {
    src,
    poster,
    className = '',
    videoClassName = '',
    style,
    videoStyle,
    preload = 'metadata',
    playsInline = true,
    autoPlay,
    loop,
    muted,
    defaultMuted,
    controlsList = 'nodownload noplaybackrate noremoteplayback',
    disablePictureInPicture = true,
    frontCameraMirror,
    mirrorVideo,
    fit = 'contain',
    fill = false,
    onLoadedMetadata,
    onLoadedData,
    onCanPlay,
    onPlay,
    onPause,
    onEnded,
    onError,
    ...rest
  },
  forwardedRef,
) {
  const localRef = React.useRef(null)
  const [playing, setPlaying] = React.useState(false)
  const [mutedState, setMutedState] = React.useState(() => !!(muted ?? defaultMuted))
  const [duration, setDuration] = React.useState(0)
  const [current, setCurrent] = React.useState(0)
  const [controlsVisible, setControlsVisible] = React.useState(true)
  const controlsHideTimerRef = React.useRef(null)
  const shouldMirrorVideo = !!(frontCameraMirror || mirrorVideo)

  const assignRef = React.useCallback(
    (node) => {
      localRef.current = node
      setVideoRef(forwardedRef, node)
    },
    [forwardedRef],
  )

  React.useEffect(() => {
    const node = localRef.current
    if (!node) return
    try {
      node.muted = !!mutedState
    } catch {}
  }, [mutedState, src])

  const syncTime = React.useCallback((node) => {
    try {
      const nextDuration = Number(node?.duration || 0)
      const nextCurrent = Number(node?.currentTime || 0)
      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0)
      setCurrent(Number.isFinite(nextCurrent) ? nextCurrent : 0)
    } catch {}
  }, [])

  const clearControlsHideTimer = React.useCallback(() => {
    try {
      if (controlsHideTimerRef.current) {
        clearTimeout(controlsHideTimerRef.current)
        controlsHideTimerRef.current = null
      }
    } catch {}
  }, [])

  const queueControlsHide = React.useCallback(() => {
    clearControlsHideTimer()
    try {
      const node = localRef.current
      if (!node || node.paused || node.ended) return
      controlsHideTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
        controlsHideTimerRef.current = null
      }, 1800)
    } catch {}
  }, [clearControlsHideTimer])

  const revealControls = React.useCallback(() => {
    setControlsVisible(true)
    queueControlsHide()
  }, [queueControlsHide])

  const playPause = React.useCallback((options = {}) => {
    const node = localRef.current
    if (!node) return
    try {
      if (node.paused || node.ended) {
        if (options?.withSound) {
          node.muted = false
          setMutedState(false)
        }
        const p = node.play?.()
        if (p && typeof p.catch === 'function') p.catch(() => {})
        setPlaying(true)
        setControlsVisible(false)
        clearControlsHideTimer()
      } else {
        node.pause?.()
        setPlaying(false)
        setControlsVisible(true)
        clearControlsHideTimer()
      }
    } catch {}
  }, [clearControlsHideTimer])

  const handleVideoAreaClick = React.useCallback((event) => {
    try {
      event?.stopPropagation?.()
    } catch {}
    setControlsVisible(true)
    try {
      playPause({ withSound: true })
    } catch {}
  }, [playPause])

  React.useEffect(() => () => clearControlsHideTimer(), [clearControlsHideTimer])

  React.useEffect(() => {
    if (playing) {
      setControlsVisible(false)
      clearControlsHideTimer()
    } else {
      setControlsVisible(true)
      clearControlsHideTimer()
    }
  }, [clearControlsHideTimer, playing])

  React.useEffect(() => {
    setControlsVisible(true)
  }, [src])

  const seekTo = React.useCallback((event) => {
    const node = localRef.current
    if (!node) return
    try {
      const next = Number(event?.target?.value || 0)
      if (Number.isFinite(next)) {
        node.currentTime = next
        setCurrent(next)
      }
    } catch {}
  }, [])

  const toggleMute = React.useCallback(() => {
    setMutedState((prev) => {
      const next = !prev
      try {
        const node = localRef.current
        if (node) node.muted = next
      } catch {}
      return next
    })
  }, [])

  const baseVideoStyle = fill
    ? {
        width: '100%',
        height: '100%',
        objectFit: fit,
      }
    : {
        width: '100%',
        height: 'auto',
        objectFit: fit,
      }

  const mirroredVideoStyle = shouldMirrorVideo
    ? {
        ...baseVideoStyle,
        ...(videoStyle || {}),
        transform: videoStyle?.transform ? `${videoStyle.transform} scaleX(-1)` : 'scaleX(-1)',
        transformOrigin: 'center center',
      }
    : {
        ...baseVideoStyle,
        ...(videoStyle || {}),
      }

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeCurrent = Number.isFinite(current) && current > 0 ? Math.min(current, safeDuration || current) : 0

  return (
    <div
      className={`ql7NativeSafeVideoSurface ${fill ? 'isFill' : ''} ${className || ''}`.trim()}
      data-native-safe-video-player="1"
      data-front-camera-mirror={shouldMirrorVideo ? '1' : undefined}
      style={style}
      onClick={handleVideoAreaClick}
      onPointerDown={revealControls}
    >
      <video
        ref={assignRef}
        src={src}
        poster={poster || undefined}
        playsInline={playsInline}
        preload={preload}
        autoPlay={autoPlay}
        loop={loop}
        muted={mutedState}
        controls={false}
        controlsList={controlsList}
        disablePictureInPicture={disablePictureInPicture}
        disableRemotePlayback
        referrerPolicy="no-referrer"
        data-front-camera-mirror={shouldMirrorVideo ? '1' : undefined}
        className={`ql7NativeSafeVideo ${videoClassName || ''}`.trim()}
        style={mirroredVideoStyle}
        onLoadedMetadata={(event) => {
          syncTime(event.currentTarget)
          try { onLoadedMetadata?.(event) } catch {}
        }}
        onLoadedData={(event) => {
          syncTime(event.currentTarget)
          try { onLoadedData?.(event) } catch {}
        }}
        onCanPlay={(event) => {
          syncTime(event.currentTarget)
          try { onCanPlay?.(event) } catch {}
        }}
        onTimeUpdate={(event) => syncTime(event.currentTarget)}
        onPlay={(event) => {
          setPlaying(true)
          setControlsVisible(false)
          clearControlsHideTimer()
          try { onPlay?.(event) } catch {}
        }}
        onPause={(event) => {
          setPlaying(false)
          try { onPause?.(event) } catch {}
        }}
        onEnded={(event) => {
          setPlaying(false)
          syncTime(event.currentTarget)
          try { onEnded?.(event) } catch {}
        }}
        onError={onError}
        onPointerDown={(event) => {
          event.stopPropagation()
          revealControls()
        }}
        onClick={handleVideoAreaClick}
        {...rest}
      />

      <button
        type="button"
        className={`ql7NativeSafeCenter ${playing ? '' : 'isVisible'}`}
        onClick={(event) => {
          event.stopPropagation()
          playPause({ withSound: true })
        }}
        aria-label={playing ? 'Pause video' : 'Play video'}
      >
        {playing ? <Ql7IconPause /> : <Ql7IconPlay />}
      </button>

      <div
        className={`ql7NativeSafeControls ${controlsVisible ? 'isVisible' : ''}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="ql7NativeSafeBtn"
          onClick={() => playPause({ withSound: true })}
          aria-label={playing ? 'Pause video' : 'Play video'}
        >
          {playing ? <Ql7IconPause /> : <Ql7IconPlay />}
        </button>
        <span className="ql7NativeSafeTime" aria-label="Current video time">
          {formatNativeSafeVideoTime(safeCurrent)}
        </span>
        <input
          className="ql7NativeSafeSeek"
          type="range"
          min="0"
          max={safeDuration || 0}
          step="0.01"
          value={safeDuration ? safeCurrent : 0}
          onChange={seekTo}
          aria-label="Seek video"
          disabled={!safeDuration}
        />
        <span className="ql7NativeSafeTime" aria-label="Video duration">
          {formatNativeSafeVideoTime(safeDuration)}
        </span>
        <button
          type="button"
          className="ql7NativeSafeBtn"
          onClick={toggleMute}
          aria-label={mutedState ? 'Unmute video' : 'Mute video'}
        >
          <Ql7IconVolume muted={mutedState} />
        </button>
      </div>

      <style>{`
        .ql7NativeSafeVideoSurface{
          position:relative;
          display:block;
          width:100%;
          max-width:100%;
          overflow:hidden;
          isolation:isolate;
          background:radial-gradient(circle at 50% 48%, rgba(44,148,205,.12), rgba(0,0,0,.98) 68%);
          touch-action:manipulation;
          -webkit-tap-highlight-color:transparent;
        }
        .ql7NativeSafeVideoSurface.isFill{
          height:100%;
        }
        .ql7NativeSafeVideo{
          position:relative;
          z-index:1;
          display:block;
          max-width:100%;
          background:#000;
          -webkit-appearance:none !important;
          appearance:none !important;
        }
        .ql7NativeSafeVideo::-webkit-media-controls,
        .ql7NativeSafeVideo::-webkit-media-controls-enclosure,
        .ql7NativeSafeVideo::-webkit-media-controls-panel,
        .ql7NativeSafeVideo::-webkit-media-controls-play-button,
        .ql7NativeSafeVideo::-webkit-media-controls-start-playback-button,
        .ql7NativeSafeVideo::-webkit-media-controls-timeline,
        .ql7NativeSafeVideo::-webkit-media-controls-current-time-display,
        .ql7NativeSafeVideo::-webkit-media-controls-time-remaining-display,
        .ql7NativeSafeVideo::-webkit-media-controls-volume-slider,
        .ql7NativeSafeVideo::-webkit-media-controls-mute-button,
        .ql7NativeSafeVideo::-webkit-media-controls-fullscreen-button,
        .ql7NativeSafeVideo::-webkit-media-controls-overlay-play-button{
          display:none !important;
          opacity:0 !important;
          pointer-events:none !important;
        }
        .ql7NativeSafeCenter{
          position:absolute;
          left:50%;
          top:50%;
          z-index:3;
          width:86px;
          height:86px;
          border:0;
          border-radius:0;
          transform:translate(-50%,-50%) scale(.92);
          color:#b9f5ff;
          background:transparent;
          box-shadow:none;
          opacity:0;
          pointer-events:none;
          transition:opacity .18s ease, transform .18s ease, filter .18s ease;
          filter:drop-shadow(0 0 20px rgba(102,220,255,.28));
        }
        .ql7NativeSafeCenter.isVisible{
          opacity:1;
          pointer-events:auto;
          transform:translate(-50%,-50%) scale(1);
        }
        .ql7NativeSafeCenter .ql7Glyph{
          width:100%;
          height:100%;
        }
        .ql7NativeSafeControls{
          position:absolute;
          left:12px;
          right:12px;
          bottom:12px;
          z-index:4;
          display:grid;
          grid-template-columns:34px auto minmax(72px, 1fr) auto 34px;
          align-items:center;
          gap:8px;
          min-height:44px;
          padding:7px 9px;
          border-radius:18px;
          border:1px solid rgba(126,220,255,.26);
          background:linear-gradient(120deg, rgba(6,14,25,.82), rgba(8,21,38,.58));
          box-shadow:inset 0 0 18px rgba(89,202,255,.12), 0 0 24px rgba(0,0,0,.32);
          backdrop-filter:blur(12px) saturate(1.2);
          opacity:0;
          pointer-events:none;
          transform:translateY(8px);
          transition:opacity .18s ease, transform .18s ease;
        }
        .ql7NativeSafeControls.isVisible{
          opacity:1;
          pointer-events:auto;
          transform:translateY(0);
        }
        .ql7NativeSafeBtn{
          width:34px;
          height:34px;
          border:1px solid rgba(125,218,255,.26);
          border-radius:13px;
          color:#dffaff;
          background:radial-gradient(circle at 50% 35%, rgba(103,203,255,.2), rgba(13,25,45,.76));
          box-shadow:inset 0 0 12px rgba(103,203,255,.11), 0 0 12px rgba(75,190,255,.14);
          display:inline-flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }
        .ql7NativeSafeBtn .ql7Glyph{
          width:25px;
          height:25px;
        }
        .ql7NativeSafeTime{
          min-width:31px;
          color:#ecfbff;
          font-size:11px;
          font-weight:800;
          font-variant-numeric:tabular-nums;
          text-shadow:0 0 10px rgba(126,220,255,.32);
          text-align:center;
          white-space:nowrap;
        }
        .ql7NativeSafeSeek{
          width:100%;
          min-width:72px;
          height:16px;
          accent-color:#8ae8ff;
          cursor:pointer;
        }
        .ql7NativeSafeSeek:disabled{
          opacity:.45;
          cursor:default;
        }
        @media (max-width:520px){
          .ql7NativeSafeControls{
            left:8px;
            right:8px;
            bottom:8px;
            grid-template-columns:32px auto minmax(48px, 1fr) auto 32px;
            gap:5px;
            padding:6px;
          }
          .ql7NativeSafeBtn{
            width:32px;
            height:32px;
          }
          .ql7NativeSafeTime{
            font-size:10px;
            min-width:27px;
          }
          .ql7NativeSafeCenter{
            width:74px;
            height:74px;
          }
        }
      `}</style>
    </div>
  )
})

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
  poster: nativeVideoPoster,
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
  frontCameraMirror,
  mirrorVideo,
  ...rest
}) {
  const ref = React.useRef(null)
  const surfaceRef = React.useRef(null)
  const safariGestureButtonRef = React.useRef(null)
  const recoverTimerRef = React.useRef(0)
  const mediaKeyRef = React.useRef('')
  const controlsTimerRef = React.useRef(0)
  const centerIconTimerRef = React.useRef(0)
  const fxTimersRef = React.useRef([])
  const fxIdRef = React.useRef(0)
  const surfaceTouchRef = React.useRef({ x: 0, y: 0, moved: false, touchHandledAt: 0 })
  const [hudVisible, setHudVisible] = React.useState(false)
  const [pausedState, setPausedState] = React.useState(true)
  const [mutedState, setMutedState] = React.useState(true)
  const [isIosSafariBrowser, setIsIosSafariBrowser] = React.useState(false)
  const [centerGlyph, setCenterGlyph] = React.useState('')
  const [fxBursts, setFxBursts] = React.useState([])
  const mutedEvent = String(mutedEventName || 'forum:media-mute')
  const shouldMirrorVideo = !!(frontCameraMirror || mirrorVideo)

  React.useEffect(() => {
    setIsIosSafariBrowser(isIosSafariBrowserRuntime())
  }, [])
  const mediaVisMargin = Number.isFinite(Number(mediaVisMarginPx)) ? Number(mediaVisMarginPx) : 380
  const preloadMode = String(preload || 'none').trim().toLowerCase() || 'none'
const isPostVideo = String(dataForumVideo || '') === 'post'
const coordinatorOwnsLifecycle = !!String(dataForumMedia || '').trim()
const coordinatorOwnsPostLifecycle = isPostVideo && coordinatorOwnsLifecycle
const renderControls = isPostVideo ? false : controls
const renderPreload = coordinatorOwnsPostLifecycle ? 'none' : (isPostVideo ? 'metadata' : preload)
void nativeVideoPoster

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
        ? (wantsWarm ? 'auto' : (coordinatorOwnsPostLifecycle ? 'none' : 'metadata'))
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
    try {
      const attachedSrc = String(el.getAttribute('src') || '')
      if (attachedSrc && attachedSrc !== s) el.removeAttribute('src')
    } catch {}
    try { delete el.dataset.__bootAttachedSrc } catch {}
    try { delete el.dataset.__bootMetadataPrimed } catch {}
    try { el.preload = 'metadata' } catch {}
  }
} catch {}
}, [
  autoPlay,
  clearNativeControlsForPost,
  coordinatorOwnsPostLifecycle,
  defaultMutedProp,
  isPostVideo,
  playsInline,
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
    try {
      delete el.dataset.__endedHold
    } catch {}

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
    try {
      delete el.dataset.__endedHold
      el.dataset.__playRequested = '0'
      el.dataset.__loadPending = '0'
    } catch {}
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
    const currentVolume = Number(el.volume)
    if (!m && Number.isFinite(currentVolume) && currentVolume > 0.01) {
      try { el.dataset.__lastAudibleVolume = String(Math.min(1, Math.max(0.01, currentVolume))) } catch {}
    }
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
        if (!isPostVideo) return
        dropActiveVideoFn(el)
        try {
          el.pause?.()
        } catch {}

        const readDetachedCleanupDelay = () => {
          try {
            const ua = String(navigator?.userAgent || '')
            const isIOS = /iP(hone|ad|od)/i.test(ua)
            const isAndroid = /Android/i.test(ua)
            const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
            if (isIOS || isAndroid || coarse) return 980
          } catch {}
          return 560
        }

        const markDetachedCold = () => {
          try {
            el.dataset.__active = '0'
            el.dataset.__prewarm = '0'
            el.dataset.__resident = '0'
            el.dataset.__playRequested = '0'
            el.dataset.__loadPending = '0'
            el.dataset.__warmReady = '0'
            delete el.dataset.__loadPendingSince
            el.preload = 'none'
          } catch {}
        }

        const runDetachedUnload = () => {
          try {
            if (el.isConnected) return
            markDetachedCold()
            try { el.dataset.__forceHardUnload = '1' } catch {}
            unloadVideoElFn(el)
          } catch {} finally {
            try { delete el.dataset.__forceHardUnload } catch {}
          }
        }

        try {
          if (el.isConnected) {
            const raf = typeof window.requestAnimationFrame === 'function'
              ? window.requestAnimationFrame
              : (cb) => window.setTimeout(cb, 80)
            raf(() => {
              try { window.setTimeout(runDetachedUnload, readDetachedCleanupDelay()) } catch { runDetachedUnload() }
            })
          } else {
            try { window.setTimeout(runDetachedUnload, readDetachedCleanupDelay()) } catch { runDetachedUnload() }
          }
        } catch {
          runDetachedUnload()
        }
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
    isPostVideo,
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

  const isSurfaceControlTarget = React.useCallback((target) => {
    try { return !!target?.closest?.('button, input, a, textarea, select, [role="button"]') } catch { return false }
  }, [])

  const playWithSoundFromSurface = React.useCallback((gestureType = 'click') => {
    const el = ref.current
    if (!el) return false
    const now = Date.now()
    let started = null
    let nextVolume = 1

    try {
      const storedVolume = Number(el.dataset?.__lastAudibleVolume || 0)
      const currentVolume = Number(el.volume)
      nextVolume = Number.isFinite(storedVolume) && storedVolume > 0.01
        ? storedVolume
        : (Number.isFinite(currentVolume) && currentVolume > 0.01 ? currentVolume : 1)

      // Safari hot path: mutate and call play() before React state work, storage,
      // timers, or CustomEvent fanout. The call stays inside the trusted event.
      el.dataset.__manualLeaseUntil = String(now + 5200)
      el.dataset.__userGestureUntil = String(now + 5200)
      el.dataset.__audibleGestureUntil = String(now + 5200)
      el.dataset.__surfaceGestureEvent = String(gestureType || 'unknown')
      el.dataset.__surfaceGestureAt = String(now)
      try { el.dataset.__surfaceGestureUserActive = navigator?.userActivation?.isActive ? '1' : '0' } catch {}
      delete el.dataset.__audibleAutoplayBlocked
      delete el.dataset.__audibleAutoplayFallbackAt
      delete el.dataset.__audibleAutoplayFallbackUntil
      delete el.dataset.__audibleAutoplayFallbackPending
      delete el.dataset.__autoplayFallbackMuted
      delete el.dataset.__iosAudibleAutoplayAttempted
      delete el.dataset.__iosAudibleAutoplaySucceeded
      delete el.dataset.__skipMutePersistUntil
      delete el.dataset.__userPaused
      delete el.dataset.__userPausedAt
      delete el.dataset.__suppressedPlayUntil
      if (isPostVideo && !String(el.getAttribute('src') || el.currentSrc || '').trim()) restoreVideoElFn(el)
      el.playsInline = true
      el.setAttribute('playsinline', '')
      el.setAttribute('webkit-playsinline', '')
      el.preload = 'auto'
      if (el.ended) el.currentTime = 0
      el.muted = false
      el.defaultMuted = false
      el.volume = Math.min(1, Math.max(0.01, nextVolume))
      el.removeAttribute('muted')
      el.dataset.__lastAudibleVolume = String(el.volume)
      el.dataset.__persistMuteUntil = String(now + 4200)
      started = el.play?.()
      el.dataset.__surfacePlayResult = 'pending'
    } catch (error) {
      try {
        el.dataset.__surfacePlayResult = 'threw'
        el.dataset.__surfacePlayError = String(error?.name || error?.message || 'play_threw').slice(0, 120)
      } catch {}
      return false
    }

    armUserIntentLease(5200)
    clearNativeControlsForPost()
    revealHud(2100)
    setMutedState(false)
    writeMuted(false, 'video', true)
    try {
      window.__FORUM_MEDIA_SOUND_UNLOCKED__ = true
      window.__SITE_MEDIA_SOUND_UNLOCKED__ = true
      document.documentElement.dataset.forumMediaSoundUnlocked = '1'
    } catch {}

    if (started && typeof started.then === 'function') {
      started.then(() => {
        try { el.dataset.__surfacePlayResult = 'resolved' } catch {}
        setPausedState(false)
        showCenterGlyph('pause', 620)
        try { window.dispatchEvent(new CustomEvent('site-media-play', { detail: { source: 'video', element: el, manual: true, gestureType } })) } catch {}
      }).catch((error) => {
        try {
          el.dataset.__surfacePlayResult = 'rejected'
          el.dataset.__surfacePlayError = String(error?.name || error?.message || 'play_rejected').slice(0, 120)
        } catch {}
      })
    } else {
      try { el.dataset.__surfacePlayResult = el.paused ? 'unknown' : 'resolved-sync' } catch {}
    }
    return true
  }, [armUserIntentLease, clearNativeControlsForPost, isPostVideo, restoreVideoElFn, revealHud, showCenterGlyph, writeMuted])

  const handleRootPointerDown = React.useCallback((e) => {
    try { onPointerDownProp?.(e) } catch {}
    try { e.stopPropagation?.() } catch {}
    armUserIntentLease(2200)
    clearNativeControlsForPost()
    revealHud(2100)
  }, [armUserIntentLease, clearNativeControlsForPost, onPointerDownProp, revealHud])

  const handleSurfaceTouchStart = React.useCallback((event) => {
    if (isSurfaceControlTarget(event?.target)) return
    const touch = event?.touches?.[0] || event?.changedTouches?.[0]
    if (!touch) return
    surfaceTouchRef.current.x = Number(touch.clientX || 0)
    surfaceTouchRef.current.y = Number(touch.clientY || 0)
    surfaceTouchRef.current.moved = false
  }, [isSurfaceControlTarget])

  const handleSurfaceTouchMove = React.useCallback((event) => {
    const touch = event?.touches?.[0] || event?.changedTouches?.[0]
    if (!touch) return
    const dx = Number(touch.clientX || 0) - Number(surfaceTouchRef.current.x || 0)
    const dy = Number(touch.clientY || 0) - Number(surfaceTouchRef.current.y || 0)
    if ((dx * dx) + (dy * dy) > 14 * 14) surfaceTouchRef.current.moved = true
  }, [])

  const handleSurfaceTouchEnd = React.useCallback((event) => {
    if (isSurfaceControlTarget(event?.target) || surfaceTouchRef.current.moved) return
    try { event?.stopPropagation?.() } catch {}
    surfaceTouchRef.current.touchHandledAt = Date.now()
    playWithSoundFromSurface('touchend')
  }, [isSurfaceControlTarget, playWithSoundFromSurface])

  const handleSurfaceClick = React.useCallback((event) => {
    if (isSurfaceControlTarget(event?.target)) return
    try { event?.stopPropagation?.() } catch {}
    const el = ref.current
    if (Date.now() - Number(surfaceTouchRef.current.touchHandledAt || 0) < 900 && el && !el.paused && !el.muted) {
      revealHud(2100)
      return
    }
    playWithSoundFromSurface('click')
  }, [isSurfaceControlTarget, playWithSoundFromSurface, revealHud])

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

  const toggleMute = React.useCallback((e) => {
    try { e?.stopPropagation?.() } catch {}
    const el = ref.current
    if (!el) return
    armUserIntentLease(2200)
    clearNativeControlsForPost()
    revealHud(1900)
    try {
      const nextMuted = !el.muted
      const now = Date.now()
      el.muted = nextMuted
      el.defaultMuted = nextMuted
      el.dataset.__persistMuteUntil = String(now + 2600)
      el.dataset.__lastManualMuteTs = String(now)
      el.dataset.__audibleGestureUntil = String(now + 3600)
      if (!nextMuted) {
        try { window.__FORUM_MEDIA_SOUND_UNLOCKED__ = true } catch {}
        try { window.__SITE_MEDIA_SOUND_UNLOCKED__ = true } catch {}
        try { document.documentElement.dataset.forumMediaSoundUnlocked = '1' } catch {}
        try { delete el.dataset.__audibleAutoplayFallbackUntil } catch {}
        try { delete el.dataset.__autoplayFallbackMuted } catch {}
      }
      if (nextMuted) el.setAttribute('muted', '')
      else el.removeAttribute('muted')
      setMutedState(!!nextMuted)
      if (!nextMuted) {
        try {
          const p = el.play?.()
          if (p && typeof p.catch === 'function') p.catch(() => {})
        } catch {}
      }
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
        if (el.ended) {
          try { el.currentTime = 0 } catch {}
          try { delete el.dataset.__endedHold } catch {}
        }
        let hasSrc = !!String(el.getAttribute('src') || el.currentSrc || '').trim()

        if (!hasSrc) {
          restoreVideoElFn(el)
          hasSrc = !!String(el.getAttribute('src') || el.currentSrc || '').trim()
        }

        try { el.playsInline = true } catch {}
        try { el.preload = 'auto' } catch {}

        try {
          if (el.muted !== mutedState) el.muted = !!mutedState
        } catch {}

        if ((el.readyState || 0) < 2 && String(el.dataset?.__loadPending || '') !== '1') {
          try {
            const networkEmpty = typeof HTMLMediaElement !== 'undefined'
              ? HTMLMediaElement.NETWORK_EMPTY
              : 0
            const canDirectLoad =
              !coordinatorOwnsPostLifecycle ||
              (hasSrc && Number(el.networkState || 0) === networkEmpty)
            if (canDirectLoad) {
              el.dataset.__loadPending = '1'
              el.dataset.__loadPendingSince = String(Date.now())
              el.load?.()
            }
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
    coordinatorOwnsPostLifecycle,
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

const videoStyle = shouldMirrorVideo
  ? {
      ...(style || {}),
      transform: style?.transform ? `${style.transform} scaleX(-1)` : 'scaleX(-1)',
    }
  : style

const videoNode = (
  <video
    ref={ref}
    data-forum-media={dataForumMedia}
    data-forum-video={dataForumVideo}
    playsInline={playsInline}
    disableRemotePlayback
    preload={renderPreload}
    muted={isPostVideo ? mutedState : undefined}
    data-default-muted={isPostVideo ? '1' : undefined}
    data-front-camera-mirror={shouldMirrorVideo ? '1' : undefined}
    controls={isPostVideo ? undefined : renderControls}
    autoPlay={isPostVideo ? undefined : autoPlay}
    loop={isPostVideo ? true : loop}
    controlsList={controlsList}
    disablePictureInPicture={disablePictureInPicture}
    referrerPolicy="no-referrer"
    className={className}
    style={videoStyle}
    onPointerDown={handleRootPointerDown}
    onClick={undefined}
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
      ref={surfaceRef}
      className="ql7VideoSurface mediaBoxItem"
      data-forum-video-surface="1"
      data-front-camera-mirror={shouldMirrorVideo ? '1' : undefined}
      onPointerDown={handleRootPointerDown}
      onTouchStartCapture={handleSurfaceTouchStart}
      onTouchMoveCapture={handleSurfaceTouchMove}
      onTouchEndCapture={handleSurfaceTouchEnd}
      onClick={handleSurfaceClick}
    >
      {videoNode}
      <AndroidChromiumVideoCanvas videoRef={ref} fit="contain" />

      {isIosSafariBrowser ? (
        <button
          ref={safariGestureButtonRef}
          type="button"
          aria-label="Play video with sound"
          data-ios-safari-media-gesture="video"
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
