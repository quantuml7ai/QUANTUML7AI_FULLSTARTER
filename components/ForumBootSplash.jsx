'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* =========================================================
   FORUM BOOT SPLASH — MASTER SETTINGS
   1 = enabled
   0 = disabled
========================================================= */
const FORUM_SPLASH_ENABLED = 1

/* =========================================================
   TIMING
========================================================= */
const FORUM_SPLASH_SHOW_MS = 10000           // legacy fallback mode only
const FORUM_SPLASH_CLOSE_ON_VIDEO_END = 1    // 1 = close when video ends, 0 = ignore video end
const FORUM_SPLASH_FAILSAFE_MS = 45000       // emergency close only if video never ends/errors
const FORUM_SPLASH_FADE_OUT_MS = 320         // fade-out duration

/* =========================================================
   VIDEO SOURCE
   File must exist in: public/load/load.mp4
   URL for Next/public usage: /load/load.mp4
========================================================= */
const FORUM_SPLASH_VIDEO_SRC = '/load/load.mp4'

/* =========================================================
   SOUND SETTINGS
========================================================= */
// 1 = try to start with sound immediately
// 0 = always start muted
const FORUM_SPLASH_TRY_SOUND_AUTOPLAY = 1

// If sound autoplay is blocked by browser:
// 1 = fallback to muted autoplay
// 0 = do not fallback
const FORUM_SPLASH_ALLOW_MUTED_FALLBACK = 1

// Initial volume if sound autoplay succeeds
const FORUM_SPLASH_VOLUME = 1

/* =========================================================
   LAYER / Z-INDEX
========================================================= */
const FORUM_SPLASH_Z_INDEX = 2147483647

/* =========================================================
   OVERLAY POSITIONING
========================================================= */
const FORUM_SPLASH_OVERLAY_INSET = '0px'
const FORUM_SPLASH_ALIGN_X = 'center'     // center | flex-start | flex-end
const FORUM_SPLASH_ALIGN_Y = 'center'     // center | flex-start | flex-end
const FORUM_SPLASH_PADDING = '0px'

/* =========================================================
   OVERLAY BACKGROUND
========================================================= */
const FORUM_SPLASH_BACKDROP = 'rgba(0,0,0,0.94)'
const FORUM_SPLASH_BACKDROP_BLUR = '0px'

/* =========================================================
   VIDEO FRAME GEOMETRY (9:16 PRESERVED)
========================================================= */
const FORUM_SPLASH_ASPECT_RATIO = '9 / 16'

// 'vw' | 'vh' | 'px'
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
const FORUM_SPLASH_OBJECT_FIT = 'contain' // contain | cover | fill
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
  if (FORUM_SPLASH_ENABLED !== 1) return false
  if (typeof window === 'undefined') return true
  if (window.__QL7_FORUM_SPLASH_SHOWN__) return false
  window.__QL7_FORUM_SPLASH_SHOWN__ = true
  try {
    window.__forumBootSplashActive = '1'
    document.documentElement.dataset.forumBootSplashActive = '1'
  } catch {}
  return true
}

export default function ForumBootSplash({ onDone }) {
  const [visible, setVisible] = useState(() => shouldShowSplashNow())
  const [closing, setClosing] = useState(false)
  const [playbackReady, setPlaybackReady] = useState(false)
  const [soundAutoplayBlocked, setSoundAutoplayBlocked] = useState(false)

  const closeTimerRef = useRef(0)
  const fadeTimerRef = useRef(0)
  const videoRef = useRef(null)

  const frameWidth = useMemo(() => getFrameWidth(), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const active = visible && !closing
    try {
      if (active) {
        window.__forumBootSplashActive = '1'
        document.documentElement.dataset.forumBootSplashActive = '1'
      } else {
        delete window.__forumBootSplashActive
        delete document.documentElement.dataset.forumBootSplashActive
      }
    } catch {}
    try {
      window.dispatchEvent(
        new CustomEvent('forum-boot-splash', {
          detail: { active: !!active },
        }),
      )
    } catch {}
  }, [visible, closing])

  const finish = useCallback(() => {
    if (FORUM_SPLASH_ENABLED !== 1) {
      try {
        onDone?.()
      } catch {}
      return
    }

    setClosing(true)

    try {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    } catch {}

    fadeTimerRef.current = window.setTimeout(() => {
      setVisible(false)
      try {
        onDone?.()
      } catch {}
    }, Math.max(0, Number(FORUM_SPLASH_FADE_OUT_MS || 0)))
  }, [onDone])

  const startPlayback = useCallback(async () => {
    const el = videoRef.current
    if (!el) return

    try {
      el.preload = 'auto'
      const isCold =
        (el.networkState === HTMLMediaElement.NETWORK_EMPTY) ||
        !el.currentSrc
      if (isCold) el.load?.()
    } catch {}

    try {
      el.currentTime = 0
    } catch {}

    try {
      el.volume = Math.max(0, Math.min(1, Number(FORUM_SPLASH_VOLUME || 1)))
    } catch {}

    if (FORUM_SPLASH_TRY_SOUND_AUTOPLAY === 1) {
      try {
        el.muted = false
        el.defaultMuted = false
        el.removeAttribute('muted')

        const p = el.play?.()
        if (p && typeof p.then === 'function') {
          await p
        }

        setSoundAutoplayBlocked(false)
        setPlaybackReady(true)
        return
      } catch {
        setSoundAutoplayBlocked(true)
      }
    }

    if (FORUM_SPLASH_ALLOW_MUTED_FALLBACK === 1) {
      try {
        el.muted = true
        el.defaultMuted = true
        el.setAttribute('muted', '')

        const p = el.play?.()
        if (p && typeof p.then === 'function') {
          await p
        }

        setPlaybackReady(true)
        return
      } catch {}
    }

    setPlaybackReady(false)
  }, [])

  useEffect(() => {
    if (FORUM_SPLASH_ENABLED !== 1) {
      setVisible(false)
      try {
        onDone?.()
      } catch {}
      return
    }

    if (!visible) {
      try {
        onDone?.()
      } catch {}
      return
    }

    if (FORUM_SPLASH_DEBUG) {
      try {
        console.log('[ForumBootSplash] mounted')
      } catch {}
    }

    try {
      const el = videoRef.current
      if (el) {
        el.preload = 'auto'
        const isCold =
          (el.networkState === HTMLMediaElement.NETWORK_EMPTY) ||
          !el.currentSrc
        if (isCold) el.load?.()
      }
    } catch {}

    void startPlayback()

    try {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    } catch {}

    if (FORUM_SPLASH_CLOSE_ON_VIDEO_END === 1) {
      const failsafeMs = Math.max(0, Number(FORUM_SPLASH_FAILSAFE_MS || 0))
      if (failsafeMs > 0) {
        closeTimerRef.current = window.setTimeout(() => {
          finish()
        }, failsafeMs)
      }
    } else {
      closeTimerRef.current = window.setTimeout(() => {
        finish()
      }, Math.max(0, Number(FORUM_SPLASH_SHOW_MS || 0)))
    }

    return () => {
      try {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
      } catch {}
      try {
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
      } catch {}
    }
  }, [finish, onDone, startPlayback, visible])

  useEffect(() => {
    if (!visible) return
    if (typeof document === 'undefined') return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [visible])

  if (!visible || FORUM_SPLASH_ENABLED !== 1) return null

  return (
    <>
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
            onLoadedData={() => {
              setPlaybackReady(true)
            }}
            onEnded={() => {
              finish()
            }}
            onError={() => {
              finish()
            }}
          />

          {!playbackReady && (
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
        }

        .forum-boot-splash__fallback {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.28);
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
