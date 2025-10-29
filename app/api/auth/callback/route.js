import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const redis = Redis.fromEnv()

function b64urlDecode(s) {
  try {
    s = s.replace(/-/g,'+').replace(/_/g,'/')
    const pad = s.length % 4 ? 4 - (s.length % 4) : 0
    const buf = Buffer.from(s + '='.repeat(pad), 'base64')
    return JSON.parse(buf.toString('utf8'))
  } catch { return null }
}

async function exchangeCodeForUser(provider, code, origin) {
  // Здесь меняешь на реальный обмен code→tokens→userinfo.
  // Возвращай минимально: { userId, email, name }
  // Ниже — заглушка.
  return { userId: 'u_' + Math.random().toString(36).slice(2), email: null, name: provider }
}

function setSessionCookie(res, sessId, origin) {
  // Создай реальную сессию (например, подпиши JWT или положи в Redis).
  // Здесь для примера — простая cookie 'sid'.
  res.cookies.set('sid', sessId, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: true,
    // domain можно явно указать, если нужно шарить поддомены
  })
}

export async function GET(req) {
  const url = new URL(req.url)
  const origin = url.origin
  const provider = (url.searchParams.get('provider') || '').toLowerCase()
  const code = url.searchParams.get('code')
  const stateRaw = url.searchParams.get('state')

  if (!provider || !code || !stateRaw) {
    return NextResponse.json({ ok:false, error:'BAD_CALLBACK' }, { status:400 })
  }

  const state = b64urlDecode(stateRaw) || {}
  const ret = state.r || '/'
  const bridge = (state.b || '').toLowerCase()

  // 1) Обменять code на пользователя
  const user = await exchangeCodeForUser(provider, code, origin)
  if (!user?.userId) {
    return NextResponse.json({ ok:false, error:'OAUTH_EXCHANGE_FAILED' }, { status:400 })
  }

  // 2) Создать сессию для обычного браузера (cookie)
  const sessId = 's_' + Math.random().toString(36).slice(2)
  // В реальном коде: свяжи sessId -> user в Redis/DB
  await redis.hset(`sess:${sessId}`, { userId: user.userId, createdAt: Date.now() })
  await redis.expire(`sess:${sessId}`, 60 * 60 * 24 * 14) // 14 дней

  const res = NextResponse.redirect(new URL(ret, origin), { status: 302 })
  setSessionCookie(res, sessId, origin)

  // 3) Если это Telegram Mini App — нужно вернуть не в сайт, а в мини-апп c одноразовым кодом
  if (bridge === 'tma') {
    const codeOnce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    // Сохраним маппинг одноразового кода -> сессия/пользователь + куда вернуться
    await redis.hset(`tmaauth:${codeOnce}`, {
      userId: user.userId,
      sessId,
      return: ret,
      createdAt: Date.now()
    })
    await redis.expire(`tmaauth:${codeOnce}`, 600) // 10 минут

    const bot = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || '@l7ai_bot').replace('@','')
    const tma = `https://t.me/${bot}?startapp=auth_${codeOnce}`

    // редиректим ВО ВНЕШНИЙ Telegram, откуда мини-апп поднимется с этим кодом
    return NextResponse.redirect(tma, { status: 302 })
  }

  // Обычный браузер: просто вернёмся туда, где начинали
  return res
}
