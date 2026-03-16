'use client'

import React from 'react'

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
  onError: onErrorProp,
  'data-forum-media': dataForumMedia,
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
  const mutedEvent = String(mutedEventName || 'forum:media-mute')
  const mediaVisMargin = Number.isFinite(Number(mediaVisMarginPx)) ? Number(mediaVisMarginPx) : 380
  const preloadMode = String(preload || 'none').trim().toLowerCase() || 'none'

  const readMuted = React.useCallback(() => {
    try {
      return typeof readMutedPref === 'function' ? readMutedPref() : null
    } catch {
      return null
    }
  }, [readMutedPref])

  const writeMuted = React.useCallback(
    (nextMuted) => {
      try {
        if (typeof writeMutedPref === 'function') writeMutedPref(!!nextMuted)
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

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const s = String(src || '')
    el.dataset.__src = s
    try {
      if (s) el.setAttribute('data-src', s)
      else el.removeAttribute('data-src')
    } catch {}
    try {
      const wantsWarm = el.dataset?.__prewarm === '1' || el.dataset?.__active === '1'
      const effectivePreload = wantsWarm && preloadMode === 'none' ? 'auto' : preloadMode
      el.preload = effectivePreload
    } catch {}
    if (poster) {
      try {
        el.dataset.__posterOriginal = String(poster)
        el.setAttribute('poster', String(poster))
      } catch {}
    }
  }, [src, poster, preloadMode])

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    const initial = readMuted()
    const nextMuted = typeof initial === 'boolean' ? initial : !!autoPlay
    try {
      el.muted = !!nextMuted
      el.defaultMuted = !!nextMuted
      if (nextMuted) el.setAttribute('muted', '')
      else el.removeAttribute('muted')
    } catch {}

    const onVol = () => {
      try {
        const m = !!el.muted
        writeMuted(m)
        window.dispatchEvent(
          new CustomEvent(mutedEvent, {
            detail: { muted: m, source: 'video', id: el.dataset.__mid || null },
          }),
        )
      } catch {}
    }

    const onMutedEvent = (e) => {
      try {
        if (!ref.current) return
        const m = e?.detail?.muted
        if (typeof m !== 'boolean') return
        if (ref.current.muted !== m) ref.current.muted = m
        ref.current.defaultMuted = m
        if (m) ref.current.setAttribute('muted', '')
        else ref.current.removeAttribute('muted')
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
  }, [autoPlay, mutedEvent, readMuted, writeMuted])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    let io = null
    let active = false
    let unloadTimer = null
    const warmKeepMargin = Math.max(560, Math.round(mediaVisMargin * 1.9))
    const runtimeProfile = (() => {
      try {
        const ua = String(navigator?.userAgent || '')
        const isIOS = /iP(hone|ad|od)/i.test(ua)
        const isAndroid = /Android/i.test(ua)
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
        const dm = Number(navigator?.deviceMemory || 0)
        const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
        if (isIOS) return { unloadDelayMs: 3200, hardUnloadOnInactive: false }
        if (lowMem) return { unloadDelayMs: 2400, hardUnloadOnInactive: true }
        if (isAndroid || coarse) return { unloadDelayMs: 3600, hardUnloadOnInactive: false }
        return { unloadDelayMs: 4200, hardUnloadOnInactive: false }
      } catch {
        return { unloadDelayMs: 3200, hardUnloadOnInactive: false }
      }
    })()

    const shouldKeepWarmResident = () => {
      try {
        if (!el?.isConnected) return false
        const warmFlag = el.dataset?.__prewarm === '1'
        if (warmFlag) return true
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
          if ((el.readyState === 0 || !el.currentSrc) && el.paused && (el.currentTime === 0)) {
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
    dropActiveVideoFn,
    enforceActiveVideoCapFn,
    isVideoNearViewportFn,
    mediaVisMargin,
    restoreVideoElFn,
    touchActiveVideoFn,
    unloadVideoElFn,
  ])

  const onVideoError = React.useCallback(
    (e) => {
      const el = ref.current
      if (!el) {
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
    [onErrorProp],
  )

  const onVideoLoaded = React.useCallback(() => {
    try {
      const el = ref.current
      if (!el) return
      el.dataset.__recoverTry = '0'
      const revealPoster = () => {
        try {
          if (!el.isConnected) return
          if ((el.readyState || 0) < 2) return
          if (el.dataset?.__posterRevealed === '1') return
          el.dataset.__posterRevealed = '1'
          el.removeAttribute('poster')
        } catch {}
      }
      try {
        if (typeof el.requestVideoFrameCallback === 'function') {
          el.requestVideoFrameCallback(() => revealPoster())
        } else {
          requestAnimationFrame(() => revealPoster())
        }
      } catch {
        revealPoster()
      }
    } catch {}
  }, [])

  return (
    <video
      ref={ref}
      data-forum-media={dataForumMedia}
      playsInline={playsInline}
      poster={poster}
      preload={preload}
      controls={controls}
      autoPlay={autoPlay}
      loop={loop}
      controlsList={controlsList}
      disablePictureInPicture={disablePictureInPicture}
      className={className}
      style={style}
      onLoadedData={onVideoLoaded}
      onCanPlay={onVideoLoaded}
      onError={onVideoError}
      {...rest}
    />
  )
}
