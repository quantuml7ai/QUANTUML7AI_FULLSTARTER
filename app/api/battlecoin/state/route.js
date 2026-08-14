// app/api/battlecoin/state/route.js
import { NextResponse } from 'next/server'
import { isVipNowReadOnly } from '@/lib/subscriptions'
import battlecoinPrimary from '@/lib/mongo/battlecoin-primary.cjs'

const BINANCE = 'https://api.binance.com'

function getUid(req) {
  const h1 = (req.headers.get('x-forum-user-id') || '').trim()
  if (h1) return h1

  const h2 = (req.headers.get('x-forum-user') || '').trim()
  if (h2) return h2

  const h3 = (req.headers.get('x-auth-account-id') || '').trim()
  if (h3) return h3

  return ''
}

async function readVip(req, uid) {
  if (!uid) return false
  if (req.headers.get('x-forum-vip') === '1') return true
  const state = await isVipNowReadOnly(uid).catch(() => null)
  return !!state?.active
}

async function fetchSymbolsUSDT() {
  try {
    const r = await fetch(`${BINANCE}/api/v3/exchangeInfo`, { cache: 'no-store' })
    const j = await r.json()
    const list = j.symbols
      .filter((s) => s.status === 'TRADING' && s.quoteAsset === 'USDT')
      .map((s) => s.symbol)
    return [...new Set(list)].sort()
  } catch {
    return ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']
  }
}

async function fetchSpotPrice(symbol) {
  const sym = String(symbol || '').toUpperCase().trim()
  if (!sym) return 0
  try {
    const r = await fetch(`${BINANCE}/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`, { cache: 'no-store' })
    const j = await r.json().catch(() => null)
    const price = Number(j?.price || 0)
    return Number.isFinite(price) && price > 0 ? price : 0
  } catch {
    return 0
  }
}

async function fetchBattlecoinMarketList(activeSymbol = null) {
  const symbols = await fetchSymbolsUSDT()

  let tickers = []
  try {
    const r = await fetch(`${BINANCE}/api/v3/ticker/24hr`, { cache: 'no-store' })
    const j = await r.json()
    if (Array.isArray(j)) tickers = j
  } catch {
    tickers = []
  }

  const bySym = new Map()
  for (const t of tickers) {
    if (t && typeof t.symbol === 'string') bySym.set(t.symbol, t)
  }

  const out = symbols.map((sym) => {
    const t = bySym.get(sym) || {}
    const priceRaw = t.lastPrice ?? t.weightedAvgPrice ?? t.askPrice ?? t.bidPrice ?? 0
    const chRaw = t.priceChangePercent ?? 0
    const price = Number(priceRaw || 0)
    const change24h = Number(chRaw || 0)
    return {
      symbol: sym,
      price: Number.isFinite(price) ? price : 0,
      change24h: Number.isFinite(change24h) ? change24h : 0,
    }
  })

  const active = String(activeSymbol || '').toUpperCase().trim()
  if (active) {
    const index = out.findIndex((s) => s.symbol === active)
    const currentPrice = index >= 0 ? Number(out[index]?.price || 0) : 0
    if (!Number.isFinite(currentPrice) || currentPrice <= 0) {
      const spotPrice = await fetchSpotPrice(active)
      if (index >= 0) {
        out[index] = { ...out[index], price: spotPrice || 0 }
      } else {
        out.unshift({ symbol: active, price: spotPrice || 0, change24h: 0 })
      }
    }
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
  if (pnl < -stake) pnl = -stake

  o.markPrice = lastPrice
  o.changePct = change * 100
  o.pnl = pnl
  return o
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const scope = (url.searchParams.get('scope') || 'full').toLowerCase()
    const uid = getUid(req)

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

    const includeHistory = scope !== 'light'
    const isVipPromise = readVip(req, uid)
    const statePromise = battlecoinPrimary.readState(uid, { includeHistory })

    let [{ balance, order, orders }, isVip] = await Promise.all([statePromise, isVipPromise])

    const activeSymbol = order && order.symbol ? String(order.symbol) : null
    const symbols = await fetchBattlecoinMarketList(activeSymbol)
    const priceMap = new Map(symbols.map((s) => [s.symbol, Number(s.price || 0)]))

    if (order && order.status === 'OPEN') {
      const enriched = enrichOrderWithMarket(order, priceMap)
      const now = Date.now()
      const expired = typeof enriched.expiresAt === 'number' && enriched.expiresAt <= now
      const stakeNum = Number(enriched.stake || 0)
      const pnlNum = Number(enriched.pnl || 0)
      const fullyLiquidated = Number.isFinite(stakeNum) && stakeNum > 0 && Number.isFinite(pnlNum) && pnlNum <= -stakeNum + 1e-8

      if (expired || fullyLiquidated) {
        const result = await battlecoinPrimary.settleOrderWithQcoinReturn({
          uid,
          closePrice: enriched.markPrice || enriched.entryPrice,
          now,
          source: expired ? 'state-auto-expired' : 'state-auto-liquidated',
        })
        if (result?.ok) {
          balance = result.balance
          order = null
          if (includeHistory) orders = await battlecoinPrimary.readHistory(uid, 100)
        } else {
          order = enriched
        }
      } else {
        order = enriched
      }
    }

    return NextResponse.json({
      ok: true,
      auth: true,
      isVip: !!isVip,
      balance,
      order,
      orders: includeHistory ? orders : [],
      symbols,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
