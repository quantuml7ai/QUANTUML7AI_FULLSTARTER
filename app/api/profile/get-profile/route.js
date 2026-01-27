// app/api/profile/get-profile/route.js
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import { getUserProfile } from '../../forum/_db.js'
import { resolveCanonicalAccountId } from '../_identity.js'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(req) {
  try {
    let userId = ''
    // 1) пробуем из заголовка x-forum-user-id (как в мутаторе форума)
    try { userId = requireUserId(req, {}) } catch {}

    // 2) fallback — из query ?uid=...
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

    const accountId = await resolveCanonicalAccountId(userId)
    if (!accountId) {
      return NextResponse.json(
        { ok: false, error: 'missing_user_id' },
        { status: 401 },
      )
    }

    // WHY: always read profile by canonical accountId to avoid split identities.
    const profile = await getUserProfile(accountId)


    return NextResponse.json({
      ok: true,
      userId: accountId,
      accountId,
      nickname: profile.nickname || '',
      icon: profile.icon || '',
            about: profile.about || '',
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
