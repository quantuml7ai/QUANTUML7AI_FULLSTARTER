// app/api/pay/create/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Пингануть легко из браузера: GET /api/pay/create  -> { ok: true, ping: true }
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = (searchParams.get('accountId') || '').trim()
    const plan = String(searchParams.get('plan') || 'vip_plus')

    // Если accountId не передан — ведём себя как раньше (ping)
    if (!accountId) {
      return NextResponse.json({ ok: true, ping: true })
    }

    // --- конфиг из ENV (то же самое, что и в POST) ---
    const API_BASE = process.env.NOWPAYMENTS_API_BASE || 'https://api.nowpayments.io/v1'
    const API_KEY  = process.env.NOWPAYMENTS_API_KEY
    const PRICE_USD = Number(process.env.PLAN_PRICE_USD || '30')

    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      'http://localhost:3000'

    const successUrl = process.env.NOWPAYMENTS_SUCCESS_URL || `${appUrl}/exchange?status=success`
    const cancelUrl  = process.env.NOWPAYMENTS_CANCEL_URL  || `${appUrl}/exchange?status=cancel`
    const ipnUrl     = process.env.NOWPAYMENTS_CALLBACK    || `${appUrl}/api/pay/webhook`

    if (!API_KEY || !PRICE_USD || Number.isNaN(PRICE_USD)) {
      // Если что-то с конфигом не так — уводим обратно на биржу с ошибкой
      return NextResponse.redirect(`${appUrl}/exchange?status=error`, 302)
    }

    // --- создаём invoice (как в POST) ---
    const tsSec   = Math.floor(Date.now() / 1000)
    const orderId = `vipplus:${accountId}:${tsSec}`

    const payload = {
      price_amount: PRICE_USD,
      price_currency: 'USD',
      order_id: orderId,
      order_description: `Remove quota — VIP+`,
      success_url: successUrl,
      cancel_url: cancelUrl,
      ipn_callback_url: ipnUrl,
    }

    const res = await fetch(`${API_BASE}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('NOWPAYMENTS create (GET) failed', res.status, data)
      // Тоже уводим пользователя назад с флагом ошибки
      return NextResponse.redirect(`${appUrl}/exchange?status=error`, 302)
    }

    const invoiceId =
      data?.id || data?.invoice_id || data?.invoice?.id || null

    const url =
      data?.invoice_url || data?.url || data?.invoice?.url || null

    if (!url) {
      console.error('NOWPAY no invoice_url in GET response', data)
      return NextResponse.redirect(`${appUrl}/exchange?status=error`, 302)
    }

    // --- сохраняем маппинг в Redis (так же, как в POST) ---
    if (invoiceId) {
      await redis.hset(`invoice:${invoiceId}`, {
        accountId,
        orderId,
        tier: plan,
        createdAt: Date.now(),
      })
    }

    // Ключевой момент: редирект на NOWPayments
    return NextResponse.redirect(url, 302)
  } catch (err) {
    console.error('SERVER_ERROR /api/pay/create GET', err)
    // При жёстком фейле — либо JSON, либо редирект назад
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err?.message || String(err),
    }, { status: 500 })
  }
}


const redis = Redis.fromEnv()

export async function POST(req) {
  try {
    // -------- входные данные --------
    let body = {}
    try { body = await req.json() } catch (_) { body = {} }

    const accountId = (body?.accountId || '').trim()
    const plan = String(body?.plan || 'vip_plus')

    if (!accountId) {
      // запрещаем создавать инвойс без подтверждённой авторизации
      return NextResponse.json({ ok: false, error: 'NO_ACCOUNT_ID' }, { status: 400 })
    }

    // -------- конфиг из ENV --------
    const API_BASE = process.env.NOWPAYMENTS_API_BASE || 'https://api.nowpayments.io/v1'
    const API_KEY  = process.env.NOWPAYMENTS_API_KEY
    const PRICE_USD = Number(process.env.PLAN_PRICE_USD || '30')

    const appUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.APP_URL ||
      'http://localhost:3000'

    const successUrl = process.env.NOWPAYMENTS_SUCCESS_URL || `${appUrl}/exchange?status=success`
    const cancelUrl  = process.env.NOWPAYMENTS_CANCEL_URL  || `${appUrl}/exchange?status=cancel`
    // ВАЖНО: по умолчанию шлём на /api/pay/webhook
    const ipnUrl     = process.env.NOWPAYMENTS_CALLBACK    || `${appUrl}/api/pay/webhook`

    if (!API_KEY)  return NextResponse.json({ ok: false, error: 'NO_API_KEY' }, { status: 500 })
    if (!PRICE_USD || Number.isNaN(PRICE_USD))
      return NextResponse.json({ ok: false, error: 'BAD_PRICE' }, { status: 500 })

    // -------- создаём invoice --------
    const tsSec   = Math.floor(Date.now() / 1000)
    const orderId = `vipplus:${accountId}:${tsSec}`

    const payload = {
      price_amount: PRICE_USD,
      price_currency: 'USD',               // валюту оплаты юзер выберет у NOWPayments
      order_id: orderId,
      order_description: `Remove quota — VIP+`,
      success_url: successUrl,
      cancel_url: cancelUrl,
      ipn_callback_url: ipnUrl,
      // is_fee_paid_by_user: true,        // при желании можно переложить комиссию на пользователя
    }

    const res = await fetch(`${API_BASE}/invoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      console.error('NOWPAYMENTS create failed', res.status, data)
      return NextResponse.json({
        ok: false,
        error: 'NOWPAY_ERROR',
        status: res.status,
        message: data?.message || data?.description || 'Create invoice failed',
        data,
      }, { status: 502 })
    }

    const invoiceId =
      data?.id || data?.invoice_id || data?.invoice?.id || null

    const url =
      data?.invoice_url || data?.url || data?.invoice?.url || null

    if (!url) {
      console.error('NOWPAY no invoice_url in response', data)
      return NextResponse.json({ ok: false, error: 'NO_INVOICE_URL', data }, { status: 502 })
    }

    // -------- сохраняем маппинг в Redis --------
    if (invoiceId) {
      await redis.hset(`invoice:${invoiceId}`, {
        accountId,
        orderId,
        tier: plan,
        createdAt: Date.now(),
      })
    }

    return NextResponse.json({
      ok: true,
      url,          // фронт открывает это в новой вкладке
      invoiceId,
      orderId,
    })
  } catch (err) {
    console.error('SERVER_ERROR /api/pay/create', err)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err?.message || String(err),
    }, { status: 500 })
  }
}
