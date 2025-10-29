// app/api/auth/me/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

export async function GET(req) {
  try {
    const sid = req.cookies.get('sid')?.value
    if (!sid) return NextResponse.json({ ok:false, error:'NO_SESSION' }, { status: 401 })
    const sess = await redis.hgetall(`sess:${sid}`)
    if (!sess || !sess.userId) return NextResponse.json({ ok:false, error:'BAD_SESSION' }, { status: 401 })
    // верни минимально — можно обогатить почтой/именем, если ты их кладёшь
    return NextResponse.json({ ok:true, user: { userId: sess.userId } })
  } catch (e) {
    return NextResponse.json({ ok:false, error:'SERVER_ERROR', message: String(e?.message || e) }, { status: 500 })
  }
}
