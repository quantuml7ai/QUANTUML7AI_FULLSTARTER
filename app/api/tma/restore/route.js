import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function setSessionCookie(res, sessId) {
  res.cookies.set('sid', sessId, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: true
  })
}

// Проверка initData по докам Telegram (HMAC-SHA256 от данных с ключом SHA256(bot_token))
function verifyInitData(initData, botToken) {
  if (!initData || !botToken) return null
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) return null

  // собираем «проверочные строки»
  const dataCheckStrings = []
  for (const [key, value] of params.entries()) {
    if (key === 'hash') continue
    dataCheckStrings.push(`${key}=${value}`)
  }
  dataCheckStrings.sort()
  const data = dataCheckStrings.join('\n')

  const secret = crypto.createHmac('sha256', 'WebAppData')
                        .update(botToken)
                        .digest()
  const sig = crypto.createHmac('sha256', secret).update(data).digest('hex')

  if (sig !== hash) return null

  // распарсим user
  try {
    const raw = params.get('user')
    const user = raw ? JSON.parse(raw) : null
    return { user }
  } catch {
    return null
  }
}

export async function POST(req) {
  try {
    const { initData } = await req.json()
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const ok = verifyInitData(initData, BOT_TOKEN)
    if (!ok || !ok.user || !ok.user.id) {
      return NextResponse.json({ ok:false, error:'BAD_INITDATA' }, { status: 401 })
    }
    const tgid = ok.user.id

    // читаем последнюю сессию
    const last = await redis.hgetall(`tg:last:${tgid}`)
    if (!last || !last.sessId) {
      return NextResponse.json({ ok:false, error:'NO_LAST_SESSION' }, { status: 404 })
    }

    const res = NextResponse.json({ ok:true, restored:true, userId: last.userId || null })
    setSessionCookie(res, last.sessId)
    return res
  } catch (e) {
    return NextResponse.json({ ok:false, error:'SERVER_ERROR', message: String(e?.message || e) }, { status: 500 })
  }
}
