// app/api/telegram/link/confirm/route.js
import { redis } from '@/lib/redis' // поправь путь, если у тебя другой
import profilePrimary from '../../../../../lib/mongo/profile-primary.cjs'

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

    // The token remains Redis/TTL runtime state; durable Telegram identity lives in Mongo.
    await Promise.all([
      profilePrimary.updateProfile(accountId, { telegramId: String(telegramId) }),
      profilePrimary.writeCanonicalAliases(accountId, [
        telegramId,
        `tguid:${telegramId}`,
        `tg:${telegramId}`,
        `telegram:${telegramId}`,
      ]),
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
