// app/api/profile/check-nick/route.js
import { NextResponse } from 'next/server'
import { isNickAvailable, normNick } from '../../forum/_db.js'
import { requireUserId } from '../../forum/_utils.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const nick = normNick(searchParams.get('nick') || '')
    if (!nick) return NextResponse.json({ ok: false, error: 'empty_nick' }, { status: 400 })

    // пытаемся определить userId (не обязателен, но улучшает точность)
    let uid = ''
    try { uid = requireUserId(req, {}) } catch {}
    if (!uid) uid = searchParams.get('uid') || ''  // резервный путь с клиента

    const free = await isNickAvailable(nick, uid)
    return NextResponse.json({ ok: true, free, nick })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}
