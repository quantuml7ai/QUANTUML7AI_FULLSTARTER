// app/api/telegram/link/confirm/route.js
import { redis } from '@/lib/redis';
 // путь поправь при необходимости

export async function POST(req) {
  try {
    const { token, telegramId } = await req.json().catch(() => ({}))
    if (!token || !telegramId) {
      return new Response(JSON.stringify({ ok:false, error:'NO_TOKEN_OR_TGID' }), { status:400 })
    }

    const key = `tg:link:${token}`
    const accountId = await redis.get(key)
    if (!accountId) {
      return new Response(JSON.stringify({ ok:false, error:'TOKEN_EXPIRED_OR_UNKNOWN' }), { status:400 })
    }

    // Связка в Redis: acc:<accountId> -> tg_id, и обратный индекс tg:uid:<tgId> -> accountId
    await Promise.all([
      redis.hset(`acc:${accountId}`, { tg_id: String(telegramId) }),
      redis.set(`tg:uid:${telegramId}`, String(accountId), { ex: 60 * 60 * 24 * 365 }),
      redis.del(key),
    ])

    return new Response(JSON.stringify({ ok:true, accountId }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error:String(e?.message || e) }), { status:500 })
  }
}
