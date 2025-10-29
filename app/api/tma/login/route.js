import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setSidCookie(res, sid) {
  // Lax достаточно для TMA, но можно поставить 'None' если есть cross-site iframes
  res.cookies.set('sid', sid, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/'
  })
}

export async function POST(req) {
  try {
    const { tgId } = await req.json().catch(() => ({}))
    const tg = String(tgId || '').trim()
    if (!tg) return NextResponse.json({ ok:false, error:'NO_TGID' }, { status:400 })

    // 1) найти привязанный аккаунт
    const accountId = await redis.get(`tg:uid:${tg}`)
    if (!accountId) {
      return NextResponse.json({ ok:false, error:'TG_NOT_LINKED' }, { status:404 })
    }

    // 2) создать сессию
    const sid = 's_' + Math.random().toString(36).slice(2)
    await redis.hset(`sess:${sid}`, { userId: accountId, createdAt: Date.now() })
    await redis.expire(`sess:${sid}`, 60 * 60 * 24 * 30) // 30 дней

    // 3) кука + ответ
    const res = NextResponse.json({ ok:true, user:{ userId: String(accountId) } })
    setSidCookie(res, sid)
    return res
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 })
  }
}
