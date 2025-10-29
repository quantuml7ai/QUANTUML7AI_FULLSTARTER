// app/api/auth/tma/auto/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setSid(res, sid) {
  res.cookies.set('sid', sid, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: true,
    maxAge: 60 * 60 * 24 * 30, // 30d
  })
}

export async function POST(req) {
  try {
    const { tgId } = await req.json().catch(() => ({}))
    const id = String(tgId || '').trim()
    if (!id) return NextResponse.json({ ok:false, error:'NO_TGID' }, { status:400 })

    // если бот уже линковал — берём связанный аккаунт, иначе используем сам tgId
    let accountId = await redis.get(`tg:uid:${id}`)
    if (!accountId) accountId = id

    const sid = 's_' + Math.random().toString(36).slice(2)
    await redis.hset(`sess:${sid}`, { userId: String(accountId), via: 'tma', createdAt: Date.now() })
    await redis.expire(`sess:${sid}`, 60 * 60 * 24 * 30)

    const res = NextResponse.json({ ok:true, user:{ userId: String(accountId) } })
    setSid(res, sid)
    return res
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 })
  }
}
