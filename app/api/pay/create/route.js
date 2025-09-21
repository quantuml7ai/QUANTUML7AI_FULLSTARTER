// app/api/pay/create/route.js

import { NextResponse } from 'next/server';

// чтобы Vercel/Next не кэшировали и не делали ISR
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Быстрый GET-пинг: можно просто открыть /api/pay/create в браузере и увидеть ok:true
export async function GET() {
  return NextResponse.json({ ok: true, ping: true });
}

/**
 * POST /api/pay/create
 * Создаёт invoice в NOWPayments и отдаёт { ok:true, url: <invoice_url> }.
 * Пользователь выберет валюту на стороне NOWPayments.
 */
export async function POST(req) {
  try {
    // Тело не обязательно
    let body = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }

    const plan = body?.plan || 'VIP+';

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    const price = Number(process.env.PLAN_PRICE_USD || '30');

    const appUrl =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
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
      // отдадим ok:false со статусом 200 — фронт покажет алерт
      return NextResponse.json({ ok: false, error: 'NO_API_KEY' });
    }
    if (!price || Number.isNaN(price)) {
      return NextResponse.json({ ok: false, error: 'BAD_PRICE' });
    }

    // ВАЖНО: pay_currency НЕ указываем — выбор монеты будет на странице NOWPayments
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
      console.error('NOWPAY create failed', res.status, data);
      // ok:false, чтобы твой фронтовый обработчик показал ошибку
      return NextResponse.json({
        ok: false,
        error: 'NOWPAY_ERROR',
        status: res.status,
        message: data?.message || data?.description || 'Create invoice failed',
        data,
      });
    }

    // Ожидаемое поле для редиректа на фронте
    const url = data?.invoice_url || data?.invoice?.url || data?.url;
    if (!url) {
      console.error('NOWPAY no invoice_url in response', data);
      return NextResponse.json({
        ok: false,
        error: 'NO_INVOICE_URL',
        data,
      });
    }

    return NextResponse.json({
      ok: true,
      url,                 // <<< фронт редиректит на это поле
      invoiceId: data?.id,
      raw: data,
    });
  } catch (err) {
    console.error('SERVER_ERROR /api/pay/create', err);
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err?.message || String(err),
    });
  }
}
