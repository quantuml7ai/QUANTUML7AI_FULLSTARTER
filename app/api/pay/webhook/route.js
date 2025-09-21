import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { setVip } from '../../../../lib/subscriptions'

// Берём секрет из любого из двух имён
function getSecret() {
  return (
    process.env.NOWPAY_IPN_SECRET ||
    process.env.NOWPAYMENTS_IPN_SECRET ||
    ''
  )
}

// Берём подпись из любого заголовка, который шлёт NowPayments
function getSignature(req) {
  return (
    req.headers.get('x-nowpayments-sig') ||
    req.headers.get('x-nowpayments-signature') ||
    ''
  )
}

// HMAC-SHA512 по raw body
function verifySig(rawBody, sig) {
  const secret = getSecret()
  if (!secret || !sig) return false
  const h = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
  return h.toLowerCase() === String(sig).toLowerCase()
}

export async function POST(req) {
  try {
    // 1) читаем сырой текст, чтобы верифицировать подпись
    const raw = await req.text()
    const sig = getSignature(req)
    if (!verifySig(raw, sig)) {
      return NextResponse.json({ ok:false, error:'BAD_SIGNATURE' }, { status: 401 })
    }

    // 2) теперь можно парсить JSON
    const j = JSON.parse(raw || '{}')

    // 3) интересующие статусы (можешь скорректировать под свою политику)
    const okStatuses = new Set([
      'finished', 'confirmed', 'completed', 'partially_paid'
    ])
    const status = String(j.payment_status || j.status || '').toLowerCase()
    if (!okStatuses.has(status)) {
      // игнорируем «в процессе»
      return NextResponse.json({ ok:true, ignored:true, status })
    }

    // 4) на ком активировать — это наш order_id из create
    const accountId =
      j.order_id || j.orderId || j.order || j.invoice_id || j.invoiceId
    if (!accountId) {
      return NextResponse.json({ ok:false, error:'NO_ACCOUNT_ID' }, { status: 400 })
    }

    // 5) срок подписки
    const days = Number(process.env.PLAN_DAYS || process.env.NOWPAYMENTS_PLAN_DAYS || 30)
    const until = new Date(Date.now() + days*24*60*60*1000).toISOString()

    // 6) записываем VIP
    setVip(accountId, until)

    return NextResponse.json({ ok:true, accountId, until, status })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status: 500 })
  }
}
