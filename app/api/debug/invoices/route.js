// app/api/debug/invoices/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const aid = (searchParams.get('aid') || searchParams.get('accountId') || '').trim().toLowerCase()
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || '50')))

    const results = []
    let count = 0

    // scanIterator доступен в @upstash/redis — удобно пройти все ключи invoice:*
    for await (const key of redis.scanIterator({ match: 'invoice:*', count: 200 })) {
      if (count >= limit) break
      const h = await redis.hgetall(key)
      if (!h) continue
      if (aid && String(h.accountId || '').toLowerCase() !== aid) continue
      results.push({ key, ...h })
      count++
    }

    return NextResponse.json({
      ok: true,
      aid: aid || null,
      found: results.length,
      items: results,
      hint: "GET /api/debug/invoices?aid=<accountId>&limit=50",
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
