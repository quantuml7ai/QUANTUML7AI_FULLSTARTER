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
import AIWorkbench from './ai-box/AIWorkbench'
import { useAIEntitlement } from './ai-box/useAIEntitlement'
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
// ==================== TradingView timezone helpers ====================

// 1) "Зелёный список" таймзон, которые TradingView реально понимает (из официальной доки)
const TV_SUPPORTED_TIMEZONES = new Set([
  'Etc/UTC',
  'Africa/Cairo',
  'Africa/Casablanca',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Tunis',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/El_Salvador',
  'America/Juneau',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Almaty',
  'Asia/Ashkhabad',
  'Asia/Bahrain',
  'Asia/Bangkok',
  'Asia/Chongqing',
  'Asia/Colombo',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Ho_Chi_Minh',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Kabul',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Kuwait',
  'Asia/Manila',
  'Asia/Muscat',
  'Asia/Nicosia',
  'Asia/Qatar',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tehran',
  'Asia/Tokyo',
  'Asia/Yangon',
  'Atlantic/Azores',
  'Atlantic/Reykjavik',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Belgrade',
  'Europe/Berlin',
  'Europe/Bratislava',
  'Europe/Brussels',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Luxembourg',
  'Europe/Madrid',
  'Europe/Malta',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Riga',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Tallinn',
  'Europe/Vienna',
  'Europe/Vilnius',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Chatham',
  'Pacific/Fakaofo',
  'Pacific/Honolulu',
  'Pacific/Norfolk',
  'US/Mountain',
])

// 2) Ручные алиасы для "странных" зон, у которых есть эквивалент в списке TV
//    Здесь можно дописывать то, что лично вам нужно (Kyiv, Chisinau и т.д.)
const TV_TIMEZONE_OVERRIDES = {
  // ===== БАЗОВЫЕ UTC / GMT СИНОНИМЫ =====
  'UTC': 'Etc/UTC',
  'Etc/UTC': 'Etc/UTC',
  'GMT': 'Etc/UTC',
  'Etc/GMT': 'Etc/UTC',
  'Etc/GMT+0': 'Etc/UTC',
  'Etc/GMT-0': 'Etc/UTC',
  'Etc/GMT0': 'Etc/UTC',
  'GMT0': 'Etc/UTC',
  'Etc/Universal': 'Etc/UTC',
  'Etc/Zulu': 'Etc/UTC',

  // ===== УКРАИНА / МОЛДОВА / ВОСТОЧНАЯ ЕВРОПА =====
  'Europe/Kyiv': 'Europe/Bucharest',
  'Europe/Kiev': 'Europe/Bucharest',
  'Europe/Chisinau': 'Europe/Bucharest',

  'Europe/Uzhgorod': 'Europe/Bucharest',
  'Europe/Zaporozhye': 'Europe/Bucharest',

  // иногда так встречается Киев/Москва в старых системах
  'EET': 'Europe/Bucharest',   // generic Eastern European Time
  'CET': 'Europe/Berlin',
  'WET': 'Europe/Lisbon',
  'MET': 'Europe/Berlin',

  // мелкие страны, которых нет в списке TV, но они по сути EU-зоны
  'Europe/Andorra': 'Europe/Madrid',
  'Europe/Monaco': 'Europe/Paris',
  'Europe/Vatican': 'Europe/Rome',
  'Europe/San_Marino': 'Europe/Rome',

  'Europe/Belfast': 'Europe/London',
  'Europe/Guernsey': 'Europe/London',
  'Europe/Jersey': 'Europe/London',
  'Europe/Isle_of_Man': 'Europe/London',
  'Europe/Greenwich': 'Europe/London',

  // Балканы, которые иногда мапятся на Belgrade
  'Europe/Sarajevo': 'Europe/Belgrade',
  'Europe/Skopje': 'Europe/Belgrade',
  'Europe/Podgorica': 'Europe/Belgrade',
  'Europe/Ljubljana': 'Europe/Belgrade',

  // Беларусь (сейчас без DST, но по UTC близко к Москве)
  'Europe/Minsk': 'Europe/Moscow',

  // ===== ТУРЦИЯ / БЛИЖНИЙ ВОСТОК =====
  'Asia/Istanbul': 'Europe/Istanbul',
  'Europe/Istanbul': 'Europe/Istanbul', // чтобы наверняка
  'Asia/Tel_Aviv': 'Asia/Jerusalem',

  // ===== АЗИЯ: СТАРЫЕ / АЛЬТЕРНАТИВНЫЕ НАЗВАНИЯ =====
  'Asia/Calcutta': 'Asia/Kolkata',
  'Asia/Katmandu': 'Asia/Kathmandu',

  'Asia/Saigon': 'Asia/Ho_Chi_Minh',
  'Asia/Phnom_Penh': 'Asia/Bangkok',
  'Asia/Vientiane': 'Asia/Bangkok',

  'Asia/Chungking': 'Asia/Chongqing',
  'Asia/Harbin': 'Asia/Shanghai',
  'Asia/Kashgar': 'Asia/Shanghai',
  'Asia/Urumqi': 'Asia/Shanghai',

  'Asia/Macao': 'Asia/Hong_Kong',
  'Asia/Brunei': 'Asia/Singapore',

  // Улан-Батор — у TV нет своей зоны, берём ближайший по UTC+8
  'Asia/Ulan_Bator': 'Asia/Shanghai',
  'Asia/Ulaanbaatar': 'Asia/Shanghai',

  // разные "персистентные" варианты залива
  'Asia/Qatar': 'Asia/Qatar',        // есть в TV, но оставим на всякий
  'Asia/Bahrain': 'Asia/Qatar',
  'Asia/Kuwait': 'Asia/Riyadh',

  // ===== АВСТРАЛИЯ / ОКЕАНИЯ =====
  'Australia/ACT': 'Australia/Sydney',
  'Australia/NSW': 'Australia/Sydney',
  'Australia/Victoria': 'Australia/Sydney',
  'Australia/Canberra': 'Australia/Sydney',
  'Australia/Tasmania': 'Australia/Sydney',
  'Australia/Yancowinna': 'Australia/Sydney',

  'Australia/Queensland': 'Australia/Brisbane',

  'Australia/West': 'Australia/Perth',
  'Australia/North': 'Australia/Darwin',

  // Самоа / Мидуэй — у TV нет всех этих зон, берём ближайший Pacific
  'Pacific/Samoa': 'Pacific/Honolulu',
  'Pacific/Pago_Pago': 'Pacific/Honolulu',
  'Pacific/Midway': 'Pacific/Honolulu',

  // ===== США: LEGACY / ШТАТНЫЕ ИДЕНТИФИКАТОРЫ =====
  'US/Pacific': 'America/Los_Angeles',
  'US/Mountain': 'US/Mountain',          // есть в TV
  'US/Central': 'America/Chicago',
  'US/Eastern': 'America/New_York',
  'US/Arizona': 'America/Phoenix',
  'US/Alaska': 'America/Anchorage',
  'US/Hawaii': 'Pacific/Honolulu',

  // старые alias'ы для конкретных городов / штатов
  'America/Detroit': 'America/New_York',
  'America/Indianapolis': 'America/New_York',
  'America/Fort_Wayne': 'America/New_York',
  'America/Louisville': 'America/New_York',
  'America/Kentucky/Louisville': 'America/New_York',
  'America/Grand_Turk': 'America/New_York',

  'America/Atka': 'America/Anchorage',
  'America/Juneau': 'America/Juneau', // TV умеет
  'America/Ensenada': 'America/Los_Angeles',
  'America/Santa_Isabel': 'America/Los_Angeles',
  'America/Tijuana': 'America/Los_Angeles',

  // ===== ЛАТИНСКАЯ АМЕРИКА / АРГЕНТИНА =====
  'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
  'America/Cordoba': 'America/Argentina/Buenos_Aires',
  'America/Rosario': 'America/Argentina/Buenos_Aires',
  'America/Catamarca': 'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba': 'America/Argentina/Buenos_Aires',
  'America/Argentina/Catamarca': 'America/Argentina/Buenos_Aires',
  'America/Argentina/ComodRivadavia': 'America/Argentina/Buenos_Aires',
  'America/Argentina/Jujuy': 'America/Argentina/Buenos_Aires',
  'America/Jujuy': 'America/Argentina/Buenos_Aires',
  'America/Mendoza': 'America/Argentina/Buenos_Aires',

  // Центральная Америка — сводим к El_Salvador (UTC-6 без DST)
  'America/Guatemala': 'America/El_Salvador',
  'America/Belize': 'America/El_Salvador',
  'America/Costa_Rica': 'America/El_Salvador',
  'America/Managua': 'America/El_Salvador',
  'America/Tegucigalpa': 'America/El_Salvador',

  // Бразильские города, сводим к Sao_Paulo
  'America/Belem': 'America/Sao_Paulo',
  'America/Fortaleza': 'America/Sao_Paulo',
  'America/Recife': 'America/Sao_Paulo',
  'America/Maceio': 'America/Sao_Paulo',
  'America/Araguaina': 'America/Sao_Paulo',
  'America/Santarem': 'America/Sao_Paulo',

  // ===== ПРОЧИЕ ОБЩИЕ ПСЕВДОНИМЫ =====
  // иногда системы возвращают просто "Etc/GMT+N", но TV лучше даёт UTC
  'Etc/GMT+1': 'Etc/UTC',
  'Etc/GMT-1': 'Etc/UTC',

  // «плавающие» europe-cites, которых нет в списке TV, но по смещению ок
  'Africa/Tripoli': 'Europe/Athens',
  'Africa/Ceuta': 'Europe/Madrid',
}


// 3) Считываем таймзону браузера
function getBrowserTimezone() {
  if (typeof window === 'undefined' || !window.Intl) return null
  try {
    const opts = Intl.DateTimeFormat().resolvedOptions()
    return opts && opts.timeZone ? opts.timeZone : null
  } catch {
    return null
  }
}

// 4) Переводим минутный offset в формат Etc/GMT±X, который понимает TV
//    offsetMinutes — это смещение "от UTC" в минутах (для UTC+2 будет 120)
function offsetMinutesToEtcGmt(offsetMinutes) {
  const sign = offsetMinutes >= 0 ? '-' : '+' // у Etc/GMT знак инвертирован относительно нормального
  const abs = Math.abs(offsetMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  if (minutes === 0) {
    return `Etc/GMT${sign}${hours}`
  }
  return `Etc/GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`
}

// 5) Главный helper: возвращает конфиг для TradingView: { timezone, custom_timezones }
function getTradingViewTimezoneConfig() {
  const browserTz = getBrowserTimezone()

  // Если браузер ничего не сказал — просто UTC
  if (!browserTz) {
    return {
      timezone: 'Etc/UTC',
      custom_timezones: [],
    }
  }

  // Если таймзона прямо поддерживается TV — отдаем как есть
  if (TV_SUPPORTED_TIMEZONES.has(browserTz)) {
    return {
      timezone: browserTz,
      custom_timezones: [],
    }
  }

  // Если есть ручной алиас — используем его
  if (TV_TIMEZONE_OVERRIDES[browserTz]) {
    return {
      timezone: TV_TIMEZONE_OVERRIDES[browserTz],
      custom_timezones: [],
    }
  }

  // Универсальный fallback: регаем custom timezone с алиасом на ближайший Etc/GMT±X
  // offset берём из текущей системной TZ (она же браузерная)
  const offsetNowMinutes = -new Date().getTimezoneOffset() // +120 для UTC+2
  const alias = offsetMinutesToEtcGmt(offsetNowMinutes)

  const id = browserTz // используем строку браузера как id для custom timezone
  const title = browserTz

  return {
    timezone: id,
    custom_timezones: [
      {
        id,
        alias,
        title,
      },
    ],
  }
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

function TVChart({ symbol, tf }) {
  useTVCore()
  const containerRef = useRef(null)
  const widgetRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    const containerEl = containerRef.current   // <-- фикс

    if (!containerEl) return

    onTVReady(() => {
      if (cancelled) return
      if (!containerEl) return

      containerEl.innerHTML = ''

      const { timezone, custom_timezones } = getTradingViewTimezoneConfig()
      // console.log('[TV] tz config ->', { browser: getBrowserTimezone(), timezone, custom_timezones })

      // eslint-disable-next-line no-undef
      const widget = new window.TradingView.widget({
        autosize: true,
        symbol: MAP_TV(symbol),
        interval: TFmap[tf],
        container_id: containerEl.id,   // <-- тоже используем локальный
        theme: 'dark',
        style: '1',
        locale: 'en',
        hide_side_toolbar: false,
        hide_legend: false,
        allow_symbol_change: false,
        timezone,
        custom_timezones,
      })

      widgetRef.current = widget

      if (typeof widget.onChartReady === 'function') {
        widget.onChartReady(() => {
          try {
            const { timezone: tzFinal } = getTradingViewTimezoneConfig()
            widget
              .activeChart()
              .getTimezoneApi()
              .setTimezone(tzFinal)
          } catch (e) {
            console.warn('[TV] failed to set timezone via API', e)
          }
        })
      }
    })

    // cleanup
    return () => {
      cancelled = true
      try {
        if (widgetRef.current && typeof widgetRef.current.remove === 'function') {
          widgetRef.current.remove()
        }
      } catch {}
      widgetRef.current = null

      if (containerEl) {
        containerEl.innerHTML = ''
      }
    }
  }, [symbol, tf])

  return (
    <Panel>
      <div className="tvWrap">
        <div id="tv_chart" ref={containerRef} />
      </div>
    <style jsx>{`.tvWrap{position:relative;width:100%;height:58vh;min-height:360px} .tvWrap :global(#tv_chart){position:absolute;inset:0}`}</style>

    </Panel>
  )
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
    let settled = false
    let tid = null
    const cleanup = () => {
      try { window.removeEventListener('auth:ok', done) } catch {}
      try { window.removeEventListener('auth:success', done) } catch {}
      if (tid) {
        clearTimeout(tid)
        tid = null
      }
    }
    const finish = (value) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(value)
    }
    const done = (e)=> {
      const id = e?.detail?.accountId || getAcc()
      if (id) finish(id)
    }
    window.addEventListener('auth:ok', done, { once:true })
    window.addEventListener('auth:success', done, { once:true })
    tid = setTimeout(() => finish(getAcc()), 120000)
  })

  return acc || null
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

  const { entitlement, canAnalyze } = useAIEntitlement()

  // AI Brain runs only for an authoritatively available FREE/VIP entitlement.
  const [ai,setAI]=useState(null)
  const brainGenerationRef = useRef(0)
  useEffect(()=>{
    const generation = brainGenerationRef.current + 1
    brainGenerationRef.current = generation

    if (!canAnalyze) {
      setAI(null)
      return undefined
    }

    const controller = new AbortController()
    setAI(null)

    ;(async () => {
      try {
        const params = new URLSearchParams({
          symbol,
          tf,
          limit: '750',
        })
        const response = await fetch(`/api/brain/analyze?${params.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })
        const json = await response.json().catch(() => null)
        if (controller.signal.aborted || generation !== brainGenerationRef.current) return

        let payload = null
        if (json && typeof json === 'object') {
          payload = json.data || json
        }

        if (payload && (payload.action || payload.price != null)) {
          const price = Number.isFinite(payload.price)
            ? payload.price
            : (Array.isArray(payload.c) && payload.c.length
                ? payload.c[payload.c.length - 1]
                : 0)
          setAI({ ...payload, price })
          return
        }

        setAI({
          action:'HOLD',
          confidence:50,
          price:0,
          horizons:{'1h':0,'6h':0,'24h':0},
          reasons:[TX(t,'ai_no_data','Not enough data')],
        })
      } catch (error) {
        if (error?.name === 'AbortError') return
        console.error('[Exchange] Brain API error:', error)
        if (generation === brainGenerationRef.current) {
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

    return () => controller.abort()
  }, [canAnalyze, symbol, tf, t])


  const sections = Array.isArray(TX(t, 'exchange_sections', [])) ? TX(t, 'exchange_sections', []) : []
  const bullets  = Array.isArray(TX(t, 'ex_bullets', [])) ? TX(t, 'ex_bullets', []) : []

  // ===== VIP+ purchase overlay scoped to the AI Workbench =====
  const [openUnlimit, setOpenUnlimit] = useState(false)
  const [paymentBusy, setPaymentBusy] = useState(false)

  const handleOpenUnlimit = useCallback(async () => {
    const accountId = await ensureAuthorized()
    if (accountId) setOpenUnlimit(true)
  }, [])

  useEffect(() => {
    const open = () => { void handleOpenUnlimit() }
    window.addEventListener('open-unlimit', open)
    return () => window.removeEventListener('open-unlimit', open)
  }, [handleOpenUnlimit])

  const handlePayClick = async () => {
    if (paymentBusy) return
    setPaymentBusy(true)
    try {
      const accountId = await ensureAuthorized()
      if (!accountId) {
        setPaymentBusy(false)
        return
      }
      const response = await fetch('/api/pay/create', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ accountId })
      })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json?.error || 'Create failed')

      if (json.url) {
        openPaymentWindow(json.url)
        return
      }
      setPaymentBusy(false)
    } catch (error) {
      console.error(error)
      setPaymentBusy(false)
      alert('Payment error: ' + error.message)
    }
  }



  return (
    <div className="wrap">
      <BadgeTitle/>

      <TVTicker symbol={symbol}/>
      <BattleCoin />
      <TVChart symbol={symbol} tf={tf}/>

      <AIWorkbench
        symbol={symbol}
        timeframe={tf}
        symbols={symbols}
        onSelectionChange={(nextSymbol, nextTimeframe) => {
          setSymbol(nextSymbol)
          setTf(nextTimeframe)
        }}
        aiData={ai}
        entitlement={entitlement}
        canAnalyze={canAnalyze}
        onOpenPurchase={handleOpenUnlimit}
        purchaseOpen={openUnlimit}
        onClosePurchase={() => setOpenUnlimit(false)}
        onPay={handlePayClick}
        paymentBusy={paymentBusy}
      />

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
