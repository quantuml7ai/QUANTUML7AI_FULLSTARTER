import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'
import qcoinPrimary from '../../../../../lib/mongo/qcoin-primary.cjs'
import { notifyQl7QcoinCredited } from '../../../../../lib/ql7-support/events.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()
const NOWPAYMENTS_IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET || ''
const UNDERPAY_TOLERANCE_FIAT = 0.01

function hmacSHA512(message, secret) {
  return crypto.createHmac('sha512', secret).update(message).digest('hex')
}

function num(...values) {
  for (const value of values) {
    const n = Number(value)
    if (Number.isFinite(n)) return n
  }
  return null
}

function isSuccessStatus(rawStatus) {
  const status = String(rawStatus || '').toLowerCase()
  return ['finished', 'confirmed', 'sending', 'completed', 'paid', 'done'].some((item) => status.includes(item))
}

function computeUnderpayFiat(payload, expectedPrice) {
  const priceUsd = num(expectedPrice, payload.price_amount, payload.priceAmount, payload.order_amount)
  const paidUsd = num(payload.actually_paid_fiat, payload.actuallyPaidFiat, payload.pay_amount_fiat)

  if (Number.isFinite(priceUsd) && Number.isFinite(paidUsd)) {
    const diff = priceUsd - paidUsd
    return diff <= 0 ? 0 : diff
  }

  const payCrypto = num(payload.pay_amount, payload.payAmount)
  const paidCrypto = num(payload.actually_paid, payload.actuallyPaid, payload.paid_amount)

  if (
    Number.isFinite(priceUsd) &&
    Number.isFinite(payCrypto) &&
    Number.isFinite(paidCrypto) &&
    payCrypto > 0
  ) {
    const diffCrypto = payCrypto - paidCrypto
    if (diffCrypto <= 0) return 0
    return diffCrypto * (priceUsd / payCrypto)
  }

  return null
}

function isPaymentEffectivelySuccess(payload, rawStatus, expectedPrice) {
  const status = String(rawStatus || '').toLowerCase()
  if (isSuccessStatus(status)) return true
  if (!status.includes('partial')) return false
  const underpayFiat = computeUnderpayFiat(payload, expectedPrice)
  return underpayFiat !== null && underpayFiat <= UNDERPAY_TOLERANCE_FIAT
}

async function loadInvoice(internalId) {
  if (!internalId) return null
  const mongoInvoice = await qcoinPrimary.loadTopupInvoice(internalId).catch(() => null)
  if (mongoInvoice) return mongoInvoice
  return null
}

async function saveInvoice(invoice) {
  return qcoinPrimary.saveTopupInvoice(invoice)
}

export async function POST(req) {
  if (!NOWPAYMENTS_IPN_SECRET) {
    return NextResponse.json({ ok: false, error: 'NO_IPN_SECRET' }, { status: 500 })
  }

  const rawBody = await req.text()

  try {
    const signature = req.headers.get('x-nowpayments-sig') || req.headers.get('X-NOWPAYMENTS-SIG') || ''
    const calculated = hmacSHA512(rawBody, NOWPAYMENTS_IPN_SECRET)
    const okSig = String(signature || '').toLowerCase() === String(calculated || '').toLowerCase()

    await qcoinPrimary.saveTopupRuntime('topup:last', {
      at: new Date().toISOString(),
      okSig,
      sig: signature,
      body: rawBody.slice(0, 4000),
    })

    if (!okSig) {
      return NextResponse.json({ ok: false, error: 'BAD_SIGNATURE' }, { status: 401 })
    }

    let payload = {}
    try {
      payload = rawBody ? JSON.parse(rawBody) : {}
    } catch {
      payload = {}
    }

    const externalInvoiceId = payload.invoice_id || payload.id || null
    const paymentId = payload.payment_id || payload.paymentId || null
    const orderId = payload.order_id || payload.orderId || ''
    const statusRaw = payload.payment_status || payload.status || payload.paymentStatus || ''

    let internalId = await qcoinPrimary.findTopupInternalId({
      externalInvoiceId,
      orderId,
      paymentId,
    }).catch(() => '')
    if (!internalId) {
      return NextResponse.json({
        ok: false,
        error: 'INVOICE_NOT_FOUND',
        externalInvoiceId,
        paymentId,
        orderId,
      }, { status: 400 })
    }

    const invoice = await loadInvoice(internalId)
    if (!invoice || invoice.type !== 'qcoin_topup') {
      return NextResponse.json({ ok: false, error: 'INVOICE_NOT_FOUND_INTERNAL', internalId }, { status: 400 })
    }

    invoice.internalId = invoice.internalId || String(internalId)
    invoice.id = invoice.id || String(internalId)
    invoice.orderId = invoice.orderId || orderId
    invoice.externalId = invoice.externalId || (externalInvoiceId ? String(externalInvoiceId) : null)
    invoice.paymentId = invoice.paymentId || (paymentId ? String(paymentId) : null)
    invoice.lastStatus = String(statusRaw || '').toLowerCase()
    invoice.updatedAt = new Date().toISOString()

    await saveInvoice(invoice)

    if (invoice.status === 'paid' && invoice.activated) {
      return NextResponse.json({
        ok: true,
        type: 'qcoin_topup',
        alreadyPaid: true,
        activated: true,
        accountId: invoice.accountId,
        balance: invoice.newBalance ?? null,
        status: invoice.lastStatus,
      })
    }

    const success = isPaymentEffectivelySuccess(payload, statusRaw, invoice.priceAmount)
    if (!success) {
      invoice.status = invoice.lastStatus || 'failed'
      await saveInvoice(invoice)
      return NextResponse.json({
        ok: true,
        type: 'qcoin_topup',
        activated: false,
        status: invoice.lastStatus,
      })
    }

    const underpayFiat = computeUnderpayFiat(payload, invoice.priceAmount)
    if (underpayFiat === null || underpayFiat > UNDERPAY_TOLERANCE_FIAT) {
      invoice.status = 'underpaid'
      invoice.underpayFiat = underpayFiat
      await saveInvoice(invoice)
      return NextResponse.json({
        ok: true,
        type: 'qcoin_topup',
        activated: false,
        status: 'underpaid',
        underpayFiat,
      })
    }

    const lockKey = `qcoin:topup:lock:${invoice.internalId}`
    const locked = await redis.set(lockKey, '1', { nx: true, ex: 15 })
    if (!locked) {
      return NextResponse.json({ ok: true, type: 'qcoin_topup', activated: false, status: 'busy' })
    }

    try {
      const credit = Number(invoice.qcoinAmount || 0)
      if (!invoice.accountId || !Number.isFinite(credit) || credit <= 0) {
        invoice.status = 'invalid_invoice'
        await saveInvoice(invoice)
        return NextResponse.json({ ok: false, error: 'INVALID_INVOICE' }, { status: 400 })
      }
      const rawInvoiceAccountId = invoice.accountId
      const canonicalInvoiceAccountId = await qcoinPrimary.resolveCanonicalAccountId(rawInvoiceAccountId)
      if (canonicalInvoiceAccountId && canonicalInvoiceAccountId !== invoice.accountId) {
        invoice.rawAccountId = invoice.rawAccountId || rawInvoiceAccountId
        invoice.accountId = canonicalInvoiceAccountId
      }

      const nowIso = new Date().toISOString()
      let newBalance
      try {
        const result = await qcoinPrimary.incrementBalance({
          uid: invoice.accountId,
          amount: credit,
          eventKind: 'qcoin_topup_credit',
          route: '/api/qcoin/topup/webhook',
          sourceEventId: `topup:webhook:${invoice.internalId}:${paymentId || externalInvoiceId || invoice.internalId}`,
          idempotencyKey: `qcoin:topup:paid:${paymentId || externalInvoiceId || invoice.internalId}`,
          meta: {
            invoiceId: invoice.internalId,
            externalId: invoice.externalId,
            paymentId: paymentId || invoice.paymentId || '',
            priceAmount: invoice.priceAmount,
            currency: invoice.currency,
            status: invoice.lastStatus,
          },
        })
        newBalance = Number(result?.balance || 0)
        await qcoinPrimary.claimTopupPayment(
          `qcoin:topup:paid:${paymentId || externalInvoiceId || invoice.internalId}`,
          invoice.internalId,
        ).catch(() => {})
      } catch (error) {
        invoice.status = 'credit_failed'
        invoice.creditError = error?.message || String(error)
        invoice.updatedAt = new Date().toISOString()
        await saveInvoice(invoice).catch(() => {})
        return NextResponse.json({
          ok: false,
          error: 'MONGO_QCOIN_CREDIT_FAILED',
          message: error?.message || String(error),
        }, { status: 503 })
      }
      invoice.status = 'paid'
      invoice.activated = true
      invoice.paidAt = invoice.paidAt || nowIso
      invoice.creditedAt = nowIso
      invoice.underpayFiat = underpayFiat
      invoice.newBalance = Number(newBalance)
      await saveInvoice(invoice)

      const event = {
        type: 'qcoin_topup',
        invoiceId: invoice.internalId,
        externalId: invoice.externalId,
        paymentId: paymentId || invoice.paymentId || '',
        accountId: invoice.accountId,
        qcoinAmount: credit,
        priceAmount: invoice.priceAmount,
        currency: invoice.currency,
        balance: Number(newBalance),
        createdAt: nowIso,
      }
      await qcoinPrimary.saveTopupEvent(event)
      await notifyQl7QcoinCredited({
        userId: invoice.accountId,
        userAliases: [rawInvoiceAccountId, invoice.rawAccountId, invoice.accountId],
        amount: credit,
        balance: Number(newBalance),
        invoiceId: invoice.internalId,
        paymentId: paymentId || invoice.paymentId || '',
        creditedAt: nowIso,
      }).catch((error) => {
        console.warn('[ql7-support:qcoin-credit]', error?.message || error)
      })
      return NextResponse.json({
        ok: true,
        type: 'qcoin_topup',
        activated: true,
        accountId: invoice.accountId,
        balance: Number(newBalance),
        qcoinAmount: credit,
        invoiceId: invoice.externalId || invoice.internalId,
        status: invoice.lastStatus,
      })
    } finally {
      await redis.del(lockKey).catch(() => {})
    }
  } catch (error) {
    console.error('[qcoin/topup/webhook] error', error)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: error?.message || String(error),
    }, { status: 500 })
  }
}
