import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setSessionCookie(res, sessId) {
  res.cookies.set('sid', sessId, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: true,
  })
}

export async function POST(req) {
  try {
    const { code } = await req.json()
    if (!code) return NextResponse.json({ ok:false, error:'NO_CODE' }, { status:400 })

    const key = `tmaauth:${code}`
    const data = await redis.hgetall(key)
    if (!data || !data.sessId) {
      return NextResponse.json({ ok:false, error:'CODE_NOT_FOUND' }, { status:404 })
    }

    // Поднимем сессию в текущем вебвью (ставим ту же cookie sid)
    const res = NextResponse.json({ ok:true, userId: data.userId, return: data.return || '/' })
    setSessionCookie(res, data.sessId)

    // Код одноразовый — удалим
    await redis.del(key)
    return res
  } catch (err) {
    return NextResponse.json({ ok:false, error:'SERVER_ERROR', message: String(err?.message || err) }, { status:500 })
  }
}
