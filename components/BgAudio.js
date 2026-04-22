// components/BgAudio.js
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export default function BgAudio({
  src = '/audio/cosmic.mp3',
  defaultVolume = 0.35,
  className = '',
}) {
  const audioRef = useRef(null)
  const [vol, setVol] = useState(defaultVolume)
  const [playing, setPlaying] = useState(false)
  const [locked, setLocked] = useState(true) // браузер запретил autoplay со звуком

  const emitAudiblePlayback = useCallback(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('site-media-audible', {
          detail: { source: 'bg-audio', element: audioRef.current || null },
        })
      )
    } catch {}
  }, [])

  /* =========================
     ГРОМКОСТЬ
  ========================= */
  useEffect(() => {
    if (audioRef.current) {
      try {
        audioRef.current.volume = vol
      } catch {}
    }
  }, [vol])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return undefined
    const sync = () => {
      try {
        setPlaying(!a.paused)
      } catch {}
    }
    sync()
    try { a.addEventListener('play', sync) } catch {}
    try { a.addEventListener('pause', sync) } catch {}
    try { a.addEventListener('ended', sync) } catch {}
    return () => {
      try { a.removeEventListener('play', sync) } catch {}
      try { a.removeEventListener('pause', sync) } catch {}
      try { a.removeEventListener('ended', sync) } catch {}
    }
  }, [])

  const unlockAudiblePlayback = useCallback(async () => {
    const el = audioRef.current
    if (!el) return false
    try {
      el.muted = false
      el.defaultMuted = false
      let playPromise = null
      if (el.paused) playPromise = el.play?.()
      if (playPromise && typeof playPromise.then === 'function') {
        await playPromise
      }
      setPlaying(!el.paused)
      setLocked(false)
      emitAudiblePlayback()
      window.dispatchEvent(
        new CustomEvent('site-media-play', {
          detail: { source: 'bg-audio' },
        })
      )
      return true
    } catch {
      return false
    }
  }, [emitAudiblePlayback])

  /* =========================
     1) АВТОСТАРТ ПРИ МОНТАЖЕ
  ========================= */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    let cancelled = false

    ;(async () => {
      try {
        a.muted = false
        a.playsInline = true
        await a.play()
        if (cancelled) return

        setPlaying(true)
        setLocked(false)

        // сообщаем: BG Audio играет
        window.dispatchEvent(
          new CustomEvent('site-media-play', {
            detail: { source: 'bg-audio' },
          })
        )
        emitAudiblePlayback()
      } catch {
        // autoplay со звуком запрещён → играем тихо
        try {
          a.muted = true
          a.playsInline = true
          await a.play().catch(() => {})
        } catch {}
        if (cancelled) return
        setPlaying(!a.paused)
        setLocked(true)
      }
    })()

    return () => {
      cancelled = true
      try { a.pause() } catch {}
      try { a.removeAttribute('src') } catch {}
      try { a.load?.() } catch {}
    }
  }, [emitAudiblePlayback, src])

  /* =========================
     2) РАЗБЛОКИРОВКА ПО ЖЕСТУ
  ========================= */
  useEffect(() => {
    const a = audioRef.current
    if (!a || !locked) return () => {}

    let detached = false
    const captureOptions = true
    const passiveCaptureOptions = { passive: true, capture: true }

    const detach = () => {
      if (detached) return
      detached = true
      window.removeEventListener('pointerdown', onGesture, captureOptions)
      window.removeEventListener('click', onGesture, captureOptions)
      window.removeEventListener('keydown', onGesture, captureOptions)
      window.removeEventListener('wheel', onGesture, passiveCaptureOptions)
      window.removeEventListener('touchstart', onGesture, passiveCaptureOptions)
      window.removeEventListener('touchmove', onGesture, passiveCaptureOptions)
    }

    const enableSound = async () => {
      const ok = await unlockAudiblePlayback()
      if (ok) detach()
    }

    const onGesture = () => {
      void enableSound()
    }

    window.addEventListener('pointerdown', onGesture, captureOptions)
    window.addEventListener('click', onGesture, captureOptions)
    window.addEventListener('keydown', onGesture, captureOptions)
    window.addEventListener('wheel', onGesture, passiveCaptureOptions)
    window.addEventListener('touchstart', onGesture, passiveCaptureOptions)
    window.addEventListener('touchmove', onGesture, passiveCaptureOptions)

    return () => {
      detach()
    }
  }, [locked, unlockAudiblePlayback])

  /* =========================
     3) КООРДИНАЦИЯ АУДИО
     (основной + fallback)
  ========================= */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    // A) основной путь — кастомное событие
    const isActuallyAudibleMedia = (target) => {
      try {
        if (!(target instanceof HTMLMediaElement)) return false
        if (!!target.muted) return false
        return Number(target.volume ?? 1) > 0.01
      } catch {
        return false
      }
    }

    const onMediaPlay = (e) => {
      if (e?.detail?.source === 'bg-audio') return
      if (!a.paused) {
        try { a.pause() } catch {}
        setPlaying(false)
      }
    }

    // B) fallback — любой play в документе
    const onAnyPlay = (e) => {
      const target = e.target
      if (target === a) return
      if (!isActuallyAudibleMedia(target)) return
      if (!a.paused) {
        try { a.pause() } catch {}
        setPlaying(false)
      }
    }

    window.addEventListener('site-media-audible', onMediaPlay)
    document.addEventListener('play', onAnyPlay, true)

    return () => {
      window.removeEventListener('site-media-audible', onMediaPlay)
      document.removeEventListener('play', onAnyPlay, true)
    }
  }, [])

  /* =========================
     4) КНОПКА ВКЛ / ВЫКЛ
  ========================= */
  const toggle = async () => {
    const a = audioRef.current
    if (!a) return

    if (playing) {
      try { a.pause() } catch {}
      setPlaying(false)
    } else {
      const ok = await unlockAudiblePlayback()
      if (!ok) {
        try {
          a.muted = false
          await a.play()
          setPlaying(true)
          setLocked(false)
          window.dispatchEvent(
            new CustomEvent('site-media-play', {
              detail: { source: 'bg-audio' },
            })
          )
          emitAudiblePlayback()
        } catch {}
      }
    }
  }

  /* =========================
     5) КОЛЁСИКО — ГРОМКОСТЬ
  ========================= */
  const onWheelVolume = (e) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    const nv = Math.max(0, Math.min(1, +(vol + delta).toFixed(2)))
    setVol(nv)
  }

  const isOn = playing && !locked

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        playsInline
        aria-hidden="true"
      />
      <button
        className={`audio-toggle ${isOn ? 'on' : 'off'} ${className}`}
        onClick={toggle}
        onWheel={onWheelVolume}
        type="button"
        title={
          isOn
            ? `Sound on • ${Math.round(vol * 100)}% (wheel to change)`
            : 'Enable sound'
        }
        aria-label="Toggle background audio"
      >
        <span className="ico">{isOn ? '🔊' : '🔇'}</span>
      </button>
    </>
  )
}
