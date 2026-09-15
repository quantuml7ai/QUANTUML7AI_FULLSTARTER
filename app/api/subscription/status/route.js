// app/api/subscription/status/route.js
import { NextResponse } from 'next/server'
import { isVipNowReadOnly, getVipReadOnly } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function jsonOk(res) {
  return NextResponse.json(res, { status: 200 })
}

function jsonError(message, status = 500) {
  return NextResponse.json({ ok: false, error: message || 'SERVER_ERROR' }, { status })
}

async function readSubscriptionStatus(accountId, { includeRaw = false } = {}) {
  const vip = await isVipNowReadOnly(accountId)
  const result = {
    ok: true,
    isVip: Boolean(vip.active),
    untilISO: vip.untilISO,
    daysLeft: vip.daysLeft,
    storagePrimary: 'mongo',
  }

  if (includeRaw) {
    result.raw = await getVipReadOnly(accountId)
  }

  return result
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = (searchParams.get('id') || searchParams.get('accountId') || '').trim()
    if (!accountId) return jsonError('NO_ACCOUNT', 400)

    return jsonOk(await readSubscriptionStatus(accountId, { includeRaw: true }))
  } catch (e) {
    return jsonError(String(e), 500)
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const accountId = String(body?.accountId || '').trim()
    if (!accountId) return jsonError('NO_ACCOUNT', 400)

    return jsonOk(await readSubscriptionStatus(accountId, { includeRaw: false }))
  } catch (e) {
    return jsonError(String(e), 500)
  }
}
