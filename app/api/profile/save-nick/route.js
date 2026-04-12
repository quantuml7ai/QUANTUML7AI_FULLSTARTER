// app/api/profile/save-nick/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import {
  getUserProfile,
  setUserNick,
  normNick,
  setUserAvatar,
  normUserGender,
  normUserBirthYear,
  setUserGender,
  setUserBirthYear,
} from '../../forum/_db.js'
import { resolveCanonicalAccountId, writeCanonicalAliases } from '../_identity.js'
import { Redis } from '@upstash/redis'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const NO_STORE_HEADERS = {
  'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  pragma: 'no-cache',
  expires: '0',
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))

    let userId = ''
    try {
      userId = requireUserId(req, body)
    } catch {}
    if (!userId) userId = body.accountId || body.asherId || ''
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const sourceUserId = String(userId || body?.userId || body?.accountId || body?.asherId || '').trim()
    const sourceAccountId = String(body?.sourceAccountId || body?.accountId || '').trim()
    const sourceAsherId = String(body?.sourceAsherId || body?.asherId || '').trim()
    const sourceForumUserId = String(body?.sourceForumUserId || '').trim()
    const rawUserId = String(body?.rawUserId || '').trim()

    const accountId = await resolveCanonicalAccountId(userId)
    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const nick = normNick(body?.nick || '')
    if (!nick) {
      return NextResponse.json({ ok: false, error: 'empty_nick' }, { status: 400 })
    }

    const hasGenderInput = body?.gender != null && String(body?.gender || '').trim() !== ''
    const nextGender = normUserGender(body?.gender)
    if (hasGenderInput && !nextGender) {
      return NextResponse.json({ ok: false, error: 'invalid_gender' }, { status: 400 })
    }

    const hasBirthYearInput = body?.birthYear != null && String(body?.birthYear || '').trim() !== ''
    const nextBirthYear = normUserBirthYear(body?.birthYear)
    if (hasBirthYearInput && !nextBirthYear) {
      return NextResponse.json({ ok: false, error: 'invalid_birth_year' }, { status: 400 })
    }

    const iconRaw = body?.icon || body?.avatar || ''
    const currentProfile = await getUserProfile(accountId)
    const saved = await setUserNick(accountId, nick)
    const savedIcon = await setUserAvatar(accountId, iconRaw)
    const savedGender = currentProfile?.gender
      ? String(currentProfile.gender)
      : (nextGender ? await setUserGender(accountId, nextGender) : '')
    const savedBirthYear = Number(currentProfile?.birthYear || 0) || (
      nextBirthYear ? await setUserBirthYear(accountId, nextBirthYear) : 0
    )

    try {
      const redis = Redis.fromEnv()
      await writeCanonicalAliases(
        accountId,
        [
          userId,
          body?.userId,
          rawUserId,
          sourceUserId,
          sourceAccountId,
          sourceAsherId,
          sourceForumUserId,
          req?.headers?.get?.('x-forum-user-id') || '',
        ],
        redis,
      )
      await redis.publish(
        'forum:events',
        JSON.stringify({
          type: 'profile.updated',
          accountId,
          userId: sourceUserId || accountId,
          sourceUserId,
          sourceAccountId,
          sourceAsherId,
          sourceForumUserId,
          rawUserId,
          nickname: saved,
          nick: saved,
          icon: savedIcon,
          avatar: savedIcon,
          ts: Date.now(),
        }),
      )
    } catch {}

    return NextResponse.json(
      {
        ok: true,
        nick: saved,
        icon: savedIcon,
        accountId,
        gender: savedGender || '',
        birthYear: Number(savedBirthYear || 0) || 0,
      },
      { headers: NO_STORE_HEADERS },
    )
  } catch (e) {
    const msg = String(e?.message || e)
    const code = msg === 'nick_taken' ? 409 : 500
    return NextResponse.json({ ok: false, error: msg }, { status: code })
  }
}
