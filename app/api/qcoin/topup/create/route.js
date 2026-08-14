import { NextResponse } from 'next/server'
import crypto from 'crypto'
import qcoinPrimary from '../../../../../lib/mongo/qcoin-primary.cjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const MIN_QCOIN_TOPUP = 20
const MAX_QCOIN_TOPUP = Number(process.env.QCOIN_TOPUP_MAX_QCOIN || '1000000000')

function normalizeAccountId(raw) {
  if (!raw) return null
  let value = String(raw).trim()
  if (!value) return null

  const lower = value.toLowerCase()
  if (lower.startsWith('telegramid:')) {
    value = value.slice('telegramid:'.length)
  } else if (lower.startsWith('tguid:')) {
    value = value.slice('tguid:'.length)
  } else if (lower.startsWith('tg:')) {
    value = value.slice('tg:'.length)
  }

  value = value.trim()
  if (!value) return null
  if (value.toLowerCase().startsWith('0x')) return value.toLowerCase()
  return value
}

function isSafeAccountId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_:.@-]{1,120}$/.test(value)
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  ).replace(/\/+$/, '')
}

function parseTopupAmount(raw) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return null
  const normalized = Math.floor(value)
  if (normalized < MIN_QCOIN_TOPUP) return null
  if (Number.isFinite(MAX_QCOIN_TOPUP) && MAX_QCOIN_TOPUP > 0 && normalized > MAX_QCOIN_TOPUP) return null
  return normalized
}

function clientHash(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')?.[0]?.trim() || req.headers.get('x-real-ip') || ''
  const ua = req.headers.get('user-agent') || ''
  return crypto.createHash('sha256').update(`${ip}|${ua}`).digest('hex')
}

export async function GET() {
  return NextResponse.json({ ok: true, module: 'qcoin_topup' })
}

export async function POST(req) {
  try {
    const apiKey = (process.env.NOWPAYMENTS_API_KEY || '').trim()
    const apiBase = (process.env.NOWPAYMENTS_API_BASE || 'https://api.nowpayments.io/v1').trim()
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'NO_NOWPAYMENTS_API_KEY' }, { status: 500 })
    }

    let body = {}
    try {
      body = await req.json()
    } catch {
      body = {}
    }

    const headerAccount =
      req.headers.get('x-forum-user-id') ||
      req.headers.get('x-forum-user') ||
      req.headers.get('x-auth-account-id') ||
      ''
    const requestedAccountId = normalizeAccountId(headerAccount || body?.accountId || body?.userId || body?.asherId)
    const requestedBodyAccount = normalizeAccountId(body?.accountId || body?.userId || body?.asherId)
    const accountId = requestedAccountId
      ? await qcoinPrimary.resolveCanonicalAccountId(requestedAccountId)
      : null
    const bodyAccount = requestedBodyAccount
      ? await qcoinPrimary.resolveCanonicalAccountId(requestedBodyAccount)
      : null

    if (!accountId || !isSafeAccountId(accountId)) {
      return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401 })
    }
    if (bodyAccount && bodyAccount !== accountId) {
      return NextResponse.json({ ok: false, error: 'account_mismatch' }, { status: 403 })
    }

    const qcoinAmount = parseTopupAmount(body?.qcoinAmount ?? body?.amount)
    if (!qcoinAmount) {
      return NextResponse.json({ ok: false, error: 'invalid_amount', minQcoin: MIN_QCOIN_TOPUP }, { status: 400 })
    }

    const siteUrl = getSiteUrl()
    const currency = (process.env.NOWPAYMENTS_CURRENCY || 'USD').trim().toUpperCase()
    const priceAmount = Number(qcoinAmount.toFixed(2))
    let internalId = ''
    try { internalId = String(await qcoinPrimary.nextTopupId()) } catch {}
    if (!internalId || internalId === '0') {
      return NextResponse.json({ ok: false, error: 'MONGO_TOPUP_SEQUENCE_UNAVAILABLE' }, { status: 503 })
    }
    const orderId = `qcoin_topup:${internalId}:${Date.now()}`
    const nowIso = new Date().toISOString()
    const callbackUrl =
      process.env.QCOIN_TOPUP_NOWPAYMENTS_IPN_CALLBACK_URL ||
      `${siteUrl}/api/qcoin/topup/webhook`

    const invoice = {
      id: internalId,
      internalId,
      type: 'qcoin_topup',
      accountId,
      rawAccountId: requestedAccountId,
      rawBodyAccountId: requestedBodyAccount || null,
      qcoinAmount,
      priceAmount,
      currency,
      rate: '1 QCoin = 1 USD',
      orderId,
      status: 'pending',
      activated: false,
      externalId: null,
      paymentId: null,
      paymentUrl: null,
      clientHash: clientHash(req),
      createdAt: nowIso,
      updatedAt: nowIso,
      paidAt: null,
      creditedAt: null,
      lastStatus: null,
    }

    try {
      await qcoinPrimary.saveTopupInvoice(invoice)
    } catch (error) {
      return NextResponse.json({
        ok: false,
        error: 'MONGO_TOPUP_INVOICE_SAVE_FAILED',
        message: error?.message || String(error),
      }, { status: 503 })
    }

    const payload = {
      price_amount: priceAmount,
      price_currency: currency,
      order_id: orderId,
      order_description: `QCoin top-up ${qcoinAmount} for ${accountId}`,
      success_url: process.env.QCOIN_TOPUP_SUCCESS_URL || `${siteUrl}/forum?status=qcoin-topup-success`,
      cancel_url: process.env.QCOIN_TOPUP_CANCEL_URL || `${siteUrl}/forum?status=qcoin-topup-cancel`,
      ipn_callback_url: callbackUrl,
    }

    const res = await fetch(`${apiBase}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      invoice.status = 'error'
      invoice.lastStatus = `HTTP_${res.status}`
      invoice.updatedAt = new Date().toISOString()
      try { await qcoinPrimary.saveTopupInvoice(invoice) } catch {}
      return NextResponse.json({
        ok: false,
        error: `NOWPAYMENTS_HTTP_${res.status}`,
        message: data?.message || data?.description || '',
        data,
      }, { status: 502 })
    }

    const externalId = data?.invoice_id || data?.id || data?.invoice?.id || null
    const paymentUrl = data?.invoice_url || data?.url || data?.invoice?.url || data?.pay_address || null

    if (!paymentUrl) {
      invoice.status = 'error'
      invoice.lastStatus = 'BAD_RESPONSE'
      invoice.updatedAt = new Date().toISOString()
      try { await qcoinPrimary.saveTopupInvoice(invoice) } catch {}
      return NextResponse.json({ ok: false, error: 'NOWPAYMENTS_BAD_RESPONSE', data }, { status: 502 })
    }

    if (externalId) {
      invoice.externalId = String(externalId)
    }
    invoice.paymentUrl = String(paymentUrl)
    invoice.updatedAt = new Date().toISOString()
    try {
      await qcoinPrimary.saveTopupInvoice(invoice)
    } catch (error) {
      return NextResponse.json({
        ok: false,
        error: 'MONGO_TOPUP_INVOICE_UPDATE_FAILED',
        message: error?.message || String(error),
        invoiceId: invoice.externalId || internalId,
      }, { status: 503 })
    }

    return NextResponse.json({
      ok: true,
      url: invoice.paymentUrl,
      invoiceId: invoice.externalId || internalId,
      orderId,
      amountQcoin: qcoinAmount,
      priceAmount,
      currency,
    })
  } catch (error) {
    console.error('[qcoin/topup/create] error', error)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: error?.message || String(error),
    }, { status: 500 })
  }
}
