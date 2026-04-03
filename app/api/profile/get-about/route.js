// app/api/profile/get-about/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import { getUserAbout } from '../../forum/_db.js'
import { resolveCanonicalAccountId } from '../_identity.js'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    let userId = ''
    try { userId = requireUserId(req, {}) } catch {}

    if (!userId) {
      const { searchParams } = new URL(req.url)
      userId = searchParams.get('uid') || ''
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: 'missing_user_id' },
        { status: 401 },
      )
    }

    const rawUserId = String(userId || '').trim()
    const accountId = await resolveCanonicalAccountId(rawUserId)
    if (!accountId) {
      return NextResponse.json(
        { ok: false, error: 'missing_user_id' },
        { status: 401 },
      )
    }

    let about = await getUserAbout(accountId)
    if (!String(about || '').trim()) {
      const legacyId = rawUserId && rawUserId !== accountId ? rawUserId : ''
      if (legacyId) {
        try { about = await getUserAbout(legacyId) } catch {}
      }
    }

    return NextResponse.json({
      ok: true,
      accountId,
      about: about || '',
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
