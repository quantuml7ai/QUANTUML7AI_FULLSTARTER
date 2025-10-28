// lib/brain.js — Quantum Brain v2 (scoring, multi-signal, rich reasons, i18n-ready)
// Экспорты: analyze (default), analyzeTF, analyzeEnsemble

/* -------------------------- math & utils -------------------------- */
const last = a => (a?.length ? a[a.length - 1] : undefined)
const safe = (x, fb=NaN)=> (Number.isFinite(x)?x:fb)
const clip = (x,a,b)=> Math.max(a, Math.min(b,x))
const mean = a => a.reduce((s,x)=>s+x,0)/Math.max(1,a.length)
const std  = a => { const m=mean(a); const v=mean(a.map(x=>(x-m)*(x-m))); return Math.sqrt(v) }
const sliceLast = (arr, n)=> arr.slice(Math.max(0, arr.length - n))
const sum = a => a.reduce((s,x)=>s+x,0)

function sma(a, n){ const out=[]; let s=0
  for(let i=0;i<a.length;i++){ s+=a[i]; if(i>=n) s-=a[i-n]; out.push(i>=n-1?s/n:NaN) } return out }
function ema(a, n){
  const out=new Array(a.length).fill(NaN), k=2/(n+1)
  let prev=0, started=false
  for(let i=0;i<a.length;i++){
    const x=a[i]
    if(!started){ const w=a.slice(0,i+1); if(w.length>=n){ prev = sum(w.slice(-n))/n; out[i]=prev; started=true } }
    else { prev = x*k + prev*(1-k); out[i]=prev }
  } return out
}
function roc(a, n){ const out=new Array(a.length).fill(NaN)
  for(let i=n;i<a.length;i++) out[i]=(a[i]-a[i-n])/(Math.abs(a[i-n])||1e-9)
  return out
}
function rsi(c, n=14){
  let g=0, l=0; const out=new Array(c.length).fill(NaN)
  for(let i=1;i<c.length;i++){
    const d=c[i]-c[i-1]; g+=Math.max(d,0); l+=Math.max(-d,0)
    if(i>=n){ const d0=c[i-n+1]-c[i-n]; g-=Math.max(d0,0); l-=Math.max(-d0,0)
      const rs=(g/n)/((l/n)||1e-9); out[i]=100-100/(1+rs) }
  } return out
}
function macd(c, fast=12, slow=26, sig=9){
  const f=ema(c,fast), s=ema(c,slow)
  const macdLine=c.map((_,i)=> (safe(f[i]) - safe(s[i])))
  const signal=ema(macdLine,sig)
  const hist=macdLine.map((x,i)=> x - safe(signal[i]))
  return {macd:macdLine, signal, hist}
}
function atr(o,h,l,c,n=14){
  const out=new Array(c.length).fill(NaN); let pc=c[0], acc=[]
  for(let i=1;i<c.length;i++){
    const tr = Math.max(h[i]-l[i], Math.abs(h[i]-pc), Math.abs(l[i]-pc)); pc=c[i]; acc.push(tr)
    if(acc.length>n) acc.shift(); if(acc.length===n) out[i]=mean(acc)
  } return out
}
function vwap(h,l,c,v,n=48){ // intraday-like window
  const out=new Array(c.length).fill(NaN); let pv=0, vv=0
  for(let i=0;i<c.length;i++){
    const tp=(h[i]+l[i]+c[i])/3; pv += tp*v[i]; vv += v[i]
    if(i>=n){ // slide
      let pvOld=0,vvOld=0
      for(let j=i-n+1;j<=i;j++){ const tpj=(h[j]+l[j]+c[j])/3; pvOld+=tpj*v[j]; vvOld+=v[j] }
      pv=pvOld; vv=vvOld
    }
    if(i>=n-1 && vv>0) out[i]=pv/vv
  } return out
}

/* -------------------------- levels / pivots -------------------------- */
function pivots(h,l,left=2,right=2){
  const ph=[],pl=[]
  for(let i=left;i<h.length-right;i++){
    let isH=true,isL=true
    for(let k=1;k<=left;k++){ if(h[i]<=h[i-k]) isH=false; if(l[i]>=l[i-k]) isL=false }
    for(let k=1;k<=right;k++){ if(h[i]<=h[i+k]) isH=false; if(l[i]>=l[i+k]) isL=false }
    ph[i]=isH?h[i]:NaN; pl[i]=isL?l[i]:NaN
  } return {ph,pl}
}
function levelsFromSwings(h,l,lookback=240){
  const H=sliceLast(h,lookback), L=sliceLast(l,lookback)
  const hi = Math.max(...H.filter(Number.isFinite)), lo = Math.min(...L.filter(Number.isFinite))
  // Кластеры уровней по квантилям, чтобы получить 2-3 уровня на сторону
  const sort=(arr)=>arr.filter(Number.isFinite).sort((a,b)=>a-b)
  const highs = sort(H)
  const lows  = sort(L)
  const q = p => (arr)=>{ const i=Math.floor(arr.length*p); return arr[Math.max(0,Math.min(arr.length-1,i))] }
  return {
    supportCandidates: [ q(0.05)(lows), q(0.15)(lows), lo ].filter(Number.isFinite),
    resistanceCandidates: [ hi, q(0.85)(highs), q(0.95)(highs) ].filter(Number.isFinite),
    box:{lo,hi}
  }
}
function nearestSR(price, supports, resistances){
  const ns = supports.reduce((m,x)=> (Math.abs(price-x)<Math.abs(price-m)?x:m), supports[0] ?? NaN)
  const nr = resistances.reduce((m,x)=> (Math.abs(price-x)<Math.abs(price-m)?x:m), resistances[0] ?? NaN)
  return {support:ns, resistance:nr}
}

/* -------------------------- core TF analysis -------------------------- */
export function analyzeTF(pack){
  const {o,h,l,c,v=[], tf='5m'} = pack
  const N=c.length; if(N<60) return fallback()

  // indicators
  const ema21=ema(c,21), ema50=ema(c,50), ema200=ema(c,200)
  const rsi14=rsi(c,14)
  const {macd:mac, signal:macSig, hist:macH}=macd(c)
  const atr14=atr(o,h,l,c,14)
  const vwap48=vwap(h,l,c, v.length? v : new Array(N).fill(1), 48)
  const roc5=roc(c,5), roc14=roc(c,14)

  const P = last(c), A = safe(last(atr14),0), E21=last(ema21), E50=last(ema50), E200=last(ema200)
  const RSI=safe(last(rsi14),50), MACD=safe(last(mac),0), MACS=safe(last(macSig),0), HIST=safe(last(macH),0)
  const VWAP=safe(last(vwap48),NaN)

  // trend regime
  const emaAlignedUp = E21>E50 && E50>E200
  const emaAlignedDn = E21<E50 && E50<E200
  const slope50 = (last(sliceLast(ema50,5)) - sliceLast(ema50,5)[0])/(5||1)
  const trendScore = (emaAlignedUp? +3 : 0) + (emaAlignedDn? -3 : 0) + (slope50>0? +1 : -1) + (P>E200? +1 : -1)

  // momentum regime
  const breakout20 = P > Math.max(...sliceLast(h,20))
  const breakdown20= P < Math.min(...sliceLast(l,20))
  const rocScore   = clip(roc5.at(-1)*100, -5, 5) + clip(roc14.at(-1)*100, -5, 5)
  const macdScore  = (HIST>0? +1 : -1) + (MACD>MACS? +1 : -1)
  const momentumScore = (breakout20? +2:0) + (breakdown20? -2:0) + (rocScore/5) + macdScore

  // RSI zone
  const rsiScore = RSI>55? +1 : RSI<45? -1 : 0
  const rsiState = RSI>70? 'overbought' : RSI<30? 'oversold' : 'neutral'

  // Volatility & volume proxy
  const atrRel = A / Math.max(1e-9, P)
  const volaScore = atrRel>0.01 ? +1 : atrRel<0.004 ? -1 : 0

  // VWAP filter (если есть)
  const vwapScore = Number.isFinite(VWAP) ? (P>VWAP? +1 : -1) : 0

  // S/R
  const Ls = levelsFromSwings(h,l,480)
  const supports = Ls.supportCandidates.filter(Number.isFinite)
  const resistances = Ls.resistanceCandidates.filter(Number.isFinite)
  const near = nearestSR(P, supports, resistances)

  // proximity bonuses
  const nearS = Math.abs(P - near.support) / Math.max(1e-9,A) // в ATR
  const nearR = Math.abs(P - near.resistance) / Math.max(1e-9,A)
  const proximityScore = (emaAlignedUp && P>=near.support && nearS<=0.8? +1 : 0) +
                         (emaAlignedDn && P<=near.resistance && nearR<=0.8? -1 : 0)

  // Итоговый скор
  const totalScore = trendScore + momentumScore + rsiScore + volaScore + vwapScore + proximityScore

  // Решение
  let action='HOLD'
  const TH=3          // порог
  if (totalScore >= +TH) action='BUY'
  if (totalScore <= -TH) action='SELL'

  // Confidence (0..100)
  let confidence = 50 + clip(Math.abs(totalScore)*6, 0, 40)
  // усилители согласованности
  const agree = [
    emaAlignedUp && breakout20,
    emaAlignedDn && breakdown20,
    (HIST>0) === (MACD>MACS),
    (action==='BUY' && P>VWAP) || (action==='SELL' && P<VWAP)
  ].filter(Boolean).length
  confidence = Math.min(95, confidence + agree*3)

  // Entry/SL/TP (RR-модель + ближайшие уровни)
  const rr = 2.0
  let entry=null, sl=null, tp1=null, tp2=null
  if (action==='BUY'){
    const base = breakout20? P + 0.1*A : Math.max(near.support + 0.1*A, P) // breakout или отбой
    entry = base
    const stopByS = near.support - 0.8*A
    sl   = Math.min(base - 1.2*A, stopByS)
    const tpByR = Number.isFinite(near.resistance)? near.resistance : base + rr* (base - sl)
    tp1  = Math.min(base + rr*(base - sl), tpByR)
    tp2  = tp1 + 0.6*(tp1 - base)              // частичная фиксация 1, расширенный таргет 2
  }
  if (action==='SELL'){
    const base = breakdown20? P - 0.1*A : Math.min(near.resistance - 0.1*A, P)
    entry = base
    const stopByR = near.resistance + 0.8*A
    sl   = Math.max(base + 1.2*A, stopByR)
    const tpByS = Number.isFinite(near.support)? near.support : base - rr* (sl - base)
    tp1  = Math.max(base - rr*(sl - base), tpByS)
    tp2  = tp1 - 0.6*(base - tp1)
  }

  // Оценка профита/убытка
  const expLoss  = (entry!=null && sl!=null)? Math.abs(entry - sl) : 0
  const expProfit= (entry!=null && tp1!=null)? Math.abs(tp1 - entry) : 0
  const rrEff    = (expLoss>0? expProfit/expLoss : NaN)

  // Горизонты — амплитуда, как «порядок движения» в ценах
  const horizons = {
    '1h': +(A*1.0).toFixed(6),
    '6h': +(A*3.0).toFixed(6),
    '24h':+(A*6.0).toFixed(6),
  }

  /* -------- reasons/i18n (ключи + параметры) -------- */
// --- причины: ЖЁСТКАЯ СОВМЕСТИМОСТЬ С ТВОИМ i18n (ai_f_* / ai_note_*) ---
const reasons = []
const push = (key, params = {}) => reasons.push({ key, params })

// EMA выстроены
if (emaAlignedUp)  push('ai_f_ema21_gt_ma50_on',  { ema21: E21, ema50: E50, ema200: E200 })
else if (emaAlignedDn) push('ai_f_ema21_gt_ma50_off', { ema21: E21, ema50: E50, ema200: E200 })

// MA50 vs MA200
const ma50gt200 = E50 > E200
if (ma50gt200) push('ai_f_ma50_gt_ma200_on',  { ma50: E50, ma200: E200 })
else           push('ai_f_ma50_gt_ma200_off', { ma50: E50, ma200: E200 })

// Цена vs VWAP
if (Number.isFinite(VWAP)) {
  if (P > VWAP) push('ai_f_price_gt_vwap_on',  { vwap: VWAP })
  else          push('ai_f_price_gt_vwap_off', { vwap: VWAP })
}

// RSI: bullish / neutral / bearish
if (RSI >= 55)       push('ai_f_rsi_bull_on',  { rsi: RSI })
else if (RSI <= 45)  push('ai_f_rsi_bull_off', { rsi: RSI })

// MACD histogram
if (HIST > 0) push('ai_f_macd_pos_on',  { hist: HIST })
else          push('ai_f_macd_pos_off', { hist: HIST })

// Пояснительные заметки
push('ai_note_atr', { v: A, atr: A, atrRel: +(A / Math.max(1e-9, P)).toFixed(6) })
push('ai_note_sr',  { s: near.support, r: near.resistance })
push('ai_note_h',   {}) // статичный текст из словаря


// (оставляем итоговый объект с reasons)

  // финальный объект
  return {
    tf, price:P,
    action, confidence:Math.round(confidence),
    entry, sl, tp1, tp2,
    rr: Number.isFinite(rrEff)? +rrEff.toFixed(2) : null,
    nearest:{ support: near.support, resistance: near.resistance },
    support: supports.filter(Number.isFinite).sort((a,b)=>a-b),
    resistance: resistances.filter(Number.isFinite).sort((a,b)=>a-b),
    horizons,
    indicators:{
      ema21:E21, ema50:E50, ema200:E200, rsi14:RSI, atr14:A, vwap:VWAP,
      macd:MACD, macdSignal:MACS, macdHist:HIST, roc5:safe(roc5.at(-1),0), roc14:safe(roc14.at(-1),0)
    },
    diagnostics:{
      trendScore, momentumScore, rsiScore, volaScore, vwapScore, proximityScore, totalScore
    },
    reasons
  }
}

function fallback(){
  return {
    action:'HOLD', confidence:50, price:0,
    entry:null, sl:null, tp1:null, tp2:null, rr:null,
    nearest:{support:null,resistance:null},
    support:[], resistance:[],
    horizons:{'1h':0,'6h':0,'24h':0},
    indicators:{}, diagnostics:{},
    reasons:[{ key:'ai.no_data', params:{} }]   // ← вместо 'data.not_enough'
  }
}


/* -------------------------- compatibility wrappers -------------------------- */
export function analyze(input, symbolMaybe, tfMaybe){
  if (input && typeof input==='object' && Array.isArray(input.c)) return analyzeTF(input)
  if (Array.isArray(input)){ // legacy (prices, symbol, tf)
    const c=input; const pack={o:c,h:c,l:c,c, v:new Array(c.length).fill(1), tf: tfMaybe||'5m'}
    return analyzeTF(pack)
  }
  return fallback()
}
export default analyze
export function analyzeEnsemble({tf, candles}){ return analyzeTF({...candles, tf}) }
