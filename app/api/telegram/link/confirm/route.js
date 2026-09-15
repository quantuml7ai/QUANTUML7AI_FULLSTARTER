// app/api/telegram/link/confirm/route.js
import { redis } from '@/lib/redis' // поправь путь, если у тебя другой
import profilePrimary from '../../../../../lib/mongo/profile-primary.cjs'

function isIdentityLinkConflict(error) {
  const code = String(error?.code || error?.message || '')
  return code === 'IDENTITY_LINK_CONFLICT'
    || code === 'identity_link_conflict_profiles'
    || code === 'identity_link_conflict_wallet'
    || code === 'identity_link_conflict_telegram'
}

function ignoredLinkResponse() {
  return new Response(
    JSON.stringify({ ok: false, ignored: true, reason: 'ALREADY_LINKED' }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  )
}

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

    // Redis remains only the one-shot TTL nonce. Mongo owns the durable 1:1
    // identity fence. Any already-linked Telegram or Wallet is a terminal
    // silent no-op: consume the nonce, do not write a profile, and never return
    // ok:true to the bot/web-core confirmation path.
    const reservation = await profilePrimary.reserveTelegramWebLink(accountId, telegramId)
    if (!reservation?.ok) {
      await redis.del(key)
      return ignoredLinkResponse()
    }

    let profilePersisted = false
    try {
      await profilePrimary.assertTelegramLinkAvailable(accountId, telegramId)
      await profilePrimary.updateProfile(accountId, { telegramId: String(telegramId) })
      profilePersisted = true
      await profilePrimary.writeCanonicalAliases(accountId, [
        telegramId,
        `tguid:${telegramId}`,
        `tg:${telegramId}`,
        `telegram:${telegramId}`,
      ])
    } catch (error) {
      if (!profilePersisted) {
        await profilePrimary.releaseTelegramWebLinkReservation(accountId, telegramId)
      }
      if (isIdentityLinkConflict(error)) {
        await redis.del(key)
        return ignoredLinkResponse()
      }
      throw error
    }

    await redis.del(key)

    return new Response(
      JSON.stringify({ ok: true, accountId }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    )
  } catch (e) {
    if (isIdentityLinkConflict(e)) return ignoredLinkResponse()
    return new Response(
      JSON.stringify({ ok: false, error: 'LINK_FAILED' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    )
  }
}
