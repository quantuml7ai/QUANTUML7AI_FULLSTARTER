// app/api/pay/create/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { plan, price } = await req.json();
    const amount = Number(price ?? process.env.PLAN_PRICE_USD ?? 30);

    const API_KEY =
      process.env.NOWPAYMENTS_API_KEY || process.env.NOWPAY_API_KEY;
    const APP_URL = process.env.APP_URL;
    const successUrl =
      process.env.NOWPAYMENTS_SUCCESS_URL || `${APP_URL}/exchange?paid=1`;
    const cancelUrl =
      process.env.NOWPAYMENTS_CANCEL_URL || `${APP_URL}/exchange?paid=0`;
    const ipnUrl =
      process.env.NOWPAYMENTS_CALLBACK || `${APP_URL}/api/pay/webhook`;

    const body = {
      price_amount: amount,
      price_currency: 'usd',
      order_id: `vip_${Date.now()}`,
      order_description: 'VIP+ Remove AI Box limit',
      success_url: successUrl,
      cancel_url: cancelUrl,
      ipn_callback_url: ipnUrl,
      // pay_currency: 'usdttrc20', // при необходимости зафиксируем валюту
    };

    const res = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('NOWPAY create failed', res.status, text);
      return NextResponse.json(
        { error: 'NOWPAY_ERROR', status: res.status, detail: text },
        { status: 500 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error('NOWPAY create exception', err?.stack || err?.message || err);
    return NextResponse.json(
      { error: 'NOWPAY_ERROR', detail: err?.message || 'unexpected' },
      { status: 500 }
    );
  }
}
