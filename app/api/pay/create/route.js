// app/api/pay/create/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

// ---- общая функция создания инвойса ----
async function createInvoiceAndPersist(accountId, plan = 'vip_plus', reqUrlForBase) {
  const cleanAccountId = (accountId || '').trim()
  if (!cleanAccountId) return { error: 'NO_ACCOUNT_ID' }

  // -------- конфиг из ENV --------
  const API_BASE = process.env.NOWPAYMENTS_API_BASE || 'https://api.nowpayments.io/v1'
  const API_KEY  = process.env.NOWPAYMENTS_API_KEY
  const PRICE_USD = Number(process.env.PLAN_PRICE_USD || '30')

  // базовый URL приложения
  let appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'

  // если в env не задан, но есть реальный reqUrl – подхватим origin
  if (!process.env.NEXT_PUBLIC_SITE_URL && reqUrlForBase) {
    try {
      const u = new URL(reqUrlForBase)
      appUrl = `${u.protocol}//${u.host}`
    } catch {}
  }

  const successUrl = process.env.NOWPAYMENTS_SUCCESS_URL || `${appUrl}/exchange?status=success`
  const cancelUrl  = process.env.NOWPAYMENTS_CANCEL_URL  || `${appUrl}/exchange?status=cancel`
  const ipnUrl     = process.env.NOWPAYMENTS_CALLBACK    || `${appUrl}/api/pay/webhook`

  if (!API_KEY)  return { error: 'NO_API_KEY' }
  if (!PRICE_USD || Number.isNaN(PRICE_USD)) return { error: 'BAD_PRICE' }

  // -------- создаём invoice --------
  const tsSec   = Math.floor(Date.now() / 1000)
  const orderId = `vipplus:${cleanAccountId}:${tsSec}`

  const payload = {
    price_amount: PRICE_USD,
    price_currency: 'USD',               // валюту оплаты юзер выберет у NOWPayments
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
    console.error('NOWPAYMENTS create failed', res.status, data)
    return {
      error: 'NOWPAY_ERROR',
      status: res.status,
      data,
      message: data?.message || data?.description || 'Create invoice failed',
    }
  }

  const invoiceId =
    data?.id || data?.invoice_id || data?.invoice?.id || null

  const url =
    data?.invoice_url || data?.url || data?.invoice?.url || null

  if (!url) {
    console.error('NOWPAY no invoice_url in response', data)
    return { error: 'NO_INVOICE_URL', data }
  }

  // -------- сохраняем маппинг в Redis --------
  if (invoiceId) {
    await redis.hset(`invoice:${invoiceId}`, {
      accountId: cleanAccountId,
      orderId,
      tier: plan,
      createdAt: Date.now(),
    })
  }

  return { ok: true, url, invoiceId, orderId }
}

// ------------------- GET -------------------
// Если без accountId → старый ping.
// Если с accountId → создаём инвойс и редиректим на NOWPayments.
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = (searchParams.get('accountId') || '').trim()
    const plan = String(searchParams.get('plan') || 'vip_plus')

    // старое поведение "ping"
    if (!accountId) {
      return NextResponse.json({ ok: true, ping: true })
    }

    const result = await createInvoiceAndPersist(accountId, plan, req.url)

    // если что-то пошло не так — уводим на /exchange с ошибкой
    if (!result.ok) {
      console.error('GET /api/pay/create error', result)
      const appUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.APP_URL ||
        (() => {
          try { const u = new URL(req.url); return `${u.protocol}//${u.host}` } catch { return 'http://localhost:3000' }
        })()

      return NextResponse.redirect(`${appUrl}/exchange?status=error`, 302)
    }

    // Успех → 302 на NOWPayments
    return NextResponse.redirect(result.url, 302)
  } catch (err) {
    console.error('SERVER_ERROR /api/pay/create GET', err)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err?.message || String(err),
    }, { status: 500 })
  }
}

// ------------------- POST -------------------
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

    const result = await createInvoiceAndPersist(accountId, plan, req.url)

    if (!result.ok) {
      console.error('POST /api/pay/create error', result)
      return NextResponse.json(
        {
          ok: false,
          error: result.error || 'NOWPAY_ERROR',
          status: result.status,
          message: result.message || 'Create invoice failed',
          data: result.data,
        },
        { status: result.status && Number.isFinite(result.status) ? result.status : 502 },
      )
    }

    const { url, invoiceId, orderId } = result

    return NextResponse.json({
      ok: true,
      url,          // фронт открывает это в новой вкладке
      invoiceId,
      orderId,
    })
  } catch (err) {
    console.error('SERVER_ERROR /api/pay/create POST', err)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: err?.message || String(err),
    }, { status: 500 })
  }
}
