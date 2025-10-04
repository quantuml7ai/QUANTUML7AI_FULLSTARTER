'use client'

/* #############################################################
# NEWS TICKER / MARQUEE (CLIENT)
# mode="quotes"  -> бегущая строка с котировками /api/quotes
# mode="marquee" -> фирменная текстовая маркиза (t('marquee'))
############################################################# */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* ==================== env / helpers ==================== */

const PUB = {
  SYMBOLS: (process.env.NEXT_PUBLIC_TICKER_SYMBOLS || '')
    .split(',')
    .map(s => s.trim().toUpperCase())
    .filter(Boolean),
  REFRESH_SEC: Number(process.env.NEXT_PUBLIC_QUOTES_REFRESH_SEC || 30),
  SPEED: Number(process.env.NEXT_PUBLIC_TICKER_SPEED || 1.0),
}

function cn(...a){return a.filter(Boolean).join(' ')}

function fmtNum(v, d=2) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—'
  const n = Number(v)
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })
}

function pctColor(p) {
  if (p > 0.0001) return 'pos'
  if (p < -0.0001) return 'neg'
  return 'flat'
}

async function getJSON(url, def=null){
  try{
    const r = await fetch(url, { cache:'no-store' })
    if (!r.ok) return def
    return await r.json()
  }catch{return def}
}

/* ==================== Ticker ==================== */

export default function NewsTicker({
  mode = 'quotes',         // 'quotes' | 'marquee'
  className = '',
  dense = false,           // компактнее
  speed = PUB.SPEED,       // множитель скорости css-анимации
}) {
  const { t } = useI18n()
  const wrapRef = useRef()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  const marqueeSpeed = Math.max(0.25, Number(speed || 1))

  /* ---------- data load for quotes ---------- */
  const sym = useMemo(() => (PUB.SYMBOLS.length ? PUB.SYMBOLS : [
    'BTC','ETH','SOL','BNB','TON','XRP','MATIC','ADA','DOGE','AVAX','ATOM','OP','ARB','NEAR','APT','SUI','ETC','LTC','TRX','DOT'
  ]), [])

  async function loadQuotes(){
    if (mode !== 'quotes') return
    setLoading(true); setErr(null)
    const q = new URLSearchParams({ symbols: sym.join(',') })
    const data = await getJSON(`/api/quotes?${q.toString()}`, { ok:false, items:[] })
    if (!data?.ok){
      setErr('load_failed'); setItems([]); setLoading(false); return
    }
    setItems(Array.isArray(data.items) ? data.items : [])
    setLoading(false)
  }

  useEffect(() => {
    if (mode !== 'quotes') return
    loadQuotes()
    const id = setInterval(loadQuotes, Math.max(10, PUB.REFRESH_SEC) * 1000)
    return () => clearInterval(id)
  }, [mode])

  /* ---------- content for marquee mode ---------- */
  const marqueeText = (t('marquee') || '').trim()

  /* ==================== render ==================== */

  if (mode === 'marquee') {
    // фирменная нижняя маркиза — четыре повтора, чтобы шов был невидим
    return (
      <section className={cn('marquee-wrap', dense && 'dense', className)} aria-hidden="true">
        <div className="fade left" />
        <div className="marquee" ref={wrapRef} style={{ ['--speed']: String(marqueeSpeed) }} suppressHydrationWarning>
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
        <div className="fade right" />
        <style jsx>{`
          .marquee-wrap{position:relative;overflow:hidden;border-top:1px solid rgba(0,255,255,.12);border-bottom:1px solid rgba(0,255,255,.12);background:rgba(8,12,16,.35);backdrop-filter:blur(6px)}
          .marquee{display:flex;gap:64px;white-space:nowrap;animation:scroll calc(50s / var(--speed,1)) linear infinite}
          .dense .marquee{gap:40px}
          .marquee span{padding:12px 0;opacity:.92}
          .fade{position:absolute;top:0;bottom:0;width:60px;pointer-events:none}
          .fade.left{left:0;background:linear-gradient(90deg, rgba(8,12,16,.9), rgba(8,12,16,0))}
          .fade.right{right:0;background:linear-gradient(270deg, rgba(8,12,16,.9), rgba(8,12,16,0))}
          @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        `}</style>
      </section>
    )
  }

  // quotes
  return (
    <section className={cn('ticker-wrap', dense && 'dense', className)}>
      <div className="fade left" />
      <div className="track" style={{ ['--speed']: String(marqueeSpeed) }}>
        <div className="lane" suppressHydrationWarning>
          {renderQuotes(items, loading, err, t)}
          {renderQuotes(items, loading, err, t)}
        </div>
      </div>
      <div className="fade right" />
      <style jsx>{`
        .ticker-wrap{
          position:relative;overflow:hidden;
          border:1px solid rgba(0,255,255,.12);
          background:rgba(8,12,16,.45);
          backdrop-filter:blur(6px);
          border-radius:14px;
        }
        .track{ --h: 40px; height:var(--h); }
        .dense .track{ --h: 34px; }
        .lane{
          display:flex;gap:28px;height:var(--h);align-items:center;
          padding:0 10px;white-space:nowrap;
          animation:scrollX calc(45s / var(--speed,1)) linear infinite;
        }
        .fade{position:absolute;top:0;bottom:0;width:60px;pointer-events:none}
        .fade.left{left:0;background:linear-gradient(90deg, rgba(8,12,16,.95), rgba(8,12,16,0))}
        .fade.right{right:0;background:linear-gradient(270deg, rgba(8,12,16,.95), rgba(8,12,16,0))}
        @keyframes scrollX{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

        .item{
          display:flex;gap:8px;align-items:center;
          border:1px solid rgba(0,255,255,.14);
          background:rgba(255,255,255,.04);
          border-radius:999px;padding:6px 10px;
          height:28px;
          box-shadow:0 0 18px rgba(0,255,255,.08) inset, 0 0 14px rgba(0,180,255,.06);
        }
        .dense .item{padding:5px 9px;height:26px}
        .sym{font-weight:700;letter-spacing:.3px}
        .px{opacity:.95}
        .chg{font-weight:600}
        .chg.pos{color:#28ffa6;text-shadow:0 0 10px rgba(40,255,166,.35)}
        .chg.neg{color:#ff6b6b;text-shadow:0 0 10px rgba(255,107,107,.35)}
        .chg.flat{opacity:.85}
        .sep{opacity:.35}
        .sk{opacity:.55}
      `}</style>
    </section>
  )
}

/* ==================== render helpers ==================== */

function renderQuotes(list, loading, err, t) {
  if (loading && (!list || list.length === 0)) {
    // скелетоны, чтобы анимация не ломалась
    return (
      <>
        {Array.from({length: 12}).map((_,i)=>(
          <span key={`sk-${i}`} className="item sk">•••</span>
        ))}
      </>
    )
  }
  if (err && (!list || list.length === 0)) {
    return <span className="item sk">{t('load_failed') || 'load_failed'}</span>
  }
  const rows = (list && list.length ? list : []).map(q => {
    const p = Number(q?.c) || 0
    const d = Number(q?.d || q?.change24h || 0) // абсолютное изм.
    const dp = Number(q?.dp || q?.pct24h || 0)  // %
    const sign = dp > 0 ? '+' : ''
    return (
      <span className="item" key={`${q.s}-${q.t || q.ts || ''}`}>
        <span className="sym">{(q.s || '').toUpperCase()}</span>
        <span className="sep">·</span>
        <span className="px">{fmtNum(p, p>=100 ? 0 : 4)}</span>
        <span className={cn('chg', pctColor(dp))}>{`${sign}${fmtNum(dp,2)}%`}</span>
      </span>
    )
  })

  // повтор, чтобы бесшовно
  return (<>{rows}</>)
}
