// app/api/pay/create/route.js
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getEnv(name, fallback) {
  return process.env[name] ?? fallback;
}

// Достаём адрес кошелька из авторизации.
// 1) Если ты уже кладёшь адрес в cookie (например, 'wallet') — заберём его.
// 2) Либо можешь прокидывать в заголовок X-Q-Wallet на клиенте.
// 3) При желании добавь сюда свою проверку сессии (JWT и т.п.)
function getWalletFromAuth() {
  const h = headers();
  const c = cookies();

  const fromHeader = h.get('x-q-wallet');
  const fromCookie = c.get('wallet')?.value;

  const addr = (fromHeader || fromCookie || '').trim();
  return addr || null;
}

export async function POST() {
  // 1) Проверка авторизации (наличие привязанного кошелька)
  const wallet = getWalletFromAuth();
  if (!wallet) {
    return NextResponse.json(
      { ok: false, needAuth: true, message: 'WALLET_REQUIRED' },
      { status: 401 }
    );
  }

  const apiKey = getEnv('NOWPAYMENTS_API_KEY', getEnv('NOWPAY_API_KEY', ''));
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: 'NO_API_KEY' },
      { status: 500 }
    );
  }

  const price = Number(getEnv('PLAN_PRICE_USD', '30')); // $30 по умолчанию
  const appUrl = getEnv('APP_URL', getEnv('NEXT_PUBLIC_SITE_URL', ''));
  const successUrl = getEnv('NOWPAYMENTS_SUCCESS_URL', `${appUrl}/exchange?paid=1`);
  const cancelUrl  = getEnv('NOWPAYMENTS_CANCEL_URL',  `${appUrl}/exchange?cancel=1`);
  const ipnUrl     = getEnv('NOWPAYMENTS_CALLBACK',    `${appUrl}/api/pay/webhook`);

  // 2) Создаём инвойс БЕЗ pay_currency, чтобы на стороне NowPayments
  //    пользователь сам выбрал монету.
  const body = {
    price_amount: price,
    price_currency: 'usd',
    order_id: wallet, // <— здесь передаём привязанный кошелёк как идентификатор
    success_url: successUrl,
    cancel_url: cancelUrl,
    ipn_callback_url: ipnUrl,
    is_fixed_rate: true,
    is_fee_paid_by_user: true,
  };

  const res = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: 'NOWPAY_ERROR', detail: text },
      { status: 500 }
    );
  }

  const data = await res.json();
  // NOWPayments обычно возвращает invoice_url
  const url = data?.invoice_url || data?.payment_url;
  if (!url) {
    return NextResponse.json(
      { ok: false, error: 'NO_INVOICE_URL', data },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, url, id: data?.id ?? data?.invoice_id ?? null });
}
