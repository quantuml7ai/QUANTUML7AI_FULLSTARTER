// app/api/battlecoin/state/route.js
import { NextResponse } from 'next/server'
import { redis, safeParse } from '../../forum/_db.js'


const qcoinKey   = (uid) => `qcoin:${uid}`
const orderKey   = (uid) => `battlecoin:order:${uid}`
const historyKey = (uid) => `battlecoin:history:${uid}`

async function getUid(req) {
  const h1 = (req.headers.get('x-forum-user-id') || '').trim()
  if (h1) return h1

  const h2 = (req.headers.get('x-forum-user') || '').trim()
  if (h2) return h2

  // запасной вариант для любых общих auth-хедеров с Exchange
  const h3 = (req.headers.get('x-auth-account-id') || '').trim()
  if (h3) return h3

  return ''
}


async function readQcoinBalance(uid) {
  try {
    const v = await redis.hget(qcoinKey(uid), 'balance')
    const n = Number(v || 0)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

async function readActiveOrder(uid) {
  try {
    const raw = await redis.get(orderKey(uid))
    const o = safeParse(raw)          // не падаем на "[object Object]"
    return o && typeof o === 'object' ? o : null
  } catch (e) {
    const msg = String(e?.message || '')
    if (msg.includes('WRONGTYPE')) {
      try { await redis.del(orderKey(uid)) } catch {}
      return null
    }
    throw e
  }
}

async function readHistory(uid, limit = 100) {
  try {
    const rows = await redis.lrange(historyKey(uid), 0, limit - 1)
    if (!rows || !rows.length) return []
    const out = []
    for (const r of rows) {
      const o = safeParse(r)
      if (o && typeof o === 'object') out.push(o)
    }
    return out
  } catch {
    return []
  }
}

// --- Binance symbols / live prices ---
// Берём именно тот же набор USDT-пар, что Exchange / AI-bокс
const BINANCE = 'https://api.binance.com'

// как в app/exchange/page.js
async function fetchSymbolsUSDT() {
  try {
    const r = await fetch(`${BINANCE}/api/v3/exchangeInfo`, {
      cache: 'no-store',
    })
    const j = await r.json()
    const list = j.symbols
      .filter(
        (s) =>
          s.status === 'TRADING' &&
          s.quoteAsset === 'USDT'
      )
      .map((s) => s.symbol)
    return [...new Set(list)].sort()
  } catch {
    return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
  }
}

// строим полный market-лист: те же символы + цены + 24h %
async function fetchBattlecoinMarketList(activeSymbol = null) {
  const symbols = await fetchSymbolsUSDT()

  let tickers = []
  try {
    const r = await fetch(`${BINANCE}/api/v3/ticker/24hr`, {
      cache: 'no-store',
    })
    const j = await r.json()
    if (Array.isArray(j)) tickers = j
  } catch {
    tickers = []
  }

  const bySym = new Map()
  for (const t of tickers) {
    if (t && typeof t.symbol === 'string') {
      bySym.set(t.symbol, t)
    }
  }

  const out = symbols.map((sym) => {
    const t = bySym.get(sym) || {}
    const priceRaw =
      t.lastPrice ??
      t.weightedAvgPrice ??
      t.askPrice ??
      t.bidPrice ??
      0
    const chRaw = t.priceChangePercent ?? 0

    const price = Number(priceRaw || 0)
    const change24h = Number(chRaw || 0)

    return {
      symbol: sym,
      price: Number.isFinite(price) ? price : 0,
      change24h: Number.isFinite(change24h) ? change24h : 0,
    }
  })

  // на всякий случай, если активный символ по какой-то причине выпал
  if (
    activeSymbol &&
    !out.find((s) => s.symbol === activeSymbol)
  ) {
    out.unshift({
      symbol: activeSymbol,
      price: 0,
      change24h: 0,
    })
  }

  return out
}

function enrichOrderWithMarket(order, priceMap) {
  if (!order || order.status !== 'OPEN') return order
  const o = { ...order }
  const lastPrice = Number(priceMap.get(o.symbol) || o.entryPrice || 0)
  const P0 = Number(o.entryPrice || 0)

  if (!Number.isFinite(lastPrice) || !Number.isFinite(P0) || P0 <= 0) {
    o.markPrice = lastPrice
    o.changePct = 0
    o.pnl = 0
    return o
  }

  const change = (lastPrice - P0) / P0
  const side = String(o.side || '').toUpperCase()
  const signed = side === 'LONG' ? change : -change

  const stake = Number(o.stake || 0)
  const lev = Number(o.leverage || 1)

  let pnl = stake * lev * signed
  if (!Number.isFinite(pnl)) pnl = 0
  if (pnl < -stake) pnl = -stake   // pnl >= -stake

  o.markPrice = lastPrice
  o.changePct = change * 100
  o.pnl = pnl
  return o
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const scope = (url.searchParams.get('scope') || 'full').toLowerCase()

    const uid = await getUid(req)

    // VIP-флаг из заголовка (если прокинули с другого слоя)
    let isVip = req.headers.get('x-forum-vip') === '1'

    // если заголовка нет — просим тот же /api/subscription/status,
    // который использует Exchange / AI box
    if (uid && !isVip) {
      try {
        const origin = url.origin
        const res = await fetch(`${origin}/api/subscription/status`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ accountId: uid }),
        })
        const j = await res.json().catch(() => null)
        if (j && j.ok && j.isVip) {
          isVip = true
        }
      } catch {
        // если упало – просто считаем, что не VIP, UI от этого не развалится
      }
    }

    // гость: отдаём монеты, но без баланса/ордера
    if (!uid) {
      const symbols = await fetchBattlecoinMarketList(null)
      return NextResponse.json({
        ok: true,
        auth: false,
        isVip: false,
        balance: null,
        order: null,
        orders: [],
        symbols,
      })
    }

    let balance = null
    let order = null
    let orders = []

    // баланс всегда читаем — это дешёвый Redis hget
    balance = await readQcoinBalance(uid)

    // активный ордер тоже всегда читаем
    order = await readActiveOrder(uid)

    // историю только для "full"
    if (scope !== 'light') {
      orders = await readHistory(uid, 100)
    }

    const activeSymbol =
      order && order.symbol ? String(order.symbol) : null

    const symbols = await fetchBattlecoinMarketList(activeSymbol)
    const priceMap = new Map(
      symbols.map((s) => [s.symbol, Number(s.price || 0)])
    )

    if (order && order.status === 'OPEN') {
      order = enrichOrderWithMarket(order, priceMap)
    }

    return NextResponse.json({
      ok: true,
      auth: true,
      isVip: !!isVip,
      balance,
      order,
      orders,
      symbols,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
