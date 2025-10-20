// app/api/debug/redis/info/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = (searchParams.get('id') || '').trim()
    const id = raw.toLowerCase()

    const url = process.env.UPSTASH_REDIS_REST_URL || ''
    const host = url.replace(/^https?:\/\//,'').split('/')[0]

    let valMain = null, valLegacy = null
    if (id) {
      valMain   = await redis.get(`vip:${id}`)
      valLegacy = await redis.get(`vip:vipplus:${id}`)
    }

    return NextResponse.json({
      ok: true,
      env: { host, hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN },
      queryId: raw || null,
      found: { main: valMain, legacy: valLegacy },
      hint: "GET /api/debug/redis/info?id=<accountId>",
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
