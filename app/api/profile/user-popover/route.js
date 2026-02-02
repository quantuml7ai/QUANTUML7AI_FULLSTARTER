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

    const accountId = await resolveCanonicalAccountId(userId)
    if (!accountId) {
      return NextResponse.json(
        { ok: false, error: 'missing_user_id' },
        { status: 401 },
      )
    }

    const [about, followers, posts, topics, likes] = await Promise.all([
      getUserAbout(accountId),
      getFollowersCount(accountId),
      getUserPostsTotal(accountId),
      getUserTopicsTotal(accountId),
      getUserLikesTotal(accountId),
    ])

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
