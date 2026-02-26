// app/api/profile/user-popover/route.js

import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import {
  getFollowersCount,
  getUserAbout,
  getUserPostsTotal,
  getUserTopicsTotal,
  getUserLikesTotal,
} from '../../forum/_db.js'
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

    const legacyId = rawUserId && rawUserId !== accountId ? rawUserId : ''
    const [
      aboutCanonical,
      followersCanonical,
      postsCanonical,
      topicsCanonical,
      likesCanonical,
      aboutLegacy,
      followersLegacy,
      postsLegacy,
      topicsLegacy,
      likesLegacy,
    ] = await Promise.all([
      getUserAbout(accountId),
      getFollowersCount(accountId),
      getUserPostsTotal(accountId),
      getUserTopicsTotal(accountId),
      getUserLikesTotal(accountId),
      legacyId ? getUserAbout(legacyId).catch(() => '') : Promise.resolve(''),
      legacyId ? getFollowersCount(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getUserPostsTotal(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getUserTopicsTotal(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getUserLikesTotal(legacyId).catch(() => 0) : Promise.resolve(0),
    ])

    const about = String(aboutCanonical || aboutLegacy || '')
    const followers = Math.max(Number(followersCanonical || 0), Number(followersLegacy || 0))
    const posts = Number(postsCanonical || 0) + Number(postsLegacy || 0)
    const topics = Number(topicsCanonical || 0) + Number(topicsLegacy || 0)
    const likes = Number(likesCanonical || 0) + Number(likesLegacy || 0)

    return NextResponse.json({
      ok: true,
      accountId,
      about: about || '',
      stats: {
        followers: Number(followers || 0),
        posts: Number(posts || 0),
        topics: Number(topics || 0),
        likes: Number(likes || 0),
      },
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
