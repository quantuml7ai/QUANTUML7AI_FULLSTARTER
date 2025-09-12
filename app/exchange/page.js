'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../../components/i18n'

/* ---------- small ui helpers ---------- */
const TX = (t, key, fb) => { try { const v = t(key); return v === key ? fb : v } catch { return fb } }
const Btn = ({ active, children, onClick }) => (
  <button className={`btn ${active ? '' : 'ghost'}`} onClick={onClick} style={{ userSelect:'none' }}>
    {children}
  </button>
)
const Small = ({ children }) => <span style={{ opacity:.8, fontSize:12 }}>{children}</span>
const Slider = ({ min, max, step=1, value, onChange }) =>
  <input type="range" min={min} max={max} step={step} value={value}
         onChange={e=>onChange(parseFloat(e.target.value))} style={{ width:140 }} />

/* ---------- math ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const lerp  = (a, b, t) => a + (b - a) * t
const ema = (arr, p) => {
  if (!arr.length) return []
  const k = 2 / (p + 1); const out = new Array(arr.length); out[0] = arr[0]
  for (let i=1;i<arr.length;i++) out[i] = arr[i]*k + out[i-1]*(1-k)
  return out
}
const sma = (arr, p) => arr.map((_,i)=> i<p-1 ? null : (arr.slice(i-p+1, i+1).reduce((s,x)=>s+x,0)/p))
const stdev = (arr, p) => arr.map((_,i)=>{
  if (i<p-1) return null
  const s = arr.slice(i-p+1, i+1); const m = s.reduce((a,b)=>a+b,0)/p
  const v = s.reduce((a,b)=>a+(b-m)**2,0)/p; return Math.sqrt(v)
})
const typical = (o,h,l,c) => o.map((_,i)=>(h[i]+l[i]+c[i])/3)

/* ---------- synthetic data ---------- */
function seedRand(seed=1){ let x = seed>>>0; return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; return ((x>>>0)%1_000_000)/1_000_000 } }
function genOHLCV(n=320, start=120, vol=1.8, seed=7, bias=0){
  const rnd = seedRand(seed)
  const o=new Array(n), h=new Array(n), l=new Array(n), c=new Array(n), v=new Array(n)
  let last = start
  for (let i=0;i<n;i++){
    const trend = bias * (i/n)
    const drift = (rnd()-.5)*vol + trend
    const open = last
    let close = clamp(open + drift + (rnd()-.5)*vol*0.6, 60, 240)
    const high = Math.max(open, close) + rnd()*vol*0.9
    const low  = Math.min(open, close) - rnd()*vol*0.9
    const volu = 100 + Math.floor(rnd()*900)
    o[i]=open; h[i]=high; l[i]=low; c[i]=close; v[i]=volu
    last = close
  }
  return { o,h,l,c,v }
}
function heikinAshi({o,h,l,c}){
  const n=c.length, ho=new Array(n), hh=new Array(n), hl=new Array(n), hc=new Array(n)
  hc[0]=(o[0]+h[0]+l[0]+c[0])/4; ho[0]=(o[0]+c[0])/2; hh[0]=h[0]; hl[0]=l[0]
  for(let i=1;i<n;i++){ hc[i]=(o[i]+h[i]+l[i]+c[i])/4; ho[i]=(ho[i-1]+hc[i-1])/2; hh[i]=Math.max(h[i],ho[i],hc[i]); hl[i]=Math.min(l[i],ho[i],hc[i]) }
  return {o:ho,h:hh,l:hl,c:hc}
}

/* ---------- themes ---------- */
const THEMES = {
  aqua:  { up:'#3afcd1', down:'#ff6b9e', line:'#5ee7ff', grid:'rgba(170,220,255,.2)', axis:'#8ed5ff', volUp:'#5ee7ff', volDn:'#f98fb4', band:'#3ab6ff' },
  violet:{ up:'#34d399', down:'#fb7185', line:'#a78bfa', grid:'rgba(190,160,255,.22)', axis:'#c4b5fd', volUp:'#93c5fd', volDn:'#fda4af', band:'#8b5cf6' },
  amber: { up:'#22d3ee', down:'#f43f5e', line:'#fbbf24', grid:'rgba(255,210,140,.22)', axis:'#fde68a', volUp:'#fcd34d', volDn:'#fca5a5', band:'#f59e0b' },
}

/* ---------- TF params ---------- */
const TF_PARAMS = {
  '1m':  { vol:2.8, bias:-0.15, seed:13 },
  '5m':  { vol:2.4, bias:-0.05, seed:11 },
  '15m': { vol:2.0, bias: 0.00, seed:9  },
  '1h':  { vol:1.6, bias: 0.12, seed:7  },
  '4h':  { vol:1.3, bias: 0.18, seed:5  },
  '1d':  { vol:1.0, bias: 0.25, seed:3  },
}

/* ---------- page ---------- */
export default function ExchangePage(){
  const { t, lang } = useI18n()

  const [tf, setTf] = useState('1m')
  const [style, setStyle] = useState('quantum')      // 'candle' | 'hollow' | 'heikin' | 'area' | 'quantum'
  const [theme, setTheme] = useState('violet')
  const [bars, setBars]   = useState(320)
  const [glow, setGlow]   = useState(250)            // будет «зажато» ниже
  const [tickMs, setTickMs] = useState(900)
  const [speed, setSpeed] = useState(2.0)
  const [live, setLive]   = useState(true)

  const [show, setShow]   = useState({ ma50:true, ema21:true, ma200:false, vwap:true, bands:true, vol:true })
  const [decor, setDecor] = useState({ waves:true, stars:true, halos:true, scan:true, ions:false, glint:true })

  const cvsRef = useRef(null)
  const volRef = useRef(null)
  const rafRef = useRef(0)

  const pxRatio = typeof window!=='undefined'
    ? Math.min(Math.max(window.devicePixelRatio||1,1), 1.5)     // <= 1.5 вместо 2.0+
    : 1
  const glowEff = Math.min(glow, 120)                            // блур жёстко ограничен

  const dataRef    = useRef(genOHLCV(bars, 118, TF_PARAMS[tf].vol, TF_PARAMS[tf].seed, TF_PARAMS[tf].bias))
  const derivedRef = useRef({ ema21:[], ma50:[], ma200:[], vwap:[], mid:[], sd:[] })
  const gridPathRef = useRef(null)
  const starsRef    = useRef([])
  const volDirtyRef = useRef(true)                               // перерисовывать объём только при изменении данных

  /* recompute derived only when data changes */
  const recomputeDerived = () => {
    const src = dataRef.current
    const c = src.c
    const ema21 = ema(c,21)
    const ma50  = sma(c,50)
    const ma200 = sma(c,200)

    // vwap
    const typ = typical(src.o,src.h,src.l,src.c)
    let pv=0, vv=0; const vw=new Array(c.length)
    for(let i=0;i<c.length;i++){ pv+=typ[i]*src.v[i]; vv+=src.v[i]; vw[i]=pv/Math.max(1,vv) }

    const mid = sma(c,20), sd = stdev(c,20)
    derivedRef.current = { ema21, ma50, ma200, vwap:vw, mid, sd }
  }

  /* resize */
  const resize = () => {
    const cvs=cvsRef.current, vol=volRef.current
    if(!cvs||!cvs.parentElement) return
    const rect = cvs.parentElement.getBoundingClientRect()
    const W = Math.floor(rect.width)
    const H = Math.floor(rect.width*0.5)
    for(const el of [cvs,vol]){ if(!el) continue; el.width=Math.floor(W*pxRatio); el.height=Math.floor(H*pxRatio); el.style.width=W+'px'; el.style.height=H+'px' }
    // rebuild grid & stars for new size
    const padL=60*pxRatio, padR=20*pxRatio, padT=20*pxRatio, padB=24*pxRatio
    const Gh=H*pxRatio - 0
    const path = new Path2D()
    for(let i=0;i<=6;i++){ const y=lerp(padT, Gh*0.78 - padB, i/6); path.moveTo(padL,y); path.lineTo(W*pxRatio-padR,y) }
    for(let i=0;i<=10;i++){ const x=lerp(padL, W*pxRatio-padR, i/10); path.moveTo(x,padT); path.lineTo(x,Gh*0.78 - padB) }
    gridPathRef.current = path
    // static star field
    const stars=[]; const count=60
    for(let i=0;i<count;i++){
      stars.push({
        x: padL + Math.random()*(W*pxRatio-padL-padR),
        y: padT + Math.random()*((Gh*0.78)-padT-padB),
        r: 1 + Math.random()*1.5
      })
    }
    starsRef.current = stars
  }
  useEffect(()=>{ resize(); const ro=new ResizeObserver(resize); if(cvsRef.current?.parentElement) ro.observe(cvsRef.current.parentElement); return ()=>ro.disconnect() },[pxRatio])

  /* regenerate on bars/tf change */
  useEffect(()=>{
    const p = TF_PARAMS[tf] || TF_PARAMS['1m']
    dataRef.current = genOHLCV(bars, 118, p.vol, p.seed, p.bias)
    recomputeDerived()
    volDirtyRef.current = true
  },[bars, tf])

  /* live ticks (data change only) */
  useEffect(()=>{
    let timer
    const loop = () => {
      if(live){
        const p = TF_PARAMS[tf] || TF_PARAMS['1m']
        const d = dataRef.current
        const {o,h,l,c,v} = d
        const last = c[c.length-1]
        const rnd = Math.random
        const trend = p.bias * 0.3
        const drift = (rnd()-.5)*p.vol + trend
        const open=last
        const close = clamp(open + drift + (rnd()-.5)*p.vol*0.6, 60, 240)
        const high = Math.max(open, close) + rnd()*p.vol*0.8
        const low  = Math.min(open, close) - rnd()*p.vol*0.8
        const volu = 100 + Math.floor(rnd()*900)
        o.push(open); h.push(high); l.push(low); c.push(close); v.push(volu)
        while(o.length>bars){ o.shift(); h.shift(); l.shift(); c.shift(); v.shift() }
        recomputeDerived()
        volDirtyRef.current = true
      }
      timer = setTimeout(loop, tickMs)
    }
    timer = setTimeout(loop, tickMs)
    return () => clearTimeout(timer)
  },[bars, tf, tickMs, live])

  /* draw loop (throttled to 30fps) */
  useEffect(()=>{
    cancelAnimationFrame(rafRef.current)
    const ctx = cvsRef.current?.getContext('2d')
    const vtx = volRef.current?.getContext('2d')
    if(!ctx || !vtx) return

    const FPS = 30
    const frameMs = 1000/FPS
    const lastRef = { t: 0 }

    const draw = (ts=0)=>{
      if (ts - lastRef.t < frameMs) { rafRef.current = requestAnimationFrame(draw); return }
      lastRef.t = ts

      const W=ctx.canvas.width, H=ctx.canvas.height
      const Vh=Math.floor(H*0.22), Gh=H-Vh
      const padL=60*pxRatio, padR=20*pxRatio, padT=20*pxRatio, padB=24*pxRatio

      const th = THEMES[theme]||THEMES.violet
      const up=th.up, dn=th.down, ln=th.line, grid=th.grid, axis=th.axis, band=th.band

      const src = dataRef.current
      let {o,h,l,c,v} = src
      const n=c.length

      // choose visual price series
      let vo=o, vh=h, vl=l, vc=c
      if(style==='heikin'){ ({o:vo,h:vh,l:vl,c:vc}=heikinAshi(src)) }

      // scaling
      const max=Math.max(...vh), min=Math.min(...vl)
      const priceToY = (p)=> padT + (Gh-padT-padB) * (1 - (p - min) / (max - min + 1e-6))
      const xStep = (W-padL-padR)/(n-1)

      // clear
      ctx.clearRect(0,0,W,H)

      // grid (static path)
      if (gridPathRef.current){
        ctx.save(); ctx.strokeStyle=grid; ctx.lineWidth=1*pxRatio; ctx.stroke(gridPathRef.current); ctx.restore()
      }

      // bands (precomputed mid/sd)
      if(show.bands){
        const { mid, sd } = derivedRef.current
        ctx.save(); ctx.strokeStyle=band; ctx.globalAlpha=.45; ctx.lineWidth=1*pxRatio; ctx.beginPath()
        for(let i=0;i<n;i++){
          const mm=mid[i], s=sd[i]; if(mm==null||s==null) continue
          const x=padL+i*xStep; const y1=priceToY(mm+s*2), y2=priceToY(mm-s*2)
          ctx.moveTo(x,y1); ctx.lineTo(x,y2)
        }
        ctx.stroke(); ctx.restore()
      }

      // candles / area (без shadowBlur во имя FPS)
      if(style==='area'){
        ctx.save(); ctx.lineWidth=2*pxRatio; ctx.strokeStyle=ln; ctx.beginPath()
        for(let i=0;i<n;i++){ const x=padL+i*xStep, y=priceToY(vc[i]); i?ctx.lineTo(x,y):ctx.moveTo(x,y) }
        ctx.stroke()
        const g=ctx.createLinearGradient(0,padT,0,Gh-padB)
        g.addColorStop(0,ln.replace(')',',.22)').replace('rgb','rgba')); g.addColorStop(1,'rgba(0,0,0,0)')
        ctx.fillStyle=g; ctx.lineTo(W-padR,Gh-padB); ctx.lineTo(padL,Gh-padB); ctx.closePath(); ctx.fill()
        ctx.restore()
      } else {
        const w=Math.max(1,xStep*.6)
        ctx.save(); ctx.lineWidth=Math.max(1,1.2*pxRatio)
        for(let i=0;i<n;i++){
          const x=padL+i*xStep, yo=priceToY(vo[i]), yh=priceToY(vh[i]), yl=priceToY(vl[i]), yc=priceToY(vc[i])
          const isUp=vc[i]>=vo[i], col=isUp?up:dn
          ctx.strokeStyle=col; ctx.beginPath(); ctx.moveTo(x,yh); ctx.lineTo(x,yl); ctx.stroke()
          const top=Math.min(yo,yc), bot=Math.max(yo,yc)
          if(style==='hollow' && isUp){ ctx.strokeRect(x-w/2,top,w,Math.max(1,bot-top)) }
          else { ctx.fillStyle=col; ctx.fillRect(x-w/2,top,w,Math.max(1,bot-top)) }
        }
        ctx.restore()
      }

      // indicators (используем derivedRef — без пересчётов)
      const { ema21, ma50, ma200, vwap } = derivedRef.current
      if(show.ema21){
        ctx.save(); ctx.strokeStyle=th.line; ctx.lineWidth=2*pxRatio; ctx.beginPath()
        ema21.forEach((v,i)=>{ if(!v&&v!==0) return; const x=padL+i*xStep, y=priceToY(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y) })
        ctx.stroke(); ctx.restore()
      }
      if(show.ma50){
        ctx.save(); ctx.strokeStyle=axis; ctx.setLineDash([6*pxRatio,4*pxRatio]); ctx.beginPath()
        ma50.forEach((v,i)=>{ if(v==null) return; const x=padL+i*xStep, y=priceToY(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y) })
        ctx.stroke(); ctx.setLineDash([]); ctx.restore()
      }
      if(show.ma200){
        ctx.save(); ctx.strokeStyle='#999'; ctx.beginPath()
        ma200.forEach((v,i)=>{ if(v==null) return; const x=padL+i*xStep, y=priceToY(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y) })
        ctx.stroke(); ctx.restore()
      }
      if(show.vwap){
        ctx.save(); ctx.strokeStyle='#00ffffaa'; ctx.lineWidth=1.6*pxRatio; ctx.beginPath()
        vwap.forEach((v,i)=>{ const x=padL+i*xStep, y=priceToY(v); i?ctx.lineTo(x,y):ctx.moveTo(x,y) })
        ctx.stroke(); ctx.restore()
      }

      // volume canvas — только если dirty
      if(show.vol && volDirtyRef.current){
        vtx.clearRect(0,0,W,H)
        const maxV=Math.max(...v)
        for(let i=0;i<n;i++){
          const x=padL+i*xStep, hgt=(v[i]/maxV)*(Vh-10*pxRatio), isUp=c[i]>=o[i]
          vtx.fillStyle=isUp?THEMES[theme].volUp:THEMES[theme].volDn
          vtx.fillRect(x-Math.max(1,xStep*.4), H-hgt-6*pxRatio, Math.max(1,xStep*.8), hgt)
        }
        volDirtyRef.current = false
      }

      // decor — лёгкие версии
      if(decor.stars && starsRef.current.length){
        for(const s of starsRef.current){
          const a=.35 + .25*Math.sin((s.x*0.01 + ts*0.003*speed))
          ctx.fillStyle=`rgba(255,255,255,${a})`; ctx.fillRect(s.x, s.y, s.r, s.r)
        }
      }
      if(decor.waves){
        ctx.save(); ctx.strokeStyle=THEMES[theme].line; ctx.globalAlpha=.22; ctx.lineWidth=1.1*pxRatio
        for(let k=0;k<2;k++){ ctx.beginPath()
          for(let x=padL;x<=W-padR;x+=10*pxRatio){
            const y=padT+(Gh-padT-padB)/2 + Math.sin((x*0.009 + ts*0.002*speed + k))*14*pxRatio
            x===padL?ctx.moveTo(x,y):ctx.lineTo(x,y)
          } ctx.stroke()
        } ctx.restore()
      }
      if(decor.scan){
        const x=padL + ((ts*0.06*speed) % (W-padL-padR))
        const g=ctx.createLinearGradient(x-24*pxRatio,0,x+24*pxRatio,0)
        g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.5,'rgba(255,255,255,.10)'); g.addColorStop(1,'rgba(255,255,255,0)')
        ctx.fillStyle=g; ctx.fillRect(padL,padT,W-padL-padR,Gh-padT-padB)
      }
      if(decor.halos){
        ctx.save(); ctx.globalCompositeOperation='lighter'
        for(let i=n-60;i<n;i+=20){
          const x=padL+i*xStep, y=priceToY(c[i]), r=16*pxRatio
          const g=ctx.createRadialGradient(x,y,0,x,y,r)
          g.addColorStop(0,THEMES[theme].line.replace(')',',.28)').replace('rgb','rgba')); g.addColorStop(1,'rgba(0,0,0,0)')
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill()
        } ctx.restore()
      }
      if(decor.glint){
        const y=padT + ((ts*.10*speed) % (Gh-padT-padB))
        const g=ctx.createLinearGradient(0,y-14*pxRatio,0,y+14*pxRatio)
        g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(0.5,'rgba(255,255,255,.05)'); g.addColorStop(1,'rgba(255,255,255,0)')
        ctx.fillStyle=g; ctx.fillRect(padL,padT,W-padL-padR,Gh-padT-padB)
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [style, theme, show, decor, bars, glowEff, tickMs, speed, live, tf, pxRatio])

  /* ---------- AI recommendation (без тяжёлых пересчётов) ---------- */
  const advice = useMemo(()=>{
    const src = dataRef.current
    const price = src.c[src.c.length-1]
    const { ema21, ma50, ma200, vwap, mid, sd } = derivedRef.current
    const lastE = ema21[ema21.length-1]
    const lastM50 = ma50[ma50.length-1]
    const lastM200 = ma200[ma200.length-1]
    const lastVWAP = vwap[vwap.length-1]
    const m = mid[mid.length-1], s = sd[sd.length-1] || 0
    const bandPos = s ? (price - m) / (2*s) : 0

    // RSI(14)
    let up=0, dn=0; const pArr=src.c
    for(let i=pArr.length-14;i<pArr.length;i++){
      const d = pArr[i]-pArr[i-1]; if(d>0) up+=d; else dn-=d
    }
    const rs = dn===0 ? 100 : up/dn
    const rsi = 100 - 100/(1+rs)

    let score = 0
    if (lastE && lastM50) score += (lastE>lastM50) ? +0.7 : -0.7
    if (lastM50 && lastM200) score += (lastM50>lastM200) ? +0.6 : -0.6
    if (price && lastVWAP) score += (price>lastVWAP) ? +0.4 : -0.4
    if (bandPos < -0.6) score += 0.8; else if (bandPos > 0.6) score -= 0.8
    if (rsi < 30) score += 0.8; else if (rsi > 70) score -= 0.8

    const conf = clamp(Math.round(50 + 48*Math.tanh(Math.abs(score)/2)), 5, 99)
    let action = 'HOLD'
    if (score >= 0.4) action = 'BUY'
    else if (score <= -0.4) action = 'SELL'

    let tr=0; for(let i=src.c.length-20;i<src.c.length;i++) tr += (src.h[i]-src.l[i])
    const atr = tr/20
    const tp = price + (action==='BUY'? atr*1.2 : action==='SELL'? -atr*1.2 : 0)
    const sl = price - (action==='BUY'? atr*0.9 : action==='SELL'? -atr*0.9 : 0)

    const factors = [
      `${TX(t,'ui_ema21','EMA21')} ${lastE>lastM50?'>':'<'} ${TX(t,'ui_ma50','MA50')}`,
      `${TX(t,'ui_ma50','MA50')} ${lastM50>(lastM200||lastM50)?'>':'<'} ${TX(t,'ui_ma200','MA200')}`,
      `${TX(t,'ui_price','Price')} ${price>lastVWAP?'>':'<'} VWAP`,
      `RSI ${rsi.toFixed(1)} (${rsi<30?'oversold': rsi>70?'overbought':'neutral'})`,
    ]

    return { action, conf, price, tp, sl, tf, factors }
  }, [bars, tf, lang, t])

  /* ---------- text blocks ---------- */
  const sections = Array.isArray(TX(t, 'exchange_sections', [])) ? TX(t, 'exchange_sections', []) : []
  const bullets  = Array.isArray(TX(t, 'ex_bullets', [])) ? TX(t, 'ex_bullets', []) : []

  return (
    <>
      <section className="panel" style={{ marginTop:10 }}>
        <div className="row" style={{ alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <span className="badge">{TX(t,'ui_inprogress','IN PROGRESS')}</span>
          <h1 style={{ margin:0 }}>{TX(t,'exchange_title','Exchange (in development)')}</h1>
        </div>
        <p style={{ marginTop:8, whiteSpace:'pre-line' }}>{TX(t,'exchange_sub','A living neon canvas…')}</p>

        {/* controls */}
        <div className="row" style={{ gap:8, flexWrap:'wrap', marginTop:6 }}>
          {['1m','5m','15m','1h','4h','1d'].map(x=>(
            <Btn key={x} active={tf===x} onClick={()=>setTf(x)}>{x}</Btn>
          ))}

          <Btn active={style==='quantum'} onClick={()=>setStyle('quantum')}>{TX(t,'ui_quantum','Quantum')}</Btn>
          <Btn active={style==='candle'}  onClick={()=>setStyle('candle')}>{TX(t,'ui_candles','Candles')}</Btn>
          <Btn active={style==='hollow'}  onClick={()=>setStyle('hollow')}>{TX(t,'ui_hollow','Hollow')}</Btn>
          <Btn active={style==='heikin'}  onClick={()=>setStyle('heikin')}>{TX(t,'ui_heikin','Heikin-Ashi')}</Btn>
          <Btn active={style==='area'}    onClick={()=>setStyle('area')}>{TX(t,'ui_area','Area')}</Btn>

          <Btn active={show.ma50}  onClick={()=>setShow(s=>({...s,ma50:!s.ma50}))}>{TX(t,'ui_ma50','MA50')}</Btn>
          <Btn active={show.ema21} onClick={()=>setShow(s=>({...s,ema21:!s.ema21}))}>{TX(t,'ui_ema21','EMA21')}</Btn>
          <Btn active={show.ma200} onClick={()=>setShow(s=>({...s,ma200:!s.ma200}))}>{TX(t,'ui_ma200','MA200')}</Btn>
          <Btn active={show.vwap}  onClick={()=>setShow(s=>({...s,vwap:!s.vwap}))}>{TX(t,'ui_vwap','VWAP')}</Btn>
          <Btn active={show.bands} onClick={()=>setShow(s=>({...s,bands:!s.bands}))}>{TX(t,'ui_bands','Bands')}</Btn>
          <Btn active={show.vol}   onClick={()=>setShow(s=>({...s,vol:!s.vol}))}>{TX(t,'ui_volume','Volume')}</Btn>

          <Btn active={theme==='aqua'}   onClick={()=>setTheme('aqua')}>{TX(t,'ui_theme_aqua','Aqua')}</Btn>
          <Btn active={theme==='violet'} onClick={()=>setTheme('violet')}>{TX(t,'ui_theme_violet','Violet')}</Btn>
          <Btn active={theme==='amber'}  onClick={()=>setTheme('amber')}>{TX(t,'ui_theme_amber','Amber')}</Btn>

          <Btn active={decor.halos} onClick={()=>setDecor(d=>({...d,halos:!d.halos}))}>{TX(t,'ui_halos','Halos')}</Btn>
          <Btn active={decor.stars} onClick={()=>setDecor(d=>({...d,stars:!d.stars}))}>{TX(t,'ui_stars','Stars')}</Btn>
          <Btn active={decor.scan}  onClick={()=>setDecor(d=>({...d,scan:!d.scan}))}>{TX(t,'ui_scan','Scan')}</Btn>
          <Btn active={decor.waves} onClick={()=>setDecor(d=>({...d,waves:!d.waves}))}>{TX(t,'ui_waves','Waves')}</Btn>
          <Btn active={decor.ions}  onClick={()=>setDecor(d=>({...d,ions:!d.ions}))}>{TX(t,'ui_ions','Ions')}</Btn>
          <Btn active={decor.glint} onClick={()=>setDecor(d=>({...d,glint:!d.glint}))}>{TX(t,'ui_glint','Glint')}</Btn>

          <Btn active={live} onClick={()=>setLive(v=>!v)}>{TX(t, live?'ui_live_on':'ui_live_off', live?'Live ON':'Live OFF')}</Btn>

          <div className="row" style={{ alignItems:'center', gap:8 }}>
            <Small>{TX(t,'ui_bars','Bars')}</Small>
            <Slider min={120} max={600} step={10} value={bars} onChange={setBars} />
            <Small>{bars}</Small>
          </div>

          <div className="row" style={{ alignItems:'center', gap:8 }}>
            <Small>{TX(t,'ui_glow','Glow')}</Small>
            <Slider min={0} max={400} step={10} value={glow} onChange={setGlow} />
            <Small>{Math.round(glowEff)}</Small>
          </div>

          <div className="row" style={{ alignItems:'center', gap:8 }}>
            <Small>{TX(t,'ui_tick','Tick')}</Small>
            <Slider min={120} max={2000} step={20} value={tickMs} onChange={setTickMs} />
            <Small>{(tickMs/1000).toFixed(1)}s</Small>
          </div>

          <div className="row" style={{ alignItems:'center', gap:8 }}>
            <Small>{speed.toFixed(1)}x</Small>
            <Slider min={0.5} max={3} step={0.1} value={speed} onChange={setSpeed} />
          </div>
        </div>
      </section>

      {/* CHART */}
      <section className="panel" style={{ position:'relative', overflow:'hidden' }}>
        <div style={{ position:'relative' }}>
          <canvas ref={cvsRef} />
          <canvas ref={volRef} style={{ position:'absolute', left:0, top:0 }} />
        </div>

        {/* AI box */}
        <div className="panel" style={{ position:'absolute', right:18, top:18, width:320, maxWidth:'calc(100% - 36px)', background:'rgba(10,20,35,.55)', backdropFilter:'blur(6px)' }}>
          <div className="row" style={{ justifyContent:'space-between', alignItems:'center' }}>
            <strong style={{ fontSize:18 }}>{TX(t,'ui_ai_reco','AI Recommendation')}</strong>
            <span className="badge" style={{ background:'rgba(0,0,0,.25)' }}>{TX(t,'ui_preview','preview')}</span>
          </div>

          <AdviceBox t={t} advice={useMemo(()=>advice,[advice])} />
        </div>

        <div style={{ opacity:.7, fontSize:12, marginTop:8 }}>
          TF: {tf} • Bars: {bars} • Style: {style} • Theme: {theme} • Live: {live ? 'on':'off'}
        </div>
      </section>

      {/* Roadmap */}
      <section className="panel">
        <h2>{TX(t,'roadmap','Roadmap')}</h2>
        <ul className="bullets">
          {bullets.map((b,i)=><li key={i}>• {b}</li>)}
        </ul>
      </section>

      {/* Extended sections */}
      {sections.map((s,idx)=>(
        <section className="panel" key={idx}>
          <h2>{s.title}</h2>
          {Array.isArray(s.paras) ? s.paras.map((p,i)=><p key={i} style={{ whiteSpace:'pre-line' }}>{p}</p>) : null}
        </section>
      ))}
    </>
  )
}

/* ---------- split small box (чтобы не дёргать React часто) ---------- */
function AdviceBox({ t, advice }){
  return (
    <>
      <div className="row" style={{ alignItems:'center', gap:10, marginTop:8 }}>
        <div style={{ width:42, height:42, borderRadius:'50%', display:'grid', placeItems:'center', fontWeight:700,
          background: advice.action==='BUY' ? 'linear-gradient(135deg,#22c55e,#34d399)'
                   : advice.action==='SELL'? 'linear-gradient(135deg,#f43f5e,#fb7185)'
                   : 'linear-gradient(135deg,#64748b,#94a3b8)' }}>
          {advice.conf}%
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:700 }}>{advice.action}</div>
          <span style={{ opacity:.8, fontSize:12 }}>{TX(t,'ui_price','Price')}: {advice.price.toFixed(2)}</span>
        </div>
      </div>

      <div className="row" style={{ gap:8, marginTop:10 }}>
        <span className="badge" style={{ background:'rgba(0,0,0,.25)' }}>TP {advice.tp.toFixed(2)}</span>
        <span className="badge" style={{ background:'rgba(0,0,0,.25)' }}>SL {advice.sl.toFixed(2)}</span>
        <span className="badge" style={{ background:'rgba(0,0,0,.25)' }}>{TX(t,'ui_tf','TF')} {advice.tf}</span>
      </div>

      <ul className="bullets" style={{ marginTop:10 }}>
        {advice.factors.map((f,i)=><li key={i}>• {f}</li>)}
      </ul>

      <div className="row" style={{ gap:8, marginTop:12 }}>
        <button className="btn">{TX(t,'ui_long_demo','Long (demo)')}</button>
        <button className="btn ghost">{TX(t,'ui_short_demo','Short (demo)')}</button>
        <button className="btn ghost">{TX(t,'ui_hedge_demo','Hedge (demo)')}</button>
      </div>
    </>
  )
}
