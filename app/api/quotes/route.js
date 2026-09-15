/* #############################################################
# /api/quotes  — live котировки для тикера/маркиз
# ENV (сервер):
#  - CMC_API_KEY
#  - UPSTASH_REDIS_REST_URL
#  - UPSTASH_REDIS_REST_TOKEN
#
# Пример: /api/quotes?symbols=BTC,ETH,SOL,BNB,TON,XRP
# Ответ:  { ok:true, items:[{ s:'BTC', c: 62345.12, dp: +1.23, ts: 1699999999999 }, ...] }
############################################################# */

import { NextResponse } from 'next/server'

/* =========================
#1. Конфиг (TTL/лимиты/дефолты)
========================= */
const DEF_SYMBOLS = ['BTC','ETH','SOL','BNB','TON','XRP','MATIC','ADA','DOGE','AVAX','ATOM','OP','ARB','NEAR','APT','SUI','ETC','LTC','TRX','DOT']
const CACHE_SECONDS = 30        // ttl кэша котировок (сек)
const CACHE_PREFIX = 'ql7:quotes:v1:'
const FETCH_TIMEOUT_MS = 8000   // таймаут для внешних API

/* =========================
#2. ENV (серверные)
========================= */
const ENV = {
  CMC_API_KEY: process.env.CMC_API_KEY || '',
  UPSTASH_URL: process.env.UPSTASH_REDIS_REST_URL || '',
  UPSTASH_TOK: process.env.UPSTASH_REDIS_REST_TOKEN || '',
}

/* =========================
#3. Утилиты
========================= */
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function withTimeout(promise, ms = FETCH_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(v => { clearTimeout(id); resolve(v) }, e => { clearTimeout(id); reject(e) })
  })
}

function ok(data) {
  return NextResponse.json({ ok: true, ...data }, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function fail(status = 500, message = 'error') {
  return NextResponse.json({ ok: false, error: message }, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

/* =========================
#4. Upstash REST helpers (GET/SET с TTL)
========================= */
async function upstashGet(key) {
  if (!ENV.UPSTASH_URL || !ENV.UPSTASH_TOK) return null
  try {
    const r = await fetch(`${ENV.UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${ENV.UPSTASH_TOK}` },
      cache: 'no-store',
    })
    if (!r.ok) return null
    const data = await r.json()
    const v = data?.result
    if (!v) return null
    return JSON.parse(v)
  } catch { return null }
}

async function upstashSetEx(key, value, ttlSec) {
  if (!ENV.UPSTASH_URL || !ENV.UPSTASH_TOK) return false
  try {
    const body = JSON.stringify([ 'SET', key, JSON.stringify(value), 'EX', String(ttlSec) ])
    const r = await fetch(`${ENV.UPSTASH_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ENV.UPSTASH_TOK}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([ JSON.parse(body) ]),
    })
    return r.ok
  } catch { return false }
}

/* =========================
#5. Нормализация ответов провайдеров к {s,c,dp,ts}
========================= */

// CoinMarketCap listings/map endpoints -> symbols
function normalizeCMC(json, wantSymbolsSet) {
  const out = []
  const now = Date.now()
  const arr = json?.data || []
  for (const it of arr) {
    const sym = (it?.symbol || '').toUpperCase()
    if (!sym || (wantSymbolsSet && !wantSymbolsSet.has(sym))) continue
    const usd = it?.quote?.USD
    if (!usd) continue
    const price = Number(usd.price)
    const pct = Number(usd.percent_change_24h)
    if (!Number.isFinite(price)) continue
    out.push({ s: sym, c: price, dp: Number.isFinite(pct) ? pct : 0, ts: now })
  }
  return out
}

// Coingecko /simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true
function normalizeCoingecko(json, symToIdMap) {
  const out = []
  const now = Date.now()
  for (const [id, obj] of Object.entries(json || {})) {
    const sym = symToIdMap[id]
    if (!sym) continue
    const price = Number(obj?.usd)
    const dp = Number(obj?.usd_24h_change)
    if (!Number.isFinite(price)) continue
    out.push({ s: sym, c: price, dp: Number.isFinite(dp) ? dp : 0, ts: now })
  }
  return out
}

// CoinCap /assets?ids=bitcoin,ethereum → { data:[{id,symbol,priceUsd,changePercent24Hr}] }
function normalizeCoinCap(json, wantSymbolsSet, symToIdMap) {
  const out = []
  const now = Date.now()
  const arr = json?.data || []
  for (const it of arr) {
    const id = it?.id
    const sym = Object.entries(symToIdMap).find(([,v]) => v === id)?.[0]
    const symbol = sym || (it?.symbol || '').toUpperCase()
    if (!symbol || (wantSymbolsSet && !wantSymbolsSet.has(symbol))) continue
    const price = Number(it?.priceUsd)
    const dp = Number(it?.changePercent24Hr)
    if (!Number.isFinite(price)) continue
    out.push({ s: symbol, c: price, dp: Number.isFinite(dp) ? dp : 0, ts: now })
  }
  return out
}

/* =========================
#6. Мапы ID<->SYMBOL для коингеки/коинкап (минимальный)
#   Чтобы поддержать хиты без внешних словарей.
========================= */
const SYM_TO_CG = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', TON: 'the-open-network',
  XRP: 'ripple', MATIC: 'matic-network', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
  ATOM: 'cosmos', OP: 'optimism', ARB: 'arbitrum', NEAR: 'near', APT:'aptos', SUI:'sui',
  ETC:'ethereum-classic', LTC:'litecoin', TRX:'tron', DOT:'polkadot'
}
const CG_TO_SYM = Object.fromEntries(Object.entries(SYM_TO_CG).map(([k,v]) => [v,k]))

const SYM_TO_CC = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binance-coin', TON: 'toncoin',
  XRP: 'xrp', MATIC: 'polygon', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche',
  ATOM: 'cosmos', OP: 'optimism-ethereum', ARB: 'arbitrum', NEAR: 'near-protocol', APT:'aptos',
  SUI:'sui', ETC:'ethereum-classic', LTC:'litecoin', TRX:'tron', DOT:'polkadot'
}

/* =========================
#7. Фетч провайдеров
========================= */
async function fetchFromCMC(symbols) {
  // Listings latest — проще нормализовать, чем /quotes/latest с symbol=
  const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?convert=USD&limit=300'
  const r = await withTimeout(fetch(url, { headers: { 'X-CMC_PRO_API_KEY': ENV.CMC_API_KEY }, cache: 'no-store' }))
  if (!r.ok) throw new Error('cmc_bad')
  const j = await r.json()
  const want = new Set(symbols)
  return normalizeCMC(j, want)
}

async function fetchFromCoingecko(symbols) {
  const ids = symbols.map(s => SYM_TO_CG[s]).filter(Boolean)
  if (!ids.length) return []
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
  const r = await withTimeout(fetch(url, { cache: 'no-store' }))
  if (!r.ok) throw new Error('cg_bad')
  const j = await r.json()
  return normalizeCoingecko(j, CG_TO_SYM)
}

async function fetchFromCoinCap(symbols) {
  const ids = symbols.map(s => SYM_TO_CC[s]).filter(Boolean)
  if (!ids.length) return []
  const url = `https://api.coincap.io/v2/assets?ids=${ids.join(',')}`
  const r = await withTimeout(fetch(url, { cache: 'no-store' }))
  if (!r.ok) throw new Error('cc_bad')
  const j = await r.json()
  const want = new Set(symbols)
  return normalizeCoinCap(j, want, SYM_TO_CC)
}

/* =========================
#8. Основной обработчик
========================= */
export async function GET(req) {
  try {
    // ---- symbols ----
    const { searchParams } = new URL(req.url)
    const symbols = (searchParams.get('symbols') || DEF_SYMBOLS.join(','))
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(Boolean)

    const cacheKey = CACHE_PREFIX + symbols.join(',')
    // ---- cache ----
    const cached = await upstashGet(cacheKey)
    if (cached?.items?.length) {
      return ok({ items: cached.items })
    }

    // ---- providers chain: CMC -> CG -> CC ----
    let items = []
    if (ENV.CMC_API_KEY) {
      try {
        items = await fetchFromCMC(symbols)
      } catch {}
    }
    if (!items?.length) {
      try { items = await fetchFromCoingecko(symbols) } catch {}
    }
    if (!items?.length) {
      try { items = await fetchFromCoinCap(symbols) } catch {}
    }
    // если совсем пусто — делаем нулевой ответ по символам (чтобы не ронять клиент)
    if (!items?.length) {
      const now = Date.now()
      items = symbols.map(s => ({ s, c: 0, dp: 0, ts: now }))
    }

    // ---- cache set ----
    await upstashSetEx(cacheKey, { items }, CACHE_SECONDS)

    return ok({ items })
  } catch (e) {
    return fail(500, e?.message || 'quotes_error')
  }
}
