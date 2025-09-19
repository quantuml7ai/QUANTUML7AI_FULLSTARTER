'use client'

// ==================================================================================================
// app/exchange/page.js — QUANTUML7 Exchange — R12c-fix (remove duplicate onTVReady; TV + AI from klines + neon + info)
// ==================================================================================================

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import * as Brain from '../../lib/brain.js'



/* ================================ i18n bridge ================================ */
let useI18n = () => ({ t: (k)=>k })
try { const mod = require('../../components/i18n'); if (mod?.useI18n) useI18n = mod.useI18n } catch {}
const TX = (t, key, fb) => { try { const v=t(key); return v===key?fb:v } catch { return fb } }

/* ================================= helpers ================================= */
const fmtP=(x)=>!Number.isFinite(x)?'-':(Math.abs(x)>=10000?x.toFixed(0):Math.abs(x)>=1000?x.toFixed(2):Math.abs(x)>=1?x.toFixed(2):x.toFixed(6))
const fmtQ=(x)=>!Number.isFinite(x)?'-':(Math.abs(x)>=1?x.toFixed(4):x.toFixed(8))
const MAP_TV=(s)=>`BINANCE:${s}`
const TFmap={ '1m':'1','5m':'5','15m':'15','1h':'60','4h':'240','1d':'D' }
const BINANCE='https://api.binance.com'

/* ================================= data ================================= */
async function fetchDepth(sym,limit=20){ const r=await fetch(`${BINANCE}/api/v3/depth?symbol=${sym}&limit=${limit}`,{cache:'no-store'}); return r.json() }
async function fetchSymbolsUSDT(){ 
  try{ const r=await fetch(`${BINANCE}/api/v3/exchangeInfo`,{cache:'no-store'}); const j=await r.json()
    const list=j.symbols.filter(s=>s.status==='TRADING' && s.quoteAsset==='USDT').map(s=>s.symbol)
    return [...new Set(list)].sort()
  }catch{ return ['BTCUSDT','ETHUSDT','BNBUSDT'] }
}
const TF_TO_BINANCE={"1m":"1m","5m":"5m","15m":"15m","1h":"1h","4h":"4h","1d":"1d"}
async function fetchKlines(sym, tf, limit=750){
  const interval = TF_TO_BINANCE[tf] || '5m'
  const url = `${BINANCE}/api/v3/klines?symbol=${sym}&interval=${interval}&limit=${limit}`
  const r = await fetch(url, { cache:'no-store' })
  const j = await r.json()
  const o=[],h=[],l=[],c=[],v=[], t=[]
  for (const k of j){ o.push(+k[1]); h.push(+k[2]); l.push(+k[3]); c.push(+k[4]); v.push(+k[5]); t.push(+k[6]) }
  return {o,h,l,c,v,t, tf, symbol: sym}
}

/* ================================= TradingView ================================= */
function useTVCore(){
  useEffect(()=>{
    if (typeof window==='undefined') return
    if (window.TradingView) return
    if (document.getElementById('tv-core')) return
    const s=document.createElement('script'); s.id='tv-core'; s.src='https://s3.tradingview.com/tv.js'; s.async=true
    document.head.appendChild(s)
  },[])
}
function onTVReady(cb){
  if (typeof window==='undefined') return
  const tick=()=>{ if (window.TradingView) cb(); else setTimeout(tick,40) }
  tick()
}

/* ================================= UI atoms ================================= */
function Panel({children}){ 
  return <div className="panel">{children}
    <style jsx>{`
      .panel{position:relative; overflow:hidden; border:1px solid rgba(255,255,255,.08);
        border-radius:14px;padding:12px;background:rgba(0,0,0,.85); margin-bottom:12px}
    `}</style>
  </div>
}
const Btn=({children,onClick,active,neon})=>(
  <button className={`btn ${active?'active':''} ${neon?'neon':''}`} onClick={onClick}>{children}
    <style jsx>{`
      .btn{padding:8px 14px;border-radius:12px;background:#0a0a0a;border:1px solid rgba(255,255,255,.12);font-size:13px;color:#e5faff;cursor:pointer}
      .btn.active{background:rgba(255,255,255,.15)}
      .btn.neon{border-color:#00e5ff;color:#aefaff;box-shadow:0 0 0 1px rgba(0,229,255,.25),0 0 12px rgba(0,229,255,.25) inset,0 0 24px rgba(0,229,255,.25)}
      .btn.neon:hover{box-shadow:0 0 0 2px rgba(0,229,255,.35),0 0 18px rgba(0,229,255,.45) inset,0 0 30px rgba(0,229,255,.45)}
    `}</style>
  </button>
)

/* ================================= Badge ================================= */
function BadgeTitle(){ const {t}=useI18n(); return <Panel><span className="pill">{TX(t,'exchange_title','Биржа (в разработке)')}</span>
  <style jsx>{`.pill{display:inline-block;padding:6px 10px;border-radius:999px;background:rgba(59,130,246,.25);border:1px solid rgba(59,130,246,.45);font-weight:700}`}</style>
</Panel> }

/* ================================= Symbol+TF dropdown ================================= */
const TF_KEYS=Object.keys(TFmap)
function SymbolTFSelector({current, onChange, symbols}){
  const [open,setOpen]=useState(false)
  const [q,setQ]=useState('')
  const filtered = useMemo(()=> symbols.filter(s=>s.includes(q.toUpperCase())).slice(0,500),[symbols,q])
  return <Panel>
    <div className="row">
      <div className="now">{current.symbol} · {current.tf}</div>
      <div className="grow" />
      <Btn neon onClick={()=>setOpen(o=>!o)}>{TX(useI18n().t,'select_symbol_tf','Выбрать символ / TF')}</Btn>
    </div>
    {open && <div className="pop">
      <input className="search" placeholder="Search…" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="grid">
        {filtered.map(sym=>(
          <div key={sym} className="row2">
            <span className="sym">{sym}</span>
            <div className="tfs">{TF_KEYS.map(tf=>(<button key={tf} className="tf" onClick={()=>{onChange(sym,tf); setOpen(false)}}>{tf}</button>))}</div>
          </div>
        ))}
      </div>
    </div>}
    <style jsx>{`
      .row{display:flex;align-items:center;gap:8px}
      .grow{flex:1}
      .now{font-weight:800}
      .pop{margin-top:8px;border:1px solid #0ff;border-radius:10px;padding:8px;background:#000}
      .search{width:100%;background:#0b0b0b;border:1px solid #111;border-radius:10px;padding:8px 10px;color:#fff;margin-bottom:8px}
      .grid{max-height:420px;overflow:auto;display:grid;gap:6px}
      .row2{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:6px;border-radius:8px;background:#0a0a0a}
      .sym{color:#0ff;font-weight:700}
      .tf{background:#111;border:1px solid #0ff;border-radius:6px;padding:2px 6px;cursor:pointer;color:#0ff}
      .tf:hover{background:#0ff;color:#000}
    `}</style>
  </Panel>
}

/* ================================= TV widgets ================================= */
function TVTicker({symbol}){
  const boxRef=useRef(null)
  useEffect(()=>{
    if (!boxRef.current) return
    boxRef.current.innerHTML=''
    const script=document.createElement('script')
    script.type='text/javascript'; script.src='https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js'; script.async=true
    script.innerHTML=JSON.stringify({ symbols:[{proName:MAP_TV(symbol),title:symbol}], isTransparent:true, showSymbolLogo:true, colorTheme:'dark', locale:'en', displayMode:'regular', width:'100%', height:52 })
    boxRef.current.appendChild(script)
  },[symbol])
  return <Panel><div ref={boxRef} /></Panel>
}

function TVChart({symbol, tf}){
  useTVCore()
  const ref = useRef(null)
  useEffect(()=>{
    onTVReady(()=>{
      if (!ref.current) return
      ref.current.innerHTML=''
      // eslint-disable-next-line no-undef
      new window.TradingView.widget({
        autosize:true,
        symbol: MAP_TV(symbol),
        interval: TFmap[tf],
        container_id: ref.current.id,
        theme:'dark', style:'1', locale:'en',
        hide_side_toolbar:false, hide_legend:false, allow_symbol_change:false,
      })
    })
  },[symbol,tf])
  return <Panel><div className="tvWrap"><div id="tv_chart" ref={ref}/></div>
    <style jsx>{`.tvWrap{position:relative;width:100%;height:58vh;min-height:360px} .tvWrap :global(#tv_chart){position:absolute;inset:0}`}</style>
  </Panel>
}

/* ================================= AI Box (i18n-aware) ================================= */
function AIBox({ data }) {
  const { t } = useI18n()
  const fmtP = (x)=> Number.isFinite(x)
    ? (Math.abs(x)>=10000? x.toFixed(0) : Math.abs(x)>=1000? x.toFixed(2) : Math.abs(x)>=1? x.toFixed(2) : x.toFixed(6))
    : '-'

  const tr = (key, params) => {
    try {
      let s = t(key)
      if (s === key) s = t(key.replaceAll('.', '_'))
      if (typeof s === 'string' && params) {
        for (const [k,v] of Object.entries(params)) {
          s = s.replaceAll(`{${k}}`, typeof v==='number'? fmtP(v) : String(v))
        }
      }
      return s
    } catch { return key }
  }

  // Гард — данных нет или они ещё считаются
  if (!data || !Number.isFinite(data.price)) {
    return <Panel><div className="muted">…{tr('ai_calculating') || 'AI calculating'}</div></Panel>
  }

  const color = data.action==='BUY' ? 'buy' : data.action==='SELL' ? 'sell' : 'hold'
  return (
    <Panel>
      <div className={`pill ${color}`}>{tr('ai_action')||'Action'}: {data.action} · {Math.round(data.confidence)}%</div>
      <div className="meta">
        <span>{(tr('ai_price')||'Price')} {fmtP(data.price)}</span>
        {data.entry!=null && <span>Entry {fmtP(data.entry)}</span>}
        {data.sl!=null && <span>{(tr('ai_sl')||'SL')} {fmtP(data.sl)}</span>}
        {data.tp1!=null && <span>{(tr('ai_tp')||'TP')}1 {fmtP(data.tp1)}</span>}
        {data.tp2!=null && <span>{(tr('ai_tp')||'TP')}2 {fmtP(data.tp2)}</span>}
        {data.horizons && Object.entries(data.horizons).map(([k,v])=>(
          <span key={k}>{k} ±{fmtP(v)}</span>
        ))}
      </div>

      <div className="reason-block">
        <div className="ttl">{tr('ai_explainer_title') || 'Why this recommendation'}</div>
        <ul className="reasons">
          {Array.isArray(data.reasons) && data.reasons.length
  ? data.reasons.map((r,i)=> (
      <li key={i}>
        {typeof r==='string' ? tr(r) : tr(r.key, r.params)}
      </li>
    ))
  : <li>—</li>}

        </ul>
      </div>

      <div className="levels">
        {!!data.support?.length && <div><b>{tr('ai_support')||'Support'}:</b> {data.support.map(fmtP).join(' · ')}</div>}
        {!!data.resistance?.length && <div><b>{tr('ai_resistance')||'Resistance'}:</b> {data.resistance.map(fmtP).join(' · ')}</div>}
      </div>

      <div className="muted small" style={{marginTop:8}}>{tr('ai_disclaimer') || 'Signals are assistive and educational; not financial advice.'}</div>

      <style jsx>{`
        .pill{display:inline-block;padding:6px 10px;border-radius:999px;font-weight:800;color:#fff;margin-bottom:6px}
        .pill.buy{background:linear-gradient(135deg,#22c55e,#34d399)}
        .pill.sell{background:linear-gradient(135deg,#ef4444,#f43f5e)}
        .pill.hold{background:linear-gradient(135deg,#64748b,#94a3b8)}
        .meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px}
        .meta span{background:rgba(255,255,255,.06);padding:4px 8px;border-radius:999px;font-size:12px}
        .reason-block .ttl{font-weight:800;opacity:.9;margin:6px 0 4px}
        .reasons{margin:0 0 0 18px}
        .levels{opacity:.95;margin-top:6px}
        .small{font-size:12px;opacity:.7}
      `}</style>
    </Panel>
  )
}

/* ================================= OrderBook (black) ================================= */
function OrderBook({symbol}){
  const [data,setData]=useState(null)
  useEffect(()=>{
    let alive=true
    ;(async()=>{ try{ const j=await fetchDepth(symbol,20); if(alive) setData(j) }catch{} })()
    const id=setInterval(async()=>{ try{ const j=await fetchDepth(symbol,20); if(alive) setData(j) }catch{} }, 3000)
    return ()=>{ alive=false; clearInterval(id) }
  },[symbol])
  if(!data) return <Panel><div className="muted">…loading</div></Panel>
  const bids=data.bids.map(([p,q])=>({price:+p,qty:+q}))
  const asks=data.asks.map(([p,q])=>({price:+p,qty:+q}))
  const maxQty=Math.max(1,...bids.map(x=>x.qty),...asks.map(x=>x.qty))
  return <Panel>
    <div className="hdr">Order Book · {symbol}</div>
    <div className="cols">
      <div className="col">
        <div className="h h-asks">Asks</div>
        {asks.slice(0,20).reverse().map((r,i)=>(<div key={'a'+i} className="row ask">
          <div className="bar" style={{width:`${(r.qty/maxQty)*100}%`}}/><span>{fmtP(r.price)}</span><span className="q">{fmtQ(r.qty)}</span></div>))}
      </div>
      <div className="col">
        <div className="h h-bids">Bids</div>
        {bids.slice(0,20).map((r,i)=>(<div key={'b'+i} className="row bid">
          <div className="bar" style={{width:`${(r.qty/maxQty)*100}%`}}/><span>{fmtP(r.price)}</span><span className="q">{fmtQ(r.qty)}</span></div>))}
      </div>
    </div>
    <style jsx>{`
      .hdr{opacity:.85;margin-bottom:6px;font-size:12px}
      .cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .h{font-weight:700;margin-bottom:4px}
      .h-asks{color:#f87171}.h-bids{color:#4ade80}
      .row{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px 8px;border-radius:8px;overflow:hidden;font-variant-numeric:tabular-nums}
      .row .bar{position:absolute;left:0;top:0;bottom:0;opacity:.18}
      .ask .bar{background:#ef4444}.bid .bar{background:#22c55e}
      .q{text-align:right}
    `}</style>
  </Panel>
}

/* ================================= Page ================================= */
export default function ExchangePage(){
  const { t } = useI18n()
  useTVCore()

  // symbols
  const [symbols,setSymbols]=useState(['BTCUSDT','ETHUSDT','BNBUSDT'])
  useEffect(()=>{ let alive=true; (async()=>{ const list=await fetchSymbolsUSDT(); if(alive) setSymbols(list) })(); return ()=>{alive=false}},[])

  // selection state
  const [symbol,setSymbol]=useState('BTCUSDT')
  const [tf,setTf]=useState('5m')

  // AI state driven by OHLCV klines
  const [ai,setAI]=useState(null)
  useEffect(()=>{
    let alive=true
    ;(async()=>{
      try{
        const pack = await fetchKlines(symbol, tf, 750)
        const call = (Brain.analyze || Brain.default || (()=>null))
        let res = await call(pack)
        if(!res && Brain.default && call!==Brain.default) res = await Brain.default(pack)
        if(!res && Brain.analyze && call!==Brain.analyze) res = await Brain.analyze(pack)
        if(!res) res = { action:'HOLD', confidence:50, price:pack.c.at(-1)??0, horizons:{'1h':0,'6h':0,'24h':0}, reasons:[TX(t,'ai.no_data','Not enough data')] }
        if(alive) setAI(res)
      }catch{ if(alive) setAI({ action:'HOLD', confidence:50, price:0, horizons:{'1h':0,'6h':0,'24h':0}, reasons:[TX(t,'ai.no_data','Not enough data')] }) }
    })()
    return ()=>{alive=false}
  },[symbol,tf])

  // bottom content from i18n (restored)
  const sections = Array.isArray(TX(t, 'exchange_sections', [])) ? TX(t, 'exchange_sections', []) : []
  const bullets  = Array.isArray(TX(t, 'ex_bullets', [])) ? TX(t, 'ex_bullets', []) : []

  return (
    <div className="wrap">
      <BadgeTitle/>

      <SymbolTFSelector current={{symbol,tf}} symbols={symbols} onChange={(s,tf2)=>{setSymbol(s); setTf(tf2)}}/>
      <TVTicker symbol={symbol}/>

      <TVChart symbol={symbol} tf={tf}/>

      <AIBox data={ai}/>

      <OrderBook symbol={symbol}/>

      {/* --- Restored informational sections (texts & pictures) --- */}
      <section className="panel">
        <h2>{TX(t,'roadmap','Roadmap')}</h2>
        <div className="img16x9 panel-media">
          <Image src="/branding/exchange_promo.png" alt="Exchange promo" fill sizes="100vw" priority={false} className="cover"/>
        </div>
        <ul className="bullets">{bullets.map((b,i)=><li key={i}>• {b}</li>)}</ul>
      </section>

      {sections.map((s, idx) => (
        <section key={idx} className="panel">
          <h2>{s.title}</h2>
          {Array.isArray(s.paras)? s.paras.map((p,i)=>(<p key={i} style={{whiteSpace:'pre-line'}}>{p}</p>)) : null}
        </section>
      ))}

      <style jsx>{`
        .wrap{display:block;max-width:1200px;margin:0 auto;padding:0 8px}
        .muted{opacity:.7}
        .img16x9{position:relative;width:100%;aspect-ratio:16/9;border-radius:12px;overflow:hidden;margin-top:8px}
        .cover{object-fit:cover}
        .bullets{margin:10px 0 0 8px}
      `}</style>
    </div>
  )
}

