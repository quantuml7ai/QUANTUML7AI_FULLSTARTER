// app/api/battlecoin/order/route.js
import { NextResponse } from 'next/server'
import { isVipNowReadOnly } from '@/lib/subscriptions'
import battlecoinPrimary from '@/lib/mongo/battlecoin-primary.cjs'

const BINANCE = 'https://api.binance.com'

function getUid(req, body = {}) {
  const h1 = (req.headers.get('x-forum-user-id') || '').trim()
  if (h1) return h1

  const h2 = (req.headers.get('x-forum-user') || '').trim()
  if (h2) return h2

  const h3 = (req.headers.get('x-auth-account-id') || '').trim()
  if (h3) return h3

  if (body?.accountId) return String(body.accountId).trim()
  if (body?.asherId) return String(body.asherId).trim()

  return ''
}

async function readVip(req, uid) {
  if (!uid) return false
  if (req.headers.get('x-forum-vip') === '1') return true
  const state = await isVipNowReadOnly(uid).catch(() => null)
  return !!state?.active
}

function jsonError(error, status) {
  return NextResponse.json({ ok: false, error }, { status })
}

async function fetchSpot(symbol) {
  const sym = String(symbol || 'BTCUSDT').toUpperCase()
  const res = await fetch(
    `${BINANCE}/api/v3/ticker/price?symbol=${encodeURIComponent(sym)}`,
    { cache: 'no-store' }
  )
  const j = await res.json()
  const p = Number(j?.price || 0)
  if (!Number.isFinite(p) || p <= 0) throw new Error('price_unavailable')
  return p
}

export async function POST(req) {
  try {
    let body = {}
    try { body = await req.json() } catch {}

    const op = String(body?.op || '').toLowerCase()
    const uid = getUid(req, body)
    if (!uid) return jsonError('battlecoin_auth_required', 401)

    const isVip = await readVip(req, uid)
    const maxLev = isVip ? 100 : 5

    if (op === 'open') {
      const symbol = String(body?.symbol || '').toUpperCase().trim()
      if (!symbol || !/^[A-Z0-9]{3,20}$/.test(symbol) || !symbol.endsWith('USDT')) {
        return jsonError('battlecoin_err_open_failed', 400)
      }

      const side = String(body?.side || '').toUpperCase()
      if (side !== 'LONG' && side !== 'SHORT') return jsonError('battlecoin_err_open_failed', 400)

      const stake = Number(body?.stake)
      if (!Number.isFinite(stake) || stake <= 0) return jsonError('battlecoin_err_invalid_stake', 400)

      const leverage = Number(body?.leverage || 1)
      if (!Number.isFinite(leverage) || leverage <= 0 || leverage > maxLev) {
        return jsonError('battlecoin_err_invalid_stake', 400)
      }

      let entryPrice
      try { entryPrice = await fetchSpot(symbol) } catch { return jsonError('battlecoin_err_open_failed', 500) }

      const result = await battlecoinPrimary.openOrderWithStakeDebit({
        uid,
        symbol,
        side,
        stake,
        leverage,
        entryPrice,
        now: Date.now(),
      })

      if (!result?.ok) return jsonError(result?.error || 'battlecoin_err_open_failed', result?.status || 400)

      return NextResponse.json({
        ok: true,
        balance: result.balance,
        order: result.order,
      })
    }

    if (op === 'settle') {
      const existing = await battlecoinPrimary.readOpenOrder(uid)
      if (!existing) return jsonError('battlecoin_err_settle_failed', 400)

      const symbol = String(existing.symbol || 'BTCUSDT').toUpperCase()
      let priceNow
      try { priceNow = await fetchSpot(symbol) } catch { return jsonError('battlecoin_err_settle_failed', 500) }

      const result = await battlecoinPrimary.settleOrderWithQcoinReturn({
        uid,
        closePrice: priceNow,
        now: Date.now(),
        source: 'order-route',
      })

      if (!result?.ok) return jsonError(result?.error || 'battlecoin_err_settle_failed', result?.status || 400)

      return NextResponse.json({
        ok: true,
        balance: result.balance,
        order: result.order,
      })
    }

    return jsonError('battlecoin_err_open_failed', 400)
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    )
  }
}
