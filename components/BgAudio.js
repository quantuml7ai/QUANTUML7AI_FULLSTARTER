// components/BgAudio.js
'use client'

import { useEffect, useRef, useState } from 'react'

export default function BgAudio({ src = '/audio/cosmic.mp3', defaultVolume = 0.35, className = '' }) {
  const audioRef = useRef(null)
  const userToggledRef = useRef(false) // чтобы не перебивать явный выбор «Off» в рамках СЕССИИ
  const [vol, setVol] = useState(defaultVolume)
  const [enabled, setEnabled] = useState(true)   // по умолчанию — ВСЕГДА ВКЛ при заходе
  const [locked, setLocked] = useState(true)     // нужен «жест» для звука?

  // восстановить ТОЛЬКО громкость пользователя (звук не помним — всегда автозапуск)
  useEffect(() => {
    try {
      const savedVol = parseFloat(localStorage.getItem('ql7_audio_volume'))
      if (!Number.isNaN(savedVol)) {
        setVol(Math.max(0, Math.min(1, savedVol)))
      }
    } catch {}
  }, [])

  // поддерживать громкость
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = vol
  }, [vol])

  // 1) сразу пробуем играть со звуком; если нельзя — тихий цикл (muted) и ждём жест
  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    ;(async () => {
      try {
        if (enabled) {
          a.muted = false
          await a.play()               // попытка со звуком
          setLocked(false)             // получилось
        } else {
          a.muted = true               // пользовательский Off: тихий цикл
          await a.play().catch(() => {})
          setLocked(true)
        }
      } catch {
        // браузер заблокировал — запускаем тихо и ждём жест
        try {
          a.muted = true
          await a.play().catch(() => {})
        } finally {
          setLocked(true)
        }
      }
    })()
  }, [enabled])

  // 2) глобальная разблокировка звука по ЛЮБОМУ действию пользователя
  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    // Если уже играет со звуком или пользователь явно выключал в ЭТОЙ сессии — не вешаем слушатели
    if (!locked || (userToggledRef.current && !enabled)) return

    let removed = false
    const tryEnable = async () => {
      // Уважать явный Off пользователя в рамках текущей сессии
      if (userToggledRef.current && !enabled) return
      try {
        a.muted = false
        await a.play()
        setEnabled(true)
        setLocked(false)
        // ВАЖНО: НЕ сохраняем enabled в localStorage → новый заход = новый автозапуск
      } catch {
        // всё ещё заблокировано — ничего, ждём следующий жест
      }
    }

    const onPointer = () => { tryEnable() }
    const onKey     = () => { tryEnable() }
    const onWheel   = () => { tryEnable() }
    const onTouch   = () => { tryEnable() }

    window.addEventListener('pointerdown', onPointer, { once: true })
    window.addEventListener('keydown',     onKey,     { once: true })
    window.addEventListener('wheel',       onWheel,   { passive: true, once: true })
    window.addEventListener('touchmove',   onTouch,   { passive: true, once: true })

    return () => {
      if (removed) return
      removed = true
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown',     onKey)
      window.removeEventListener('wheel',       onWheel)
      window.removeEventListener('touchmove',   onTouch)
    }
  }, [enabled, locked])

  // кнопка-динамик: выключает/включает звук в СЕССИИ, но не на всю вечность
  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    userToggledRef.current = true
    if (enabled && !locked) {
      a.pause()
      setEnabled(false)
      // НЕ пишем ql7_audio_enabled → после reload всё равно автозапуск
    } else {
      try {
        a.muted = false
        await a.play()
        setEnabled(true)
        setLocked(false)
        // тоже ничего не сохраняем
      } catch {}
    }
  }

  // колесо мыши — изменить громкость (эту можно помнить)
  const onWheelVolume = (e) => {
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    const nv = Math.max(0, Math.min(1, +(vol + delta).toFixed(2)))
    setVol(nv)
    try { localStorage.setItem('ql7_audio_volume', String(nv)) } catch {}
  }

  // (опционально) Media Session — красивее в плеере ОС
  useEffect(() => {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new window.MediaMetadata({
          title: 'Quantum L7 Ambient',
          artist: 'Quantum L7',
          album: 'Site Background',
        })
      } catch {}
    }
  }, [])

  const isOn = enabled && !locked

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="auto"
        playsInline
        aria-hidden="true"
      />
      <button
        className={`audio-toggle ${isOn ? 'on' : 'off'} ${className}`}
        onClick={toggle}
        onWheel={onWheelVolume}
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
