// app/api/debug/vip/grant/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
const redis = Redis.fromEnv()

function norm(id) {
  return String(id || '').trim().toLowerCase()
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const rawId = searchParams.get('id') || searchParams.get('accountId')
    const days  = Number(searchParams.get('days') || '30')
    const id = norm(rawId)
    if (!id || !Number.isFinite(days) || days <= 0) {
      return NextResponse.json({ ok: false, error: 'PASS ?id=<accountId>&days=30' }, { status: 400 })
    }

    const now   = Date.now()
    const until = new Date(now + days * 24 * 60 * 60 * 1000).toISOString()

    // пишем оба варианта ключей — на случай рассинхрона
    await redis.set(`vip:${id}`, until, { ex: 3600 * 24 * 400 })
    await redis.set(`vip:vipplus:${id}`, until, { ex: 3600 * 24 * 400 })

    return NextResponse.json({ ok: true, id, days, until })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
