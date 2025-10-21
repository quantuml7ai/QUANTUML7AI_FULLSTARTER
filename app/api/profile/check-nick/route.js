// app/api/profile/check-nick/route.js
import { NextResponse } from 'next/server'
import { isNickAvailable, normNick } from '../../forum/_db.js'
import { requireUserId } from '../../forum/_utils.js'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// простые правила — синхронизируй с фронтом и normNick
const MIN = 2
const MAX = 24
const RESERVED = new Set(['admin','moderator','mod','support','team','staff','root','system'])

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const raw = (searchParams.get('nick') || '').trim()
    const nick = normNick(raw)

    // БЫСТРАЯ ВАЛИДАЦИЯ
    if (!nick || nick.length < MIN || nick.length > MAX || RESERVED.has(nick)) {
      return json({ ok: true, free: false, nick, reason: 'invalid_nick' })
      // если предпочитаешь 400:
      // return NextResponse.json({ ok:false, error:'invalid_nick', nick }, { status:400 })
    }

    // userId (для «свой ник — всегда free»)
    let uid = ''
    try { uid = requireUserId(req, {}) } catch {}
    if (!uid) uid = searchParams.get('uid') || ''

    const free = await isNickAvailable(nick, uid)
    return json({ ok: true, free, nick })
  } catch (e) {
    return json({ ok: false, error: String(e?.message || e) }, 500)
  }
}

function json(obj, status = 200) {
  return NextResponse.json(obj, {
    status,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
