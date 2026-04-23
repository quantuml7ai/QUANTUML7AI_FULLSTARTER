'use client' 
 
import { useCallback, useEffect, useRef, useState } from 'react'

function isAudibleMediaElement(el) {
  if (!el) return false

  const tag = String(el.tagName || '').toLowerCase()
  if (tag !== 'audio' && tag !== 'video') return false

  try {
    if (el.muted) return false
  } catch {}

  try {
    if (typeof el.volume === 'number' && el.volume <= 0) return false
  } catch {}

  return true
}

function findAudibleMediaInNode(node) {
  if (!node) return null

  if (isAudibleMediaElement(node)) return node

  try {
    if (typeof node.querySelectorAll === 'function') {
      const list = node.querySelectorAll('audio,video')
      for (const el of list) {
        if (isAudibleMediaElement(el)) return el
      }
    }
  } catch {}

  return null
}

function eventMeansAudibleOtherMedia(detail) {
  const d = detail || {}
  if (d.source === 'bg-audio') return false

  if (typeof d.audible === 'boolean') return d.audible
  if (typeof d.muted === 'boolean') return !d.muted

  const audibleEl = findAudibleMediaInNode(d.element)
  return !!audibleEl
}

export default function BgAudio({
  src = '/audio/cosmic.mp3',
  defaultVolume = 0.35,
  className = '',
}) {
  const audioRef = useRef(null)
  const volRef = useRef(defaultVolume)

  const [vol, setVol] = useState(defaultVolume)
  const [playing, setPlaying] = useState(false)
  const [locked, setLocked] = useState(true)
 
  useEffect(() => {
    volRef.current = vol
    const a = audioRef.current
    if (!a) return
    try {
      a.volume = vol
    } catch {}
  }, [vol])

  const emitBgAudioPlay = useCallback((el) => {
    try {
      window.dispatchEvent(
        new CustomEvent('site-media-play', {
          detail: {
            source: 'bg-audio',
            element: el,
            audible: true,
            muted: false,
          },
        })
      )
    } catch {}
  }, [])

  const stopPlayback = useCallback((resetToStart = true) => {
    const a = audioRef.current
    if (!a) return

    try { a.pause() } catch {}
    if (resetToStart) {
      try { a.currentTime = 0 } catch {}
    }

    setPlaying(false)
  }, [])

  const playWithSound = useCallback(async () => {
    const a = audioRef.current
    if (!a) return false

    try {
      const duration = Number(a.duration)

      if (
        a.ended ||
        (Number.isFinite(duration) && duration > 0 && a.currentTime >= duration)
      ) {
        try { a.currentTime = 0 } catch {}
      }

      a.loop = false
      a.muted = false
      a.playsInline = true

      try {
        a.volume = volRef.current
      } catch {}

      await a.play()

      setPlaying(true)
      setLocked(false)
      emitBgAudioPlay(a)
      return true
    } catch {
      return false
    }
  }, [emitBgAudioPlay])

  /* =========================
     1) АВТОСТАРТ ПРИ МОНТАЖЕ
     - пробуем со звуком
     - если браузер блокирует, ждём первый жест
  ========================= */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    let cancelled = false

    ;(async () => {
      const ok = await playWithSound()
      if (cancelled) return

      if (!ok) {
        try { a.pause() } catch {}
        try { a.currentTime = 0 } catch {}
        try { a.muted = false } catch {}

        setPlaying(false)
        setLocked(true)
      }
    })()

    return () => {
      cancelled = true
      try { a.pause() } catch {}
    } 
  }, [src, playWithSound])

  /* =========================
     2) РАЗБЛОКИРОВКА ПО ПЕРВОМУ ЖЕСТУ
  ========================= */
  useEffect(() => {
    const a = audioRef.current
    if (!a || !locked) return () => {}

    let detached = false
    const captureOptions = true
 
    const detach = () => {
      if (detached) return
      detached = true

      window.removeEventListener('pointerdown', onGesture, captureOptions)
      window.removeEventListener('click', onGesture, captureOptions)
      window.removeEventListener('keydown', onGesture, captureOptions)
      window.removeEventListener('touchstart', onGesture, captureOptions)
    }

    const enableSound = async () => {
      const ok = await playWithSound()
      if (ok) detach()
    }

    const onGesture = (e) => {
      const target = e?.target

      if (target && typeof target.closest === 'function') {
        if (target.closest('.audio-toggle')) return
      }

      void enableSound()
    }

    window.addEventListener('pointerdown', onGesture, captureOptions)
    window.addEventListener('click', onGesture, captureOptions)
    window.addEventListener('keydown', onGesture, captureOptions)
    window.addEventListener('touchstart', onGesture, captureOptions)

    return () => {
      detach()
    }
  }, [locked, playWithSound])

  /* =========================
     3) КООРДИНАЦИЯ АУДИО
     - стопаемся только от реально слышимого
       чужого audio/video
  ========================= */
  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    const hardStopBecauseOtherAudioStarted = () => {
      if (a.paused) return
      stopPlayback(true)
    }

    const onMediaPlay = (e) => {
      const d = e?.detail || {}
      if (!eventMeansAudibleOtherMedia(d)) return
      hardStopBecauseOtherAudioStarted()
    }

    const onAnyPlay = (e) => {
      const target = e.target
      if (target === a) return
      if (!isAudibleMediaElement(target)) return
      hardStopBecauseOtherAudioStarted()
    }

    window.addEventListener('site-media-play', onMediaPlay)
    document.addEventListener('play', onAnyPlay, true)

    return () => {
      window.removeEventListener('site-media-play', onMediaPlay)
      document.removeEventListener('play', onAnyPlay, true)
    }
  }, [stopPlayback])

  /* =========================
     4) КНОПКА ВКЛ / ВЫКЛ
     - OFF => play with sound
     - ON  => hard stop
  ========================= */
  const toggle = useCallback(async (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    const a = audioRef.current
    if (!a) return

    if (playing && !a.paused) {
      stopPlayback(true)
      return
    }

    await playWithSound()
  }, [playing, playWithSound, stopPlayback])

  /* =========================
     5) КОЛЁСИКО — ГРОМКОСТЬ
  ========================= */
  const onWheelVolume = useCallback((e) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    const nv = Math.max(0, Math.min(1, +(vol + delta).toFixed(2)))
    setVol(nv)
  }, [vol])

  const isOn = playing && !locked && !audioRef.current?.muted

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        playsInline
        loop={false}
        aria-hidden="true"
        onEnded={() => {
          try {
            if (audioRef.current) audioRef.current.currentTime = 0
          } catch {}
          setPlaying(false)
          setLocked(false)
        }}
      />

      <button
        className={`audio-toggle ${isOn ? 'on' : 'off'} ${className}`}
        onClick={toggle}
        onWheel={onWheelVolume}
        type="button"
        title={
          isOn
            ? `Sound on • ${Math.round(vol * 100)}% (wheel to change)`
            : locked
              ? 'Enable sound'
              : 'Play background audio'
        }
        aria-label="Toggle background audio"
      >
        <span className="audio-toggle__visual" aria-hidden="true">
          <img
            className="audio-toggle__gif"
            src="/audio/bgaudio.gif"
            alt=""
            draggable="false"
          />
          <span className="audio-toggle__slash" />
        </span>
      </button>
    </>
  )
} 