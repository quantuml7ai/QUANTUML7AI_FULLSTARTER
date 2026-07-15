// app/api/profile/user-popover/route.js
import { createRequire } from 'node:module'
import { NextResponse } from 'next/server'
import { requireUserId } from '../../forum/_utils.js'
import {
  getFollowersCount,
  getSubscriptionCounts,
  getUserAbout,
  getUserLikesTotal,
  getUserPostsTotal,
  getUserProfile,
  getUserTopicsTotal,
} from '../../forum/_db.js'
import { resolveCanonicalAccountId } from '../_identity.js'
import { isVipNowReadOnly } from '../../../../lib/subscriptions.js'

const require = createRequire(import.meta.url)
const { getMongoDb } = require('../../../../lib/mongo/client.cjs')
const qcoinPrimary = require('../../../../lib/mongo/qcoin-primary.cjs')

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

function n(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

async function readProjectionUserStats(accountId) {
  const id = String(accountId || '').trim()
  if (!id) return null
  try {
    const handle = await getMongoDb()
    const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
    if (!db || typeof db.collection !== 'function') return null
    const doc = await db.collection('forum_user_stats').findOne(
      { _id: id },
      { projection: { _id: 1, canonicalAuthorId: 1, stats: 1, updatedAt: 1, storagePrimary: 1 } },
    )
    if (!doc || typeof doc !== 'object') return null
    return {
      posts: n(doc?.stats?.posts, 0),
      topics: n(doc?.stats?.topics, 0),
      likes: n(doc?.stats?.likes, 0),
      repliesReceived: n(doc?.stats?.repliesReceived, 0),
      views: n(doc?.stats?.views, 0),
      source: 'forum_user_stats',
    }
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    let userId = ''
    try { userId = requireUserId(req, {}) } catch {}

    if (!userId) {
      const { searchParams } = new URL(req.url)
      userId = searchParams.get('uid') || ''
    }

    if (!userId) {
      return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401 })
    }

    const rawUserId = String(userId || '').trim()
    const accountId = await resolveCanonicalAccountId(rawUserId)
    if (!accountId) {
      return NextResponse.json({ ok: false, error: 'missing_user_id' }, { status: 401 })
    }

    const legacyId = rawUserId && rawUserId !== accountId ? rawUserId : ''
    const [
      aboutCanonical,
      followersCanonical,
      postsCanonical,
      topicsCanonical,
      likesCanonical,
      countsCanonical,
      profileCanonical,
      vipCanonical,
      projectionStats,
      aboutLegacy,
      followersLegacy,
      postsLegacy,
      topicsLegacy,
      likesLegacy,
      countsLegacy,
      profileLegacy,
      vipLegacy,
      qcoinState,
    ] = await Promise.all([
      getUserAbout(accountId).catch(() => ''),
      getFollowersCount(accountId).catch(() => 0),
      getUserPostsTotal(accountId).catch(() => 0),
      getUserTopicsTotal(accountId).catch(() => 0),
      getUserLikesTotal(accountId).catch(() => 0),
      getSubscriptionCounts(accountId).catch(() => null),
      getUserProfile(accountId).catch(() => null),
      isVipNowReadOnly(accountId).catch(() => ({ active: false })),
      readProjectionUserStats(accountId).catch(() => null),
      legacyId ? getUserAbout(legacyId).catch(() => '') : Promise.resolve(''),
      legacyId ? getFollowersCount(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getUserPostsTotal(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getUserTopicsTotal(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getUserLikesTotal(legacyId).catch(() => 0) : Promise.resolve(0),
      legacyId ? getSubscriptionCounts(legacyId).catch(() => null) : Promise.resolve(null),
      legacyId ? getUserProfile(legacyId).catch(() => null) : Promise.resolve(null),
      legacyId ? isVipNowReadOnly(legacyId).catch(() => ({ active: false })) : Promise.resolve(null),
      qcoinPrimary.readAccount(accountId).catch(() => null),
    ])

    const profile = {
      nickname: String(profileCanonical?.nickname || profileLegacy?.nickname || '').trim(),
      icon: String(profileCanonical?.icon || profileLegacy?.icon || '').trim(),
    }
    const followers = Math.max(
      n(followersCanonical, 0),
      n(followersLegacy, 0),
      n(countsCanonical?.followers, 0),
      n(countsLegacy?.followers, 0),
    )
    const following = Math.max(
      n(countsCanonical?.following, 0),
      n(countsLegacy?.following, 0),
    )
    const posts = Math.max(n(postsCanonical, 0), n(postsLegacy, 0), n(projectionStats?.posts, 0))
    const topics = Math.max(n(topicsCanonical, 0), n(topicsLegacy, 0), n(projectionStats?.topics, 0))
    const likes = Math.max(n(likesCanonical, 0), n(likesLegacy, 0), n(projectionStats?.likes, 0))

    return NextResponse.json({
      ok: true,
      accountId,
      nickname: profile.nickname,
      icon: profile.icon,
      vipActive: !!(vipCanonical?.active || vipLegacy?.active),
      lastActiveAt: Number(qcoinState?.lastActiveAt || 0),
      about: String(aboutCanonical || aboutLegacy || ''),
      stats: {
        followers: n(followers, 0),
        following: n(following, 0),
        posts: n(posts, 0),
        topics: n(topics, 0),
        likes: n(likes, 0),
        views: n(projectionStats?.views, 0),
        repliesReceived: n(projectionStats?.repliesReceived, 0),
      },
      statsSource: projectionStats ? 'mongo_projection_user_stats' : 'mongo_legacy_profile_stats',
      storagePrimary: 'mongo',
    })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 },
    )
  }
}
