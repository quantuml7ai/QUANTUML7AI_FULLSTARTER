// app/api/tma/auth/exchange/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setSessionCookie(res, sessId, req) {
  // вычислим домен (чтобы кука жила и на www, и без)
  let domain
  try {
    const { hostname } = new URL(req.url)
    // если поддоменов нет — не ставим domain вообще
    if (hostname.split('.').length > 2) {
      const parts = hostname.split('.')
      domain = `.${parts.slice(-2).join('.')}`
    }
  } catch {}
  res.cookies.set('sid', sessId, {
    httpOnly: true,
    path: '/',
    sameSite: 'None',     // <-- важно для webview
    secure: true,
    ...(domain ? { domain } : {}),
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

    const res = NextResponse.json({ ok:true, userId: data.userId, return: data.return || '/' })
    setSessionCookie(res, data.sessId, req)

    await redis.del(key)
    return res
  } catch (err) {
    return NextResponse.json({ ok:false, error:'SERVER_ERROR', message: String(err?.message || err) }, { status:500 })
  }
}
