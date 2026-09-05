import { NextResponse } from 'next/server'
import { getVipStatesManySideEffectFree } from '@/lib/subscriptions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// POST /api/forum/vip/batch
// body: { ids: ["uid1","uid2", ...] }
// resp: { ok:true, count:N, checkedAt, map: { [uid]: { available, active, untilISO, untilMs, daysLeft, checkedAt } }, unavailableIds: [] }
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
      return NextResponse.json({ ok: true, count: 0, checkedAt: Date.now(), map: {}, unavailableIds: [] })
    }

    const MAX = 250
    const list = ids.slice(0, MAX)
    const result = await getVipStatesManySideEffectFree(list)

    return NextResponse.json({
      ok: true,
      count: list.length,
      checkedAt: Number(result?.checkedAt || Date.now()) || Date.now(),
      map: result?.map || {},
      unavailableIds: Array.isArray(result?.unavailableIds) ? result.unavailableIds : [],
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
