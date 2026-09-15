import { NextResponse } from 'next/server'
import qcoinPrimary from '../../../../../lib/mongo/qcoin-primary.cjs'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

function str(value) {
  return value === null || value === undefined ? '' : String(value).trim()
}

function safeCancelReason(raw) {
  const value = str(raw || 'user_cancel').toLowerCase().replace(/[^a-z0-9_:-]/g, '_').slice(0, 80)
  return value || 'user_cancel'
}

function looksPaid(invoice = {}) {
  const status = str(invoice.status || invoice.lastStatus).toLowerCase()
  if (invoice.activated || invoice.paidAt || invoice.creditedAt) return true
  return ['paid', 'finished', 'confirmed', 'completed', 'done'].some((item) => status.includes(item))
}

async function readJson(req) {
  try {
    return await req.json()
  } catch {
    return {}
  }
}

async function resolveInvoice(body = {}) {
  const invoiceId = str(body.invoiceId || body.internalId || body.id)
  const orderId = str(body.orderId || body.order_id)
  const paymentId = str(body.paymentId || body.payment_id)

  let invoice = null
  let internalId = ''

  if (invoiceId) {
    invoice = await qcoinPrimary.loadTopupInvoice(invoiceId).catch(() => null)
    if (invoice) internalId = str(invoice.internalId || invoice.id)
  }

  if (!internalId) {
    internalId = await qcoinPrimary.findTopupInternalId({
      externalInvoiceId: invoiceId,
      orderId,
      paymentId,
    }).catch(() => '')
  }

  if (!internalId && orderId) {
    internalId = await qcoinPrimary.findTopupInternalId({ orderId }).catch(() => '')
  }

  if (!invoice && internalId) {
    invoice = await qcoinPrimary.loadTopupInvoice(internalId).catch(() => null)
  }

  return { invoice, internalId: str(internalId || invoice?.internalId || invoice?.id), invoiceId, orderId, paymentId }
}

export async function GET() {
  return NextResponse.json({ ok: true, module: 'qcoin_topup_cancel', version: 'v2' })
}

export async function POST(req) {
  try {
    const body = await readJson(req)
    const headerAccount =
      req.headers.get('x-forum-user-id') ||
      req.headers.get('x-forum-user') ||
      req.headers.get('x-auth-account-id') ||
      ''

    const requestedAccountId = normalizeAccountId(headerAccount || body?.accountId || body?.userId || body?.asherId)
    const bodyAccountId = normalizeAccountId(body?.accountId || body?.userId || body?.asherId)
    const accountId = requestedAccountId
      ? await qcoinPrimary.resolveCanonicalAccountId(requestedAccountId)
      : null
    const bodyAccount = bodyAccountId
      ? await qcoinPrimary.resolveCanonicalAccountId(bodyAccountId)
      : null

    if (!accountId || !isSafeAccountId(accountId)) {
      return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401 })
    }
    if (bodyAccount && bodyAccount !== accountId) {
      return NextResponse.json({ ok: false, error: 'account_mismatch' }, { status: 403 })
    }

    const { invoice, internalId, invoiceId, orderId, paymentId } = await resolveInvoice(body)
    if (!invoice || !internalId) {
      return NextResponse.json({
        ok: false,
        error: 'invoice_not_found',
        invoiceId: invoiceId || null,
        orderId: orderId || null,
        paymentId: paymentId || null,
      }, { status: 404 })
    }

    const invoiceAccount = invoice.accountId
      ? await qcoinPrimary.resolveCanonicalAccountId(invoice.accountId).catch(() => invoice.accountId)
      : ''
    if (!invoiceAccount || invoiceAccount !== accountId) {
      return NextResponse.json({ ok: false, error: 'invoice_account_mismatch' }, { status: 403 })
    }

    if (looksPaid(invoice)) {
      return NextResponse.json({
        ok: true,
        cancelled: false,
        alreadyPaid: true,
        invoiceId: invoice.externalId || invoice.internalId || internalId,
        internalId,
        status: invoice.status || invoice.lastStatus || 'paid',
      })
    }

    const nowIso = new Date().toISOString()
    const nextInvoice = {
      ...invoice,
      id: invoice.id || internalId,
      internalId,
      status: 'client_cancelled',
      clientCancelled: true,
      clientCancelledAt: nowIso,
      clientCancelReason: safeCancelReason(body?.reason),
      cancelledBy: accountId,
      updatedAt: nowIso,
    }

    await qcoinPrimary.saveTopupInvoice(nextInvoice)

    return NextResponse.json({
      ok: true,
      cancelled: true,
      invoiceId: nextInvoice.externalId || nextInvoice.internalId,
      internalId,
      status: nextInvoice.status,
    })
  } catch (error) {
    console.error('[qcoin/topup/cancel] error', error)
    return NextResponse.json({
      ok: false,
      error: 'SERVER_ERROR',
      message: error?.message || String(error),
    }, { status: 500 })
  }
}
