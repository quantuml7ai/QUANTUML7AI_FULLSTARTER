// app/api/debug/vip/route.js
import { NextResponse } from 'next/server'
import { isVipNow, getVip } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const accountId = (searchParams.get('id') || searchParams.get('accountId') || '').trim()
    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'PASS ?id=<accountId>' }, { status: 400 })
    }

    const logical = await isVipNow(accountId)   // { active, untilISO, daysLeft }
    const raw = await getVip(accountId)         // сырое значение ключа vip:<id> (или null)

    return NextResponse.json({
      ok: true,
      accountId,
      vip: logical,
      raw,
      hint: "GET /api/debug/vip?id=<accountId>",
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
