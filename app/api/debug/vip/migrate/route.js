// app/api/debug/vip/migrate/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = (searchParams.get('id') || '').trim().toLowerCase()
    if (!raw) return NextResponse.json({ ok: false, error: 'PASS ?id=<accountId>' }, { status: 400 })

    const legacyKey = `vip:vipplus:${raw}`
    const mainKey   = `vip:${raw}`

    const v = await redis.get(legacyKey)
    if (!v) {
      const cur = await redis.get(mainKey)
      return NextResponse.json({ ok: true, moved: false, info: cur ? 'already main' : 'no legacy & no main' })
    }

    await redis.set(mainKey, v, { ex: 3600 * 24 * 400 })
    await redis.del(legacyKey)

    const check = await redis.get(mainKey)
    return NextResponse.json({ ok: true, moved: true, value: check })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
