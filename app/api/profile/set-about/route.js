// app/api/profile/set-about/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import { setUserAbout } from '../../forum/_db.js'
import { resolveCanonicalAccountId } from '../_identity.js'
import { Redis } from '@upstash/redis'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    let userId = ''
    try { userId = requireUserId(req, body) } catch {}
    if (!userId) userId = body.accountId || body.asherId || ''
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const accountId = await resolveCanonicalAccountId(userId)
    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const about = await setUserAbout(accountId, body?.about || '')

    try {
      const redis = Redis.fromEnv()
      await redis.publish('forum:events', JSON.stringify({
        type: 'profile.about.updated',
        accountId,
        userId: accountId,
        about,
        ts: Date.now(),
      }))
    } catch {}

    return NextResponse.json({ ok: true, accountId, about })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}