import { NextResponse } from 'next/server'
import { getUserIdFromReq } from '../../_utils.js'
import { snapshot as readForumSnapshot } from '../../_db.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'
import { isVipNow } from '../../../../../lib/subscriptions.js'
import profilePrimary from '../../../../../lib/mongo/profile-primary.cjs'
import forumPrimary from '../../../../../lib/mongo/forum-primary.cjs'
import { getMongoDb } from '../../../../../lib/mongo/client.cjs'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const DEFAULT_BATCH_SIZE = 15
const DEFAULT_BATCHES_PER_REQUEST = 4
const DEFAULT_CACHE_TTL_SEC = 30
const DEFAULT_ROTATE_SEC = 90
const MAX_BATCH_SIZE = 24
const MAX_BATCHES_PER_REQUEST = 8
const MAX_CANDIDATE_ENTRIES = 1600
const CACHE_LIMIT = 96

const responseCache = new Map()
const normalizeId = (value) => String(value || '').trim()
const normalizeIdList = (values) => Array.from(new Set((Array.isArray(values) ? values : []).map(normalizeId).filter(Boolean)))

function parseCsvParam(searchParams, key) {
  const chunks = searchParams.getAll(key)
  if (!chunks.length) return []
  return normalizeIdList(chunks.flatMap((chunk) => String(chunk || '').split(',').map((value) => value.trim())))
}

function readBoundedNumber(searchParams, key, fallback, max) {
  const raw = Number(searchParams.get(key) || fallback)
  if (!Number.isFinite(raw)) return fallback
  return Math.max(1, Math.min(max, Math.trunc(raw)))
}

function readRawAuthorId(entity) {
  return normalizeId(entity?.canonicalAccountId || entity?.accountId || entity?.authorId || entity?.userId || entity?.ownerId || entity?.uid)
}

function readNickname(entity) {
  return normalizeId(entity?.displayNick || entity?.nickname || entity?.nick || entity?.name)
}

function readAvatar(entity) {
  return normalizeId(entity?.avatar || entity?.icon || entity?.avatarUrl || entity?.photoUrl)
}

function readTs(entity) {
  const ts = Number(entity?.ts || entity?.createdAt || entity?.updatedAt || 0)
  return Number.isFinite(ts) ? ts : 0
}

function hash32(input) {
  let h = 0x811c9dc5
  const value = String(input || '')
  for (let idx = 0; idx < value.length; idx += 1) {
    h ^= value.charCodeAt(idx)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function stableShuffle(list, seedValue) {
  const out = Array.isArray(list) ? list.slice() : []
  let seed = (Number(seedValue) >>> 0) || 1
  for (let idx = out.length - 1; idx > 0; idx -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const swapIdx = seed % (idx + 1)
    const tmp = out[idx]
    out[idx] = out[swapIdx]
    out[swapIdx] = tmp
  }
  return out
}

function buildCandidateBatches(pool, targetBatchSize, requestedBatchCount, rotationKey, seed) {
  const list = Array.isArray(pool) ? pool : []
  const batchSize = Math.max(1, Number(targetBatchSize || 0) || 1)
  const batchCount = Math.max(1, Number(requestedBatchCount || 0) || 1)
  if (!list.length) return []
  const effectiveBatchSize = Math.min(batchSize, list.length)
  const enoughForDisjointBatches = list.length >= (effectiveBatchSize * batchCount)
  const batchStep = enoughForDisjointBatches ? effectiveBatchSize : Math.max(1, Math.floor(list.length / batchCount))
  const batches = []
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex += 1) {
    const users = []
    const seenIds = new Set()
    let cursor = (batchIndex * batchStep) % list.length
    let attempts = 0
    while (users.length < effectiveBatchSize && attempts < (list.length * 2)) {
      const candidate = list[cursor % list.length]
      const candidateId = normalizeId(candidate?.canonicalAccountId || candidate?.userId)
      cursor += 1
      attempts += 1
      if (!candidateId || seenIds.has(candidateId)) continue
      seenIds.add(candidateId)
      users.push(candidate)
    }
    if (users.length) batches.push({ batchId: `${rotationKey}:${seed}:${batchIndex}`, users })
  }
  return batches
}

function pruneCache(now) {
  for (const [key, value] of responseCache.entries()) {
    if (!value || Number(value.exp || 0) <= now) responseCache.delete(key)
  }
  while (responseCache.size > CACHE_LIMIT) {
    const oldestKey = responseCache.keys().next().value
    if (!oldestKey) break
    responseCache.delete(oldestKey)
  }
}


async function readProjectionCandidateEntries(limit = MAX_CANDIDATE_ENTRIES) {
  // QL7_GEO111_RECOMMENDATIONS_PROJECTION_CANDIDATES_V1
  const handle = await getMongoDb()
  const db = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!db || typeof db.collection !== 'function') return []
  const max = Math.max(1, Math.min(MAX_CANDIDATE_ENTRIES, Math.trunc(Number(limit || MAX_CANDIDATE_ENTRIES))))
  const rows = await db.collection('forum_user_stats')
    .find({ canonicalAuthorId: { $type: 'string', $ne: '' } })
    .sort({ updatedAt: -1, canonicalAuthorId: 1 })
    .limit(max)
    .toArray()
  return rows.map((row) => ({
    kind: 'stats',
    rawUserId: normalizeId(row?.canonicalAuthorId || row?.authorId || row?.userId),
    nickname: '',
    avatar: '',
    ts: Number(row?.updatedAt || row?.lastPostAt || row?.lastTopicAt || 0),
    postsCount: Number(row?.stats?.posts || 0),
    topicsCount: Number(row?.stats?.topics || 0),
  })).filter((entry) => entry.rawUserId && (entry.postsCount + entry.topicsCount) > 0)
}

function readSnapshotCandidateEntries(snapshotDoc, limit = MAX_CANDIDATE_ENTRIES) {
  const max = Math.max(1, Math.min(MAX_CANDIDATE_ENTRIES, Math.trunc(Number(limit || MAX_CANDIDATE_ENTRIES))))
  const posts = Array.isArray(snapshotDoc?.posts) ? snapshotDoc.posts : []
  const topics = Array.isArray(snapshotDoc?.topics) ? snapshotDoc.topics : []
  const entries = []
  posts.forEach((post) => {
    const rawUserId = readRawAuthorId(post)
    if (!rawUserId) return
    entries.push({
      kind: 'post',
      rawUserId,
      nickname: readNickname(post),
      avatar: readAvatar(post),
      ts: readTs(post),
      postsCount: 1,
      topicsCount: 0,
    })
  })
  topics.forEach((topic) => {
    const rawUserId = readRawAuthorId(topic)
    if (!rawUserId) return
    entries.push({
      kind: 'topic',
      rawUserId,
      nickname: readNickname(topic),
      avatar: readAvatar(topic),
      ts: readTs(topic),
      postsCount: 0,
      topicsCount: 1,
    })
  })
  return entries
    .filter((entry) => entry.rawUserId && (entry.postsCount + entry.topicsCount) > 0)
    .slice(0, max)
}

async function readBannedUserIds(snapshotDoc) {
  const ids = normalizeIdList(snapshotDoc?.banned)
  if (forumPrimary && typeof forumPrimary.listBannedUsers === 'function') {
    const primaryIds = await forumPrimary.listBannedUsers().catch(() => [])
    ids.push(...normalizeIdList(primaryIds))
  }
  return normalizeIdList(ids)
}

async function readProfileMap(accountIds) {
  const ids = normalizeIdList(accountIds)
  const out = {}
  await Promise.all(ids.map(async (accountId) => {
    const profile = await profilePrimary.getUserProfile(accountId)
    out[accountId] = { nickname: normalizeId(profile?.nickname), avatar: normalizeId(profile?.icon) }
  }))
  return out
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const batchSize = readBoundedNumber(searchParams, 'batchSize', DEFAULT_BATCH_SIZE, MAX_BATCH_SIZE)
    const batchesPerRequest = readBoundedNumber(searchParams, 'batches', DEFAULT_BATCHES_PER_REQUEST, MAX_BATCHES_PER_REQUEST)
    const feedMode = normalizeId(searchParams.get('feedMode') || 'video')
    const sort = normalizeId(searchParams.get('sort') || 'random')
    const now = Date.now()
    const rotationEpoch = Math.floor(now / (DEFAULT_ROTATE_SEC * 1000))
    const rotationKey = `${feedMode}:${sort}:${rotationEpoch}`
    const viewerIdRaw = normalizeId(getUserIdFromReq(req) || searchParams.get('viewerId') || '')
    const viewerId = viewerIdRaw ? await resolveCanonicalAccountId(viewerIdRaw) : ''
    const excludeRawIds = parseCsvParam(searchParams, 'excludeIds')
    const resolvedExclude = await resolveCanonicalAccountIds(excludeRawIds)
    const excludeCanonicalIds = new Set(normalizeIdList([...(resolvedExclude?.ids || []), ...excludeRawIds]))
    if (viewerId) excludeCanonicalIds.add(viewerId)
    if (viewerIdRaw) excludeCanonicalIds.add(viewerIdRaw)

    const seed = hash32([rotationKey, viewerId || viewerIdRaw || 'guest', Array.from(excludeCanonicalIds).sort().join('|'), batchSize, batchesPerRequest].join('|'))
    const cacheKey = [rotationKey, viewerId || viewerIdRaw || 'guest', batchSize, batchesPerRequest, Array.from(excludeCanonicalIds).sort().join(',')].join('|')
    const cacheBust = normalizeId(searchParams.get('b') || '')
    pruneCache(now)
    if (!cacheBust) {
      const cached = responseCache.get(cacheKey)
      if (cached && Number(cached.exp || 0) > now) return new Response(cached.body, { status: 200, headers: cached.headers })
    }

    const snapshotDoc = await readForumSnapshot(0, MAX_CANDIDATE_ENTRIES)
    const bannedSet = new Set((await readBannedUserIds(snapshotDoc)).map((value) => String(value).toLowerCase()))
    const snapshotEntries = readSnapshotCandidateEntries(snapshotDoc, MAX_CANDIDATE_ENTRIES)
    const entries = snapshotEntries.length ? snapshotEntries : await readProjectionCandidateEntries(MAX_CANDIDATE_ENTRIES)

    entries.sort((left, right) => (Number(right.ts || 0) - Number(left.ts || 0)) || String(left.rawUserId || '').localeCompare(String(right.rawUserId || '')))
    const limitedEntries = entries.slice(0, MAX_CANDIDATE_ENTRIES)
    const rawIds = normalizeIdList(limitedEntries.map((entry) => entry.rawUserId))
    const canonicalResolution = await resolveCanonicalAccountIds(rawIds)
    const rawToCanonical = new Map(rawIds.map((rawId) => [rawId, normalizeId(canonicalResolution?.aliases?.[rawId] || rawId)]))
    const candidatesByCanonicalId = new Map()

    limitedEntries.forEach((entry) => {
      const rawUserId = normalizeId(entry.rawUserId)
      const canonicalAccountId = normalizeId(rawToCanonical.get(rawUserId) || rawUserId)
      if (!rawUserId || !canonicalAccountId) return
      if (bannedSet.has(rawUserId.toLowerCase()) || bannedSet.has(canonicalAccountId.toLowerCase())) return
      if (excludeCanonicalIds.has(rawUserId) || excludeCanonicalIds.has(canonicalAccountId)) return
      const current = candidatesByCanonicalId.get(canonicalAccountId) || {
        userId: rawUserId,
        canonicalAccountId,
        rawIds: new Set([canonicalAccountId]),
        snapshotNickname: '',
        snapshotAvatar: '',
        lastTs: 0,
        postsCount: 0,
        topicsCount: 0,
      }
      current.rawIds.add(rawUserId)
      if (!current.snapshotNickname && entry.nickname) current.snapshotNickname = entry.nickname
      if (!current.snapshotAvatar && entry.avatar) current.snapshotAvatar = entry.avatar
      current.lastTs = Math.max(Number(current.lastTs || 0), Number(entry.ts || 0))
      if (entry.kind === 'post') current.postsCount += 1
      if (entry.kind === 'topic') current.topicsCount += 1
      if (entry.kind === 'stats') {
        current.postsCount += Number(entry.postsCount || 0)
        current.topicsCount += Number(entry.topicsCount || 0)
      }
      candidatesByCanonicalId.set(canonicalAccountId, current)
    })

    const profileMap = await readProfileMap(Array.from(candidatesByCanonicalId.keys()))
    const withFollowers = await Promise.all(Array.from(candidatesByCanonicalId.values()).map(async (candidate) => {
      const profile = profileMap[candidate.canonicalAccountId] || {}
      const nickname = normalizeId(profile.nickname || candidate.snapshotNickname)
      const avatar = normalizeId(profile.avatar || candidate.snapshotAvatar)
      return {
        userId: normalizeId(candidate.userId || candidate.canonicalAccountId),
        canonicalAccountId: candidate.canonicalAccountId,
        rawIds: normalizeIdList(Array.from(candidate.rawIds || [])),
        nickname,
        avatar,
        lastTs: Number(candidate.lastTs || 0),
        postsCount: Number(candidate.postsCount || 0),
        topicsCount: Number(candidate.topicsCount || 0),
        followersCount: Number(await forumPrimary.getFollowersCount(candidate.canonicalAccountId) || 0),
      }
    }))

    const pool = stableShuffle(withFollowers
      .filter((candidate) => candidate.canonicalAccountId && candidate.nickname && candidate.avatar && (candidate.postsCount + candidate.topicsCount) > 0 && candidate.followersCount > 0)
      .sort((left, right) => (Number(right.lastTs || 0) - Number(left.lastTs || 0)) || String(left.canonicalAccountId || '').localeCompare(String(right.canonicalAccountId || ''))), seed)

    const candidateBatches = buildCandidateBatches(pool, batchSize, batchesPerRequest, rotationKey, seed)
    const candidatesToHydrate = []
    const hydrationMap = new Map()
    candidateBatches.forEach((batch) => {
      ;(batch?.users || []).forEach((candidate) => {
        const candidateId = normalizeId(candidate?.canonicalAccountId || candidate?.userId)
        if (!candidateId || hydrationMap.has(candidateId)) return
        hydrationMap.set(candidateId, candidate)
        candidatesToHydrate.push(candidate)
      })
    })

    const vipStates = await Promise.all(candidatesToHydrate.map(async (candidate) => {
      try {
        const vip = await isVipNow(candidate.canonicalAccountId)
        return [candidate.canonicalAccountId, !!vip?.active]
      } catch {
        return [candidate.canonicalAccountId, false]
      }
    }))
    const vipMap = new Map(vipStates)
    const hydratedUserMap = new Map(candidatesToHydrate.map((candidate) => [
      candidate.canonicalAccountId,
      {
        userId: candidate.userId,
        canonicalAccountId: candidate.canonicalAccountId,
        nickname: candidate.nickname,
        avatar: candidate.avatar,
        followersCount: Number(candidate.followersCount || 0),
        isVip: !!vipMap.get(candidate.canonicalAccountId),
      },
    ]))
    const batches = candidateBatches
      .map((batch) => ({ batchId: batch.batchId, users: (batch?.users || []).map((candidate) => hydratedUserMap.get(candidate.canonicalAccountId)).filter(Boolean) }))
      .filter((batch) => batch.users.length > 0)

    const payload = { ok: true, seed, rotationKey, ttlSec: DEFAULT_CACHE_TTL_SEC, batches, storagePrimary: 'mongo' }
    const body = JSON.stringify(payload)
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
      'x-ql7-read-source': 'mongo_primary',
    })
    if (!cacheBust) responseCache.set(cacheKey, { body, headers, exp: now + (DEFAULT_CACHE_TTL_SEC * 1000) })
    return new Response(body, { status: 200, headers })
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error?.message || error || 'recommendations_failed') }, { status: 500 })
  }
}
