// app/api/profile/save-nick/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import {
  setUserNick,
  normNick,
  setUserAbout,
  getUserAbout,
  setUserAvatar,
} from '../../forum/_db.js'
import { resolveCanonicalAccountId } from '../_identity.js'
import { Redis } from '@upstash/redis'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    // 1) пытаемся через твой общий helper
    let userId = ''
    try { userId = requireUserId(req, body) } catch {}
    // 2) fallback: берём из тела, если helper не смог
    if (!userId) userId = body.accountId || body.asherId || ''
    if (!userId) {
      return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })
    }
const accountId = await resolveCanonicalAccountId(userId)
if (!accountId) {
  return NextResponse.json({ ok:false, error:'unauthorized' }, { status:401 })
}

const nick = normNick(body?.nick || '')
if (!nick) {
  return NextResponse.json({ ok:false, error:'empty_nick' }, { status:400 })
}

// аватар может приходить под разными именами
const iconRaw = body?.icon || body?.avatar || ''
const aboutRaw = body?.about
// WHY: store profile on canonical accountId so all identities resolve to one source of truth.
const saved = await setUserNick(accountId, nick) // бросит 'nick_taken' если занято
const savedIcon = await setUserAvatar(accountId, iconRaw)
const savedAbout = aboutRaw !== undefined
  ? await setUserAbout(accountId, aboutRaw)
  : await getUserAbout(accountId)
// WHY: profile updates must propagate to all devices immediately.
try {
  const redis = Redis.fromEnv()
  await redis.publish('forum:events', JSON.stringify({
    type: 'profile.updated',
    accountId,
    userId: accountId,
    nickname: saved,
    nick: saved,
    icon: savedIcon,
    avatar: savedIcon,
        about: savedAbout,
    ts: Date.now(),
  }))
} catch {}

return NextResponse.json({ ok:true, nick: saved, icon: savedIcon, about: savedAbout, accountId })

  } catch (e) {
    const msg = String(e?.message || e)
    const code = msg === 'nick_taken' ? 409 : 500
    return NextResponse.json({ ok:false, error:msg }, { status: code })
  }
}
