// app/api/battlecoin/state/route.js
import { NextResponse } from 'next/server'
import { redis, safeParse } from '../../forum/_db.js'


const qcoinKey   = (uid) => `qcoin:${uid}`
const orderKey   = (uid) => `battlecoin:order:${uid}`
const historyKey = (uid) => `battlecoin:history:${uid}`
// ---------------- VIP cache (robust) ----------------
const vipKey = (uid) => `battlecoin:vip:${uid}`
const vipLockKey = (uid) => `battlecoin:viplock:${uid}`
const VIP_TTL_SEC = 60
const VIP_LOCK_TTL_SEC = 5

async function redisSetTTL(key, value, ttlSec) {
  // поддержка разных клиентов: upstash / ioredis / node-redis
  try {
    // upstash: set(key, val, { ex })
    return await redis.set(key, value, { ex: ttlSec })
  } catch {}
  try {
    // ioredis: set(key, val, 'EX', ttl)
    return await redis.set(key, value, 'EX', ttlSec)
  } catch {}
  try {
    // node-redis / ioredis: setex(key, ttl, val)    
    if (typeof redis.setex === 'function') {
      return await redis.setex(key, ttlSec, value)
    }
  } catch {}
  // если ничего не вышло — молча
}

async function readVipCached(uid) {
  if (!uid) return null
  try {
    const v = await redis.get(vipKey(uid))
    if (v === '1') return true
    if (v === '0') return false
    return null
  } catch {
    return null
  }
}

async function writeVipCached(uid, isVip) {
  if (!uid) return
  await redisSetTTL(vipKey(uid), isVip ? '1' : '0', VIP_TTL_SEC)
}

async function tryAcquireVipLock(uid) {
  if (!uid) return false
  try {
    // upstash: set(key, val, { nx: true, ex })
    return !!(await redis.set(vipLockKey(uid), '1', { nx: true, ex: VIP_LOCK_TTL_SEC }))
  } catch {}
  try {
    // ioredis: set(key, val, 'NX', 'EX', ttl)
    const r = await redis.set(vipLockKey(uid), '1', 'NX', 'EX', VIP_LOCK_TTL_SEC)
    return r === 'OK'
  } catch {
    return false
  }
}

async function resolveVipOncePerMinute(url, uid, headerVip) {
  // 1) если слой выше прокинул — доверяем
  if (headerVip) return true
  if (!uid) return false

  // 2) кэш
  const cached = await readVipCached(uid)
  if (cached !== null) return cached

  // 3) защита от stampede: только один запрос в status, остальные ждут кэш
  const locked = await tryAcquireVipLock(uid)
  if (!locked) {
    // кто-то другой уже обновляет — вернём false/или прошлое, но не идём в сеть
    return false
  }

  // 4) сеть (1 раз), потом кэшируем
  let isVip = false
  try {
    const origin = url.origin
    const res = await fetch(`${origin}/api/subscription/status`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: uid }),
      cache: 'no-store',
    })
    const j = await res.json().catch(() => null)
    isVip = !!(j && j.ok && j.isVip)
  } catch {
    isVip = false
  }
  await writeVipCached(uid, isVip)
  return isVip
}
async function saveActiveOrder(uid, order) {
  if (!order) {
    try {
      await redis.del(orderKey(uid))
    } catch {}
    return
  }
  await redis.set(orderKey(uid), JSON.stringify(order))
}

async function pushHistory(uid, order) {
  if (!order) return
  try {
    await redis.lpush(historyKey(uid), JSON.stringify(order))
    await redis.ltrim(historyKey(uid), 0, 99)
  } catch {}
}

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
// авто-settle на стороне state, с той же логикой, что в POST /battlecoin/order (op="settle")
async function applyAutoSettlement(uid, enrichedOrder) {
  const P0 = Number(enrichedOrder.entryPrice || 0)
  const P1 = Number(enrichedOrder.markPrice || 0)
  const stakeNum = Number(enrichedOrder.stake || 0)
  const lev = Number(enrichedOrder.leverage || 1)
  const side = String(enrichedOrder.side || '').toUpperCase()

  if (
    !Number.isFinite(P0) ||
    !Number.isFinite(P1) ||
    P0 <= 0 ||
    stakeNum <= 0 ||
    !Number.isFinite(lev) ||
    lev <= 0
  ) {
    // если что-то поехало — просто вернём текущий баланс и ордер как есть
    return {
      balance: await readQcoinBalance(uid),
      order: enrichedOrder,
    }
  }

  const change = (P1 - P0) / P0
  const signed = side === 'LONG' ? change : -change

  let pnl = stakeNum * lev * signed
  if (!Number.isFinite(pnl)) pnl = 0
  if (pnl < -stakeNum) pnl = -stakeNum

  const returned = stakeNum + pnl
  const returnedClamped = returned < 0 ? 0 : returned

  // та же схема, что в POST /order: на open мы списали stake,
  // здесь возвращаем stake + pnl (не меньше 0)
  const newBalance = await redis.hincrbyfloat(
    qcoinKey(uid),
    'balance',
    returnedClamped
  )

  const now = Date.now()
  const closed = {
    ...enrichedOrder,
    status: 'SETTLED',
    closedAt: now,
    closePrice: P1,
    changePct: change * 100,
    pnl,
  }

  await saveActiveOrder(uid, closed)
  await pushHistory(uid, closed)

  return {
    balance: Number(newBalance || 0),
    order: closed,
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const scope = (url.searchParams.get('scope') || 'full').toLowerCase()

    const uid = await getUid(req)

    // VIP-флаг из заголовка (если прокинули с другого слоя)
    const headerVip = req.headers.get('x-forum-vip') === '1'
    let isVip = false

    // ВАЖНО: scope=light не должен каждый раз вызывать status.
    // Мы всё равно можем обновлять VIP, но только через resolveVipOncePerMinute (кэш 60с).
    if (uid) {
      isVip = await resolveVipOncePerMinute(url, uid, headerVip)
    } else {
      isVip = false
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
      const enriched = enrichOrderWithMarket(order, priceMap)

      const now = Date.now()

      // 1) автозакрытие по времени (если фронт не дёрнул /order/settle)
      const expired =
        typeof enriched.expiresAt === 'number' &&
        enriched.expiresAt <= now

      // 2) автоликвидация, если pnl просел до -stake (полный слив)
      const stakeNum = Number(enriched.stake || 0)
      const pnlNum = Number(enriched.pnl || 0)
      const fullyLiquidated =
        Number.isFinite(stakeNum) &&
        stakeNum > 0 &&
        Number.isFinite(pnlNum) &&
        pnlNum <= -stakeNum + 1e-8

      if (expired || fullyLiquidated) {
        // делаем тот же settle, что и через POST /battlecoin/order
        const result = await applyAutoSettlement(uid, enriched)
        balance = result.balance
        order = result.order
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
