'use client'

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const useBrowserLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

/* =========================================================
   FORUM BOOT SPLASH — MASTER SETTINGS
========================================================= */ 
const FORUM_SPLASH_ENABLED = 1

/* =========================================================
   TIMING
========================================================= */
const FORUM_SPLASH_CLOSE_ON_VIDEO_END = 1
const FORUM_SPLASH_FAILSAFE_MS = 45000
const FORUM_SPLASH_FADE_OUT_MS = 320
const FORUM_SPLASH_FALLBACK_DELAY_MS = 700
const FORUM_SPLASH_RETRY_MS = 220

/* =========================================================
   VIDEO SOURCE
========================================================= */ 
const FORUM_SPLASH_VIDEO_SRC = '/load/load.mp4'

/* =========================================================
   SOUND SETTINGS
========================================================= */
const FORUM_SPLASH_TRY_SOUND_AUTOPLAY = 1 
const FORUM_SPLASH_ALLOW_MUTED_FALLBACK = 1
const FORUM_SPLASH_VOLUME = 1 

/* =========================================================
   LAYER / Z-INDEX
========================================================= */
const FORUM_SPLASH_Z_INDEX = 2147483647

/* =========================================================
   OVERLAY POSITIONING
========================================================= */
const FORUM_SPLASH_OVERLAY_INSET = '0px'
const FORUM_SPLASH_ALIGN_X = 'center'
const FORUM_SPLASH_ALIGN_Y = 'center'
const FORUM_SPLASH_PADDING = '0px'

/* =========================================================
   OVERLAY BACKGROUND
========================================================= */
const FORUM_SPLASH_BACKDROP = 'rgba(0,0,0,0.94)'
const FORUM_SPLASH_BACKDROP_BLUR = '0px'

/* =========================================================
   VIDEO FRAME GEOMETRY
========================================================= */
const FORUM_SPLASH_ASPECT_RATIO = '9 / 16' 
const FORUM_SPLASH_SIZE_MODE = 'vh'

const FORUM_SPLASH_WIDTH_VW = 56
const FORUM_SPLASH_WIDTH_VH = 100
const FORUM_SPLASH_WIDTH_PX = 720

const FORUM_SPLASH_MIN_WIDTH = '240px'
const FORUM_SPLASH_MAX_WIDTH = '100vw'
const FORUM_SPLASH_MAX_HEIGHT = '100vh'

const FORUM_SPLASH_OFFSET_X = '0px'
const FORUM_SPLASH_OFFSET_Y = '0px'

const FORUM_SPLASH_BORDER_RADIUS = '0px'
const FORUM_SPLASH_BORDER = '0px solid transparent'
const FORUM_SPLASH_BOX_SHADOW = 'none'
const FORUM_SPLASH_OVERFLOW = 'hidden'

/* =========================================================
   VIDEO FIT / LOOK
========================================================= */
const FORUM_SPLASH_OBJECT_FIT = 'contain'
const FORUM_SPLASH_OBJECT_POSITION = 'center center'
const FORUM_SPLASH_VIDEO_BACKGROUND = '#00000000'
const FORUM_SPLASH_VIDEO_OPACITY = 1

/* =========================================================
   OPTIONAL DEBUG
========================================================= */
const FORUM_SPLASH_DEBUG = 0

function getFrameWidth() {
  if (FORUM_SPLASH_SIZE_MODE === 'px') return `${FORUM_SPLASH_WIDTH_PX}px`
  if (FORUM_SPLASH_SIZE_MODE === 'vh') return `${FORUM_SPLASH_WIDTH_VH}vh`
  return `${FORUM_SPLASH_WIDTH_VW}vw`
}

function shouldShowSplashNow() {
  return FORUM_SPLASH_ENABLED === 1
}

export default function ForumBootSplash({ onDone }) {
  const [visible, setVisible] = useState(() => shouldShowSplashNow())
  const [closing, setClosing] = useState(false)
  const [playbackReady, setPlaybackReady] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [soundAutoplayBlocked, setSoundAutoplayBlocked] = useState(false)

  const videoRef = useRef(null)
  const fadeTimerRef = useRef(0)
  const failsafeTimerRef = useRef(0)
  const retryTimerRef = useRef(0)
  const fallbackTimerRef = useRef(0)

  const doneRef = useRef(false)
  const closingRef = useRef(false)
  const playbackReadyRef = useRef(false)
  const soundAttemptsRef = useRef(0)
  const mutedAttemptsRef = useRef(0)
  const ensurePlaybackRef = useRef(() => {})

  const frameWidth = useMemo(() => getFrameWidth(), [])

  const clearTimer = (ref) => {
    try {
      if (ref.current) clearTimeout(ref.current)
    } catch {}
    ref.current = 0
  }

  const debugLog = (...args) => {
    if (!FORUM_SPLASH_DEBUG) return
    try {
      console.log('[ForumBootSplash]', ...args)
    } catch {}
  }

  const setSplashActiveFlag = useCallback((next) => {
    try {
      if (typeof window === 'undefined') return
      window.__forumBootSplashActive = !!next
    } catch {}
  }, [])

  const markReady = useCallback(() => {
    playbackReadyRef.current = true
    setPlaybackReady(true)
    setShowFallback(false)
  }, [])

  const releaseVideo = useCallback(() => {
    const el = videoRef.current
    if (!el) return

    try {
      el.pause?.()
    } catch {}

    try {
      el.removeAttribute('src')
    } catch {}

    try {
      el.load?.()
    } catch {}
  }, [])

  const finish = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    closingRef.current = true

    clearTimer(retryTimerRef)
    clearTimer(fallbackTimerRef)
    clearTimer(failsafeTimerRef)

    setSplashActiveFlag(false)
    setShowFallback(false)
    setClosing(true)

    fadeTimerRef.current = window.setTimeout(() => {
      releaseVideo()
      setVisible(false)
      try {
        onDone?.()
      } catch {}
    }, Math.max(0, Number(FORUM_SPLASH_FADE_OUT_MS || 0)))
  }, [onDone, releaseVideo, setSplashActiveFlag])

  const primeVideo = useCallback(() => {
    const el = videoRef.current
    if (!el) return

    try {
      el.preload = 'auto'
      el.playsInline = true
      el.setAttribute('playsinline', '')
      el.setAttribute('webkit-playsinline', 'true')
      el.setAttribute('preload', 'auto')
    } catch {}

    try {
      if (Number(el.volume || 1) !== Number(FORUM_SPLASH_VOLUME || 1)) {
        el.volume = Math.max(0, Math.min(1, Number(FORUM_SPLASH_VOLUME || 1)))
      }
    } catch {}

    try {
      const isCold =
        (typeof HTMLMediaElement !== 'undefined' &&
          el.networkState === HTMLMediaElement.NETWORK_EMPTY) ||
        !el.currentSrc
      if (isCold) el.load?.()
    } catch {}
  }, [])

  const applyMuteState = useCallback((wantMuted) => {
    const el = videoRef.current
    if (!el) return

    try {
      el.muted = !!wantMuted
      el.defaultMuted = !!wantMuted
      if (wantMuted) el.setAttribute('muted', '')
      else el.removeAttribute('muted')
    } catch {}
  }, [])

  const tryPlay = useCallback(
    async (wantMuted, reason) => {
      const el = videoRef.current
      if (!el) return false
      if (!visible || closingRef.current) return false

      primeVideo()
      applyMuteState(wantMuted)

      try {
        if (el.ended) {
          try {
            el.currentTime = 0
          } catch {}
        }
      } catch {}

      try { 
        const p = el.play?.()
        if (p && typeof p.then === 'function') {
          await p
        }
        if (!el.paused) {
          debugLog('play_ok', { reason, muted: !!wantMuted })
          markReady()
          return true
        }
      } catch (err) {
        debugLog('play_reject', {
          reason,
          muted: !!wantMuted,
          name: String(err?.name || ''),
          message: String(err?.message || ''),
        })
      }

      return false
    },
    [applyMuteState, markReady, primeVideo, visible]
  )

  const scheduleRetry = useCallback((reason = 'retry') => {
    if (!visible || closingRef.current) return
    clearTimer(retryTimerRef)
    retryTimerRef.current = window.setTimeout(() => {
      try {
        ensurePlaybackRef.current?.(reason)
      } catch {}
    }, FORUM_SPLASH_RETRY_MS)
  }, [visible])

  const ensurePlayback = useCallback(
    async (reason = 'manual') => {
      const el = videoRef.current
      if (!el) return
      if (!visible || closingRef.current) return

      primeVideo()

      try {
        if (!el.paused && !el.ended) {
          markReady()
          return
        }
      } catch {}

      if (FORUM_SPLASH_TRY_SOUND_AUTOPLAY === 1 && soundAttemptsRef.current < 3) {
        soundAttemptsRef.current += 1
        const soundOk = await tryPlay(false, `${reason}:sound`)
        if (soundOk) {
          setSoundAutoplayBlocked(false)
          return
        }
        setSoundAutoplayBlocked(true)
      }

      if (
        FORUM_SPLASH_ALLOW_MUTED_FALLBACK === 1 &&
        mutedAttemptsRef.current < 8
      ) {
        mutedAttemptsRef.current += 1
        const mutedOk = await tryPlay(true, `${reason}:muted`)
        if (mutedOk) return
      }

      scheduleRetry(reason)
    },
    [markReady, primeVideo, scheduleRetry, tryPlay, visible]
  )

  ensurePlaybackRef.current = ensurePlayback

  useBrowserLayoutEffect(() => {
    if (!visible) return undefined
    setSplashActiveFlag(true)
    primeVideo()
    ensurePlayback('layout_mount')
    return undefined
  }, [ensurePlayback, primeVideo, setSplashActiveFlag, visible])

  useEffect(() => {
    if (FORUM_SPLASH_ENABLED !== 1) {
      setVisible(false)
      try {
        onDone?.()
      } catch {}
      return
    }

    if (!visible) return

    debugLog('mounted')
    setSplashActiveFlag(true)

    clearTimer(fallbackTimerRef)
    fallbackTimerRef.current = window.setTimeout(() => {
      if (!playbackReadyRef.current && !closingRef.current) {
        setShowFallback(true)
      }
    }, Math.max(0, Number(FORUM_SPLASH_FALLBACK_DELAY_MS || 0)))

    clearTimer(failsafeTimerRef)
    failsafeTimerRef.current = window.setTimeout(() => {
      finish()
    }, Math.max(0, Number(FORUM_SPLASH_FAILSAFE_MS || 0)))

    const onVisibilityRecover = () => {
      try {
        if (document.visibilityState !== 'visible') return
      } catch {}
      scheduleRetry('visibility')
    }

    const onPageShow = () => scheduleRetry('pageshow')
    const onFocus = () => scheduleRetry('focus')

    document.addEventListener('visibilitychange', onVisibilityRecover)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', onFocus, true)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityRecover)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', onFocus, true)

      clearTimer(fadeTimerRef)
      clearTimer(retryTimerRef)
      clearTimer(fallbackTimerRef)
      clearTimer(failsafeTimerRef)

      setSplashActiveFlag(false)
    }
  }, [finish, onDone, scheduleRetry, setSplashActiveFlag, visible])

  useEffect(() => {
    if (!visible) return
    if (typeof document === 'undefined') return undefined

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [visible])

  if (!visible || FORUM_SPLASH_ENABLED !== 1) return null

  return (
    <>
      <link
        rel="preload"
        href={FORUM_SPLASH_VIDEO_SRC}
        as="video"
        fetchPriority="high"
      />

      <div
        className={`forum-boot-splash ${closing ? 'is-closing' : ''}`}
        aria-hidden="true"
      >
        <div className="forum-boot-splash__frame">
          <video
            ref={videoRef}
            className="forum-boot-splash__video"
            src={FORUM_SPLASH_VIDEO_SRC}
            autoPlay
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            onLoadedMetadata={() => {
              ensurePlaybackRef.current?.('loadedmetadata')
            }}
            onLoadedData={() => {
              markReady()
              ensurePlaybackRef.current?.('loadeddata')
            }}
            onCanPlay={() => {
              markReady()
              ensurePlaybackRef.current?.('canplay')
            }}
            onCanPlayThrough={() => {
              markReady()
              ensurePlaybackRef.current?.('canplaythrough')
            }}
            onPlaying={() => {
              markReady()
            }}
            onPause={() => {
              const el = videoRef.current
              if (!el) return
              if (closingRef.current) return
              if (el.ended) return
              scheduleRetry('pause')
            }}
            onWaiting={() => {
              scheduleRetry('waiting')
            }}
            onStalled={() => {
              scheduleRetry('stalled')
            }}
            onSuspend={() => {
              if (!playbackReadyRef.current) {
                scheduleRetry('suspend')
              }
            }}
            onEnded={() => {
              if (FORUM_SPLASH_CLOSE_ON_VIDEO_END === 1) {
                finish()
              }
            }}
            onError={() => {
              scheduleRetry('error')
            }}
          />

          {showFallback && !playbackReady && (
            <div className="forum-boot-splash__fallback">
              <div className="forum-boot-splash__fallback-label">
                Loading...
              </div>
            </div>
          )}

          {soundAutoplayBlocked && FORUM_SPLASH_DEBUG === 1 && (
            <div className="forum-boot-splash__debug">
              sound autoplay blocked by browser, muted fallback used
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .forum-boot-splash {
          position: fixed;
          inset: ${FORUM_SPLASH_OVERLAY_INSET};
          z-index: ${FORUM_SPLASH_Z_INDEX};
          display: flex;
          align-items: ${FORUM_SPLASH_ALIGN_Y};
          justify-content: ${FORUM_SPLASH_ALIGN_X};
          padding: ${FORUM_SPLASH_PADDING};
          background: ${FORUM_SPLASH_BACKDROP};
          backdrop-filter: blur(${FORUM_SPLASH_BACKDROP_BLUR});
          -webkit-backdrop-filter: blur(${FORUM_SPLASH_BACKDROP_BLUR});
          pointer-events: auto;
          opacity: 1;
          transition: opacity ${FORUM_SPLASH_FADE_OUT_MS}ms ease;
        }

        .forum-boot-splash.is-closing {
          opacity: 0;
        }

        .forum-boot-splash__frame {
          position: relative;
          width: ${frameWidth};
          min-width: ${FORUM_SPLASH_MIN_WIDTH};
          max-width: ${FORUM_SPLASH_MAX_WIDTH};
          max-height: ${FORUM_SPLASH_MAX_HEIGHT};
          aspect-ratio: ${FORUM_SPLASH_ASPECT_RATIO};
          transform: translate(${FORUM_SPLASH_OFFSET_X}, ${FORUM_SPLASH_OFFSET_Y});
          border-radius: ${FORUM_SPLASH_BORDER_RADIUS};
          border: ${FORUM_SPLASH_BORDER};
          box-shadow: ${FORUM_SPLASH_BOX_SHADOW};
          overflow: ${FORUM_SPLASH_OVERFLOW};
          background: ${FORUM_SPLASH_VIDEO_BACKGROUND};
          contain: layout paint style;
        }

        .forum-boot-splash__video {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: ${FORUM_SPLASH_OBJECT_FIT};
          object-position: ${FORUM_SPLASH_OBJECT_POSITION};
          background: ${FORUM_SPLASH_VIDEO_BACKGROUND};
          opacity: ${FORUM_SPLASH_VIDEO_OPACITY};
          pointer-events: none;
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        .forum-boot-splash__fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.18);
        }

        .forum-boot-splash__fallback-label {
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,.45);
        }

        .forum-boot-splash__debug {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          padding: 8px 10px;
          border-radius: 10px;
          background: rgba(0,0,0,.55);
          color: #fff;
          font-size: 12px;
          line-height: 1.4;
        }
      `}</style>
    </>
  )
} 