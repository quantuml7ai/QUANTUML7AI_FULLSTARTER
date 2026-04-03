// app/api/telegram/link/confirm/route.js
import { redis } from '@/lib/redis' // поправь путь, если у тебя другой

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = (body?.token ?? '').toString().trim()
    const telegramId = (body?.telegramId ?? '').toString().trim()

    if (!token || !telegramId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'NO_TOKEN_OR_TGID' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    const key = `tg:link:${token}`
    const accountId = await redis.get(key)

    if (!accountId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'TOKEN_EXPIRED_OR_UNKNOWN' }),
        { status: 400, headers: { 'content-type': 'application/json' } }
      )
    }

    // 1) сохраняем связь в профиль аккаунта
    // 2) создаём обратный индекс tg -> accountId (на год)
    // 3) удаляем одноразовый токен
    await Promise.all([
      redis.hset(`acc:${accountId}`, { tg_id: String(telegramId) }),
      redis.set(`tg:uid:${telegramId}`, String(accountId), { ex: 60 * 60 * 24 * 365 }),
      redis.set(`tguid:${telegramId}`,  String(accountId), { ex: 60*60*24*365 }),
      redis.del(key),
    ])

    return new Response(
      JSON.stringify({ ok: true, accountId }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message || e) }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
