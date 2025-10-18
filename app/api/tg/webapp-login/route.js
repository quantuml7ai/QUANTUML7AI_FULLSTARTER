// app/api/tg/webapp-login/route.js
import { NextResponse } from 'next/server'
import { verifyInitData } from '@/lib/tg/verifyInitData'
import { createSessionCookie } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) return NextResponse.json({ ok:false, error:'BOT_TOKEN_MISSING' }, { status:500 })

    let initData = ''
    // 1) берём из заголовка (удобно из TG WebApp), иначе из body.json()
    const hdr = req.headers.get('x-telegram-init-data')
    if (hdr && typeof hdr === 'string' && hdr.trim()) {
      initData = hdr.trim()
    } else {
      const body = await req.json().catch(() => ({}))
      initData = String(body?.initData || '').trim()
    }

    if (!initData) {
      return NextResponse.json({ ok:false, error:'INITDATA_REQUIRED' }, { status:400 })
    }

    // 2) валидация подписи и разбор
    const data = verifyInitData(initData, botToken) // бросит исключение, если невалидно

    // 3) извлекаем TG user
    const user = data.user // объект из TG (id, username, ...), см. verifyInitData
    if (!user || !user.id) {
      return NextResponse.json({ ok:false, error:'USER_MISSING' }, { status:400 })
    }

    // 4) accountId — либо «связка» (если будешь делать), либо простая tg:<id>
    const accountId = `tg:${user.id}`

    // 5) подготавливаем профиль в БД (опционально — по желанию)
    // await ensureAccountExists(accountId, { nickname: user.username, avatar: user.photo_url, ... })

    // 6) сессия через httpOnly cookie
    const res = NextResponse.json({ ok:true, accountId })
    createSessionCookie(res, { accountId })
    return res
  } catch (e) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status:400 })
  }
}
