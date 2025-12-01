// app/api/battlecoin/order/route.js
import { NextResponse } from 'next/server'
import { redis, safeParse } from '../../forum/_db.js'


const qcoinKey   = (uid) => `qcoin:${uid}`
const orderKey   = (uid) => `battlecoin:order:${uid}`
const historyKey = (uid) => `battlecoin:history:${uid}`
const orderIdKey = (uid) => `battlecoin:orderId:${uid}`

async function getUid(req, body = {}) {
  // сначала явные хедеры от фронта
  const h1 = (req.headers.get('x-forum-user-id') || '').trim()
  if (h1) return h1

  const h2 = (req.headers.get('x-forum-user') || '').trim()
  if (h2) return h2

  const h3 = (req.headers.get('x-auth-account-id') || '').trim()
  if (h3) return h3

  // затем то, что прилетело в body от BattleCoin / Exchange
  if (body?.accountId) return String(body.accountId)
  if (body?.asherId)   return String(body.asherId)

  return ''
}


async function readActiveOrder(uid) {
  try {
    const raw = await redis.get(orderKey(uid))
    const o = safeParse(raw)          // защищённый parse, не падаем на "[object Object]"
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

async function saveActiveOrder(uid, order) {
  if (!order) {
    try { await redis.del(orderKey(uid)) } catch {}
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

async function readQcoinBalance(uid) {
  try {
    const v = await redis.hget(qcoinKey(uid), 'balance')
    const n = Number(v || 0)
    return Number.isFinite(n) ? n : 0
  } catch {
    return 0
  }
}

const BINANCE = 'https://api.binance.com'

async function fetchSpot(symbol) {
  const sym = String(symbol || 'BTCUSDT').toUpperCase()
  const res = await fetch(
    `${BINANCE}/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`,
    { cache: 'no-store' }
  )
  const j = await res.json()
  const p = Number(j?.price || 0)
  if (!Number.isFinite(p) || p <= 0) {
    throw new Error('price_unavailable')
  }
  return p
}

export async function POST(req) {
  try {
    let body = {}
    try {
      body = await req.json()
    } catch {}

    const opRaw = String(body?.op || '')
    const op = opRaw.toLowerCase()
    const uid = await getUid(req, body)
    if (!uid) {
      return NextResponse.json(
        { ok: false, error: 'battlecoin_auth_required' },
        { status: 401 }
      )
    }

    // VIP-флаг: сперва из заголовка (если его кто-то проставил),
    // затем — тот же /api/subscription/status, что использует Exchange / AI Box
    let isVip = req.headers.get('x-forum-vip') === '1'
    if (!isVip) {
      try {
        const url = new URL(req.url)
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
        // если упало — просто считаем, что не VIP
      }
    }

    const maxLev = isVip ? 100 : 5

    // ------------------ OPEN ------------------
    if (op === 'open') {
      let { symbol, side, stake, leverage } = body

      symbol = String(symbol || '').toUpperCase().trim()
      if (
        !symbol ||
        !/^[A-Z0-9]{3,20}$/.test(symbol) ||
        !symbol.endsWith('USDT')
      ) {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_open_failed' },
          { status: 400 }
        )
      }

      const s = String(side || '').toUpperCase()
      if (s !== 'LONG' && s !== 'SHORT') {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_open_failed' },
          { status: 400 }
        )
      }

      const stakeNum = Number(stake)
      if (!Number.isFinite(stakeNum) || stakeNum <= 0) {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_invalid_stake' },
          { status: 400 }
        )
      }

      const lev = Number(leverage || 1)
      if (!Number.isFinite(lev) || lev <= 0 || lev > maxLev) {
        // фронт покажет VIP-текст, бэку достаточно вернуть invalid stake
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_invalid_stake' },
          { status: 400 }
        )
      }

      // проверка: нет активного ордера
      const existing = await readActiveOrder(uid)
      if (existing && existing.status === 'OPEN') {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_active_order' },
          { status: 400 }
        )
      }

      const balance = await readQcoinBalance(uid)
      if (stakeNum > balance + 1e-9) {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_insufficient_balance' },
          { status: 400 }
        )
      }

      // entry price
      let entryPrice
      try {
        entryPrice = await fetchSpot(symbol)
      } catch {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_open_failed' },
          { status: 500 }
        )
      }

      const now = Date.now()
      const expiresAt = now + 10 * 60 * 1000
      const id = await redis.incr(orderIdKey(uid))

      const order = {
        orderId: id,
        symbol,
        side: s,
        stake: stakeNum,
        leverage: lev,
        entryPrice,
        status: 'OPEN',
        openedAt: now,
        expiresAt,
        pnl: 0,
        changePct: 0,
      }

      // списываем stake с QCOIN
      const newBalance = await redis.hincrbyfloat(
        qcoinKey(uid),
        'balance',
        -stakeNum
      )

      await saveActiveOrder(uid, order)

      return NextResponse.json({
        ok: true,
        balance: Number(newBalance || 0),
        order,
      })
    }

    // ------------------ SETTLE ------------------
    if (op === 'settle') {
      const existing = await readActiveOrder(uid)
      if (!existing || existing.status !== 'OPEN') {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_settle_failed' },
          { status: 400 }
        )
      }

      const symbol = String(existing.symbol || 'BTCUSDT').toUpperCase()
      let priceNow
      try {
        priceNow = await fetchSpot(symbol)
      } catch {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_settle_failed' },
          { status: 500 }
        )
      }

      const P0 = Number(existing.entryPrice || 0)
      const P1 = Number(priceNow || 0)
      const stakeNum = Number(existing.stake || 0)
      const lev = Number(existing.leverage || 1)

      if (
        !Number.isFinite(P0) ||
        !Number.isFinite(P1) ||
        P0 <= 0 ||
        stakeNum <= 0 ||
        !Number.isFinite(lev) ||
        lev <= 0
      ) {
        return NextResponse.json(
          { ok: false, error: 'battlecoin_err_settle_failed' },
          { status: 400 }
        )
      }

      const side = String(existing.side || '').toUpperCase()
      const change = (P1 - P0) / P0
      const signed = side === 'LONG' ? change : -change

      let pnl = stakeNum * lev * signed
      if (!Number.isFinite(pnl)) pnl = 0
      if (pnl < -stakeNum) pnl = -stakeNum

      const returned = stakeNum + pnl
      const returnedClamped = returned < 0 ? 0 : returned

      // возвращаем stake + pnl на QCOIN баланс
      const newBalance = await redis.hincrbyfloat(
        qcoinKey(uid),
        'balance',
        returnedClamped
      )

      const now = Date.now()
      const order = {
        ...existing,
        status: 'SETTLED',
        closedAt: now,
        closePrice: P1,
        changePct: change * 100,
        pnl,
      }

      await saveActiveOrder(uid, order)
      await pushHistory(uid, order)

      return NextResponse.json({
        ok: true,
        balance: Number(newBalance || 0),
        order,
      })
    }

    // неизвестная операция
    return NextResponse.json(
      { ok: false, error: 'battlecoin_err_open_failed' },
      { status: 400 }
    )
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
