// app/api/pay/create/route.js
import { NextResponse } from 'next/server';

/**
 * POST /api/pay/create
 * Создаёт invoice в NOWPayments.
 * Пользователь выберет криптовалюту уже на стороне NOWPayments.
 */
export async function POST(req) {
  try {
    // Тело запроса может передавать, например, plan (необязательно)
    let body = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }
    const plan = body?.plan || 'VIP+';

    // --- ENV (убедись, что они заданы на Vercel) ---
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    const price = Number(process.env.PLAN_PRICE_USD || '30');

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL || // если у тебя такое есть
      '';

    const successUrl =
      process.env.NOWPAYMENTS_SUCCESS_URL ||
      (appUrl ? `${appUrl}/exchange?paid=1` : '');

    const cancelUrl =
      process.env.NOWPAYMENTS_CANCEL_URL ||
      (appUrl ? `${appUrl}/exchange?cancel=1` : '');

    const ipnUrl =
      process.env.NOWPAYMENTS_CALLBACK ||
      (appUrl ? `${appUrl}/api/pay/webhook` : '');

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'NO_API_KEY' }, { status: 500 });
    }
    if (!price || Number.isNaN(price)) {
      return NextResponse.json({ ok: false, error: 'BAD_PRICE' }, { status: 500 });
    }

    // ВАЖНО: pay_currency НЕ указываем → выбор монеты на странице NOWPayments
    const payload = {
      price_amount: price,
      price_currency: 'usd',
      order_id: `vip-${Date.now()}`,
      order_description: `Remove quota — ${plan}`,
      success_url: successUrl || undefined,
      cancel_url: cancelUrl || undefined,
      ipn_callback_url: ipnUrl || undefined,
    };

    const res = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      // Пробрасываем понятную ошибку в логи и на клиент
      return NextResponse.json(
        { ok: false, error: 'NOWPAY_ERROR', status: res.status, data },
        { status: 500 }
      );
    }

    // data содержит invoice, например: { id, invoice_url, ... }
    return NextResponse.json({ ok: true, invoice: data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
