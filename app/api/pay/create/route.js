// app/api/pay/create/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { getAdsPackageConfig } from '@/lib/adsCore'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

 function normalizeAccountId(raw) {
   if (!raw) return null
   let s = String(raw).trim()
   if (!s) return null

   const lower = s.toLowerCase()

   // Поддержка всех префиксов, как в adsCore/subscriptions
   if (lower.startsWith('telegramid:')) {
     s = s.slice('telegramid:'.length)
   } else if (lower.startsWith('tguid:')) {
     s = s.slice('tguid:'.length)
   } else if (lower.startsWith('tg:')) {
     s = s.slice('tg:'.length)
   }

   s = s.trim()
   if (!s) return null

   // Адреса кошельков храним в lowercase 0x...
   if (s.toLowerCase().startsWith('0x')) {
     return s.toLowerCase()
   }

   // Telegram uid оставляем как есть (цифры)
   return s
 }

function envNum(name, fallback) {
  const raw = process.env[name]
  const n = Number(raw)
  if (!raw || !Number.isFinite(n) || n <= 0) return fallback
  return n
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '')
}

// GET — healthcheck, как было в старом варианте
export async function GET() {
  return NextResponse.json({ ok: true, ping: true })
}

// POST — единый create для VIP (старый/новый формат) и Ads
export async function POST(req) {
  try {
    const NOWPAYMENTS_API_KEY = (process.env.NOWPAYMENTS_API_KEY || '').trim()
    const NOWPAYMENTS_API_BASE = (
      process.env.NOWPAYMENTS_API_BASE ||
      'https://api.nowpayments.io/v1'
    ).trim()

    if (!NOWPAYMENTS_API_KEY) {
      return NextResponse.json(
        { ok: false, error: 'NO_NOWPAYMENTS_API_KEY' },
        { status: 500 },
      )
    }

    // -------- входные данные --------
    let body = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const rawAccountId = (body?.accountId || '').trim()
    const accountId = normalizeAccountId(rawAccountId)
    const plan = String(body?.plan || 'vip_plus') // для легаси-VIP

    if (!accountId) {
      return NextResponse.json(
        { ok: false, error: 'NO_ACCOUNT' },
        { status: 400 },
      )
    }

    // purpose: 'vip' | 'ads'
    // Бэкомпат:
    //  - если явно передали purpose — используем его
    //  - если есть adsPackage — считаем, что это ads
    //  - иначе считаем, что это VIP (старый фронт)
    let purpose = String(body?.purpose || '').trim().toLowerCase()
    if (!purpose) {
      if (body.adsPackage) {
        purpose = 'ads'
      } else {
        purpose = 'vip'
      }
    }

    if (purpose !== 'vip' && purpose !== 'ads') {
      return NextResponse.json(
        { ok: false, error: 'UNKNOWN_PURPOSE' },
        { status: 400 },
      )
    }

    const siteUrl = getSiteUrl()
    const currency =
      (process.env.NOWPAYMENTS_CURRENCY || 'USD').trim().toUpperCase()

    let amount
    let description
    let orderId
    let meta = {}
    let successUrl
    let cancelUrl

    // ---------- VIP ----------
    if (purpose === 'vip') {
      // Цена — как в старом роуте
      const PRICE_USD = Number(process.env.PLAN_PRICE_USD || '30')
      if (!PRICE_USD || Number.isNaN(PRICE_USD)) {
        return NextResponse.json(
          { ok: false, error: 'VIP_BAD_PRICE' },
          { status: 500 },
        )
      }

      const PLAN_NAME =
        process.env.PLAN_NAME ||
        process.env.NEXT_PUBLIC_PLAN_NAME ||
        'VIP+'

      // Дни — опционально, НЕ ломаемся, если не заданы
      const PLAN_DAYS =
        envNum('PLAN_DAYS', 0) ||
        envNum('NEXT_PUBLIC_PLAN_DAYS', 0) ||
        envNum('VIP_PLAN_DAYS', 0)

      amount = PRICE_USD
      description = `VIP subscription ${PLAN_NAME} for ${accountId}`

      // Сохраним старый формат orderId: vipplus:<accountId>:<timestampSec>
      const tsSec = Math.floor(Date.now() / 1000)
      orderId = `vipplus:${rawAccountId || accountId}:${tsSec}`

      const appUrl = siteUrl
      // Сначала берём кастомные URL, как в старом коде,
      // затем — новый дефолт /subscribe
      successUrl =
        process.env.NOWPAYMENTS_SUCCESS_URL ||
        `${appUrl}/subscribe?status=success`
      cancelUrl =
        process.env.NOWPAYMENTS_CANCEL_URL ||
        `${appUrl}/subscribe?status=cancel`

      meta = {
        planName: PLAN_NAME,
        days: PLAN_DAYS || undefined, // в вебхуке всё равно есть дефолт
        tier: plan,
      }
    }

    // ---------- ADS ----------
    if (purpose === 'ads') {
      const adsPackage = body.adsPackage
      const planCfg = getAdsPackageConfig(adsPackage)

      if (!adsPackage || !planCfg) {
        return NextResponse.json(
          { ok: false, error: 'UNKNOWN_ADS_PACKAGE' },
          { status: 400 },
        )
      }

      amount = planCfg.price
      description = `Ads package ${planCfg.internalName} for ${accountId}`

      const ts = Date.now()
      // Новый формат: adspkg:<accountId>:<pkgType>:<timestamp>
      const pkgType = planCfg.internalName
      // Используем rawAccountId, чтобы orderId красиво выглядел, но
      // нормализованный используется в invoice.accountId
      orderId = `adspkg:${rawAccountId || accountId}:${pkgType}:${ts}`

      successUrl = `${siteUrl}/ads/home?status=success`
      cancelUrl = `${siteUrl}/ads/home?status=cancel`

      meta = {
        pkgType,
        durationDays: planCfg.durationDays,
        maxCampaigns: planCfg.maxCampaigns,
        maxMediaPerCampaign: planCfg.maxMediaPerCampaign,
      }
    }

    const ipnCallbackUrl =
      process.env.NOWPAYMENTS_CALLBACK ||
      process.env.NOWPAYMENTS_IPN_CALLBACK_URL ||
      `${siteUrl}/api/pay/webhook`

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_AMOUNT' },
        { status: 500 },
      )
    }

    // ---------- Создаём внутренний инвойс ДО запроса к NOWPayments ----------
    const internalId = String(await redis.incr('invoice:seq'))
    const nowIso = new Date().toISOString()

    const invoice = {
      id: internalId, // важно: будет использовано в вебхуке и adsCore.applyPaidInvoice
      internalId,
      type: purpose === 'vip' ? 'vip' : 'ads',
      purpose,
      accountId, // нормализованный
      rawAccountId, // на всякий для отладки
      amount,
      currency,
      orderId,
      status: 'pending',
      meta,
      createdAt: nowIso,
      updatedAt: nowIso,
      paidAt: null,
      externalId: null,
      paymentUrl: null,
      lastStatus: null,
    }

    await redis.set(`invoice:${internalId}`, JSON.stringify(invoice))
    await redis.set(`invoice:byOrder:${orderId}`, internalId)

    // ---------- Создание инвойса на стороне NOWPayments ----------
    const payload = {
      price_amount: amount,
      price_currency: currency,
      order_id: orderId,
      order_description: description,
      success_url: successUrl,
      cancel_url: cancelUrl,
      ipn_callback_url: ipnCallbackUrl,
    }

    const res = await fetch(`${NOWPAYMENTS_API_BASE}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => null)

    if (!res.ok) {
      const txt =
        typeof data === 'string'
          ? data
          : data?.message || data?.description || ''

      invoice.status = 'error'
      invoice.lastStatus = `HTTP_${res.status}`
      invoice.updatedAt = new Date().toISOString()
      await redis.set(`invoice:${internalId}`, JSON.stringify(invoice))

      return NextResponse.json(
        {
          ok: false,
          error: `NOWPAYMENTS_HTTP_${res.status}`,
          message: txt,
          data,
        },
        { status: 502 },
      )
    }

    const externalId =
      data?.invoice_id || data?.id || data?.invoice?.id || null
    const paymentUrl =
      data?.invoice_url ||
      data?.url ||
      data?.invoice?.url ||
      data?.pay_address ||
      null

    if (!paymentUrl) {
      invoice.status = 'error'
      invoice.lastStatus = 'BAD_RESPONSE'
      invoice.updatedAt = new Date().toISOString()
      await redis.set(`invoice:${internalId}`, JSON.stringify(invoice))

      return NextResponse.json(
        { ok: false, error: 'NOWPAYMENTS_BAD_RESPONSE', data },
        { status: 502 },
      )
    }

    if (externalId) {
      invoice.externalId = String(externalId)
      await redis.set(`invoice:byExternal:${invoice.externalId}`, internalId)
    }

    invoice.paymentUrl = String(paymentUrl)
    invoice.updatedAt = new Date().toISOString()

    await redis.set(`invoice:${internalId}`, JSON.stringify(invoice))

    // --------- Легаси-лог под старый VIP-формат (как было) ---------
    if (purpose === 'vip' && externalId) {
      await redis.hset(`invoice:${externalId}`, {
        accountId: rawAccountId || accountId,
        orderId,
        tier: plan,
        lastStatus: 'pending',
        createdAt: Date.now(),
      })
    }

    return NextResponse.json({
      ok: true,
      url: invoice.paymentUrl,
      invoiceId: externalId || internalId,
      orderId,
    })
  } catch (e) {
    console.error('[pay/create] error', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'SERVER_ERROR',
        message: e?.message || String(e),
      },
      { status: 500 },
    )
  }
}
