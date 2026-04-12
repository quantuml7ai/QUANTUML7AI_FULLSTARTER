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
    let requesterId = ''
    let userId = ''

    try {
      requesterId = requireUserId(req, {})
      userId = requesterId
    } catch {}

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

    const profile = await getUserProfile(accountId)
    const requesterAccountId = requesterId
      ? await resolveCanonicalAccountId(requesterId)
      : ''
    const includePrivateIdentity =
      !!requesterAccountId && String(requesterAccountId).trim() === String(accountId).trim()

    return NextResponse.json({
      ok: true,
      userId: accountId,
      accountId,
      nickname: profile.nickname || '',
      icon: profile.icon || '',
      gender: includePrivateIdentity ? (profile.gender || '') : '',
      birthYear: includePrivateIdentity ? (Number(profile.birthYear || 0) || 0) : 0,
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
