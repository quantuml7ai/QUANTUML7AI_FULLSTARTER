// app/api/pay/webhook/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'
import { addVipDays, setVip } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

function hmac(body, secret) {
  return crypto.createHmac('sha512', secret).update(body).digest('hex')
}

function extractAccountId(orderId) {
  // ожидаем vipplus:<accountId>:<ts>
  try {
    const s = String(orderId || '').trim().toLowerCase()
    if (s.startsWith('vipplus:')) {
      const parts = s.split(':')
      if (parts.length >= 2) return parts[1]
    }
    // на всякий: если прилетел чистый id — вернём его
    return s.includes(':') ? s.split(':')[0] : s
  } catch { return '' }
}

export async function POST(req) {
  const rawBody = await req.text() // важно: сырой текст для HMAC
  try {
    const sig = req.headers.get('x-nowpayments-sig') || ''
    const secret = process.env.NOWPAYMENTS_IPN_SECRET || ''
    const calc = hmac(rawBody, secret)
    const okSig = sig && secret && sig.toLowerCase() === calc.toLowerCase()

    // сохраняем последний вызов для дебага
    await redis.set('np:last', JSON.stringify({
      at: new Date().toISOString(),
      okSig, sig, calc,
      body: rawBody?.slice?.(0, 4000) || null
    }), { ex: 3600 * 24 })

    if (!okSig) {
      return NextResponse.json({ ok: false, error: 'BAD_SIGNATURE' }, { status: 401 })
    }

    const j = JSON.parse(rawBody || '{}')
    const status = (j.payment_status || '').toLowerCase()
    const invoiceId = j.invoice_id || ''
    const paymentId = j.payment_id || ''
    const orderId = j.order_id || ''
    const accountId = extractAccountId(orderId)

    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'NO_ACCOUNT_IN_ORDER' }, { status: 400 })
    }

    // финальные статусы — активируем
    const finished = ['finished', 'confirmed', 'sending', 'partially_paid'].includes(status)

    if (finished) {
      const days = Number(process.env.PLAN_DAYS || '30')
      // продлеваем от максимума (если уже есть активный VIP)
      const res = await addVipDays(accountId, days, { paymentId })
      await redis.hset(`invoice:${invoiceId || paymentId}`, {
        accountId, orderId, paymentId, lastStatus: status,
        activatedAt: new Date().toISOString(),
      })
      return NextResponse.json({ ok: true, activated: true, res })
    } else {
      // просто запишем последнее состояние
      await redis.hset(`invoice:${invoiceId || paymentId}`, {
        accountId, orderId, paymentId, lastStatus: status,
        updatedAt: new Date().toISOString(),
      })
      return NextResponse.json({ ok: true, activated: false, status })
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
