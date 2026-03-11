'use client'

import React from 'react'

export default function VideoMedia({
  src,
  poster,
  className,
  style,
  preload = 'metadata',
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
  touchResidentVideo,
  enforceResidentVideoCap,
  isVideoNearViewport,
  mediaVisMarginPx,
  dropActiveVideo,
  dropResidentVideo,
  unloadVideoEl,
  primeVideoForWarmStart,
  ...rest
}) {
  const ref = React.useRef(null)
  const recoverTimerRef = React.useRef(0)
  const mutedEvent = String(mutedEventName || 'forum:media-mute')
  const mediaVisMargin = Number.isFinite(Number(mediaVisMarginPx)) ? Number(mediaVisMarginPx) : 380
  const normalizedPreload = React.useMemo(() => {
    const raw = String(preload || 'metadata').toLowerCase()
    return raw === 'none' ? 'metadata' : raw
  }, [preload])
  const [preloadMode, setPreloadMode] = React.useState(normalizedPreload)

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

  const touchResidentVideoFn = React.useCallback(
    (el) => {
      try {
        if (typeof touchResidentVideo === 'function') touchResidentVideo(el)
      } catch {}
    },
    [touchResidentVideo],
  )

  const enforceResidentVideoCapFn = React.useCallback(
    (el) => {
      try {
        if (typeof enforceResidentVideoCap === 'function') enforceResidentVideoCap(el)
      } catch {}
    },
    [enforceResidentVideoCap],
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

  const dropResidentVideoFn = React.useCallback(
    (el) => {
      try {
        if (typeof dropResidentVideo === 'function') dropResidentVideo(el)
      } catch {}
    },
    [dropResidentVideo],
  )

  const unloadVideoElFn = React.useCallback(
    (el) => {
      try {
        if (typeof unloadVideoEl === 'function') unloadVideoEl(el)
      } catch {}
    },
    [unloadVideoEl],
  )

  const primeVideoForWarmStartFn = React.useCallback(
    (el) => {
      try {
        if (typeof primeVideoForWarmStart === 'function') primeVideoForWarmStart(el)
      } catch {}
    },
    [primeVideoForWarmStart],
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
      el.preload = normalizedPreload
      el.setAttribute('preload', normalizedPreload)
    } catch {}
    if (poster) {
      try {
        el.setAttribute('poster', String(poster))
      } catch {}
    }
    setPreloadMode(normalizedPreload)
  }, [src, poster, normalizedPreload])

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    try {
      el.preload = preloadMode
      el.setAttribute('preload', preloadMode)
    } catch {}
  }, [preloadMode])

  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof window === 'undefined') return

    const initial = readMuted()
    const nextMuted = typeof initial === 'boolean' ? initial : !!autoPlay
    try {
      el.muted = !!nextMuted
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
    const runtimeProfile = (() => {
      try {
        const ua = String(navigator?.userAgent || '')
        const isIOS = /iP(hone|ad|od)/i.test(ua)
        const isAndroid = /Android/i.test(ua)
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
        const dm = Number(navigator?.deviceMemory || 0)
        const lowMem = Number.isFinite(dm) && dm > 0 && dm <= 2
        if (isIOS) return { unloadDelayMs: 7200, hardUnloadOnInactive: false, residentMarginPx: Math.max(880, Math.round(mediaVisMargin * 2.9)) }
        if (lowMem) return { unloadDelayMs: 5600, hardUnloadOnInactive: true, residentMarginPx: Math.max(760, Math.round(mediaVisMargin * 2.35)) }
        if (isAndroid || coarse) return { unloadDelayMs: 8200, hardUnloadOnInactive: false, residentMarginPx: Math.max(980, Math.round(mediaVisMargin * 3.1)) }
        return { unloadDelayMs: 7600, hardUnloadOnInactive: false, residentMarginPx: Math.max(720, Math.round(mediaVisMargin * 2.55)) }
      } catch {
        return { unloadDelayMs: 7200, hardUnloadOnInactive: false, residentMarginPx: Math.max(720, Math.round(mediaVisMargin * 2.5)) }
      }
    })()

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

        touchResidentVideoFn(el)
        enforceResidentVideoCapFn(el)
        setPreloadMode('auto')
        primeVideoForWarmStartFn(el)
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
          if (isVideoNearViewportFn(el, Math.round(runtimeProfile.residentMarginPx * 0.82))) return
          dropResidentVideoFn(el)
          dropActiveVideoFn(el)
          if (!runtimeProfile.hardUnloadOnInactive) {
            try {
              el.pause?.()
            } catch {}
            try {
              el.dataset.__active = '0'
            } catch {}
            try {
              delete el.dataset.__prewarm
              delete el.dataset.__warmLoading
              el.preload = 'metadata'
              el.setAttribute('preload', 'metadata')
            } catch {}
            setPreloadMode('metadata')
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
          rootMargin: `${runtimeProfile.residentMarginPx}px 0px ${runtimeProfile.residentMarginPx}px 0px`,
          threshold: 0.01,
        },
      )
      io.observe(el)
      if (isVideoNearViewportFn(el, Math.round(runtimeProfile.residentMarginPx * 0.78))) {
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
      dropResidentVideoFn(el)
      dropActiveVideoFn(el)
      unloadVideoElFn(el)
    }
  }, [
    dropActiveVideoFn,
    dropResidentVideoFn,
    enforceActiveVideoCapFn,
    enforceResidentVideoCapFn,
    isVideoNearViewportFn,
    mediaVisMargin,
    primeVideoForWarmStartFn,
    restoreVideoElFn,
    touchActiveVideoFn,
    touchResidentVideoFn,
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
