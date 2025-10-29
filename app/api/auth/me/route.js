// app/api/auth/me/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

export async function GET(req) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const sid = cookie.split('; ').find(x => x.startsWith('sid='))?.split('=')[1]
    if (!sid) return NextResponse.json({ ok:false, user:null })

    const data = await redis.hgetall(`sess:${sid}`)
    if (!data?.userId) return NextResponse.json({ ok:false, user:null })

    return NextResponse.json({
      ok: true,
      user: { userId: String(data.userId), email: data.email || null, name: data.name || null }
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 })
  }
}
