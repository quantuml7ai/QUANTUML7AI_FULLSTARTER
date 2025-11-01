// app/api/telegram/link/start/route.js
import { randomBytes } from 'crypto'
import { redis } from '@/lib/redis'   // путь совпадает с твоим либом

// Если когда-нибудь решишь вынести на Edge — убери randomBytes и используй crypto.getRandomValues
// export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const accountId = (body?.accountId ?? '').toString().trim()
    if (!accountId) {
      return new Response(JSON.stringify({ ok: false, error: 'NO_ACCOUNT' }), { status: 400 })
    }

    const BOT_USERNAME = (process.env.TELEGRAM_BOT_USERNAME || process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'l7ai_bot')
      .toString()
      .replace('@', '')
      .trim()
    if (!BOT_USERNAME) {
      return new Response(JSON.stringify({ ok: false, error: 'NO_BOT_USERNAME' }), { status: 500 })
    }

    // Одноразовый токен на 10 минут
    const token = randomBytes(16).toString('hex')
    // свяжем token -> accountId c TTL
    await redis.set(`tg:link:${token}`, accountId, { ex: 600 })

    const deepLink = `https://t.me/${BOT_USERNAME}?start=ql7link_${token}`

    return new Response(
      JSON.stringify({ ok: true, token, deepLink }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
