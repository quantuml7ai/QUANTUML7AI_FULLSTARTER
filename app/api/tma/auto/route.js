// app/api/tma/auto/route.js
import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { verifyInitData, extractTelegramUserId } from '@/lib/tma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setCookie(res, name, value, { days = 365 } = {}) {
  const maxAge = days * 24 * 60 * 60
  res.cookies.set(name, value, {
    path: '/',
    httpOnly: false,        // НУЖНО, чтобы фронт прочитал asherId
    sameSite: 'Lax',
    secure: true,
    maxAge,
  })
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const initDataRaw = String(body?.initData || '')
    const ret = String(body?.return || '/forum')

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
    if (!initDataRaw || !BOT_TOKEN) {
      return NextResponse.json({ ok:false, error:'NO_DATA_OR_TOKEN' }, { status:400 })
    }

    const vr = verifyInitData(initDataRaw, BOT_TOKEN)
    if (!vr.ok) {
      return NextResponse.json({ ok:false, error: vr.error || 'BAD_HASH', debug: { got: vr.got, calc: vr.calc } }, { status:401 })
    }

    const tgId = extractTelegramUserId(vr.data)
    if (!tgId) {
      return NextResponse.json({ ok:false, error: 'NO_TG_USER' }, { status:400 })
    }

    // Маппинг tg -> accountId (в твоей схеме accountId = tgId)
    const accountId = String(tgId)

    // Пишем в Redis обе стороны (как ты и показывал в скринах)
    await Promise.all([
      redis.hset(`acc:${accountId}`, { tg_id: accountId }),
      redis.set(`tg:uid:${accountId}`, accountId, { ex: 60 * 60 * 24 * 365 }),
    ])

    const res = NextResponse.json({ ok:true, accountId, return: ret })

    // Для фронта: asherId (LS fallback) и «сессионный» sid, если хочешь
    setCookie(res, 'asherId', accountId, { days: 365 })
    // Можно добавить sid, если используешь серверные сессии:
    // res.cookies.set('sid', 'tma:'+accountId, { path:'/', httpOnly:true, sameSite:'Lax', secure:true, maxAge: 365*24*60*60 })

    return res
  } catch (e) {
    return NextResponse.json({ ok:false, error:'SERVER_ERROR', message:String(e?.message || e) }, { status:500 })
  }
}
