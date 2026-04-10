import { NextResponse } from 'next/server'
import { snapshot, K, redis } from '../../_db.js'
import { getUserIdFromReq } from '../../_utils.js'
import { resolveCanonicalAccountId, resolveCanonicalAccountIds } from '../../../profile/_identity.js'
import { isVipNow } from '../../../../../lib/subscriptions.js'

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

function normalizeId(value) {
  return String(value || '').trim()
}

function normalizeIdList(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => normalizeId(value))
        .filter(Boolean),
    ),
  )
}

function parseCsvParam(searchParams, key) {
  const chunks = searchParams.getAll(key)
  if (!chunks.length) return []
  return normalizeIdList(
    chunks.flatMap((chunk) => String(chunk || '').split(',').map((value) => value.trim())),
  )
}

function readBatchSize(searchParams, fallback) {
  const raw = Number(searchParams.get('batchSize') || fallback)
  if (!Number.isFinite(raw)) return fallback
  return Math.max(1, Math.min(MAX_BATCH_SIZE, Math.trunc(raw)))
}

function readBatchCount(searchParams, fallback) {
  const raw = Number(searchParams.get('batches') || fallback)
  if (!Number.isFinite(raw)) return fallback
  return Math.max(1, Math.min(MAX_BATCHES_PER_REQUEST, Math.trunc(raw)))
}

function readRawAuthorId(entity) {
  return normalizeId(
    entity?.canonicalAccountId ||
      entity?.accountId ||
      entity?.authorId ||
      entity?.userId ||
      entity?.ownerId ||
      entity?.uid,
  )
}

function readNickname(entity) {
  return normalizeId(
    entity?.displayNick ||
      entity?.nickname ||
      entity?.nick ||
      entity?.name,
  )
}

function readAvatar(entity) {
  return normalizeId(
    entity?.avatar ||
      entity?.icon ||
      entity?.avatarUrl ||
      entity?.photoUrl,
  )
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

function unwrapMultiResult(value) {
  if (value && typeof value === 'object' && 'result' in value) return value.result
  return value
}

async function readProfileMap(accountIds) {
  const ids = normalizeIdList(accountIds)
  if (!ids.length) return {}

  const pipe = redis.multi()
  ids.forEach((accountId) => {
    pipe.get(K.userNick(accountId))
    pipe.get(K.userAvatar(accountId))
  })

  const raw = await pipe.exec()
  const flat = Array.isArray(raw) ? raw.map(unwrapMultiResult) : []
  const profileMap = {}

  ids.forEach((accountId, idx) => {
    profileMap[accountId] = {
      nickname: normalizeId(flat[idx * 2]),
      avatar: normalizeId(flat[(idx * 2) + 1]),
    }
  })

  return profileMap
}

async function readFollowersCountMap(candidates) {
  const list = Array.isArray(candidates) ? candidates : []
  if (!list.length) return new Map()

  const pipe = redis.multi()
  const reverse = []

  list.forEach((candidate) => {
    const canonicalId = normalizeId(candidate?.canonicalAccountId)
    if (!canonicalId) return

    pipe.get(K.subsFollowersCount(canonicalId))
    reverse.push({ canonicalId })

    ;(candidate?.rawIds || []).forEach((rawId) => {
      const normalizedRawId = normalizeId(rawId)
      if (!normalizedRawId || normalizedRawId === canonicalId) return
      pipe.get(K.subsFollowersCount(normalizedRawId))
      reverse.push({ canonicalId })
    })
  })

  const raw = await pipe.exec()
  const flat = Array.isArray(raw) ? raw.map(unwrapMultiResult) : []
  const counts = new Map()

  reverse.forEach((entry, idx) => {
    const nextValue = Number(flat[idx] || 0)
    if (!Number.isFinite(nextValue)) return
    const prevValue = Number(counts.get(entry.canonicalId) || 0)
    counts.set(entry.canonicalId, Math.max(prevValue, nextValue))
  })

  return counts
}

function buildEmptyResponse(rotationKey, ttlSec, seed) {
  return {
    ok: true,
    seed,
    rotationKey,
    ttlSec,
    batches: [],
  }
}

function buildCandidateBatches(pool, targetBatchSize, requestedBatchCount, rotationKey, seed) {
  const list = Array.isArray(pool) ? pool : []
  const normalizedTargetBatchSize = Math.max(1, Number(targetBatchSize || 0) || 1)
  const normalizedRequestedBatchCount = Math.max(1, Number(requestedBatchCount || 0) || 1)
  if (!list.length) return []

  const effectiveBatchSize = Math.min(normalizedTargetBatchSize, list.length)
  const enoughForDisjointBatches = list.length >= (effectiveBatchSize * normalizedRequestedBatchCount)
  const batchStep = enoughForDisjointBatches
    ? effectiveBatchSize
    : Math.max(1, Math.floor(list.length / normalizedRequestedBatchCount))

  const batches = []

  for (let batchIndex = 0; batchIndex < normalizedRequestedBatchCount; batchIndex += 1) {
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

    if (!users.length) break

    batches.push({
      batchId: `${rotationKey}:${seed}:${batchIndex}`,
      users,
    })
  }

  return batches
}

function pruneCache(now) {
  for (const [key, value] of responseCache.entries()) {
    if (!value || Number(value.exp || 0) <= now) {
      responseCache.delete(key)
    }
  }

  while (responseCache.size > CACHE_LIMIT) {
    const oldestKey = responseCache.keys().next().value
    if (!oldestKey) break
    responseCache.delete(oldestKey)
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const batchSizeDefault = DEFAULT_BATCH_SIZE
    const batchesPerRequestDefault = DEFAULT_BATCHES_PER_REQUEST
    const cacheTtlSec = DEFAULT_CACHE_TTL_SEC
    const rotateSec = DEFAULT_ROTATE_SEC
    const batchSize = Math.max(1, Math.min(MAX_BATCH_SIZE, readBatchSize(searchParams, batchSizeDefault) || batchSizeDefault))
    const batchesPerRequest = Math.max(
      1,
      Math.min(MAX_BATCHES_PER_REQUEST, readBatchCount(searchParams, batchesPerRequestDefault) || batchesPerRequestDefault),
    )
    const feedMode = normalizeId(searchParams.get('feedMode') || 'video')
    const sort = normalizeId(searchParams.get('sort') || 'random')
    const now = Date.now()
    const rotationEpoch = Math.floor(now / (rotateSec * 1000))
    const rotationKey = `${feedMode}:${sort}:${rotationEpoch}`
    const viewerIdRaw = normalizeId(getUserIdFromReq(req) || searchParams.get('viewerId') || '')
    const viewerId = viewerIdRaw ? await resolveCanonicalAccountId(viewerIdRaw) : ''
    const excludeRawIds = parseCsvParam(searchParams, 'excludeIds')
    const resolvedExclude = await resolveCanonicalAccountIds(excludeRawIds, redis)
    const excludeCanonicalIds = new Set(
      normalizeIdList([...(resolvedExclude?.ids || []), ...excludeRawIds]),
    )
    if (viewerId) excludeCanonicalIds.add(viewerId)
    if (viewerIdRaw) excludeCanonicalIds.add(viewerIdRaw)

    const seed = hash32([
      rotationKey,
      viewerId || viewerIdRaw || 'guest',
      Array.from(excludeCanonicalIds).sort().join('|'),
      batchSize,
      batchesPerRequest,
    ].join('|'))

    const cacheKey = [
      rotationKey,
      viewerId || viewerIdRaw || 'guest',
      batchSize,
      batchesPerRequest,
      Array.from(excludeCanonicalIds).sort().join(','),
    ].join('|')
    const cacheBust = normalizeId(searchParams.get('b') || '')

    pruneCache(now)
    if (!cacheBust) {
      const cached = responseCache.get(cacheKey)
      if (cached && Number(cached.exp || 0) > now) {
        return new Response(cached.body, { status: 200, headers: cached.headers })
      }
    }

    const forumSnapshot = await snapshot(0)
    const snapshotPosts = Array.isArray(forumSnapshot?.posts) ? forumSnapshot.posts : []
    const snapshotTopics = Array.isArray(forumSnapshot?.topics) ? forumSnapshot.topics : []
    const bannedSet = new Set(
      normalizeIdList(forumSnapshot?.banned || []).map((value) => String(value).toLowerCase()),
    )

    const entries = []
    for (const post of snapshotPosts) {
      if (!post || post._del) continue
      const rawUserId = readRawAuthorId(post)
      if (!rawUserId) continue
      entries.push({
        kind: 'post',
        rawUserId,
        nickname: readNickname(post),
        avatar: readAvatar(post),
        ts: readTs(post),
      })
    }
    for (const topic of snapshotTopics) {
      if (!topic || topic._del) continue
      const rawUserId = readRawAuthorId(topic)
      if (!rawUserId) continue
      entries.push({
        kind: 'topic',
        rawUserId,
        nickname: readNickname(topic),
        avatar: readAvatar(topic),
        ts: readTs(topic),
      })
    }

    entries.sort((left, right) => {
      const tsDelta = Number(right.ts || 0) - Number(left.ts || 0)
      if (tsDelta !== 0) return tsDelta
      return String(left.rawUserId || '').localeCompare(String(right.rawUserId || ''))
    })

    const limitedEntries = entries.slice(0, MAX_CANDIDATE_ENTRIES)
    const rawIds = normalizeIdList(limitedEntries.map((entry) => entry.rawUserId))
    const canonicalResolution = await resolveCanonicalAccountIds(rawIds, redis)
    const rawToCanonical = new Map(
      rawIds.map((rawId) => [rawId, normalizeId(canonicalResolution?.aliases?.[rawId] || rawId)]),
    )

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

      candidatesByCanonicalId.set(canonicalAccountId, current)
    })

    const profileMap = await readProfileMap(Array.from(candidatesByCanonicalId.keys()))
    const basePool = Array.from(candidatesByCanonicalId.values())
      .map((candidate) => {
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
        }
      })
      .filter((candidate) => {
        if (!candidate.canonicalAccountId) return false
        if (!candidate.nickname) return false
        if (!candidate.avatar) return false
        return (candidate.postsCount + candidate.topicsCount) > 0
      })

    const followersCountMap = await readFollowersCountMap(basePool)
    const pool = basePool
      .map((candidate) => ({
        ...candidate,
        followersCount: Number(followersCountMap.get(candidate.canonicalAccountId) || 0),
      }))
      .filter((candidate) => candidate.followersCount > 0)

    const shuffledPool = stableShuffle(
      pool.sort((left, right) => {
        const tsDelta = Number(right.lastTs || 0) - Number(left.lastTs || 0)
        if (tsDelta !== 0) return tsDelta
        return String(left.canonicalAccountId || '').localeCompare(String(right.canonicalAccountId || ''))
      }),
      seed,
    )

    const candidateBatches = buildCandidateBatches(
      shuffledPool,
      batchSize,
      batchesPerRequest,
      rotationKey,
      seed,
    )
    if (!candidateBatches.length) {
      const payload = buildEmptyResponse(rotationKey, cacheTtlSec, seed)
      return NextResponse.json(payload)
    }

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

    const vipStates = await Promise.all(
      candidatesToHydrate.map(async (candidate) => {
        try {
          const vip = await isVipNow(candidate.canonicalAccountId)
          return [candidate.canonicalAccountId, !!vip?.active]
        } catch {
          return [candidate.canonicalAccountId, false]
        }
      }),
    )
    const vipMap = new Map(vipStates)

    const hydratedUserMap = new Map(
      candidatesToHydrate.map((candidate) => [
        candidate.canonicalAccountId,
        {
          userId: candidate.userId,
          canonicalAccountId: candidate.canonicalAccountId,
          nickname: candidate.nickname,
          avatar: candidate.avatar,
          followersCount: Number(candidate.followersCount || 0),
          isVip: !!vipMap.get(candidate.canonicalAccountId),
        },
      ]),
    )

    const batches = candidateBatches
      .map((batch) => ({
        batchId: batch.batchId,
        users: (batch?.users || [])
          .map((candidate) => hydratedUserMap.get(candidate.canonicalAccountId))
          .filter(Boolean),
      }))
      .filter((batch) => batch.users.length > 0)

    const payload = {
      ok: true,
      seed,
      rotationKey,
      ttlSec: cacheTtlSec,
      batches,
    }

    const body = JSON.stringify(payload)
    const headers = new Headers({
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    })

    if (!cacheBust) {
      responseCache.set(cacheKey, {
        body,
        headers,
        exp: now + (cacheTtlSec * 1000),
      })
    }

    return new Response(body, { status: 200, headers })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: String(error?.message || error || 'recommendations_failed'),
      },
      { status: 500 },
    )
  }
}
