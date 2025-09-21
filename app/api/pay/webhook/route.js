// app/api/pay/webhook/route.js
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { setVip } from '../../../../lib/subscriptions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSecret() {
  return (
    process.env.NOWPAY_IPN_SECRET ||
    process.env.NOWPAYMENTS_IPN_SECRET ||
    ''
  );
}
function getSig(req) {
  return (
    req.headers.get('x-nowpayments-sig') ||
    req.headers.get('x-nowpayments-signature') ||
    ''
  );
}
function verify(raw, sig) {
  const secret = getSecret();
  if (!secret || !sig) return false;
  const h = crypto.createHmac('sha512', secret).update(raw).digest('hex');
  return h.toLowerCase() === String(sig).toLowerCase();
}

export async function POST(req) {
  try {
    const raw = await req.text();
    const sig = getSig(req);

    if (!verify(raw, sig)) {
      return NextResponse.json({ ok: false, error: 'BAD_SIGNATURE' }, { status: 401 });
    }

    const j = JSON.parse(raw || '{}');

    // Статусы, при которых считаем оплату успешной.
    // Если хочешь строгий вариант — оставь только finished/confirmed/completed.
    const okStatuses = new Set(['finished', 'confirmed', 'completed', 'partially_paid']);
    const status = String(j.payment_status || j.status || '').toLowerCase();
    if (!okStatuses.has(status)) {
      return NextResponse.json({ ok: true, ignored: true, status });
    }

    const wallet =
      j.order_id || j.orderId || j.order || j.invoice_id || j.invoiceId;
    if (!wallet) {
      return NextResponse.json({ ok: false, error: 'NO_WALLET' }, { status: 400 });
    }

    const days =
      Number(process.env.PLAN_DAYS || process.env.NOWPAYMENTS_PLAN_DAYS || 30);
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    // Идемпотентность: не продлеваем повторно один и тот же payment_id
    await setVip(wallet, until, { paymentId: j.payment_id });

    return NextResponse.json({ ok: true, wallet, until, status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
