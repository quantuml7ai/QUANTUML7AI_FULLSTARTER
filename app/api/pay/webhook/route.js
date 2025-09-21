// app/api/pay/webhook/route.js
import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { setVip, addVipDays } from '../../../../lib/subscriptions'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/* -------------------- ENV & helpers -------------------- */
const redis = Redis.fromEnv()

function getSecret() {
  return (
    process.env.NOWPAY_IPN_SECRET ||            // допустим алиас
    process.env.NOWPAYMENTS_IPN_SECRET ||       // основной
    ''
  )
}
function getSig(req) {
  return (
    req.headers.get('x-nowpayments-sig') ||
    req.headers.get('x-nowpayments-signature') ||
    ''
  )
}
function verify(raw, sig) {
  const secret = getSecret()
  if (!secret || !sig) return false
  // NOWPayments: HMAC-SHA512 от raw body
  const h = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  return h.toLowerCase() === String(sig).toLowerCase()
}

// vipplus:<accountId>:<ts>
function parseAccountFromOrder(orderId = '') {
  try {
    const s = String(orderId)
    if (s.startsWith('vipplus:')) {
      const parts = s.split(':')
      return parts[1] || null
    }
  } catch {}
  return null
}

/* -------------------- Webhook -------------------- */
export async function POST(req) {
  try {
    // берём сырое тело для HMAC
    const raw = await req.text()
    const sig = getSig(req)

    if (!verify(raw, sig)) {
      return NextResponse.json({ ok: false, error: 'BAD_SIGNATURE' }, { status: 401 })
    }

    const j = JSON.parse(raw || '{}')

    // Учитываем статусы NOWPayments
    // (обычно достаточно finished/confirmed; оставим partially_paid на твоё усмотрение)
    const okStatuses = new Set(['finished', 'confirmed', 'completed'])
    const status = String(j.payment_status || j.status || '').toLowerCase()

    // Сохраним черновик записи по инвойсу (даже если статус не ОК)
    const invoiceId = j.invoice_id || j.invoiceId || j.id || null
    if (invoiceId) {
      await redis.hset(`invoice:${invoiceId}`, {
        lastStatus: status,
        lastUpdate: Date.now(),
        orderId: j.order_id || '',
        paymentId: j.payment_id || '',
        payCurrency: j.pay_currency || '',
        payAmount: j.pay_amount || '',
      })
    }

    if (!okStatuses.has(status)) {
      // игнорим, но отвечаем 200
      return NextResponse.json({ ok: true, ignored: true, status })
    }

    // --- Определяем accountId (кошелёк) ---
    let accountId =
      parseAccountFromOrder(j.order_id) || null

    // если в order_id нет префикса — попробуем вытянуть из Redis по invoice:<id>
    if (!accountId && invoiceId) {
      const inv = await redis.hgetall(`invoice:${invoiceId}`)
      if (inv?.accountId) accountId = inv.accountId
    }

    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'NO_ACCOUNT_ID' }, { status: 400 })
    }

    // --- Продлеваем VIP ---
    const days =
      Number(process.env.PLAN_DAYS || process.env.NOWPAYMENTS_PLAN_DAYS || 30)

    // Идемпотентность по payment_id: addVipDays внутри вызывает setVip(..., { paymentId })
    const paymentId = j.payment_id || j.paymentId || j.id || `inv:${invoiceId || 'unknown'}`
    const res = await addVipDays(accountId, days, { paymentId })

    // Дополним запись об инвойсе (что активировали VIP)
    if (invoiceId) {
      await redis.hset(`invoice:${invoiceId}`, {
        lastStatus: status,
        activatedAt: Date.now(),
        accountId,
        tier: 'vip_plus',
      })
    }

    return NextResponse.json({
      ok: true,
      accountId,
      days,
      status,
      vip: res || null,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
