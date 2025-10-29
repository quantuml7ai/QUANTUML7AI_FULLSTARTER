import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

export async function GET(req) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const sid = cookie.split('; ').find(s => s.startsWith('sid='))?.split('=')[1]
    if (!sid) return NextResponse.json({ ok:false }, { status:401 })

    const sess = await redis.hgetall(`sess:${sid}`)
    const userId = sess?.userId
    if (!userId) return NextResponse.json({ ok:false }, { status:401 })

    return NextResponse.json({ ok:true, user:{ userId } }, { status:200 })
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 })
  }
}
