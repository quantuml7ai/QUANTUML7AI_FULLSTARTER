// app/api/debug/vip/migrate/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

async function run(idRaw) {
  const raw = String(idRaw || '').trim().toLowerCase()
  if (!raw) return { ok: false, error: 'PASS id' }

  const legacyKey = `vip:vipplus:${raw}`
  const mainKey   = `vip:${raw}`

  const legacy = await redis.get(legacyKey)
  if (!legacy) {
    const cur = await redis.get(mainKey)
    return { ok: true, moved: false, info: cur ? 'already main' : 'no legacy & no main' }
  }

  await redis.set(mainKey, legacy, { ex: 3600 * 24 * 400 })
  await redis.del(legacyKey)

  const check = await redis.get(mainKey)
  return { ok: true, moved: true, value: check }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || searchParams.get('accountId')
  const res = await run(id)
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}

export async function POST(req) {
  const body = await req.json().catch(()=> ({}))
  const id = body?.id || body?.accountId
  const res = await run(id)
  return NextResponse.json(res, { status: res.ok ? 200 : 400 })
}
