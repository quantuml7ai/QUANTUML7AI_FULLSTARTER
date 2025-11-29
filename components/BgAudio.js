// components/BgAudio.js
'use client'

import { useEffect, useRef, useState } from 'react'

export default function BgAudio({
  src = '/audio/cosmic.mp3',
  defaultVolume = 0.35,
  className = '',
}) {
  const audioRef = useRef(null)
  const [vol, setVol] = useState(defaultVolume)
  const [playing, setPlaying] = useState(false)
  const [locked, setLocked] = useState(true) // true = браузер не дал играть со звуком

  // Громкость держим актуальной
  useEffect(() => {
    if (audioRef.current) {
      try {
        audioRef.current.volume = vol
      } catch {}
    }
  }, [vol])

  // 1) При МОНТАЖЕ сразу пробуем играть СО ЗВУКОМ (но БЕЗ loop)
  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    let cancelled = false

    ;(async () => {
      try {
        a.muted = false
        a.playsInline = true
        await a.play()                // попытка громко
        if (cancelled) return
        setPlaying(true)
        setLocked(false)
      } catch {
        // Браузер зарубил — крутим ТИХО и ждём жест
        try {
          a.muted = true
          a.playsInline = true
          await a.play().catch(() => {})
        } catch {}
        if (cancelled) return
        setPlaying(false)
        setLocked(true)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [src])

  // 2) Если locked === true → первый жест юзера включает звук
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (!locked) return  // уже разблокировано — ничего не вешаем

    let removed = false

    const enableSound = async () => {
      if (!audioRef.current) return
      try {
        audioRef.current.muted = false
        await audioRef.current.play()
        setPlaying(true)
        setLocked(false)
        detach()
      } catch {
        // всё ещё заблокировано — оставляем слушатели, попробуем на следующем жесте
      }
    }

    const onGesture = () => {
      // любой жест → пробуем включить звук
      enableSound()
    }

    function attach() {
      if (removed) return
      window.addEventListener('pointerdown', onGesture, true)
      window.addEventListener('click',       onGesture, true)
      window.addEventListener('keydown',     onGesture, true)
      window.addEventListener('wheel',       onGesture, { passive: true, capture: true })
      window.addEventListener('touchstart',  onGesture, { passive: true, capture: true })
      window.addEventListener('touchmove',   onGesture, { passive: true, capture: true })
    }

    function detach() {
      if (removed) return
      removed = true
      window.removeEventListener('pointerdown', onGesture, true)
      window.removeEventListener('click',       onGesture, true)
      window.removeEventListener('keydown',     onGesture, true)
      window.removeEventListener('wheel',       onGesture, true)
      window.removeEventListener('touchstart',  onGesture, true)
      window.removeEventListener('touchmove',   onGesture, true)
    }

    attach()
    return detach
  }, [locked])

  // 3) Кнопка-динамик: локальный on/off
  const toggle = async () => {
    const a = audioRef.current
    if (!a) return

    if (playing) {
      try { a.pause() } catch {}
      setPlaying(false)
    } else {
      try {
        a.muted = false
        await a.play()
        setPlaying(true)
        setLocked(false)
      } catch {
        // если опять зарубили — оставим как есть, жест всё равно уже был
      }
    }
  }

  // 4) Колёсико — громкость
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
        preload="auto"
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
