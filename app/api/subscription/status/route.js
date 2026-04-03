// app/api/subscription/status/route.js
import { NextResponse } from 'next/server'
import { isVipNow, getVip } from '@/lib/subscriptions'

// чтобы не кэшировалось
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Быстрый тест из браузера: GET /api/subscription/status?id=<accountId>
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = (searchParams.get('id') || searchParams.get('accountId') || '').trim()
    if (!accountId) return NextResponse.json({ ok: false, error: 'NO_ACCOUNT' }, { status: 400 })

    const vip = await isVipNow(accountId) // { active, untilISO, daysLeft }
    const raw = await getVip(accountId)   // ISO или null

    return NextResponse.json({
      ok: true,
      isVip: !!vip.active,
      untilISO: vip.untilISO,
      daysLeft: vip.daysLeft,
      raw,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const accountId = String(body?.accountId || '').trim()
    if (!accountId) return NextResponse.json({ ok: false, error: 'NO_ACCOUNT' }, { status: 400 })

    const vip = await isVipNow(accountId) // { active, untilISO, daysLeft }
    return NextResponse.json({
      ok: true,
      isVip: !!vip.active,
      untilISO: vip.untilISO,
      daysLeft: vip.daysLeft,
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
