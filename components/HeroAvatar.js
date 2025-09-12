'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const TICKERS = [
  'BTC','ETH','SOL','BNB','XRP','ADA','DOGE','TRX','TON','AVAX',
  'DOT','LINK','LTC','BCH','XLM','NEAR','HBAR','ICP','ARB','OP',
  'MATIC','APT','SUI','FIL','RNDR','INJ','AAVE','UNI','MKR','CAKE'
]

const rnd = (a,b)=>a+Math.random()*(b-a)
const pick = a => a[(Math.random()*a.length)|0]

export default function HeroAvatar({ videoSrc='/avatar.mp4', poster='/avatar.jpg', opacity=0.92 }) {
  const density = useMemo(() => {
    if (typeof window === 'undefined') return 1
    const w = window.innerWidth
    if (w < 480) return .7
    if (w < 900) return .9
    return 1
  }, [])

  const [items, setItems] = useState(() => {
    const n = 24
    return Array.from({length:n}, () => ({
      id: Math.random().toString(36).slice(2),
      txt: pick(TICKERS),
      left: rnd(6,94),
      dur: rnd(16,28),
      sz: rnd(1.05,1.9),
      drift: rnd(-52,52),
      delay: rnd(0,6),
      floatx: rnd(10,22),
      op: rnd(.8,1).toFixed(2)
    }))
  })

  useEffect(() => {
    let killed = false
    const spawnEvery = 900 / density
    const spawn = () => {
      if (killed) return
      setItems(prev => {
        const next = [...prev,{
          id: Math.random().toString(36).slice(2),
          txt: pick(TICKERS),
          left: rnd(6,94),
          dur: rnd(16,28),
          sz: rnd(1.05,1.9),
          drift: rnd(-52,52),
          delay: rnd(0,6),
          floatx: rnd(10,22),
          op: rnd(.8,1).toFixed(2)
        }]
        return next.slice(-Math.round(32 * density))
      })
      setTimeout(spawn, spawnEvery)
    }
    const t = setTimeout(spawn, 0)
    return () => { killed = true; clearTimeout(t) }
  }, [density])

  // лёгкий параллакс
  const wrapRef = useRef(null)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onMove = e => {
      const x = (e.clientX / window.innerWidth - .5) * 2
      const y = (e.clientY / window.innerHeight - .5) * 2
      el.style.setProperty('--parx', String(x))
      el.style.setProperty('--pary', String(y))
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <div ref={wrapRef} className="scene" aria-hidden="true">
      <video className="bg-video" src={videoSrc} {...(poster?{poster}:{})} autoPlay loop muted playsInline style={{opacity}} />
      <div className="stars" />
      <div className="tickers">
        {items.map(i=>(
          <div key={i.id} className="ticker"
               style={{
                 left:`${i.left}vw`,
                 fontSize:`calc(${i.sz}rem + .7vw)`,
                 ['--dx']:`${i.drift}px`,
                 ['--dur']:`${i.dur}s`,
                 ['--delay']:`${i.delay}s`,
                 ['--floatx']:`${i.floatx}px`,
                 ['--opacity']:i.op
               }}>
            {i.txt}
          </div>
        ))}
      </div>
      <div className="glow eye left" />
      <div className="glow eye right" />
      <div className="glow chest" />
    </div>
  )
}
