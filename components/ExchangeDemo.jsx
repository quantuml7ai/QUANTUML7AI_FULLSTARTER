'use client'

/**
 * Quantum L7 Exchange — XXL Demo (history+pan+zoom)
 * - 2000+ candles buffer per (symbol, interval)
 * - Pan/Zoom with wheel & drag; fetch-back history on demand
 * - Realtime WS merge; cache by key
 * - Indicators: EMA21, MA50, VWAP, Boll(20,2), RSI(14), ATR(14)
 * - OrderBook with cumulative heat, Trades, Watchlist, Demo orders/positions
 * - Crosshair + tooltip, screenshot, fullscreen, themes, hotkeys
 * - Pure React + Canvas
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ================================ CONFIG ================================ */

const BINANCE_WS   = 'wss://stream.binance.com:9443/ws'
const BINANCE_HTTP = 'https://api.binance.com'
const INTERVALS = ['1m','5m','15m','1h','4h','1d']
const INTERVAL_MS = { '1m':60e3,'5m':300e3,'15m':900e3,'1h':3600e3,'4h':14400e3,'1d':86400e3 }

const PAIRS = [
  { sym:'BTCUSDT', label:'BTC / USDT' },
  { sym:'ETHUSDT', label:'ETH / USDT' },
  { sym:'SOLUSDT', label:'SOL / USDT' },
  { sym:'DOGEUSDT', label:'DOGE / USDT' },
  { sym:'ADAUSDT',  label:'ADA / USDT' },
  { sym:'XRPUSDT',  label:'XRP / USDT' },
]

const THEMES = {
  aqua:   { up:'#35e5c6', dn:'#ff6b9e', line:'#5ee7ff', grid:'rgba(170,220,255,.14)', volUp:'#5ee7ff', volDn:'#ffa4c1', text:'#dff' },
  violet: { up:'#34d399', dn:'#fb7185', line:'#a78bfa', grid:'rgba(190,160,255,.16)', volUp:'#93c5fd', volDn:'#fda4af', text:'#e6ddff' },
  amber:  { up:'#22d3ee', dn:'#f43f5e', line:'#fbbf24', grid:'rgba(255,210,140,.18)', volUp:'#fcd34d', volDn:'#fca5a5', text:'#ffeab5' },
}

/* =============================== HELPERS ================================ */

const clamp = (v,a,b)=>Math.max(a,Math.min(b,v))
const fmt  = (x,d=2)=>Number.isFinite(x)?x.toFixed(d):'--'
const now  = ()=>Date.now()

function ema(arr, p){
  if (!arr.length) return []
  const k = 2/(p+1), out = new Array(arr.length); out[0]=arr[0]
  for(let i=1;i<arr.length;i++) out[i]=arr[i]*k+out[i-1]*(1-k)
  return out
}
const sma   =(arr,p)=>arr.map((_,i)=>i<p-1?null:(arr.slice(i-p+1,i+1).reduce((s,x)=>s+x,0)/p))
const stdev =(arr,p)=>arr.map((_,i)=>{if(i<p-1)return null;const s=arr.slice(i-p+1,i+1),m=s.reduce((a,b)=>a+b,0)/p;return Math.sqrt(s.reduce((a,b)=>a+(b-m)**2,0)/p)})
function calcRSI(c,n=14){ if(c.length<n+1) return []; const out=new Array(c.length).fill(null)
  for(let i=n;i<c.length;i++){ let up=0,dn=0; for(let k=i-n+1;k<=i;k++){const d=c[k]-c[k-1]; if(d>0) up+=d; else dn-=d}
    const rs=dn===0?100:up/dn; out[i]=100-100/(1+rs) } return out }
function calcATR(o,h,l,c,n=14){ if(c.length<n+1) return []; const tr=new Array(c.length).fill(null)
  for(let i=1;i<c.length;i++) tr[i]=Math.max(h[i]-l[i], Math.abs(h[i]-c[i-1]), Math.abs(l[i]-c[i-1]))
  const atr=new Array(c.length).fill(null); let sum=0; for(let i=1;i<=n;i++) sum+=tr[i]||0; atr[n]=sum/n
  for(let i=n+1;i<c.length;i++) atr[i]=(atr[i-1]*(n-1)+tr[i])/n; return atr }

/* ============================== CACHE STORE ============================= */

const store = {
  // key => { candles:[{t,o,h,l,c,v}], hasMore:true }
  cache: new Map(),
  get(key){ return this.cache.get(key) },
  set(key,val){ this.cache.set(key,val) },
}

/* =============================== TOASTS ================================= */

function useToasts(){
  const [list,setList]=useState([])
  const push=(text, kind='info', ttl=3500)=>{
    const id=Math.random().toString(36).slice(2)
    setList(x=>[...x,{id,text,kind,t:now(),ttl}]); setTimeout(()=>setList(x=>x.filter(i=>i.id!==id)), ttl+250)
  }
  return { list, push }
}

/* =============================== DATA IO ================================ */

async function fetchKlines(symbol, interval, { endTime=null, limit=1000 }={}){
  const params=new URLSearchParams({ symbol, interval, limit:String(limit) })
  if(endTime) params.append('endTime', String(endTime))
  const r=await fetch(`${BINANCE_HTTP}/api/v3/klines?${params}`, { cache:'no-store' })
  const raw=await r.json()
  if(!Array.isArray(raw)) return []
  return raw.map(k=>({ t:k[0], o:+k[1], h:+k[2], l:+k[3], c:+k[4], v:+k[5] }))
}

function useDepth(symbol, levels=14){
  const [book,setBook]=useState({bids:[],asks:[]})
  useEffect(()=>{
    const ws=new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@depth20@100ms`)
    ws.onmessage=ev=>{
      const m=JSON.parse(ev.data)
      const bids=(m?.b||[]).map(([p,q])=>({p:+p,q:+q})).filter(x=>x.q>0).sort((a,b)=>b.p-a.p).slice(0,levels)
      const asks=(m?.a||[]).map(([p,q])=>({p:+p,q:+q})).filter(x=>x.q>0).sort((a,b)=>a.p-b.p).slice(0,levels)
      setBook({bids,asks})
    }
    return ()=>ws.close(1000,'bye')
  },[symbol,levels])
  return book
}
function useTrades(symbol, limit=60){
  const [rows,setRows]=useState([])
  useEffect(()=>{
    const ws=new WebSocket(`${BINANCE_WS}/${symbol.toLowerCase()}@trade`)
    ws.onmessage=ev=>{
      const t=JSON.parse(ev.data); const up = t.m ? false : true
      setRows(prev=>[{p:+t.p,q:+t.q,up,ts:t.T},...prev].slice(0,limit))
    }
    return ()=>ws.close(1000,'bye')
  },[symbol,limit])
  return rows
}

/* =============================== MAIN ==================================== */

export default function ExchangeDemo(){

  /* ---- top state ---- */
  const [symbol, setSymbol]     = useState('SOLUSDT')
  const [interval, setInterval] = useState('1m')
  const [theme, setTheme]       = useState('amber')
  const [show, setShow] = useState({ ema21:true, ma50:true, vwap:false, bands:true, rsi:true, atr:false, volume:true, grid:true })
  const [depthLevels,setDepthLevels]=useState(16)
  const [fullscreen,setFullscreen]=useState(false)
  const [live,setLive]=useState(true)

  const { list:toasts, push:toast } = useToasts()

  /* ---- history buffer + viewport ---- */
  const [candles,setCandles]=useState([])       // whole buffer (old -> new)
  const [hasMore,setHasMore]=useState(true)     // can fetch older
  const [vp,setVp]=useState({                   // viewport (indexes in buffer)
    first:0, last:0, zoom:1.0,                 // zoom=1 => ~1000px / N calculates width
  })
  const lastPrice = candles.length? candles[candles.length-1].c : 0

  const key = `${symbol}@${interval}`

  // bootstrap history (up to 2000)
  useEffect(()=>{
    let dead=false
    ;(async()=>{
      const cached = store.get(key)
      if (cached?.candles?.length) {
        setCandles(cached.candles.slice())
        setHasMore(cached.hasMore!==false)
        setVp(v=>({ ...v, first: Math.max(0, cached.candles.length-600), last: cached.candles.length-1, zoom:1 }))
        return
      }
      const batch1 = await fetchKlines(symbol, interval, { limit:1000 })
      const endTime = batch1.length? batch1[0].t-1 : null
      const batch0 = endTime ? await fetchKlines(symbol, interval, { endTime, limit:1000 }) : []
      const arr = [...batch0, ...batch1]
      if(dead) return
      setCandles(arr)
      setHasMore(batch0.length>0)
      setVp(v=>({ ...v, first: Math.max(0, arr.length-600), last: arr.length-1, zoom:1 }))
      store.set(key, { candles:arr, hasMore:batch0.length>0 })
    })()
    return ()=>{ dead=true }
  },[key, symbol, interval])

  // live WS merge (update last candle / append new)
  useEffect(()=>{
    const stream = `${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(`${BINANCE_WS}/${stream}`)
    ws.onmessage = ev=>{
      const m = JSON.parse(ev.data); const k = m?.k; if(!k) return
      const item = { t:k.t, o:+k.o, h:+k.h, l:+k.l, c:+k.c, v:+k.v }
      setCandles(prev=>{
        if(!prev.length) return prev
        const last = prev[prev.length-1]
        let next
        if(last.t === item.t){ next = prev.slice(); next[next.length-1]=item }
        else { next = [...prev,item]; if(next.length>3000) next = next.slice(next.length-3000) }
        store.set(key, { candles:next, hasMore })
        return next
      })
    }
    return ()=>ws.close(1000,'bye')
  },[key, symbol, interval, hasMore])

  // fetch older when panning left
  const fetchOlder = async()=>{
    if(!hasMore || !candles.length) return
    const first = candles[0]
    const batch = await fetchKlines(symbol, interval, { endTime:first.t-1, limit:1000 })
    if(!batch.length){ setHasMore(false); store.set(key,{candles,hasMore:false}); return }
    setCandles(prev=>{
      const next = [...batch, ...prev].slice(-3000)
      store.set(key,{candles:next,hasMore:true})
      return next
    })
    setVp(v=>({ ...v, first:v.first+batch.length, last:v.last+batch.length })) // сохранить позицию
  }

  /* ---- indicators ---- */
  const closeArr = useMemo(()=>candles.map(k=>k.c), [candles])
  const oArr  = useMemo(()=>candles.map(k=>k.o), [candles])
  const hArr  = useMemo(()=>candles.map(k=>k.h), [candles])
  const lArr  = useMemo(()=>candles.map(k=>k.l), [candles])
  const vArr  = useMemo(()=>candles.map(k=>k.v), [candles])

  const ema21 = useMemo(()=>ema(closeArr,21), [closeArr])
  const ma50  = useMemo(()=>sma(closeArr,50), [closeArr])
  const rsi14 = useMemo(()=>calcRSI(closeArr,14), [closeArr])
  const atr14 = useMemo(()=>calcATR(oArr,hArr,lArr,closeArr,14), [oArr,hArr,lArr,closeArr])
  const mid20 = useMemo(()=>sma(closeArr,20), [closeArr])
  const sd20  = useMemo(()=>stdev(closeArr,20), [closeArr])
  const vwap  = useMemo(()=>{
    // типичная VWAP (за весь видимый диапазон)
    const typ = candles.map(k=>(k.h+k.l+k.c)/3); let pv=0, vv=0
    return typ.map((t,i)=>{ pv+=t*(vArr[i]||0); vv+=(vArr[i]||0); return vv? pv/vv : null })
  },[candles,vArr])

  /* ---- canvases ---- */
  const wrapRef=useRef(null)
  const cvsRef =useRef(null)
  const volRef =useRef(null)
  const fxRef  =useRef(null)
  const rafRef =useRef(0)
  const cross  =useRef({ on:false, x:0, y:0, idx:-1 })

  // draw loop
  useEffect(()=>{
    cancelAnimationFrame(rafRef.current)
    const wrap=wrapRef.current, cvs=cvsRef.current, vcv=volRef.current, fx=fxRef.current
    if(!wrap||!cvs||!vcv||!fx) return
    const ctx=cvs.getContext('2d'), vtx=vcv.getContext('2d'), ftx=fx.getContext('2d')
    const th=THEMES[theme]||THEMES.violet

    const draw=()=>{
      const dpr=Math.min(window.devicePixelRatio||1,2)
      const Wcss=wrap.clientWidth, Hcss=wrap.clientHeight
      const W=cvs.width=vcv.width=fx.width=Math.floor(Wcss*dpr)
      const H=cvs.height=vcv.height=fx.height=Math.floor(Hcss*dpr)
      const padL=60*dpr, padR=16*dpr, padT=10*dpr, padB=60*dpr
      const range=W-padL-padR

      ctx.clearRect(0,0,W,H)
      vtx.clearRect(0,0,W,H)
      ftx.clearRect(0,0,W,H)

      // soft quantum bg
      const g=ftx.createRadialGradient(W*0.2,H*0.2,0,W*0.2,H*0.2, W*0.6)
      g.addColorStop(0,'rgba(0,160,255,.07)'); g.addColorStop(1,'rgba(0,0,0,0)')
      ftx.fillStyle=g; ftx.fillRect(0,0,W,H)

      // grid
      if(show.grid){
        ctx.strokeStyle=th.grid; ctx.lineWidth=1*dpr
        for(let i=0;i<=6;i++){ const y=padT+(H-padT-padB)*i/6; ctx.beginPath(); ctx.moveTo(padL,y); ctx.lineTo(W-padR,y); ctx.stroke() }
      }

      // viewport clamp
      const N=candles.length; if(N<2){ rafRef.current=live?requestAnimationFrame(draw):0; return }
      const first=clamp(vp.first,0,Math.max(0,N-2)), last=clamp(vp.last, first+1, N-1)
      const vis=candles.slice(first,last+1); const n=vis.length
      const step = Math.max(1, range/Math.max(1,n-1)) / clamp(vp.zoom, 0.4, 6)

      // scales
      const max=Math.max(...vis.map(k=>k.h)), min=Math.min(...vis.map(k=>k.l))
      const x=i=> padL + i*step
      const y=v=> padT + (H-padT-padB) * (1 - (v-min)/(max-min+1e-9))

      // candles
      const w=Math.max(1,step*.6)
      for(let i=0;i<n;i++){
        const k=vis[i], X=x(i), isUp=k.c>=k.o
        ctx.strokeStyle=isUp?th.up:th.dn
        ctx.beginPath(); ctx.moveTo(X,y(k.h)); ctx.lineTo(X,y(k.l)); ctx.stroke()
        const top=Math.min(y(k.o),y(k.c)), bot=Math.max(y(k.o),y(k.c))
        ctx.fillStyle=isUp?th.up:th.dn; ctx.fillRect(X-w/2, top, w, Math.max(1, bot-top))
      }

      // indicators
      if(show.ema21){ ctx.strokeStyle=th.line; ctx.lineWidth=2*dpr; ctx.beginPath()
        for(let i=first;i<=last;i++){ const v=ema21[i]; if(!Number.isFinite(v)) continue; const X=x(i-first), Y=y(v); i===first?ctx.moveTo(X,Y):ctx.lineTo(X,Y) } ctx.stroke() }
      if(show.ma50){ ctx.strokeStyle='#a8b'; ctx.setLineDash([6*dpr,5*dpr]); ctx.beginPath()
        for(let i=first;i<=last;i++){ const v=ma50[i]; if(v==null) continue; const X=x(i-first), Y=y(v); i===first?ctx.moveTo(X,Y):ctx.lineTo(X,Y) } ctx.stroke(); ctx.setLineDash([]) }
      if(show.vwap){ ctx.strokeStyle='#00ffffaa'; ctx.lineWidth=1.6*dpr; ctx.beginPath()
        for(let i=first;i<=last;i++){ const v=vwap[i]; if(!Number.isFinite(v)) continue; const X=x(i-first), Y=y(v); i===first?ctx.moveTo(X,Y):ctx.lineTo(X,Y) } ctx.stroke() }
      if(show.bands){ ctx.save(); ctx.strokeStyle=th.line; ctx.globalAlpha=.28; ctx.lineWidth=1*dpr
        for(let i=first;i<=last;i++){ const m=mid20[i], s=sd20[i]; if(m==null||s==null) continue
          const X=x(i-first); ctx.beginPath(); ctx.moveTo(X,y(m+s*2)); ctx.lineTo(X,y(m-s*2)); ctx.stroke() } ctx.restore() }

      // volume
      if(show.volume){
        const Vh=80*dpr, maxV=Math.max(...vis.map(k=>k.v))
        for(let i=0;i<n;i++){ const k=vis[i], X=x(i), hgt=(k.v/maxV)*(Vh-8*dpr)
          vtx.fillStyle=(k.c>=k.o)?THEMES[theme].volUp:THEMES[theme].volDn
          vtx.fillRect(X-Math.max(1,step*.4), H-hgt-6*dpr, Math.max(1,step*.8), hgt) }
      }

      // price badge (glow)
      const bx=W-170*dpr, by=10*dpr, bw=158*dpr, bh=28*dpr
      ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(bx,by,bw,bh)
      ctx.shadowColor=th.line; ctx.shadowBlur=10*dpr
      ctx.fillStyle=th.text; ctx.font = `${14*dpr}px ui-monospace, Menlo, Consolas, monospace`
      ctx.fillText(`${symbol}  ${fmt(lastPrice,2)}`, bx+8*dpr, by+18*dpr)
      ctx.shadowBlur=0

      // crosshair + tooltip
      if(cross.current.on){
        const { x:cx, y:cy } = cross.current
        const idx = Math.round((cx - padL)/step)
        if(idx>=0 && idx<n){
          const k = vis[idx]; cross.current.idx = first + idx
          // lines
          ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.setLineDash([5*dpr,5*dpr]); ctx.beginPath()
          ctx.moveTo(padL, cy); ctx.lineTo(W-padR, cy); ctx.moveTo(x(idx), padT); ctx.lineTo(x(idx), H-padB); ctx.stroke(); ctx.setLineDash([])
          // tooltip
          const tipX = clamp(x(idx)+8*dpr, padL, W-180*dpr)
          const tipY = clamp(cy-60*dpr, padT, H-120*dpr)
          const boxW=168*dpr, boxH=74*dpr
          ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(tipX, tipY, boxW, boxH)
          ctx.fillStyle='#cfe'
          const drawLine=(y, label, val)=>{ ctx.fillText(label, tipX+8*dpr, y); ctx.fillText(val, tipX+90*dpr, y) }
          ctx.fillText(new Date(k.t).toLocaleString(), tipX+8*dpr, tipY+16*dpr)
          drawLine(tipY+32*dpr,'O',fmt(k.o,2)); drawLine(tipY+46*dpr,'H',fmt(k.h,2))
          drawLine(tipY+60*dpr,'L',fmt(k.l,2)); drawLine(tipY+74*dpr,'C',fmt(k.c,2))
        }
      }

      rafRef.current = live? requestAnimationFrame(draw): 0
    }
    rafRef.current=requestAnimationFrame(draw)
    return ()=>cancelAnimationFrame(rafRef.current)
  },[candles, vp, show, live, theme, symbol])

  // mouse interactions (pan/zoom/crosshair)
  useEffect(()=>{
    const wrap=wrapRef.current
    if(!wrap) return
    let dragging=false, lastX=0
    const onWheel=(e)=>{
      e.preventDefault()
      const rect=wrap.getBoundingClientRect()
      const px=e.clientX-rect.left
      setVp(v=>{
        const zNew=clamp(e.deltaY<0? v.zoom*1.15 : v.zoom/1.15, .4, 6)
        // зум к точке px: сместим first так, чтобы индекс под курсором сохранился
        const n=v.last-v.first+1
        const idxRel = (px/rect.width)*n
        const nNew = Math.max(10, Math.round(n * (v.zoom/zNew)))
        let first = Math.round(v.first + idxRel - idxRel*(nNew/n))
        let last  = first + nNew - 1
        first=clamp(first,0,Math.max(0,candles.length-2)); last=clamp(last, first+1, candles.length-1)
        return { ...v, first, last, zoom:zNew }
      })
    }
    const onDown=(e)=>{ dragging=true; lastX=e.clientX }
    const onMove=(e)=>{
      const rect=wrap.getBoundingClientRect()
      cross.current={ on:true, x:e.clientX-rect.left, y:e.clientY-rect.top, idx:-1 }
      if(!dragging) return
      const dx=e.clientX-lastX; lastX=e.clientX
      setVp(v=>{
        const n=v.last-v.first+1
        const shift = Math.round(-dx/ (rect.width/n)) // пиксель -> количество свечей
        let first = clamp(v.first+shift,0,Math.max(0,candles.length-2))
        let last  = clamp(v.last +shift, first+1, candles.length-1)
        // если уехали к началу — подгружаем историю
        if(first<60) fetchOlder().catch(()=>{})
        return { ...v, first, last }
      })
    }
    const onUp=()=>{ dragging=false }
    const onLeave=()=>{ cross.current.on=false }
    wrap.addEventListener('wheel',onWheel,{passive:false})
    wrap.addEventListener('mousedown',onDown)
    window.addEventListener('mousemove',onMove)
    window.addEventListener('mouseup',onUp)
    wrap.addEventListener('mouseleave',onLeave)
    return ()=>{
      wrap.removeEventListener('wheel',onWheel)
      wrap.removeEventListener('mousedown',onDown)
      window.removeEventListener('mousemove',onMove)
      window.removeEventListener('mouseup',onUp)
      wrap.removeEventListener('mouseleave',onLeave)
    }
  },[candles, fetchOlder])

  /* ---- orderbook, trades, demo ops ---- */
  const book   = useDepth(symbol, depthLevels)
  const trades = useTrades(symbol, 80)
  const [account,setAccount]=useState(null)
  const [orders,setOrders]=useState([])
  const [positions,setPositions]=useState([])
  const [mOrder,setMOrder]=useState(false)
  const [mReg,setMReg]=useState(false)
  const [mAbout,setMAbout]=useState(false)
  const [mAlert,setMAlert]=useState(false)
  const [mSettings,setMSettings]=useState(false)

  const placeOrder=(side,type,qty,px)=>{
    if(!account){ toast('Sign in to place order (demo)','warn'); setMReg(true); return }
    const id=Math.random().toString(36).slice(2)
    const ord={id,ts:now(),symbol,side,type,qty,px:px??lastPrice}
    setOrders(x=>[ord,...x].slice(0,80))
    toast(`${side} ${qty} ${symbol} @ ${fmt(ord.px,2)} (demo)`, side==='BUY'?'ok':'err')
  }
  const openPos=(side,qty,entry)=>{
    const id=Math.random().toString(36).slice(2)
    const pos={id,symbol,side,qty,entry,ts:now()}
    setPositions(x=>[pos,...x].slice(0,40))
  }
  const closePos=(id)=>{
    const p=positions.find(x=>x.id===id); if(!p) return
    const pnl=(p.side==='LONG'?(lastPrice-p.entry):(p.entry-lastPrice))*p.qty
    toast(`PNL ${fmt(pnl,2)} (demo)`,'ok'); setPositions(x=>x.filter(i=>i.id!==id))
  }

  // hotkeys
  useEffect(()=>{
    const onKey=(e)=>{
      if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if(e.key==='b'||e.key==='B') placeOrder('BUY','Market',1)
      if(e.key==='s'||e.key==='S') placeOrder('SELL','Market',1)
      if(e.key==='=') setVp(v=>({ ...v, zoom:clamp(v.zoom*1.2,.4,6) }))
      if(e.key==='-') setVp(v=>({ ...v, zoom:clamp(v.zoom/1.2,.4,6) }))
      if(e.key===' ') setLive(v=>!v)
      if(e.key==='f'||e.key==='F') setFullscreen(v=>!v)
      if(e.key==='ArrowLeft')  setVp(v=>({ ...v, first:Math.max(0,v.first-10), last:Math.max(v.first-10+ (v.last-v.first), v.first-10+1) }))
      if(e.key==='ArrowRight') setVp(v=>({ ...v, first:Math.min(Math.max(0,candles.length-2),v.first+10), last:Math.min(candles.length-1, v.first+10+(v.last-v.first)) }))
    }
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[candles,lastPrice,account])

  /* ---- ui helpers ---- */
  const th=THEMES[theme]||THEMES.violet

  return (
    <div className={`panel--exchange ${fullscreen?'ex-full':''}`}>
      {/* top bar */}
      <div className="ex-controls">
        <div className="row">
          <select value={symbol} onChange={e=>setSymbol(e.target.value)}>
            {PAIRS.map(p=><option key={p.sym} value={p.sym}>{p.label}</option>)}
          </select>
          <select value={interval} onChange={e=>setInterval(e.target.value)}>
            {INTERVALS.map(i=><option key={i} value={i}>{i}</option>)}
          </select>
          <select value={theme} onChange={e=>setTheme(e.target.value)}>
            {Object.keys(THEMES).map(k=><option key={k} value={k}>{k}</option>)}
          </select>

          {[
            ['ema21','EMA21'],['ma50','MA50'],['vwap','VWAP'],['bands','Bands'],
            ['rsi','RSI'],['atr','ATR'],['volume','Volume'],['grid','Grid'],
          ].map(([k, label])=>(
            <label key={k} className="chk"><input type="checkbox" checked={show[k]} onChange={e=>setShow(s=>({...s,[k]:e.target.checked}))}/>{label}</label>
          ))}
        </div>

        <div className="row">
          <span className="badge">DEMO</span>
          <span className="badge">AI-orchestrated • Multi-chain • CEX+DEX</span>
          <button className="btn ghost" onClick={()=>setVp(v=>({ ...v, zoom:clamp(v.zoom/1.2,.4,6) }))}>–</button>
          <span style={{opacity:.7}}>Zoom {vp.zoom.toFixed(2)}×</span>
          <button className="btn ghost" onClick={()=>setVp(v=>({ ...v, zoom:clamp(v.zoom*1.2,.4,6) }))}>+</button>
          <button className="btn ghost" onClick={()=>setLive(v=>!v)}>{live?'Pause':'Resume'}</button>
          <button className="btn ghost" onClick={()=>setFullscreen(v=>!v)}>{fullscreen?'Exit':'Fullscreen'}</button>
          <button className="btn" onClick={()=>setMSettings(true)}>Settings</button>
          <button className="btn ghost" onClick={()=>setMAbout(true)}>About</button>
        </div>
      </div>

      {/* layout */}
      <div className="ex-grid ex-grid--withleft">
        {/* WATCHLIST (left) */}
        <div className="ex-watch">
          <div className="ex-box-title">Watchlist</div>
          {PAIRS.map(p=>{
            const active=p.sym===symbol
            return (
              <div key={p.sym} className={`ex-row ${active?'active':''}`} onClick={()=>setSymbol(p.sym)} style={{cursor:'pointer'}}>
                <span>{p.label}</span>
                <span style={{opacity:.7}}>{active? fmt(lastPrice,2) : ''}</span>
              </div>
            )
          })}
          <button className="btn ghost" onClick={()=>setMAlert(true)} style={{marginTop:'auto'}}>Alert…</button>
        </div>

        {/* CHART */}
        <div className="ex-chart" ref={wrapRef}>
          <canvas ref={cvsRef} className="ex-canvas"/>
          <canvas ref={volRef} className="ex-canvas-overlay"/>
          <canvas ref={fxRef}  className="ex-canvas-overlay"/>

          {/* quick actions */}
          <div className="ex-overlay-actions">
            <button className="btn sm" onClick={()=>placeOrder('BUY','Market',1)}>Buy 1</button>
            <button className="btn ghost sm" onClick={()=>placeOrder('SELL','Market',1)}>Sell 1</button>
            <button className="btn ghost sm" onClick={()=>setMOrder(true)}>Limit…</button>
            <button className="btn ghost sm" onClick={()=>{
              // screenshot
              const a=document.createElement('a')
              a.href=cvsRef.current.toDataURL('image/png')
              a.download=`${symbol}_${interval}_${Date.now()}.png`
              a.click()
            }}>Snapshot</button>
          </div>

          {/* RSI strip */}
          {show.rsi && <div className="ex-rsi"><RSIline data={rsi14} color={th.line}/></div>}
        </div>

        {/* ORDER BOOK */}
        <div className="ex-box">
          <div className="ex-box-title">Order Book</div>
          <label className="chk" style={{marginBottom:6}}>
            <input type="range" min="6" max="24" value={depthLevels} onChange={e=>setDepthLevels(+e.target.value)}/> Depth {depthLevels}
          </label>
          <div className="ex-book-cols">
            <div>
              <div className="ex-col-title">Bids</div>
              <OBcol rows={book.bids} kind="bid" />
            </div>
            <div>
              <div className="ex-col-title">Asks</div>
              <OBcol rows={book.asks} kind="ask" />
            </div>
          </div>
          <button className="btn" style={{width:'100%',marginTop:8}} onClick={()=>setMOrder(true)}>Open DEMO Trade</button>
        </div>

        {/* TRADES */}
        <div className="ex-box">
          <div className="ex-box-title">Recent trades</div>
          <div className="ex-scroll">
            {trades.map((t,i)=>(
              <div key={i} className="ex-row">
                <span className={t.up?'b':'r'}>{fmt(t.p,2)}</span>
                <span>{fmt(t.q,3)}</span>
              </div>
            ))}
          </div>
          <div className="row" style={{marginTop:'auto',gap:8}}>
            {!account
              ? <button className="btn" onClick={()=>setMReg(true)}>Sign in</button>
              : <button className="btn ghost" onClick={()=>{ setAccount(null); toast('Signed out','info') }}>Sign out</button>
            }
            <button className="btn ghost" onClick={()=>setMReg(true)}>Register</button>
            <button className="btn ghost" onClick={()=>setMAlert(true)}>Alert…</button>
          </div>
        </div>
      </div>

      {/* POSITIONS / ORDERS */}
      <div className="ex-boards">
        <div className="ex-board">
          <div className="ex-board-head">Positions (demo)</div>
          {positions.length===0 && <div className="ex-empty">No positions</div>}
          {positions.map(p=>(
            <div className="ex-row" key={p.id}>
              <span className={p.side==='LONG'?'b':'r'}>{p.side}</span>
              <span>{p.symbol}</span>
              <span>Qty {p.qty}</span>
              <span>Entry {fmt(p.entry,2)}</span>
              <span>Mark {fmt(lastPrice,2)}</span>
              <span>PNL {fmt((p.side==='LONG'?(lastPrice-p.entry):(p.entry-lastPrice))*p.qty,2)}</span>
              <button className="btn ghost sm" onClick={()=>closePos(p.id)}>Close</button>
            </div>
          ))}
        </div>
        <div className="ex-board">
          <div className="ex-board-head">Orders (demo)</div>
          {orders.length===0 && <div className="ex-empty">No orders</div>}
          {orders.map(o=>(
            <div className="ex-row" key={o.id}>
              <span className={o.side==='BUY'?'b':'r'}>{o.side}</span>
              <span>{o.type}</span>
              <span>{o.symbol}</span>
              <span>Qty {o.qty}</span>
              <span>Px {fmt(o.px,2)}</span>
              <span style={{opacity:.6}}>{new Date(o.ts).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="ex-actions">
        <button className="btn" onClick={()=>{ openPos('LONG',0.5,lastPrice); toast('Opened LONG 0.5 (demo)','ok') }}>Long (demo)</button>
        <button className="btn ghost" onClick={()=>{ openPos('SHORT',0.5,lastPrice); toast('Opened SHORT 0.5 (demo)','err') }}>Short (demo)</button>
        <button className="btn ghost" onClick={()=>setMOrder(true)}>Place order…</button>
      </div>

      {/* toasts */}
      <div className="ex-toasts">{toasts.map(t=><div key={t.id} className={`ex-toast ${t.kind}`}>{t.text}</div>)}</div>

      {/* modals */}
      <Modal open={mOrder} title="Place order (demo)" onClose={()=>setMOrder(false)}>
        <OrderForm symbol={symbol} price={lastPrice} onPlace={(o)=>{ placeOrder(o.side,o.type,o.qty,o.px); setMOrder(false) }}/>
      </Modal>
      <Modal open={mReg} title="Sign in / Register (demo)" onClose={()=>setMReg(false)} wide>
        <RegisterForm onDone={(u)=>{ setAccount(u); toast(`Welcome, ${u.name}`,'ok'); setMReg(false) }}/>
      </Modal>
      <Modal open={mSettings} title="Settings" onClose={()=>setMSettings(false)} wide>
        <SettingsPanel theme={theme} setTheme={setTheme} show={show} setShow={setShow} depthLevels={depthLevels} setDepthLevels={setDepthLevels}/>
      </Modal>
      <Modal open={mAbout} title="About • Quantum L7 Exchange" onClose={()=>setMAbout(false)}>
        <p className="muted">XXL-рендер с подкачкой истории (до 3000 свечей в буфере), панорамой и зумом. Всё — демо, данные — Binance. Агентная логика, маршрутизация CEX+DEX и риск-модели будут подключены в проде.</p>
        <ul className="bullets">
          <li>Hotkeys: <code>B</code>, <code>S</code>, <code>=</code>, <code>-</code>, <code>Space</code>, <code>F</code>, <code>←</code>/<code>→</code></li>
          <li>Snapshot — экспорт PNG графика</li>
          <li>Indicators: EMA, MA, VWAP, Bands, RSI, ATR</li>
        </ul>
      </Modal>
      <Modal open={mAlert} title="Create alert (demo)" onClose={()=>setMAlert(false)}>
        <AlertForm price={lastPrice} onCreate={(txt)=>{ toast(`Alert set: ${txt}`,'info'); setMAlert(false) }}/>
      </Modal>
    </div>
  )
}

/* =========================== SUB COMPONENTS ============================== */

function Modal({ open, title, children, onClose, wide=false }){
  if(!open) return null
  return (
    <div className="ex-modal">
      <div className={`ex-modal-card ${wide?'wide':''}`}>
        <div className="ex-modal-head">
          <strong>{title}</strong>
          <button className="btn ghost sm" onClick={onClose}>✕</button>
        </div>
        <div className="ex-modal-body">{children}</div>
      </div>
    </div>
  )
}

function RSIline({ data, color }){
  const ref=useRef(null)
  useEffect(()=>{
    const el=ref.current; if(!el) return
    const W=el.clientWidth, H=el.clientHeight
    const cvs=document.createElement('canvas'); cvs.width=W; cvs.height=H; el.innerHTML=''; el.appendChild(cvs)
    const ctx=cvs.getContext('2d'); ctx.clearRect(0,0,W,H)
    ctx.strokeStyle='rgba(255,255,255,.15)'; [30,70].forEach(v=>{ const y=H*(1-v/100); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() })
    if(!data||data.length<2) return
    const n=data.length, x=i=>i/(n-1)*W, y=v=>H*(1-(clamp(v||50,0,100)/100))
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath()
    data.forEach((v,i)=>{ const X=x(i), Y=y(v); i?ctx.lineTo(X,Y):ctx.moveTo(X,Y) }); ctx.stroke()
  },[data,color])
  return <div ref={ref} className="ex-rsi-line"/>
}

function OBcol({ rows, kind }){
  const maxQ = rows.length? Math.max(...rows.map(r=>r.q)) : 1
  return (
    <div className="ex-obcol">
      {rows.map((r,i)=>{
        const w = Math.min(100, Math.round(r.q/maxQ*100))
        return (
          <div key={i} className={`ex-obrow ${kind}`}>
            <span className={kind==='bid'?'b':'r'}>{fmt(r.p,2)}</span>
            <span>{fmt(r.q,3)}</span>
            <span className="bar" style={{ width:`${w}%` }}/>
          </div>
        )
      })}
    </div>
  )
}

function RegisterForm({ onDone }){
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [pass,setPass]=useState('')
  return (
    <form className="form" onSubmit={(e)=>{ e.preventDefault(); onDone({ name:name||'User', email }) }}>
      <div className="grid2">
        <label>Name<input required value={name} onChange={e=>setName(e.target.value)}/></label>
        <label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
      </div>
      <label>Password<input required type="password" value={pass} onChange={e=>setPass(e.target.value)}/></label>
      <div className="row" style={{justifyContent:'flex-end',gap:8}}>
        <button type="button" className="btn ghost" onClick={()=>{ setName('Satoshi'); setEmail('satoshi@quantuml7.ai'); setPass('demo') }}>Fill demo</button>
        <button className="btn" type="submit">Continue</button>
      </div>
    </form>
  )
}

function OrderForm({ symbol, price, onPlace }){
  const [side,setSide]=useState('BUY'); const [type,setType]=useState('Market'); const [qty,setQty]=useState(1); const [px,setPx]=useState(price)
  useEffect(()=>{ if(type==='Market') setPx(price) },[price,type])
  return (
    <form className="form" onSubmit={(e)=>{ e.preventDefault(); onPlace({ side, type, qty:+qty, px:+px }) }}>
      <div className="grid3">
        <label>Symbol<input value={symbol} disabled/></label>
        <label>Side<select value={side} onChange={e=>setSide(e.target.value)}><option>BUY</option><option>SELL</option></select></label>
        <label>Type<select value={type} onChange={e=>setType(e.target.value)}><option>Market</option><option>Limit</option><option>Stop</option></select></label>
      </div>
      <div className="grid3">
        <label>Qty<input type="number" min="0.0001" step="0.0001" value={qty} onChange={e=>setQty(e.target.value)}/></label>
        <label>Price<input type="number" step="0.01" value={px} onChange={e=>setPx(e.target.value)} disabled={type==='Market'}/></label>
        <div className="form-hint">Mark {fmt(price,2)}</div>
      </div>
      <div className="row" style={{justifyContent:'flex-end',gap:8}}>
        <button className={`btn ${side==='BUY'?'':'ghost'}`} type="submit">{side==='BUY'?'Buy':'Place'}</button>
        <button className={`btn ${side==='SELL'?'':'ghost'}`} type="button" onClick={()=>onPlace({ side:'SELL', type, qty:+qty, px:+px })}>Sell</button>
      </div>
    </form>
  )
}

function SettingsPanel({ theme,setTheme, show,setShow, depthLevels,setDepthLevels }){
  return (
    <div className="settings">
      <div className="grid2">
        <div><div className="subhead">Theme</div>
          <select value={theme} onChange={e=>setTheme(e.target.value)}>{Object.keys(THEMES).map(k=><option key={k} value={k}>{k}</option>)}</select>
        </div>
        <div><div className="subhead">Depth</div>
          <input type="range" min="6" max="24" value={depthLevels} onChange={e=>setDepthLevels(+e.target.value)}/>
          <div style={{opacity:.7}}>= {depthLevels}</div>
        </div>
      </div>
      <div className="subhead" style={{marginTop:12}}>Indicators</div>
      <div className="grid3">
        {Object.entries({ ema21:'EMA21',ma50:'MA50',vwap:'VWAP',bands:'Bands',rsi:'RSI(14)',atr:'ATR(14)',volume:'Volume',grid:'Grid' })
          .map(([k,label])=>(
            <label key={k} className="chk"><input type="checkbox" checked={show[k]} onChange={e=>setShow(s=>({...s,[k]:e.target.checked}))}/>{label}</label>
          ))}
      </div>
      <p className="muted" style={{marginTop:12}}>Подкачка «влево» делается автоматически при панорамировании. Буфер ограничен ~3000 свечей на пару/таймфрейм.</p>
    </div>
  )
}

function AlertForm({ price, onCreate }){
  const [op,setOp]=useState('>'); const [px,setPx]=useState(price); const [note,setNote]=useState('Breakout watch')
  return (
    <form className="form" onSubmit={(e)=>{ e.preventDefault(); onCreate(`${op} ${fmt(px,2)} — ${note}`) }}>
      <div className="grid3">
        <label>Condition<select value={op} onChange={e=>setOp(e.target.value)}><option>&gt;</option><option>&lt;</option><option>&gt;=</option><option>&lt;=</option></select></label>
        <label>Price<input type="number" step="0.01" value={px} onChange={e=>setPx(+e.target.value)}/></label>
        <label>Note<input value={note} onChange={e=>setNote(e.target.value)}/></label>
      </div>
      <div className="row" style={{justifyContent:'flex-end'}}><button className="btn" type="submit">Create</button></div>
    </form>
  )
}
