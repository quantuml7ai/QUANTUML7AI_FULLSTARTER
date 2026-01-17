'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
const ENABLE_HERO_VIDEO = 0
const TICKERS = [
  'BTC','ETH','SOL','BNB','XRP','ADA','DOGE','TRX','TON','AVAX',
  'DOT','LINK','LTC','BCH','XLM','NEAR','HBAR','ICP','ARB','OP',
  'MATIC','APT','SUI','FIL','RNDR','INJ','AAVE','UNI','MKR','CAKE',
  'ATOM','EGLD','ALGO','XTZ','FTM','GRT','RPL','LDO','DYDX','KAVA',
  'CRV','CVX','COMP','SNX','YFI','BAL','1INCH','ZRX','ENS','FLUX',
  'MINA','SYS','WAVES','KSM','DOT','FTT','CEL','CHZ','SAND','MANA',
  'APE','AXS','GALA','ENJ','IMX','ILV','RUNE','KLAY','CELO','FLOW',
  'NEO','QTUM','VET','ONT','ZIL','SC','STORJ','AR','BAT','FORTH',
  'ANKR','BAND','OCEAN','API3','FET','AGIX','NMR','WOO','OMG','SKL',
  'BEL','HOT','ALICE','CHR','ROSE','DAG','XDC','XEC','RVN','ZEN',
  'ICX','SXP','TFUEL','THETA','CKB','STRAX','BTT','BTG','ETC','DASH',
  'XMR','ZEC','KDA','ERG','VELO','PHA','MDX','UOS','TVK','YGG',
  'MOVR','GLMR','MTL','PUNDIX','HIVE','SC','DCR','HNT','IOTA','METIS',
  'JOE','MAGIC','HIGH','AUDIO','SUSHI','PEPE','SHIB','FLOKI','BONK','WIF',
  'MEME','TURBO','HYPE','PENDLE','NUM','ALPHA','BAR','BICO','GNO','KNC',
  'LRC','LOOM','PROM','MX','OKB','HT','GT','FRAX','FXS','USDJ',
  'USDD','TUSD','USDP','GUSD','WBTC','WETH','STETH','CBETH','PYUSD','USDT',
  'USDC','DAI','EURS','EUT','XAUT','PAXG','WLD','NXRA','XAI','SYLO',
  'ARK','ACX','BICO','WAXP','STRK','PORTAL','GG','ONDO','LYX','ZETA',
  'MANTA','SEI','JUP','PYTH','NGL','ORCA','RAY','JTO','JUP','FIDA',
  'BOME','SLERF','MEW','CHILLGUY','NEXO','RBN','SAGA','NYM','OXT','POND',
  'HARD','IRIS','AKT','TOMO','HFT','ID','TIA','SCRT','BLUR','GNS'
];

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
    const spawnEvery = 4500 / density
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
        return next.slice(-Math.round(5 * density))
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

  // === логика: видео крутится 3 раза, потом навечно постер ===
  const videoRef = useRef(null)
  const [loops, setLoops] = useState(0)
  const [showPoster, setShowPoster] = useState(false)

  // если меняется источник видео — сбрасываем цикл
  useEffect(() => {
    setLoops(0)
    setShowPoster(false)
  }, [videoSrc])

  const handleVideoEnded = () => {
    setLoops(prev => {
      const next = prev + 1
      const v = videoRef.current

      if (next < 3) {
        // запускаем следующий цикл
        if (v) {
          try {
            v.currentTime = 0
            v.play().catch(() => {})
          } catch {}
        }
      } else {
        // три раза открутили — показываем постер и глушим видео
        setShowPoster(true)
        if (v) {
          try {
            v.pause()
          } catch {}
        }
      }

      return next
    })
  }

  return (
    <div ref={wrapRef} className="scene" aria-hidden="true">
      {/* ВИДЕО: рендерим только если включено тумблером */}
      {ENABLE_HERO_VIDEO && (
        <video
          ref={videoRef}
          className="bg-video"
          src={videoSrc}
          {...(poster ? { poster } : {})}
          autoPlay
          muted
          playsInline
          preload="metadata"
          onEnded={handleVideoEnded}
          style={{ opacity: showPoster ? 0 : opacity, transition: 'opacity .5s ease' }}
        />
      )}

      {/* ПОСТЕР: всегда обычный <img>, без next/image оптимизации */}
      {poster && (
        <img
          src={poster}
          alt=""
          className="bg-video"
          aria-hidden="true" 
          style={{
            opacity: (!ENABLE_HERO_VIDEO || showPoster) ? opacity : 0,
            transition: 'opacity .5s ease',
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      )}


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
