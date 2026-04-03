import { NextResponse } from 'next/server'
import { isVipNow } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// POST /api/forum/vip/batch
// body: { ids: ["uid1","uid2", ...] }
// resp: { ok:true, count:N, map: { [uid]: { active, untilISO, untilMs, daysLeft } } }
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const raw = body?.ids

    const ids = Array.from(
      new Set(
        (Array.isArray(raw) ? raw : [])
          .map(x => String(x || '').trim())
          .filter(Boolean)
      )
    )

    if (ids.length === 0) {
      return NextResponse.json({ ok: true, count: 0, map: {} })
    }

    // защита от злоупотребления
    const MAX = 250
    const list = ids.slice(0, MAX)

    const pairs = await Promise.all(
      list.map(async (id) => {
        try {
          const vip = await isVipNow(id) // { active, untilISO, daysLeft }
          const untilISO = vip?.untilISO || null
          const untilMs = untilISO ? (Date.parse(untilISO) || 0) : 0
          return [id, { active: !!vip?.active, untilISO, untilMs, daysLeft: Number(vip?.daysLeft || 0) }]
        } catch {
          return [id, { active: false, untilISO: null, untilMs: 0, daysLeft: 0 }]
        }
      })
    )

    const map = {}
    for (const [id, v] of pairs) map[id] = v

    return NextResponse.json({ ok: true, count: list.length, map })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
