'use client'

import React from 'react'

export default function DmVoicePlayer({ src }) {
  const audioRef = React.useRef(null)
  const waveRef = React.useRef(null)

  const rafRef = React.useRef(0)
  const draggingRef = React.useRef(false)

  const [playing, setPlaying] = React.useState(false)
  const [dur, setDur] = React.useState(0)
  const [pos, setPos] = React.useState(0)
  const [rate, setRate] = React.useState(1)
  const rateRef = React.useRef(rate)
  React.useEffect(() => {
    rateRef.current = rate
  }, [rate])

  const rates = React.useMemo(() => [0.75, 1, 1.25, 1.5, 2], [])

  const fmt = (sec) => {
    const s = Math.max(0, Number(sec) || 0)
    const mm = Math.floor(s / 60)
    const ss = Math.floor(s % 60)
    return `${mm}:${String(ss).padStart(2, '0')}`
  }

  const wave = React.useMemo(() => {
    const s = String(src || '')
    let h = 2166136261
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    let x = h >>> 0
    const rnd = () => {
      x ^= x << 13
      x >>>= 0
      x ^= x >> 17
      x >>>= 0
      x ^= x << 5
      x >>>= 0
      return (x >>> 0) / 4294967295
    }

    const bars = 56
    const out = []
    for (let i = 0; i < bars; i++) {
      const v = 0.22 + rnd() * 0.78
      out.push(v)
    }
    return out
  }, [src])

  const stopRaf = React.useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  const startRaf = React.useCallback(() => {
    stopRaf()
    const tick = () => {
      const a = audioRef.current
      if (a && !draggingRef.current) {
        const t = Number(a.currentTime || 0) || 0
        setPos(t)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [stopRaf])

  React.useEffect(() => {
    const a = audioRef.current
    if (!a) return

    setPlaying(false)
    setDur(0)
    setPos(0)
    draggingRef.current = false
    stopRaf()

    try {
      a.pause?.()
    } catch {}
    try {
      a.currentTime = 0
    } catch {}
    try {
      a.playbackRate = rateRef.current
    } catch {}

    const onLoaded = () => setDur(Number(a.duration || 0) || 0)
    const onPlay = () => {
      setPlaying(true)
      startRaf()
    }
    const onPause = () => {
      setPlaying(false)
      stopRaf()
    }
    const onEnded = () => {
      setPlaying(false)
      stopRaf()
      setPos(0)
    }

    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('ended', onEnded)

    return () => {
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('ended', onEnded)
      stopRaf()
    }
  }, [src, startRaf, stopRaf])

  React.useEffect(() => {
    const a = audioRef.current
    if (a) a.playbackRate = rate
  }, [rate])

  const toggle = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play?.()
    else a.pause?.()
  }

  const cycleRate = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const idx = Math.max(0, rates.indexOf(rate))
    const next = rates[(idx + 1) % rates.length]
    setRate(next)
  }

  const progress = dur > 0 ? Math.min(1, Math.max(0, pos / dur)) : 0

  const seekToClientX = React.useCallback(
    (clientX) => {
      const a = audioRef.current
      const el = waveRef.current
      if (!a || !el || !dur) return

      const rect = el.getBoundingClientRect()
      const x = Math.min(Math.max(0, clientX - rect.left), rect.width)
      const p = rect.width ? x / rect.width : 0
      const t = p * dur

      try {
        a.currentTime = t
      } catch {}
      setPos(t)
    },
    [dur],
  )

  const onWavePointerDown = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    if (!dur) return

    draggingRef.current = true
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId)
    } catch {}

    seekToClientX(e.clientX)
  }

  const onWavePointerMove = (e) => {
    if (!draggingRef.current) return
    e?.preventDefault?.()
    e?.stopPropagation?.()
    seekToClientX(e.clientX)
  }

  const endDrag = (e) => {
    if (!draggingRef.current) return
    e?.preventDefault?.()
    e?.stopPropagation?.()
    draggingRef.current = false
  }

  const bars = wave.length
  const W = 640
  const H = 26
  const gap = 2
  const bw = Math.max(2, Math.floor((W - (bars - 1) * gap) / bars))

  return (
    <div className={`dmVoice ${playing ? 'dmVoicePlaying' : ''}`} data-kind="dm-voice" onClick={(e) => e.stopPropagation()}>
      <button type="button" className="dmVoiceBtn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path d="M7 5h3v14H7V5zm7 0h3v14h-3V5z" fill="currentColor" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path d="M8 5v14l12-7-12-7z" fill="currentColor" />
          </svg>
        )}
      </button>

      <div className="dmVoiceMid">
        <div className="dmVoiceWaveWrap">
          <div className="dmVoiceTrack" aria-hidden="true">
            <div className="dmVoiceFill" style={{ width: `${progress * 100}%` }} />
            <div className="dmVoiceSpark" style={{ left: `${progress * 100}%` }} />
          </div>

          <svg
            ref={waveRef}
            className="dmVoiceWave"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={dur || 0}
            aria-valuenow={pos || 0}
            onPointerDown={onWavePointerDown}
            onPointerMove={onWavePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={endDrag}
          >
            <defs>
              <linearGradient id="qWaveBase" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="rgba(80,160,255,.12)" />
                <stop offset=".5" stopColor="rgba(160,90,255,.12)" />
                <stop offset="1" stopColor="rgba(60,220,255,.10)" />
              </linearGradient>
            </defs>

            <rect x="0" y="0" width={W} height={H} fill="url(#qWaveBase)" />

            {wave.map((v, i) => {
              const x = i * (bw + gap)
              const bh = Math.max(3, Math.round(v * (H - 6)))
              const y = Math.round((H - bh) / 2)
              const active = i / Math.max(1, bars - 1) <= progress

              return (
                <rect
                  key={i}
                  className={`dmWaveBar ${active ? 'isActive' : ''}`}
                  x={x}
                  y={y}
                  width={bw}
                  height={bh}
                  rx="2"
                  style={{
                    '--d': `${(i % 18) * 0.035}s`,
                    '--a': String(v),
                  }}
                />
              )
            })}
          </svg>
        </div>

        <div className="dmVoiceMeta">
          <span className="dmVoiceTime">
            {fmt(pos)} / {fmt(dur)}
          </span>

          <button type="button" className="dmVoiceRate" onClick={cycleRate} title="Speed">
            {String(rate).replace(/\.0+$/, '')}x
          </button>
        </div>
      </div>

      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  )
}
