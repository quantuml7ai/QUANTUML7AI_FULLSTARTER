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
const FORUM_SPLASH_SOUND_START_BUDGET_MS = 900
const FORUM_SPLASH_SOUND_MAX_ATTEMPTS = 3
const FORUM_SPLASH_MUTED_MAX_ATTEMPTS = 10
const FORUM_SPLASH_FAILSAFE_MIN_MS = 12000
const FORUM_SPLASH_FAILSAFE_CAP_MS = 20000
const FORUM_SPLASH_DURATION_GRACE_MS = 5000
const FORUM_SPLASH_PLAY_CONFIRM_MS = 420
const FORUM_SPLASH_AUDIBLE_UPGRADE_CONFIRM_MS = 900
const FORUM_SPLASH_AUDIBLE_UPGRADE_MAX_ATTEMPTS = 1

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

const MEDIA_MUTED_KEY = 'forum:mediaMuted'
const MEDIA_VIDEO_MUTED_KEY = 'forum:videoMuted'
const MEDIA_MUTED_EVENT = 'forum:media-mute'

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
  if (FORUM_SPLASH_ENABLED !== 1) return false
  try {
    if (typeof window === 'undefined') return true
    return window.__forumBootSplashShown !== 1
  } catch {
    return true
  }
}

function readStoredForumMutedPref() {
  try {
    let v = window.localStorage?.getItem(MEDIA_MUTED_KEY)
    if (v == null) v = window.localStorage?.getItem(MEDIA_VIDEO_MUTED_KEY)
    if (v == null) return true
    return v === '1' || v === 'true'
  } catch {
    return true
  }
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
  const soundAutoplayBlockedRef = useRef(false)
  const soundAttemptsRef = useRef(0)
  const mutedAttemptsRef = useRef(0)
  const retryStageRef = useRef(0)
  const retryTotalRef = useRef(0)
  const playbackPhaseRef = useRef(
    FORUM_SPLASH_TRY_SOUND_AUTOPLAY === 1 ? 'sound' : 'muted'
  )
  const phaseStartedAtRef = useRef(0)
  const muteHoldReleasedRef = useRef(false)
  const ensurePlaybackRef = useRef(() => {})
  const audibleUpgradeAttemptsRef = useRef(0)
  const audibleUpgradeInFlightRef = useRef(false)
  const gestureCapturedRef = useRef(false)

  const frameWidth = useMemo(() => getFrameWidth(), [])

  const clearTimer = (ref) => {
    try {
      if (ref.current) clearTimeout(ref.current)
    } catch {}
    ref.current = 0
  }

  const debugLog = useCallback((...args) => {
    if (!FORUM_SPLASH_DEBUG) return
    try {
      console.log('[ForumBootSplash]', ...args)
    } catch {}
  }, [])

  const nowMs = useCallback(() => {
    try {
      if (
        typeof performance !== 'undefined' &&
        typeof performance.now === 'function'
      ) {
        return performance.now()
      }
    } catch {}
    return Date.now()
  }, [])

  const setSplashActiveFlag = useCallback((next) => {
    try {
      if (typeof window === 'undefined') return
      window.__forumBootSplashActive = !!next
    } catch {}
  }, [])

  const syncForumMutedState = useCallback((forceMuted, source) => {
    try {
      if (typeof window === 'undefined') return
      window.dispatchEvent(
        new CustomEvent(MEDIA_MUTED_EVENT, {
          detail: {
            muted: !!forceMuted,
            id: 'forum_boot_splash',
            source,
          },
        }),
      )
    } catch {}
  }, [])

  const setSoundBlocked = useCallback((nextBlocked) => {
    soundAutoplayBlockedRef.current = !!nextBlocked
    setSoundAutoplayBlocked(!!nextBlocked)
  }, [])

  const hasPlaybackStarted = useCallback(() => {
    const el = videoRef.current
    if (!el) return false
    if (playbackReadyRef.current) return true

    try {
      if (el.ended) return false
      if (el.paused) return false
      return Number(el.currentTime || 0) > 0.05
    } catch {}

    return false
  }, [])

  const releaseMuteHold = useCallback(
    (source) => {
      if (muteHoldReleasedRef.current) return
      muteHoldReleasedRef.current = true
      setSplashActiveFlag(false)
      syncForumMutedState(readStoredForumMutedPref(), source)
    },
    [setSplashActiveFlag, syncForumMutedState]
  )

  const markReady = useCallback(() => {
    clearTimer(retryTimerRef)
    playbackReadyRef.current = true
    setPlaybackReady(true)
    setShowFallback(false)
    retryStageRef.current = 0
    retryTotalRef.current = 0
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

    setShowFallback(false)
    setClosing(true)

    fadeTimerRef.current = window.setTimeout(() => {
      releaseVideo()
      releaseMuteHold('forum-splash-release')
      setVisible(false)
      try {
        onDone?.()
      } catch {}
    }, Math.max(0, Number(FORUM_SPLASH_FADE_OUT_MS || 0)))
  }, [onDone, releaseMuteHold, releaseVideo])

  const armFailsafe = useCallback((ms) => {
    clearTimer(failsafeTimerRef)
    failsafeTimerRef.current = window.setTimeout(() => {
      finish()
    }, Math.max(0, Number(ms || 0)))
  }, [finish])

  const computeFailsafeMs = useCallback((durationMs) => {
    const safeDuration = Number(durationMs || 0)
    if (!Number.isFinite(safeDuration) || safeDuration <= 0) {
      return FORUM_SPLASH_FAILSAFE_MS
    }

    return Math.min(
      FORUM_SPLASH_FAILSAFE_CAP_MS,
      Math.max(
        FORUM_SPLASH_FAILSAFE_MIN_MS,
        safeDuration + FORUM_SPLASH_DURATION_GRACE_MS,
      ),
    )
  }, [])

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

  const isAutoplayBlockError = useCallback((err) => {
    const name = String(err?.name || '')
    const message = String(err?.message || '').toLowerCase()
    return (
      /notallowed|securityerror/i.test(name) ||
      message.includes('notallowed') ||
      message.includes('gesture') ||
      message.includes('interact') ||
      message.includes('autoplay')
    )
  }, [])

  const restartPlaybackTransport = useCallback((reason) => {
    const el = videoRef.current
    if (!el) return

    debugLog('restart_transport', { reason })

    try {
      el.pause?.()
    } catch {}

    try {
      if (Number(el.currentTime || 0) > 0) {
        el.currentTime = 0
      }
    } catch {}

    try {
      if (!el.getAttribute('src')) {
        el.setAttribute('src', FORUM_SPLASH_VIDEO_SRC)
      }
    } catch {}

    try {
      el.load?.()
    } catch {}
  }, [debugLog])

  const createPlaybackEvidenceWaiter = useCallback(
    (
      timeoutMs = FORUM_SPLASH_PLAY_CONFIRM_MS,
      baselineTime = Number(videoRef.current?.currentTime || 0),
    ) => {
      const el = videoRef.current
      if (!el || !visible || closingRef.current) {
        return {
          cancel: () => {},
          promise: Promise.resolve(false),
        }
      }

      const startTime = Number.isFinite(Number(baselineTime))
        ? Number(baselineTime)
        : Number(el.currentTime || 0)

      const hasTimeAdvanced = () => {
        try {
          return Number(el.currentTime || 0) > startTime + 0.001
        } catch {
          return false
        }
      }

      if (hasPlaybackStarted() || hasTimeAdvanced()) {
        return {
          cancel: () => {},
          promise: Promise.resolve(true),
        }
      }

      let settled = false
      let confirmTimer = 0
      let rafId = 0
      let frameHandle = 0
      let settleResolve = () => {}

      const cleanup = () => {
        try {
          el.removeEventListener('playing', onPlaying)
          el.removeEventListener('timeupdate', onTimeUpdate)
        } catch {}
        try {
          if (confirmTimer) clearTimeout(confirmTimer)
        } catch {}
        confirmTimer = 0
        try {
          if (rafId) cancelAnimationFrame(rafId)
        } catch {}
        rafId = 0
        try {
          if (frameHandle && typeof el.cancelVideoFrameCallback === 'function') {
            el.cancelVideoFrameCallback(frameHandle)
          }
        } catch {}
        frameHandle = 0
      }

      const settle = (next) => {
        if (settled) return
        settled = true
        cleanup()
        settleResolve(!!next)
      }

      const check = () => {
        if (!visible || closingRef.current) {
          settle(false)
          return
        }
        if (hasPlaybackStarted() || hasTimeAdvanced()) {
          settle(true)
          return
        }
        try {
          if (!el.paused) {
            rafId = requestAnimationFrame(check)
          }
        } catch {}
      }

      const onPlaying = () => {
        settle(true)
      }

      const onTimeUpdate = () => {
        if (hasPlaybackStarted() || hasTimeAdvanced()) settle(true)
      }

      try {
        el.addEventListener('playing', onPlaying, { passive: true })
        el.addEventListener('timeupdate', onTimeUpdate, { passive: true })
      } catch {}

      try {
        if (typeof el.requestVideoFrameCallback === 'function') {
          frameHandle = el.requestVideoFrameCallback(() => {
            settle(true)
          })
        }
      } catch {}

      confirmTimer = window.setTimeout(() => {
        settle(hasPlaybackStarted() || hasTimeAdvanced())
      }, Math.max(120, Number(timeoutMs || 0)))

      rafId = requestAnimationFrame(check)

      return {
        cancel: () => settle(false),
        promise: new Promise((resolve) => {
          settleResolve = resolve
        }),
      }
    },
    [hasPlaybackStarted, visible]
  )

  const attemptAudibleUpgrade = useCallback(
    async (reason = 'muted_upgrade') => {
      const el = videoRef.current
      if (!el) return false
      if (!visible || closingRef.current || doneRef.current) return false
      if (FORUM_SPLASH_TRY_SOUND_AUTOPLAY !== 1) return false
      if (playbackPhaseRef.current !== 'muted') return false
      if (audibleUpgradeInFlightRef.current) return false
      if (
        audibleUpgradeAttemptsRef.current >= FORUM_SPLASH_AUDIBLE_UPGRADE_MAX_ATTEMPTS
      ) {
        return false
      }

      audibleUpgradeInFlightRef.current = true
      audibleUpgradeAttemptsRef.current += 1

      const startedAt = Number(el.currentTime || 0)
      let pauseSeen = false
      let settled = false
      let rafId = 0
      let timerId = 0

      const cleanup = () => {
        try {
          el.removeEventListener('pause', onPause)
        } catch {}
        try {
          if (rafId) cancelAnimationFrame(rafId)
        } catch {}
        rafId = 0
        try {
          if (timerId) clearTimeout(timerId)
        } catch {}
        timerId = 0
      }

      const onPause = () => {
        pauseSeen = true
      }

      const confirmUpgrade = () =>
        new Promise((resolve) => {
          const settle = (next) => {
            if (settled) return
            settled = true
            cleanup()
            resolve(!!next)
          }

          const check = () => {
            if (!visible || closingRef.current || doneRef.current) {
              settle(false)
              return
            }

            const advanced = Number(el.currentTime || 0) > startedAt + 0.02
            if (!pauseSeen && !el.paused && !el.muted && advanced) {
              settle(true)
              return
            }

            rafId = requestAnimationFrame(check)
          }

          try {
            el.addEventListener('pause', onPause, { passive: true })
          } catch {}

          timerId = window.setTimeout(() => {
            const advanced = Number(el.currentTime || 0) > startedAt + 0.02
            settle(!pauseSeen && !el.paused && !el.muted && advanced)
          }, Math.max(240, Number(FORUM_SPLASH_AUDIBLE_UPGRADE_CONFIRM_MS || 0)))

          rafId = requestAnimationFrame(check)
        })

      try {
        applyMuteState(false)
        try {
          el.volume = Math.max(0, Math.min(1, Number(FORUM_SPLASH_VOLUME || 1)))
        } catch {}
        const p = el.play?.()
        if (p && typeof p.then === 'function') {
          await p
        }

        const ok = await confirmUpgrade()
        if (ok) {
          playbackPhaseRef.current = 'sound'
          setSoundBlocked(false)
          debugLog('audible_upgrade_ok', { reason })
          return true
        }
      } catch (err) {
        debugLog('audible_upgrade_reject', {
          reason,
          name: String(err?.name || ''),
          message: String(err?.message || ''),
        })
      } finally {
        cleanup()
        settled = true
        audibleUpgradeInFlightRef.current = false
      }

      try {
        applyMuteState(true)
        const retry = el.play?.()
        if (retry && typeof retry.then === 'function') {
          retry.catch(() => {})
        }
      } catch {}
      setSoundBlocked(true)
      debugLog('audible_upgrade_fallback_muted', { reason })
      return false
    },
    [applyMuteState, debugLog, setSoundBlocked, visible]
  )

  const captureStartGesture = useCallback((source = 'gesture') => {
    if (!visible || closingRef.current || doneRef.current) return
    const isFirstGesture = !gestureCapturedRef.current
    gestureCapturedRef.current = true
    setShowFallback(false)

    debugLog('user_gesture', {
      source,
      firstGesture: isFirstGesture,
      phase: playbackPhaseRef.current,
      ready: playbackReadyRef.current,
      blocked: soundAutoplayBlockedRef.current,
    })

    if (playbackPhaseRef.current === 'muted' || soundAutoplayBlockedRef.current) {
      void attemptAudibleUpgrade(`${source}:muted_upgrade`)
    }

    try {
      if (!playbackReadyRef.current || !hasPlaybackStarted()) {
        ensurePlaybackRef.current?.(`${source}:play`)
      }
    } catch {}
  }, [attemptAudibleUpgrade, debugLog, hasPlaybackStarted, visible])

  const tryPlay = useCallback(
    async (wantMuted, reason) => {
      const el = videoRef.current
      if (!el) return { ok: false, blocked: false }
      if (!visible || closingRef.current) return { ok: false, blocked: false }

      primeVideo()
      applyMuteState(wantMuted)

      try {
        if (el.ended) {
          try {
            el.currentTime = 0
          } catch {}
        }
      } catch {}

      const playbackEvidence = createPlaybackEvidenceWaiter(
        FORUM_SPLASH_PLAY_CONFIRM_MS,
        Number(el.currentTime || 0),
      )

      try { 
        const p = el.play?.()
        if (p && typeof p.then === 'function') {
          await p
        }
        if (hasPlaybackStarted()) {
          playbackEvidence.cancel()
          debugLog('play_ok_immediate', { reason, muted: !!wantMuted })
          markReady()
          return { ok: true, blocked: false }
        }
        if (await playbackEvidence.promise) {
          debugLog('play_ok', { reason, muted: !!wantMuted })
          markReady()
          if (wantMuted) {
            void attemptAudibleUpgrade(`${reason}:post_start`)
          }
          return { ok: true, blocked: false }
        }
      } catch (err) {
        playbackEvidence.cancel()
        debugLog('play_reject', {
          reason,
          muted: !!wantMuted,
          name: String(err?.name || ''),
          message: String(err?.message || ''),
        })
        return { ok: false, blocked: isAutoplayBlockError(err) }
      }

      return { ok: false, blocked: false }
    },
    [
      applyMuteState,
      createPlaybackEvidenceWaiter,
      isAutoplayBlockError,
      hasPlaybackStarted,
      markReady,
      primeVideo,
      attemptAudibleUpgrade,
      debugLog,
      visible,
    ]
  )

  const enterMutedFallback = useCallback(
    (reason) => {
      if (playbackPhaseRef.current === 'muted') return
      playbackPhaseRef.current = 'muted'
      phaseStartedAtRef.current = nowMs()
      retryStageRef.current = 0
      restartPlaybackTransport(reason)
      setSoundBlocked(true)
      debugLog('enter_muted_fallback', {
        reason,
        soundAttempts: soundAttemptsRef.current,
      })
    },
    [debugLog, nowMs, restartPlaybackTransport, setSoundBlocked]
  )

  const scheduleRetry = useCallback((reason = 'retry', { rearm = false, force = false } = {}) => {
    if (!visible || closingRef.current) return
    if (playbackReadyRef.current && !force) return
    if (rearm) retryStageRef.current = 0
    if (retryTotalRef.current >= 16) {
      debugLog('retry_budget_exhausted', { reason })
      return
    }
    const delays =
      playbackPhaseRef.current === 'sound'
        ? [60, 120, 180]
        : [90, 180, 280, 420, 640, 920, 1280, 1800]
    const delay = delays[Math.min(retryStageRef.current, delays.length - 1)]
    retryStageRef.current += 1
    retryTotalRef.current += 1
    clearTimer(retryTimerRef)
    retryTimerRef.current = window.setTimeout(() => {
      try {
        ensurePlaybackRef.current?.(reason)
      } catch {}
    }, playbackPhaseRef.current === 'sound' ? delay : Math.max(FORUM_SPLASH_RETRY_MS, delay))
  }, [debugLog, visible])

  const ensurePlayback = useCallback(
    async (reason = 'manual') => {
      const el = videoRef.current
      if (!el) return
      if (!visible || closingRef.current) return

      primeVideo()

      if (
        playbackPhaseRef.current === 'sound' &&
        FORUM_SPLASH_TRY_SOUND_AUTOPLAY === 1
      ) {
        soundAttemptsRef.current += 1
        const soundResult = await tryPlay(false, `${reason}:sound`)
        if (soundResult.ok) {
          setSoundBlocked(false)
          return
        }

        const soundPhaseElapsed = Math.max(0, nowMs() - phaseStartedAtRef.current)
        const shouldUseMutedFallback =
          FORUM_SPLASH_ALLOW_MUTED_FALLBACK === 1 &&
          (
            soundResult.blocked ||
            soundAttemptsRef.current >= FORUM_SPLASH_SOUND_MAX_ATTEMPTS ||
            soundPhaseElapsed >= FORUM_SPLASH_SOUND_START_BUDGET_MS
          )

        if (!shouldUseMutedFallback) {
          scheduleRetry(reason)
          return
        }

        enterMutedFallback(
          soundResult.blocked
            ? `${reason}:sound_blocked`
            : `${reason}:sound_budget`
        )
      }

      if (
        (playbackPhaseRef.current === 'muted' ||
          FORUM_SPLASH_TRY_SOUND_AUTOPLAY !== 1) &&
        (FORUM_SPLASH_ALLOW_MUTED_FALLBACK === 1 ||
          FORUM_SPLASH_TRY_SOUND_AUTOPLAY !== 1)
      ) {
        if (mutedAttemptsRef.current >= FORUM_SPLASH_MUTED_MAX_ATTEMPTS) {
          debugLog('muted_retry_budget_exhausted', { reason })
          return
        }
        mutedAttemptsRef.current += 1
        const mutedResult = await tryPlay(true, `${reason}:muted`)
        if (mutedResult.ok) return
      }

      scheduleRetry(reason)
    },
    [
      enterMutedFallback,
      nowMs,
      primeVideo,
      scheduleRetry,
      setSoundBlocked,
      tryPlay,
      debugLog,
      visible,
    ]
  )

  ensurePlaybackRef.current = ensurePlayback

  useBrowserLayoutEffect(() => {
    if (!visible) return undefined
    try {
      if (typeof window !== 'undefined') window.__forumBootSplashShown = 1
    } catch {}
    playbackPhaseRef.current =
      FORUM_SPLASH_TRY_SOUND_AUTOPLAY === 1 ? 'sound' : 'muted'
    phaseStartedAtRef.current = nowMs()
    soundAttemptsRef.current = 0
    mutedAttemptsRef.current = 0
    audibleUpgradeAttemptsRef.current = 0
    audibleUpgradeInFlightRef.current = false
    retryStageRef.current = 0
    retryTotalRef.current = 0
    muteHoldReleasedRef.current = false
    setSoundBlocked(FORUM_SPLASH_TRY_SOUND_AUTOPLAY !== 1)
    setSplashActiveFlag(true)
    syncForumMutedState(true, 'forum-splash')
    primeVideo()
    ensurePlayback('layout_mount')
    return undefined
  }, [
    ensurePlayback,
    nowMs,
    primeVideo,
    setSoundBlocked,
    setSplashActiveFlag,
    syncForumMutedState,
    debugLog,
    visible,
  ])

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
    syncForumMutedState(true, 'forum-splash')

    clearTimer(fallbackTimerRef)
    fallbackTimerRef.current = window.setTimeout(() => {
      if (!playbackReadyRef.current && !closingRef.current) {
        setShowFallback(true)
      }
    }, Math.max(0, Number(FORUM_SPLASH_FALLBACK_DELAY_MS || 0)))

    armFailsafe(FORUM_SPLASH_FAILSAFE_MS)

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

      releaseMuteHold('forum-splash-cleanup')
    }
  }, [
    armFailsafe,
    finish,
    onDone,
    releaseMuteHold,
    scheduleRetry,
    setSplashActiveFlag,
    syncForumMutedState,
    debugLog,
    visible,
  ])

  useEffect(() => {
    if (visible) return
    if (doneRef.current) return
    try {
      onDone?.()
    } catch {}
  }, [onDone, visible])

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
        onPointerDown={() => {
          captureStartGesture('overlay-pointer')
        }}
      >
        <div className="forum-boot-splash__frame">
          <video
            ref={videoRef}
            className="forum-boot-splash__video"
            src={FORUM_SPLASH_VIDEO_SRC}
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            onLoadedMetadata={() => {
              const el = videoRef.current
              const durationMs = Number(el?.duration || 0) * 1000
              if (Number.isFinite(durationMs) && durationMs > 0) {
                armFailsafe(computeFailsafeMs(durationMs))
              }
              scheduleRetry('loadedmetadata', { rearm: true })
            }}
            onLoadedData={() => {
              scheduleRetry('loadeddata', { rearm: true })
            }}
            onCanPlay={() => {
              scheduleRetry('canplay', { rearm: true })
            }}
            onCanPlayThrough={() => {
              scheduleRetry('canplaythrough', { rearm: true })
            }}
            onPlaying={() => {
              markReady()
            }}
            onPause={() => {
              const el = videoRef.current
              if (!el) return
              if (closingRef.current) return
              if (el.ended) return
              playbackReadyRef.current = false
              scheduleRetry('pause', { rearm: true, force: true })
            }}
            onWaiting={() => {
              playbackReadyRef.current = false
              scheduleRetry('waiting', { rearm: true, force: true })
            }}
            onStalled={() => {
              playbackReadyRef.current = false
              scheduleRetry('stalled', { rearm: true, force: true })
            }}
            onSuspend={() => {
              playbackReadyRef.current = false
              scheduleRetry('suspend', { rearm: true, force: true })
            }}
            onEnded={() => {
              if (FORUM_SPLASH_CLOSE_ON_VIDEO_END === 1) {
                finish()
              }
            }}
            onError={() => {
              playbackReadyRef.current = false
              scheduleRetry('error', { rearm: true, force: true })
            }}
            data-forum-splash="1"
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
