// app/api/telegram/link/start/route.js
import { randomBytes } from 'crypto'
// Импорт твоего существующего Redis-клиента (ПУТЬ подправь, если у тебя redis.js в другом месте)
import { redis } from '@/lib/redis';


export async function POST(req) {
  try {
    const { accountId } = await req.json().catch(() => ({}))
    if (!accountId) {
      return new Response(JSON.stringify({ ok:false, error:'NO_ACCOUNT' }), { status:400 })
    }

    const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'l7ai_bot' // ← твой бот
    if (!BOT_USERNAME) {
      return new Response(JSON.stringify({ ok:false, error:'NO_BOT_USERNAME' }), { status:500 })
    }

    // Одноразовый токен на 10 минут
    const token = randomBytes(16).toString('hex')
    await redis.set(`tg:link:${token}`, String(accountId), { ex: 600 })

    const deepLink = `https://t.me/${BOT_USERNAME}?start=ql7link_${token}`
    return new Response(JSON.stringify({ ok:true, deepLink }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message || e) }), { status:500 })
  }
}
