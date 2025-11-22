// app/api/pay/webhook/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { Redis } from '@upstash/redis'
import { addVipDays } from '@/lib/subscriptions'
import {
  handleNowPaymentsWebhook, // для ЛЕГАСИ adspkg:<internalId>
  grantAdsPackageForAccount, // для новых Ads через invoice:*
} from '@/lib/adsCore'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

/* ========== HMAC ========== */

function hmacSHA512(message, secret) {
  return crypto.createHmac('sha512', secret).update(message).digest('hex')
}

/* ========== Разбор VIP orderId ========== */
/** vipplus:<accountId>:<timestamp>  -> <accountId> */
function extractVipAccountId(orderId) {
  try {
    const raw = String(orderId || '').trim()
    if (!raw.toLowerCase().startsWith('vipplus:')) return null

    const withoutPrefix = raw.slice('vipplus:'.length)
    const lastColon = withoutPrefix.lastIndexOf(':')
    if (lastColon === -1) {
      return withoutPrefix.trim().toLowerCase() || null
    }
    const accountPart = withoutPrefix.slice(0, lastColon)
    return accountPart.trim().toLowerCase() || null
  } catch {
    return null
  }
}

/* ========== Разбор Ads orderId ========== */
/**
 * adspkg:<internalId>                         -> { type: 'ads_legacy', legacyInternalId }
 * adspkg:<accountId>:<pkgType>:<ts>          -> { type: 'ads', accountId, pkgType, ts }
 */
function parseAdsOrder(orderId) {
  const raw = String(orderId || '')
  if (!raw.toLowerCase().startsWith('adspkg:')) return null

  const rest = raw.slice('adspkg:'.length)

  // Старый формат: adspkg:<internalId>
  if (!rest.includes(':')) {
    return { type: 'ads_legacy', legacyInternalId: rest }
  }

  // Новый формат: adspkg:<accountId>:<pkgType>:<timestamp>
  const lastColon = rest.lastIndexOf(':')
  if (lastColon === -1) {
    return { type: 'ads_legacy', legacyInternalId: rest }
  }

  const beforeTs = rest.slice(0, lastColon) // <accountId>:<pkgType>
  const tsPart = rest.slice(lastColon + 1)

  if (!beforeTs.includes(':')) {
    return { type: 'ads_legacy', legacyInternalId: rest }
  }

  const prevColon = beforeTs.lastIndexOf(':')
  const accountIdRaw = beforeTs.slice(0, prevColon)
  const pkgTypeRaw = beforeTs.slice(prevColon + 1)

  return {
    type: 'ads',
    accountId: accountIdRaw.trim().toLowerCase(),
    pkgType: pkgTypeRaw.trim().toUpperCase(),
    ts: tsPart,
  }
}

/* ========== Успешные статусы NOWPayments ========== */

function isSuccessStatus(rawStatus) {
  const s = String(rawStatus || '').toLowerCase()
  const successList = [
    'finished',
    'confirmed',
    'sending',
    'partially_paid',
    'completed',
    'paid',
    'done',
  ]
  return successList.some((x) => s.includes(x))
}

/* ========== Основной обработчик ========== */

export async function POST(req) {
  const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || ''
  if (!NOWPAYMENTS_IPN_SECRET) {
    return NextResponse.json(
      { ok: false, error: 'NO_IPN_SECRET' },
      { status: 500 },
    )
  }

  // ВАЖНО: сырой текст для HMAC
  const rawBody = await req.text()

  try {
    const sigHeader =
      req.headers.get('x-nowpayments-sig') ||
      req.headers.get('X-NOWPAYMENTS-SIG') ||
      ''

    const calc = hmacSHA512(rawBody, NOWPAYMENTS_IPN_SECRET)
    const okSig =
      String(sigHeader || '').toLowerCase() === String(calc || '').toLowerCase()

    const logBase = {
      at: new Date().toISOString(),
      okSig,
      sig: sigHeader,
      calc,
    }

    // лог последнего вызова
    await redis.set(
      'np:last',
      JSON.stringify({
        ...logBase,
        body: rawBody.slice(0, 4000),
      }),
      { ex: 60 * 60 * 24 },
    )

    if (!okSig) {
      return NextResponse.json(
        { ok: false, error: 'BAD_SIGNATURE' },
        { status: 401 },
      )
    }

    let payload = {}
    try {
      payload = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      payload = {}
    }

    const statusRaw =
      payload.payment_status ||
      payload.status ||
      payload.paymentStatus ||
      ''
    const externalInvoiceId = payload.invoice_id || payload.id || null
    const paymentId = payload.payment_id || payload.paymentId || null
    const orderId = payload.order_id || payload.orderId || ''

    // запишем ещё раз (с разобранными полями)
    await redis.set(
      'np:last',
      JSON.stringify({
        ...logBase,
        body: rawBody.slice(0, 4000),
        orderId,
        externalInvoiceId,
        paymentId,
        statusRaw,
      }),
      { ex: 60 * 60 * 24 },
    )

    // ---------- Определяем тип платежа по order_id ----------
    const vipAccountId = extractVipAccountId(orderId)
    const adsInfo = parseAdsOrder(orderId)

    let type = null
    if (vipAccountId) {
      type = 'vip'
    } else if (adsInfo) {
      type = adsInfo.type // 'ads' или 'ads_legacy'
    }

    if (!type) {
      return NextResponse.json(
        { ok: false, error: 'UNKNOWN_ORDER_TYPE', orderId },
        { status: 400 },
      )
    }

    // ---------- ЛЕГАСИ Ads поток (старый adspkg:<internalId>) ----------
    if (type === 'ads_legacy') {
      const res = await handleNowPaymentsWebhook(payload)
      return NextResponse.json({ ...res, legacy: true })
    }

    const success = isSuccessStatus(statusRaw)

    // ---------- Попытка найти новый invoice:* по externalId / orderId / paymentId ----------
    let internalId = null

    if (externalInvoiceId) {
      internalId =
        (await redis.get(`invoice:byExternal:${externalInvoiceId}`)) || null
    }
    if (!internalId && orderId) {
      internalId = (await redis.get(`invoice:byOrder:${orderId}`)) || null
    }
    if (!internalId && paymentId) {
      internalId = (await redis.get(`invoice:byPayment:${paymentId}`)) || null
    }

    // ---------- ЛЕГАСИ VIP: если нет invoice:*, но это VIP ----------
    if (!internalId && type === 'vip') {
      if (!vipAccountId) {
        return NextResponse.json(
          { ok: false, error: 'NO_ACCOUNT_IN_ORDER', orderId },
          { status: 400 },
        )
      }

      const status = String(statusRaw || '').toLowerCase()
      const finished = isSuccessStatus(status)

      const legacyKey = `invoice:${externalInvoiceId || paymentId || orderId}`

      if (finished) {
        const days = Number(process.env.PLAN_DAYS || '30') || 30
        await addVipDays(vipAccountId, days, {
          paymentId: paymentId || externalInvoiceId || '',
        })

        await redis.hset(legacyKey, {
          accountId: vipAccountId,
          orderId,
          paymentId: paymentId || '',
          lastStatus: status,
          activatedAt: new Date().toISOString(),
        })

        return NextResponse.json({
          ok: true,
          legacy: true,
          type: 'vip',
          activated: true,
          accountId: vipAccountId,
          status,
        })
      } else {
        await redis.hset(legacyKey, {
          accountId: vipAccountId,
          orderId,
          paymentId: paymentId || '',
          lastStatus: status,
          updatedAt: new Date().toISOString(),
        })

        return NextResponse.json({
          ok: true,
          legacy: true,
          type: 'vip',
          activated: false,
          status,
        })
      }
    }

    // Если до сюда дошли и internalId всё ещё не найден — это ошибка для нового потока
    if (!internalId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'INVOICE_NOT_FOUND',
          externalInvoiceId,
          paymentId,
          orderId,
        },
        { status: 400 },
      )
    }

    const invoiceKey = `invoice:${internalId}`
    const stored = await redis.get(invoiceKey)
    if (!stored) {
      return NextResponse.json(
        { ok: false, error: 'INVOICE_NOT_FOUND_INTERNAL', internalId },
        { status: 400 },
      )
    }

    let invoice
    try {
      invoice = typeof stored === 'string' ? JSON.parse(stored) : stored
    } catch {
      invoice = stored
    }

    // на всякий случай синхронизируем поля
    invoice.id = invoice.id || internalId
    invoice.internalId = internalId
    invoice.orderId = invoice.orderId || orderId
    invoice.accountId =
      invoice.accountId ||
      (type === 'vip'
        ? vipAccountId
        : adsInfo?.accountId
          ? adsInfo.accountId
          : null)

    // Запомним маппинг paymentId -> internalId
    if (paymentId) {
      await redis.set(`invoice:byPayment:${paymentId}`, internalId)
    }

    const status = String(statusRaw || '').toLowerCase()
    invoice.lastStatus = status
    invoice.updatedAt = new Date().toISOString()

    // Если уже paid + activated — считаем запрос идемпотентным
    if (invoice.status === 'paid' && invoice.activated) {
      if (type === 'vip') {
        return NextResponse.json({
          ok: true,
          type: 'vip',
          alreadyPaid: true,
          activated: true,
          accountId: invoice.accountId,
          status: invoice.lastStatus,
        })
      }

      if (type === 'ads') {
        return NextResponse.json({
          ok: true,
          type: 'ads',
          alreadyPaid: true,
          activated: true,
          accountId: invoice.accountId,
          pkgType: invoice.meta?.pkgType || adsInfo?.pkgType || null,
          status: invoice.lastStatus,
        })
      }
    }

    // ---------- Неуспешный статус — просто фиксируем ----------
    if (!success) {
      invoice.status = invoice.lastStatus || 'failed'
      await redis.set(invoiceKey, JSON.stringify(invoice))

      return NextResponse.json({
        ok: true,
        activated: false,
        status: invoice.lastStatus,
        type,
      })
    }

    // ---------- Успешный платёж ----------
    invoice.status = 'paid'
    invoice.paidAt = new Date().toISOString()

    /* ===== VIP ===== */
    if (type === 'vip') {
      const daysFromInvoice =
        (invoice.meta && Number(invoice.meta.days)) || 0
      const envDays =
        Number(process.env.PLAN_DAYS || 0) ||
        Number(process.env.NEXT_PUBLIC_PLAN_DAYS || 0)
      const days = daysFromInvoice || envDays || 30

      if (!invoice.accountId && vipAccountId) {
        invoice.accountId = vipAccountId
      }

      // Добавляем дни только один раз
      if (!invoice.activated && invoice.accountId && days > 0) {
        await addVipDays(invoice.accountId, days, {
          paymentId: paymentId || externalInvoiceId || '',
        })
        invoice.activated = true
      }

      // Легаси-лог (как было раньше)
      if (externalInvoiceId || paymentId) {
        await redis.hset(
          `invoice:${externalInvoiceId || paymentId}`,
          {
            accountId: invoice.accountId || '',
            orderId: invoice.orderId || orderId,
            paymentId: paymentId || '',
            lastStatus: invoice.lastStatus,
            activatedAt: new Date().toISOString(),
          },
        )
      }

      await redis.set(invoiceKey, JSON.stringify(invoice))

      return NextResponse.json({
        ok: true,
        type: 'vip',
        activated: !!invoice.activated,
        accountId: invoice.accountId,
        status: invoice.lastStatus,
      })
    }

    /* ===== ADS (новый поток) ===== */
    if (type === 'ads') {
      if (!invoice.meta) invoice.meta = {}

      // гарантируем pkgType в invoice.meta
      if (!invoice.meta.pkgType && adsInfo?.pkgType) {
        invoice.meta.pkgType = adsInfo.pkgType
      }
      const pkgType = invoice.meta.pkgType

      let pkg = null

      if (!invoice.activated && invoice.accountId && pkgType) {
        pkg = await grantAdsPackageForAccount({
          accountId: invoice.accountId,
          pkgType,
          note: `invoice:${invoice.id}`,
        })

        if (pkg) {
          invoice.activated = true
          // опционально можно сохранить id пакета в meta
          invoice.meta.packageId = pkg.id
        }
      }

      await redis.set(invoiceKey, JSON.stringify(invoice))

      return NextResponse.json({
        ok: true,
        type: 'ads',
        activated: !!invoice.activated,
        accountId: invoice.accountId,
        pkgType: pkgType || null,
        packageId: invoice.meta?.packageId || null,
        status: invoice.lastStatus,
      })
    }

    // Теоретически сюда не попадём, но на всякий:
    await redis.set(invoiceKey, JSON.stringify(invoice))
    return NextResponse.json({
      ok: true,
      type,
      activated: !!invoice.activated,
      status: invoice.lastStatus,
    })
  } catch (e) {
    console.error('[pay/webhook] error', e)
    return NextResponse.json(
      { ok: false, error: 'SERVER_ERROR', message: e?.message || String(e) },
      { status: 500 },
    )
  }
}
