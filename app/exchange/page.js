'use client'

// ==================================================================================================
// app/exchange/page.js — QUANTUML7 Exchange — R12c + Brain v5 via API (BrainAnalysisRoad)
// ==================================================================================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'

import Image from 'next/image'
import Link from 'next/link'
// ⬇⬇⬇ Brain больше не дергаем на клиенте — вся магия на сервере через API
// import * as Brain from '../../lib/brain.js'
import HomeBetweenBlocksAd from '../ads'
import BattleCoin from './BattleCoin'
/* ================================ i18n bridge ================================ */
let useI18n = () => ({ t: (k)=>k })
try { const mod = require('../../components/i18n'); if (mod?.useI18n) useI18n = mod.useI18n } catch {}
const TX = (t, key, fb) => { try { const v=t(key); return v===key?fb:v } catch { return fb } }

/* ================================= helpers ================================= */
// Price formatting: адекватно для BTC и шиткоинов типа BTT
const fmtP = (x) => {
  if (!Number.isFinite(x)) return '-'
  const ax = Math.abs(x)

  if (ax >= 10000) return x.toFixed(0)
  if (ax >= 1000)  return x.toFixed(2)
  if (ax >= 1)     return x.toFixed(4)
  if (ax >= 1e-2)  return x.toFixed(6)
  if (ax >= 1e-4)  return x.toFixed(8)
  if (ax >= 1e-8)  return x.toFixed(10)

  // Совсем микроцены — в экспоненте, но читаемо
  return x.toExponential(4)
}

const fmtQ=(x)=>!Number.isFinite(x)?'-':(Math.abs(x)>=1?x.toFixed(4):x.toFixed(8))
const MAP_TV=(s)=>`BINANCE:${s}`
const TFmap={ '1m':'1','5m':'5','15m':'15','1h':'60','4h':'240','1d':'D' }
const BINANCE='https://api.binance.com'

/* ================================= data ================================= */
async function fetchDepth(sym,limit=20){
  const r=await fetch(`${BINANCE}/api/v3/depth?symbol=${sym}&limit=${limit}`,{cache:'no-store'})
  return r.json()
}
async function fetchSymbolsUSDT(){ 
  try{
    const r=await fetch(`${BINANCE}/api/v3/exchangeInfo`,{cache:'no-store'})
    const j=await r.json()
    const list=j.symbols.filter(s=>s.status==='TRADING' && s.quoteAsset==='USDT').map(s=>s.symbol)
    return [...new Set(list)].sort()
  }catch{
    return ['BTCUSDT','ETHUSDT','BNBUSDT']
  }
}
const TF_TO_BINANCE={"1m":"1m","5m":"5m","15m":"15m","1h":"1h","4h":"4h","1d":"1d"}

// ⬇ эта функция теперь не используется для AI, но оставляем как есть (вдруг пригодится ещё где-то)
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
        border-radius:14px;padding:12px;background:rgba(0, 0, 0, 1); margin-bottom:12px}
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
function BadgeTitle() {
  const { t } = useI18n()
  const title = TX(t, 'exchange_title', 'Exchange (in progress)')

  return (
    <Panel>
      <div className="ex-hero-panel">
        {/* Бейдж сверху */}
        <div className="ex-badge">
          <span className="qcoinLabel">{title}</span>
        </div>

        {/* Обёртка 16:9 под баннер */}
        <div className="ex-hero-wrap">
          <Image
            src="/Exchange.png"
            alt="QL7 Exchange — next-gen AI trading"
            fill
            sizes="100vw"
            priority
            className="ex-hero-img"
          />
        </div>
      </div>

      <style jsx>{`
        /* Съедаем дефолтный padding панели, чтобы контент лег от бордера до бордера */
        .ex-hero-panel{
          margin: -10px;
        }

        /* Отступ только под бейдж */
        .ex-badge{
        padding: 10px 14px 6px;
        }

        /* Контейнер под баннер: всегда 16:9 и на всю ширину панели */
        .ex-hero-wrap{
          position: relative;
          width: 100%;
         aspect-ratio: 15 / 7;
          overflow: hidden;
          border-radius: 0 0 4px 4px;
          background: #f6f1f101; /* подложка, если будут поля */
        }

        /* Картинка занимает весь контейнер, без обрезки контента */
        .ex-hero-wrap :global(img.ex-hero-img){
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;   /* показываем всё, не режем */
        }
      `}</style>
    </Panel>
  )
}


/* ================================= Symbol+TF dropdown ================================= */
const TF_KEYS=Object.keys(TFmap)
function SymbolTFSelector({current, onChange, symbols}){
  const [open,setOpen]=useState(false)
  const [q,setQ]=useState('')
  const filtered = useMemo(()=> symbols.filter(s=>s.includes(q.toUpperCase())).slice(0,500),[symbols,q])

  return <Panel>
    {/* ⬇⬇⬇ НОВЫЙ БЛОК С GIF НАД ВЫБОРОМ СИМВОЛА/TF ⬇⬇⬇ */}
    <div className="tf-gif-wrap">
      <Image
        src="/ai/ai.gif"          // файл: public/ai/ai.gif
        alt="Quantum AI timeframe"
        fill
        sizes="100vw"
        priority={false}
        className="tf-gif"
        unoptimized               // чтобы GIF не ломался оптимизацией
      />
    </div>
    {/* ⬆⬆⬆ КОНЕЦ НОВОГО БЛОКА С GIF ⬆⬆⬆ */}

    <div className="row">
      <div className="now">{current.symbol} · {current.tf}</div>
      <div className="grow" />
      <Btn neon onClick={()=>setOpen(o=>!o)}>
        {TX(useI18n().t,'select_symbol_tf','Выбрать символ / TF')}
      </Btn>
    </div>
    {open && <div className="pop">
      <input
        className="search"
        placeholder="Search…"
        value={q}
        onChange={e=>setQ(e.target.value)}
      />
      <div className="grid">
        {filtered.map(sym=>(
          <div key={sym} className="row2">
            <span className="sym">{sym}</span>
            <div className="tfs">
              {TF_KEYS.map(tf=>(
                <button
                  key={tf}
                  className="tf"
                  onClick={()=>{
                    onChange(sym,tf)
                    setOpen(false)
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>}
    <style jsx>{`
      /* GIF-блок — адаптивный, на всю ширину панели */
      .tf-gif-wrap{
        position:relative;
        width:100%;
        aspect-ratio:16/9;          /* можно поменять под свою гифку */
        overflow:hidden;
        border-radius:12px;
        margin:-2px 0 10px 0;       /* лёгкий отступ снизу от гифки */
        background:#000;
      }
      .tf-gif-wrap :global(img.tf-gif){
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        object-fit:cover;           /* растягиваем по ширине, сохраняем красоту */
      }

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

      @media (max-width:640px){
        .tf-gif-wrap{
          margin-bottom:8px;
          border-radius:10px;
        }
      }
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
function useTypewriter(text, speed = 18) {
  const [value, setValue] = useState(text || '')

  useEffect(() => {
    if (!text) {
      setValue('')
      return
    }

    let i = 0
    let cancelled = false
    setValue('')

    const tick = () => {
      if (cancelled) return
      i += 1
      setValue(text.slice(0, i))
      if (i < text.length) {
        setTimeout(tick, speed)
      }
    }

    tick()

    return () => {
      cancelled = true
    }
  }, [text, speed])

  return value
}

/* ================================= AI Box (i18n-aware) ================================= */
function AIBox({ data }) {
  const i18n = useI18n()

  // мемоизированный t, чтобы не бесить eslint
  const t = useMemo(
    () => (i18n?.t ? i18n.t : (k) => k),
    [i18n],
  )

  // Универсальный helper перевода с подстановкой параметров
  const tr = useCallback((key, params) => {
    try {
      let s = t(key)
      if (s === key) s = t(key.replaceAll('.', '_'))

      if (typeof s === 'string' && params) {
        let out = s
        for (const [k, v] of Object.entries(params)) {
          out = out.replaceAll(
            `{${k}}`,
            typeof v === 'number' ? fmtP(v) : String(v),
          )
        }
        return out
      }

      return s
    } catch {
      return key
    }
  }, [t])

  // Определяем язык именно из i18n, а не только из браузера
  const rawLang = (
    i18n?.lang ??
    i18n?.locale ??
    i18n?.currentLang ??
    ''
  )
    .toString()
    .toLowerCase()

  let regimeLang = 'en'
  if (rawLang.startsWith('ru')) regimeLang = 'ru'
  else if (rawLang.startsWith('uk')) regimeLang = 'uk'
  else if (rawLang.startsWith('es')) regimeLang = 'es'
  else if (rawLang.startsWith('tr')) regimeLang = 'tr'
  else if (rawLang.startsWith('zh') || rawLang.startsWith('cn')) regimeLang = 'zh'
  else if (rawLang.startsWith('ar')) regimeLang = 'ar'

  const reasonsFullText = useMemo(() => {
    if (!data || !Array.isArray(data.reasons) || !data.reasons.length) {
      return '—'
    }

    const localized = data.reasons.map((r) => {
      if (typeof r === 'string') return tr(r)

      // Спец-обработка только для режима рынка:
      if (r.baseKey === 'ai_regime' && r.params?.regimeText) {
        const rt = r.params.regimeText || {}

        // Берём текст на нужном языке, иначе fallback
        const regimeHuman =
          rt[regimeLang] ||
          rt.en ||
          rt.ru ||
          Object.values(rt)[0] ||
          r.params.regime

        const params = {
          ...r.params,
          regime: regimeHuman,
        }

        return tr(r.key, params)
      }

      // Всё остальное как было
      return tr(r.key, r.params)
    })

    return localized.map((s) => `• ${s}`).join('\n')
  }, [data, tr, regimeLang])

  const typedReasons = useTypewriter(reasonsFullText, 14)

  const reasonLines = useMemo(
    () => (typedReasons || '—').split('\n'),
    [typedReasons],
  )

  const scrollRef = useRef(null)
 
  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    el.scrollTop = el.scrollHeight
  }, [typedReasons])

  if (!data || !Number.isFinite(data.price)) {
    return (
      <Panel>
        <div className="muted">
          …{tr('ai_calculating') || 'AI calculating'}
        </div>
      </Panel>
    )
  }

  const color =
    data.action === 'BUY'
      ? 'buy'
      : data.action === 'SELL'
      ? 'sell'
      : 'hold'

  return (
    <Panel>
      <div className={`pill ${color}`}>
        {tr('ai_action') || 'Action'}: {data.action} ·{' '}
        {Math.round(data.confidence)}%
      </div>
      <div className="meta">
        <span>{(tr('ai_price') || 'Price')} {fmtP(data.price)}</span>
        {data.entry != null && <span>{(tr('ai_entry') || 'Entry')} {fmtP(data.entry)}</span>}
        {data.sl != null && <span>{(tr('ai_sl') || 'SL')} {fmtP(data.sl)}</span>}
        {data.tp1 != null && <span>{(tr('ai_tp') || 'TP')}1 {fmtP(data.tp1)}</span>}
        {data.tp2 != null && <span>{(tr('ai_tp') || 'TP')}2 {fmtP(data.tp2)}</span>}
        {data.horizons && Object.entries(data.horizons).map(([k, v]) => (
          <span key={k}>{k} ±{fmtP(v)}</span>
        ))}
      </div>

      <div className="reason-block">
        <div className="ttl">
          {tr('ai_explainer_title') || 'Why this recommendation'}
        </div>

        <div className="reason-scroll" ref={scrollRef}>
          <ul className="reasons reasons-typed">
            {reasonLines.map((line, idx) => (
              <li key={idx}>{line.replace(/^•\s?/, '')}</li>
            ))}
          </ul>
        </div>
      </div>
 
      <div className="levels">
        {!!data.support?.length && (
          <div>
            <b>{tr('ai_support') || 'Support'}:</b>{' '}
            {data.support.map(fmtP).join(' · ')}
          </div>
        )}
        {!!data.resistance?.length && (
          <div>
            <b>{tr('ai_resistance') || 'Resistance'}:</b>{' '}
            {data.resistance.map(fmtP).join(' · ')}
          </div>
        )}
      </div>

      <div className="muted small" style={{ marginTop: 8 }}>
        {tr('ai_disclaimer') ||
          'Signals are assistive and educational; not financial advice.'}
      </div>

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
        .reasons-typed{
          min-height:40px;
          white-space:pre-line;
          transition:opacity .15s ease;
        } 
        .reason-scroll{
          max-height: unset;
          overflow-y: visible;
        } 
        @media (max-width:640px){
          .reason-scroll{
            max-height: 250px;
            overflow-y: auto;
            padding-right: 6px;
            scrollbar-width: none;
          }
          .reason-scroll::-webkit-scrollbar{
            display:none;
          }
        } 
      `}</style>

      {(() => {
        const BOT = process.env.NEXT_PUBLIC_BOT_LINK ?? 'https://t.me/l7ai_bot'
        const linkStyle = {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderRadius: 999,
          fontWeight: 800,
          background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
          color: '#fff',
          border: '1px solid rgba(59,130,246,.65)',
          boxShadow:
            '0 0 0 1px rgba(59,130,246,.25), 0 10px 20px rgba(59,130,246,.25)',
          textDecoration: 'none',
          userSelect: 'none',
        }
        return (
          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-start' }}>
            <a href={BOT} target="_blank" rel="noopener noreferrer" style={linkStyle}>
              {tr('ai_cta_start_telegram') || 'Start in Telegram'}
            </a>
          </div>
        )
      })()}
    </Panel>
  )
}
 
/* ============================ AI Quota Gate (10 min/day) ============================ */
const QUOTA_LIMIT_SEC = 10 * 60; // 10 минут
const QUOTA_HEARTBEAT_MS = 1000; // шаг 1 секунда (визуальная цель)

function todayKey() {
  try {
    const d = new Date()
    const y = d.getFullYear(), m = (`0${d.getMonth()+1}`).slice(-2), day = (`0${d.getDate()}`).slice(-2)
    return `aiQuota:${y}-${m}-${day}`
  } catch { return 'aiQuota' }
}

function getUsedSec() {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(todayKey())
    const n = Number(raw)
    return Number.isFinite(n) ? n : 0
  } catch { return 0 }
}

function setUsedSec(v) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(todayKey(), String(Math.max(0, Math.floor(v)))) } catch {}
}
function openPaymentWindow(url) {
  if (!url) return

  try {
    // Для отладки можешь оставить этот лог — увидишь, что Safari реально получает URL
    console.log('[PAY] redirect to', url)

    // Самый надёжный способ для всех браузеров, особенно Safari:
    window.location.href = url
  } catch (e) {
    try { window.location.assign(url) } catch {}
  }
}


/* ===== ДОБАВЛЕНО: ensureAuthorized — жмёт кнопку логина в TopBar и ждёт подтверждение ===== */
async function ensureAuthorized() {
  if (typeof window === 'undefined') return null
  const getAcc = () => window.__AUTH_ACCOUNT__ || localStorage.getItem('wallet') || null

  // уже авторизован?
  let acc = getAcc()
  if (acc) return acc

  // попросим TopBar открыть модалку авторизации
  try { window.dispatchEvent(new CustomEvent('open-auth')) } catch {}

  // пробуем "нажать" распространённые селекторы кнопки входа в топбаре
  try {
    const sels = ['[data-auth-open]', '.nav-auth-btn', '#nav-auth-btn', '[data-testid="auth-open"]']
    for (const s of sels) {
      const btn = document.querySelector(s)
      if (btn && typeof btn.click === 'function') { btn.click(); break }
    }
  } catch {}

  // ждём событие об успешной авторизации
  acc = await new Promise((resolve) => {
    const done = (e)=> {
      const id = e?.detail?.accountId || getAcc()
      if (id) resolve(id)
    }
    window.addEventListener('auth:ok', done, { once:true })
    window.addEventListener('auth:success', done, { once:true })
    setTimeout(()=> resolve(getAcc()), 120000)
  })

  return acc || null
}

/* ====== ДОБАВЛЕНО: модалка VIP+ (только UI) ====== */
function UnlimitModal({ open, onClose, onPay }) {
  const { t } = useI18n()
  if (!open) return null
  return (
    <div className="unlimit-overlay" role="dialog" aria-modal="true" aria-labelledby="unlimit-title">
      <div className="unlimit-modal">
        <h3 id="unlimit-title">{t('ai_unlimit_title')}</h3>
        <p className="muted">{t('ai_unlimit_price')}</p>
        <p className="desc">{t('ai_unlimit_desc')}</p>
        <ul className="benefits">
          {(t('ai_unlimit_benefits') || []).map((x, i) => <li key={i}>{x}</li>)}
        </ul>
        <div className="row">
          <button className="btn primary" onClick={onPay}>{t('ai_unlimit_pay_now')}</button>
          <button className="btn ghost" onClick={onClose}>{t('ai_unlimit_cancel')}</button>
        </div>
      </div>
      <style jsx>{`
        .unlimit-overlay{
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.48);
          display: grid; place-items: center; z-index: 1000;
        }
        .unlimit-modal{
          width: min(720px, calc(100% - 24px));
          background: rgba(10,10,12,.96);
          border: 1px solid rgba(255,255,255,.08);
          border-radius: 14px; padding: 16px;
          box-shadow: 0 12px 40px rgba(0,0,0,.45);
        }
        h3{ margin: 0 0 4px 0; }
        .muted{ opacity: .8; margin: 0 0 10px 0; }
        .desc{ opacity: .9; }
        .benefits{ margin: 10px 0 14px 20px; }
        .row{ display:flex; gap:10px; flex-wrap:wrap }
        .btn{
          padding:10px 14px; border-radius:10px; cursor:pointer;
          border:1px solid rgba(255,255,255,.18); background:#0f1116; color:#eaf6ff;
          font-weight:700;
        }
        .btn.primary{
          border-color:#00d2ff; color:#baf1ff;
          box-shadow: 0 0 0 1px rgba(0,210,255,.22), inset 0 0 18px rgba(0,210,255,.18);
        }
        .btn.ghost{ background:transparent; }
      `}</style>
    </div>
  )
}

/* ====== МАЛЕНЬКОЕ ДОПОЛНЕНИЕ: кнопка «Снять лимит» в баннере ====== */
function LimitBanner({ tr, onOpen }) {
  const BOT = process?.env?.NEXT_PUBLIC_BOT_LINK || 'https://t.me/l7ai_bot'
  return (
    <Panel>
      <div className="limit">
        <div className="blink">
          { (tr?.('ai_limit_reached') || 'Лимит исчерпан. Для полного доступа — продолжить в Telegram') }
        </div>

        <div className="row">
          <a href={BOT} target="_blank" rel="noopener noreferrer"
             className="btn tg">
            { (tr?.('ai_cta_start_telegram') || 'Начать в Telegram') }
          </a>

          <button className="btn vip" onClick={() => onOpen?.()}>
            { tr?.('ai_unlimit_btn') || 'Снять лимит' }
          </button>
        </div>
      </div>
      <style jsx>{`
        .limit{display:flex;flex-direction:column; gap:10px}
        .blink{
          font-weight:900; color:#ff5757; background:rgba(255,0,0,.08);
          border:1px solid rgba(255,0,0,.35); border-radius:10px;
          padding:10px 12px; text-transform:uppercase; letter-spacing:.5px;
          animation: blink 1s linear infinite;
        }
        @keyframes blink{0%,50%{opacity:1} 51%,100%{opacity:.45}}
        .row{ display:flex; gap:10px; flex-wrap:wrap }
        .btn{
          display:inline-flex; align-items:center; gap:8px;
          padding:10px 14px; border-radius:999px; font-weight:800;
          text-decoration:none; cursor:pointer;
        }
        .tg{
          background:linear-gradient(135deg,#1d4ed8,#3b82f6); color:#fff;
          border:1px solid rgba(59,130,246,.65);
          box-shadow:0 0 0 1px rgba(59,130,246,.25), 0 10px 20px rgba(59,130,246,.25);
        }
        .vip{
          background:rgba(0,0,0,.55); color:#baf1ff;
          border:1px solid rgba(0,210,255,.45);
          box-shadow: inset 0 0 18px rgba(0,210,255,.2);
        }
      `}</style>
    </Panel>
  )
}

/* ======================== Квота/статус VIP с корректным рендером ======================== */
const QUOTA_LIMIT = QUOTA_LIMIT_SEC
const HEARTBEAT = QUOTA_HEARTBEAT_MS

/* ===== ДОБАВЛЕНО: серверное хранилище квоты (GET/POST) ===== */
const AIQ_API = '/api/aiquota/usage'
let __aiq_lastKnown = 0
let __aiq_dayKey = null
function ensureDayKey() {
  const k = todayKey()
  if (__aiq_dayKey && __aiq_dayKey !== k) {
    __aiq_lastKnown = 0
    try { localStorage.removeItem(__aiq_dayKey) } catch {}
  }
  __aiq_dayKey = k
}
async function quotaGet() {
  ensureDayKey()
  try {
    const r = await fetch(AIQ_API, { credentials:'include', cache:'no-store' })
    const j = await r.json().catch(()=>null)
    if (j?.ok && Number.isFinite(j.usedSec)) {
      __aiq_lastKnown = Math.min(QUOTA_LIMIT, j.usedSec|0)
      setUsedSec(__aiq_lastKnown)
      return __aiq_lastKnown
    }
  } catch {}
  return getUsedSec()
}
async function quotaPost(deltaSec) {
  ensureDayKey()
  try {
    const accountId =
      (typeof window!=='undefined' && (window.__ASHER_ID__ || window.__AUTH_ACCOUNT__)) ||
      localStorage.getItem('asherId') || localStorage.getItem('account') || undefined
    const r = await fetch(AIQ_API, {
      method:'POST',
      headers:{ 'content-type':'application/json' },
      credentials:'include',
      cache:'no-store',
      body: JSON.stringify({ op:'tick', deltaSec: Math.max(0, deltaSec|0), accountId }),
      keepalive: true,
    })
    const j = await r.json().catch(()=>null)
    if (j?.ok && Number.isFinite(j.usedSec)) {
      __aiq_lastKnown = Math.min(QUOTA_LIMIT, j.usedSec|0)
      setUsedSec(__aiq_lastKnown)
      return __aiq_lastKnown
    }
  } catch {}
  return null
}

function AIQuotaGate({ children, onOpenUnlimit }) {
  const { t } = useI18n()
  const [used, setUsed] = useState(0)
  const [limit, setLimit] = useState(QUOTA_LIMIT)
  const [vipUntil, setVipUntil] = useState(null)

  // ===== ДОБАВЛЕНО: точный монотонический тикер + батч в базу =====
  const accMsRef = useRef(0)
  const lastMsRef = useRef(0)
  const batchSecRef = useRef(0)
  const tickerRef = useRef(null)
  const lastSyncRef = useRef(0)

  // init counters (локально) + первичная подгрузка квоты с бэка
  useEffect(() => {
    setLimit(QUOTA_LIMIT)
    setUsed(getUsedSec())
    let alive = true
    ;(async () => {
      const srvUsed = await quotaGet()
      if (!alive) return
      setUsed(srvUsed)
    })()
    return () => { alive = false }
  }, [])

  // тикать только если квота конечная
  useEffect(() => {
    if (!Number.isFinite(limit)) return
    if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null }

    // если квота выбрана — не запускаем тикер
    if (used >= limit) { accMsRef.current = 0; batchSecRef.current = 0; return }

    lastMsRef.current = (typeof performance!=='undefined' ? performance.now() : Date.now())
    tickerRef.current = setInterval(async () => {
      // пауза, если вкладка скрыта
      if (document.visibilityState === 'hidden') {
        lastMsRef.current = (typeof performance!=='undefined' ? performance.now() : Date.now())
        return
      }

      // если лимит достигнут — замрём
      if (used >= QUOTA_LIMIT) { accMsRef.current = 0; batchSecRef.current = 0; return }

      // точная дельта
      const now = (typeof performance!=='undefined' ? performance.now() : Date.now())
      const deltaMs = Math.max(0, now - lastMsRef.current)
      lastMsRef.current = now

      accMsRef.current += deltaMs
      // как только набежала целая секунда — прибавляем
      const whole = Math.floor(accMsRef.current / 1000)
      if (whole > 0) {
        accMsRef.current -= whole * 1000
        const next = Math.min(QUOTA_LIMIT, used + whole)
        setUsed(next)
        setUsedSec(next)       // локальный дневной кэш
        __aiq_lastKnown = next
        batchSecRef.current += whole
      }

      // батч в базу раз в ~5 сек или когда накопилось ≥1 сек
      const nowTs = Date.now()
      if (batchSecRef.current >= 1 && (batchSecRef.current >= 5 || nowTs - lastSyncRef.current > 4500)) {
        const delta = Math.min(batchSecRef.current, Math.max(0, QUOTA_LIMIT - used))
        batchSecRef.current = 0
        const srvUsed = await quotaPost(delta)
        lastSyncRef.current = nowTs
        if (Number.isFinite(srvUsed)) {
          setUsed(srvUsed)
          if (srvUsed >= QUOTA_LIMIT) { accMsRef.current = 0 }
        }
      }
    }, 250)

    return () => {
      if (tickerRef.current) { clearInterval(tickerRef.current); tickerRef.current = null }
    }
  }, [used, limit])

  const checkingRef = useRef(false)
  const refreshVip = useRef(async function () {
    if (checkingRef.current) return
    checkingRef.current = true
    try {
      const accountId =
        (typeof window !== 'undefined' && window.__AUTH_ACCOUNT__) ||
        localStorage.getItem('wallet')
      if (!accountId) return
      const r = await fetch('/api/subscription/status', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ accountId })
      })
      const j = await r.json().catch(()=> ({}))
      if (j?.isVip) {
        setUsed(0); setUsedSec(0)
        setLimit(Number.POSITIVE_INFINITY)
        setVipUntil(j.untilISO || null)
      } else {
        setVipUntil(null)
        setLimit(QUOTA_LIMIT)
        // при выходе из VIP — подтянем серверную квоту
        const srvUsed = await quotaGet()
        setUsed(srvUsed)
      }
    } catch {} finally { checkingRef.current = false }
  }).current

  // первичная проверка VIP
  useEffect(() => { refreshVip() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // авто-обновление на клики/фокус/видимость
  useEffect(() => {
    const onRefresh = async () => {
      await refreshVip()
      if (Number.isFinite(limit)) {
        const srvUsed = await quotaGet()
        setUsed(srvUsed)
      }
    }
    const onFocus = onRefresh
    const onVis = () => { if (document.visibilityState === 'visible') onRefresh() }
    window.addEventListener('vip:refresh', onRefresh)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('auth:ok', onRefresh)
    return () => {
      window.removeEventListener('vip:refresh', onRefresh)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('auth:ok', onRefresh)
    }
  }, [limit, refreshVip])

  // + мягкий фоновой опрос первые 3 минуты (на случай оплаты в соседней вкладке)
  useEffect(() => {
    const started = Date.now()
    let timer = setTimeout(function tick(){
      if (Date.now() - started > 3*60*1000) return
      refreshVip()
      if (Number.isFinite(limit)) quotaGet().then((u)=> setUsed(u))
      timer = setTimeout(tick, 7000)
    }, 7000)
    return () => clearTimeout(timer)
  }, [limit, refreshVip])

  // формат
  const fmtDate = (iso) => {
    try {
      if (!iso) return '-'
      const d = new Date(iso)
      return d.toLocaleDateString(undefined, { year:'numeric', month:'2-digit', day:'2-digit' })
    } catch { return '-' }
  }
  const daysLeft = (iso) => {
    try {
      if (!iso) return 0
      const ms = (new Date(iso)).getTime() - Date.now()
      return Math.max(0, Math.ceil(ms / (1000*60*60*24)))
    } catch { return 0 }
  }

  // ===== Рендер =====
  // VIP-режим: не показываем таймер; показываем «активен до»
  if (!Number.isFinite(limit)) {
    const dLeft = daysLeft(vipUntil)
    return (
      <>
        {children}
        <div style={{margin:'6px 0 0 6px', fontSize:12, opacity:.75}}>
          VIP+ {(t('active_until')||'активен до')}: {fmtDate(vipUntil)} ({dLeft} {(t('days')||'дн.')})
        </div>
      </>
    )
  }

  // квота исчерпана — баннер + кнопка «Снять лимит»
  if (used >= limit) return <LimitBanner tr={t} onOpen={onOpenUnlimit} />

  // обычный режим — таймер
  const remain = Math.max(0, limit - used)
  const mm = Math.floor(remain/60), ss = Math.floor(remain%60)
  return (
    <>
      {children}
      <div style={{margin:'6px 0 0 6px', fontSize:12, opacity:.65}}>
        {(t('ai_time_left') || 'Осталось времени сегодня')}: {mm}:{String(ss).padStart(2,'0')}
      </div>
    </>
  )
}


/* ================================= OrderBook (neo-visual) ================================= */
// ⬇⬇⬇ ВАЖНО: здесь ничего не менял вообще
function OrderBook({ symbol }) {
  const { t } = useI18n()
  const [data, setData] = useState(null)

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const j = await fetchDepth(symbol, 50)
        if (alive) setData(j)
      } catch {}
    }

    load()
    const id = setInterval(load, 3000)

    return () => {
      alive = false
      clearInterval(id)
    }
  }, [symbol])

  if (!data) {
    return (
      <Panel>
        <div className="ob-loading">…loading</div>
        <style jsx>{`
          .ob-loading {
            opacity: 0.75;
            font-size: 12px;
          }
        `}</style>
      </Panel>
    )
  }

  const bids = data.bids.map(([p, q]) => ({ price: +p, qty: +q }))
  const asks = data.asks.map(([p, q]) => ({ price: +p, qty: +q }))

  const maxQty = Math.max(1, ...bids.map(x => x.qty), ...asks.map(x => x.qty))

  // i18n: лейблы "Покупка"/"Продажа" (7 языков в словарях)
  const labelBuy = TX(t, 'orderbook_buy', 'Buy')
  const labelSell = TX(t, 'orderbook_sell', 'Sell')

  // === линия борьбы на реальных объёмах стакана ===
  const totalBid = bids.reduce((s, x) => s + x.qty, 0)
  const totalAsk = asks.reduce((s, x) => s + x.qty, 0)
  const total = (totalBid + totalAsk) || 1
  const bidPct = Math.round((totalBid / total) * 100)
  const askPct = 100 - bidPct

  return (
    <Panel>
      {/* Верхний хедер: Buy слева, Sell справа, посередине анимированная линия доминанса */}
      <div className="ob-hdr">
        <span className="ob-side-label ob-buy">{labelBuy}</span>

        <div className="ob-battle">
          <div className="ob-bar">
            <div
              className="ob-seg ob-seg-buy"
              style={{ width: `${bidPct}%` }}
            />
            <div
              className="ob-seg ob-seg-sell"
              style={{ width: `${askPct}%` }}
            />
            {/* мягкий бегущий блик по всей полосе */}
            <div className="ob-bar-glow" />
          </div>
          <div className="ob-nums">
            <span className="ob-num ob-num-buy">{bidPct}%</span>
            <span className="ob-num ob-num-sell">{askPct}%</span>
          </div>
        </div>

        <span className="ob-side-label ob-sell">{labelSell}</span>
      </div>

      {/* Две колонки: слева bids (buy), справа asks (sell) */}
      <div className="ob-cols">
        {/* BUY / BIDS */}
        <div className="ob-col">
          {bids.slice(0, 20).map((r, i) => (
            <div key={'b' + i} className="ob-row ob-row-bid">
              <div
                className="ob-row-fill"
                style={{ width: `${(r.qty / maxQty) * 100}%` }}
              />
              <span className="ob-price">{fmtP(r.price)}</span>
              <span className="ob-qty">{fmtQ(r.qty)}</span>
            </div>
          ))}
        </div>

        {/* SELL / ASKS */}
        <div className="ob-col">
          {asks
            .slice(0, 20)
            .reverse()
            .map((r, i) => (
              <div key={'a' + i} className="ob-row ob-row-ask">
                <div
                  className="ob-row-fill"
                  style={{ width: `${(r.qty / maxQty) * 100}%` }}
                />
                <span className="ob-price">{fmtP(r.price)}</span>
                <span className="ob-qty">{fmtQ(r.qty)}</span>
              </div>
            ))}
        </div>
      </div>

      <style jsx>{`
        /* ===== Хедер и линия борьбы ===== */
        .ob-hdr {
         display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
          font-size: 12px;
          flex-wrap: nowrap;
        }

        .ob-side-label {
          padding: 4px 14px;
          border-radius: 999px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(4, 7, 15, 0.96);
          box-shadow: 0 0 14px rgba(0, 0, 0, 0.9);
          border: 1px solid rgba(148, 163, 253, 0.14);
        }

        .ob-buy {
          color: #4ade80;
          border-color: rgba(34, 197, 94, 0.9);
          box-shadow: 0 0 16px rgba(22, 163, 74, 0.45);
        }
        .ob-sell {
          color: #f87171;
          border-color: rgba(239, 68, 68, 0.9);
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.45);
        }

        .ob-battle {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .ob-bar {
          position: relative;
          width: 100%;
          height: 12px;
          border-radius: 999px;
          overflow: hidden;
          background: radial-gradient(
              circle at 0% 50%,
              rgba(22, 163, 74, 0.16),
              transparent 55%
            ),
            radial-gradient(
              circle at 100% 50%,
              rgba(239, 68, 68, 0.16),
              transparent 55%
            ),
            rgba(6, 8, 20, 0.96);
          box-shadow:
            0 0 18px rgba(15, 23, 42, 0.9) inset,
            0 0 12px rgba(15, 23, 42, 0.9);
        }

        .ob-seg {
          position: absolute;
          top: 0;
          bottom: 0;
          transition: width 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
        }

        .ob-seg-buy {
          left: 0;
          background: linear-gradient(
            to right,
            rgba(34, 197, 94, 0.95),
            rgba(22, 163, 74, 0.8)
          );
        }

        .ob-seg-sell {
          right: 0;
          background: linear-gradient(
            to left,
            rgba(239, 68, 68, 0.95),
            rgba(248, 113, 113, 0.8)
          );
        }

        /* Бегущий блик по полосе */
        .ob-bar-glow {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 18%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(148, 163, 253, 0.35),
            transparent
          );
          mix-blend-mode: screen;
          opacity: 0.14;
          animation: obGlow 2.8s linear infinite;
        }

        .ob-nums {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: 600;
        }
        .ob-num-buy {
          color: #4ade80;
        }
        .ob-num-sell {
          color: #f97373;
        }

        @keyframes obGlow {
          0% {
            transform: translateX(-10%);
          }
          100% {
            transform: translateX(110%);
          }
        }

        /* ===== Таблица заявок ===== */
        .ob-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 4px;
        }

        .ob-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ob-row {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 4px 8px;
          border-radius: 8px;
          overflow: hidden;
          font-variant-numeric: tabular-nums;
          font-size: 11px;
          color: #e5e7eb;
          background: radial-gradient(
              circle at 0 0,
              rgba(148, 163, 253, 0.06),
              transparent 65%
            ),
            rgba(3, 7, 18, 0.9);
          transition:
            background 0.18s ease,
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .ob-row-fill {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          opacity: 0.16;
          pointer-events: none;
          transition: width 0.22s ease-out, opacity 0.18s ease;
        }

        .ob-row-bid .ob-row-fill {
          background: linear-gradient(
            to right,
            rgba(22, 163, 74, 0.85),
            rgba(22, 163, 74, 0.15)
          );
        }

        .ob-row-ask .ob-row-fill {
          background: linear-gradient(
            to right,
            rgba(239, 68, 68, 0.85),
            rgba(239, 68, 68, 0.15)
          );
        }

        .ob-row:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 14px rgba(0, 0, 0, 0.6);
          background: radial-gradient(
              circle at 10% 0,
              rgba(148, 163, 253, 0.16),
              transparent 70%
            ),
            rgba(6, 9, 20, 0.98);
        }
        .ob-row:hover .ob-row-fill {
          opacity: 0.26;
        }

        .ob-price {
          z-index: 1;
        }
        .ob-qty {
          z-index: 1;
          text-align: right;
          color: rgba(226, 232, 240, 0.9);
        }

        @media (max-width: 640px) {
           .ob-hdr {
            gap: 6px;
            font-size: 11px;
          }
          .ob-battle {
            margin: 0 4px;
          }
        }
      `}</style>
    </Panel>
  )
}



/* ===================== Маркиза как на главной: бесшовно, full-bleed ===================== */
function PageMarqueeTail() {
  const { t } = useI18n()
  const marqueeRef = useRef(null)

  useEffect(() => {
    const el = marqueeRef.current
    if (!el) return
    if (el.dataset.duped === '1') return
    el.innerHTML += el.innerHTML
    el.dataset.duped = '1'
  }, [])

  return (
    <section className="marquee-wrap no-gutters" aria-hidden="true">
      <div className="marquee" ref={marqueeRef}>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
        <span>{t('marquee')}</span>
      </div>
 
    </section>
  )
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

  // AI state (теперь через серверный Brain API)
  const [ai,setAI]=useState(null)
  useEffect(()=>{
    let alive = true

    ;(async () => {
      try {
        // Собираем параметры для API
        const params = new URLSearchParams({
          symbol,
          tf,
          limit: '750', // будет прочитан как limitMain/limit на сервере
        })

        // Дёргаем серверную ручку Brain v5
        const r = await fetch(`/api/brain/analyze?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
        })

        const j = await r.json().catch(() => null)
        if (!alive) return

        // ожидаем, что API вернет либо { ok:true, data:{...} }, либо сразу brain-объект
        let payload = null
        if (j && typeof j === 'object') {
          if (j.data) payload = j.data
          else payload = j
        }

        if (payload && (payload.action || payload.price != null)) {
          // гарантируем price, чтобы AIBox не ломался
          const price = Number.isFinite(payload.price)
            ? payload.price
            : (Array.isArray(payload.c) && payload.c.length
                ? payload.c[payload.c.length - 1]
                : 0)

          setAI({
            ...payload,
            price,
          })
        } else {
          // fallback — если API вернул что-то странное
          setAI({
            action:'HOLD',
            confidence:50,
            price:0,
            horizons:{'1h':0,'6h':0,'24h':0},
            reasons:[TX(t,'ai_no_data','Not enough data')],
          })
        }
      } catch (e) {
        // fallback — если запрос упал
        console.error('[Exchange] Brain API error:', e)
        if (alive) {
          setAI({
            action:'HOLD',
            confidence:50,
            price:0,
            horizons:{'1h':0,'6h':0,'24h':0},
            reasons:[TX(t,'ai_no_data','Not enough data')],
          })
        }
      }
    })()

    return () => { alive = false }
  }, [symbol, tf, t])


  const sections = Array.isArray(TX(t, 'exchange_sections', [])) ? TX(t, 'exchange_sections', []) : []
  const bullets  = Array.isArray(TX(t, 'ex_bullets', [])) ? TX(t, 'ex_bullets', []) : []

  // ===== модалка VIP+ =====
  const [openUnlimit, setOpenUnlimit] = useState(false)
  useEffect(() => {
    const open = () => setOpenUnlimit(true)
    window.addEventListener('open-unlimit', open)
    return () => window.removeEventListener('open-unlimit', open)
  }, [])

  const handleOpenUnlimit = async () => {
    const acc = await ensureAuthorized()
    if (acc) setOpenUnlimit(true)
  }

  const handlePayClick = async () => {
    try {
      const accountId = await ensureAuthorized()
      if (!accountId) return
      const r = await fetch('/api/pay/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ accountId })
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j?.error || 'Create failed')

      if (j.url) {
        openPaymentWindow(j.url)
      }
    } catch (e) {
      console.error(e)
      alert('Payment error: ' + e.message)
    }
  }


  return (
    <div className="wrap">
      <BadgeTitle/>
 
      <TVTicker symbol={symbol}/>
      <TVChart symbol={symbol} tf={tf}/>
      <SymbolTFSelector current={{symbol,tf}} symbols={symbols} onChange={(s,tf2)=>{setSymbol(s); setTf(tf2)}}/>

      <AIQuotaGate onOpenUnlimit={handleOpenUnlimit}>
        <AIBox data={ai}/>
      </AIQuotaGate>
      <BattleCoin />
      <OrderBook symbol={symbol}/>
     {/* Реклама сразу после биржевого стакана (Order Book) */}
     <HomeBetweenBlocksAd
      slotKey="exchange_after_orderbook"
       slotKind="exchange_after_orderbook"
     />
           
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

      <UnlimitModal
        open={openUnlimit}
        onClose={() => setOpenUnlimit(false)}
        onPay={handlePayClick}
      />
     {/* Реклама перед финальным блоком (маркиза + иконки) */}
     <HomeBetweenBlocksAd
       slotKey="exchange_before_footer"
       slotKind="exchange_before_footer"
     />
      <PageMarqueeTail />
      {/* ===== ИКОНКИ ПОСЛЕ МАРКИЗЫ (глобальные стили ql7-*, как на главной/subscribe) ===== */}
      <div className="ql7-icons-row">
        <Link
          href="/privacy"
          className="ql7-icon-link"
          aria-label="Privacy / Политика"
          style={{ '--ql7-icon-size': '130px' }}
        >
          <Image
            src="/click/policy.png"
            alt="Privacy"
            width={130}
            height={130}
            draggable={false}
            className="ql7-click-icon"
          />
        </Link>

        <Link
          href="/contact"
          className="ql7-icon-link"
          aria-label="Support / Поддержка"
          style={{ '--ql7-icon-size': '130px' }}
        >
          <Image
            src="/click/support.png"
            alt="Support"
            width={130}
            height={130}
            draggable={false}
            className="ql7-click-icon"
          />
        </Link>

      </div>
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
