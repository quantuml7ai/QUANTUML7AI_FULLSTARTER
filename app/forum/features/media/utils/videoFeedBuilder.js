'use client'

import { vfShuffleStable } from './videoFeedRandom'
import { isMediaPostCandidate, gatherAllPostsPool } from './videoFeedPosts'

export function buildVideoFeedItems({
  data,
  allPosts,
  isMediaUrl,
  extractUrlsFromText,
  videoFeedUserSortLocked,
  feedSort,
  viewerId,
  videoFeedPageSalt,
  videoFeedEntryToken,
  starredFirst,
}) {
  const pool = gatherAllPostsPool(data, allPosts)

  const finiteServerRank = (item) => {
    const mode = String(item?.__ql7ServerFeedMode || '').trim().toLowerCase()
    const n = Number(item?.__ql7ServerFeedRank ?? (mode === 'geo' ? item?.__ql7GeoFeedRank : undefined))
    return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY
  }

  const pidOf = (x) => {
    const v = (x?.id ?? x?._id ?? x?.uuid ?? x?.key ?? null)
    return v == null ? '' : String(v)
  }

  const parentIdOf = (x) => {
    const v = (x?.parentId ?? x?._parentId ?? null)
    return v == null ? '' : String(v)
  }
  const finiteCount = (value) => {
    const n = Number(value)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  const directReplyCount = (p) => {
    const candidates = [
      p?.replyCount,
      p?.repliesCount,
      p?.answersCount,
      p?.commentsCount,
      p?.__repliesCount,
      p?.replies,
      p?.counters?.replies,
      p?.counters?.replyCount,
      p?.counters?.repliesCount,
      p?.counters?.answersCount,
      p?.counters?.commentsCount,
      p?.sort?.replies,
      p?.sort?.replyCount,
      p?.sort?.repliesCount,
      p?.sort?.answersCount,
      p?.sort?.commentsCount,
    ]
    let max = NaN
    for (const value of candidates) {
      const n = Number(value)
      if (Number.isFinite(n) && n >= 0) max = Number.isFinite(max) ? Math.max(max, n) : n
    }
    return max
  }
  const hasAuthoritativeReplyCounter = (p) => Boolean(
    p?.__ql7PostCountersCoreHydrated ||
    p?.__ql7PostCountersThreadIndexHydrated ||
    p?.__ql7InboxCountersReadFallback ||
    p?.counters?.__ql7PostCountersCoreHydrated ||
    p?.counters?.__ql7PostCountersThreadIndexHydrated ||
    String(p?.__ql7CounterSource || p?.counters?.__ql7CounterSource || '').trim() === 'forum_core_posts' ||
    String(p?.__ql7CounterSource || p?.counters?.__ql7CounterSource || '').trim() === 'forum_thread_index',
  )
  const hasAuthoritativePostCounters = (p) => Boolean(
    p?.__ql7PostCountersCoreHydrated ||
    p?.counters?.__ql7PostCountersCoreHydrated ||
    String(p?.__ql7CounterSource || p?.counters?.__ql7CounterSource || '').trim() === 'forum_core_posts'
  )
  const canonicalReplyCount = (p, derived = 0) => {
    const direct = directReplyCount(p)
    const fallback = finiteCount(derived)
    if (Number.isFinite(direct)) {
      if (direct > 0 || hasAuthoritativeReplyCounter(p) || fallback <= 0) return direct
      return Math.max(direct, fallback)
    }
    return fallback
  }
  const canonicalReactions = (p) => {
    const likes = finiteCount(p?.likes) || finiteCount(p?.counters?.likes)
    const dislikes = finiteCount(p?.dislikes) || finiteCount(p?.counters?.dislikes)
    const authoritative = hasAuthoritativePostCounters(p)
    return Math.max(
      finiteCount(p?.reactions),
      finiteCount(p?.reactionCount),
      finiteCount(p?.counters?.reactions),
      finiteCount(p?.counters?.reactionCount),
      authoritative ? 0 : finiteCount(p?.sort?.likes),
      likes + dislikes,
    )
  }

  const seen = new Set()
  const all = []
  for (const p of pool) {
    if (!p) continue
    const base = (p.id ?? p._id ?? p.uuid ?? p.key ?? null)
    const topic = (p.topicId ?? p.threadId ?? null)
    const key = base != null ? String(base) : (topic != null ? `${topic}:${String(base)}` : null)
    if (key) {
      if (seen.has(key)) continue
      seen.add(key)
    }
    all.push(p)
  }

  const repliesMap = new Map()
  for (const p of all) {
    const pid = parentIdOf(p)
    if (!pid) continue
    repliesMap.set(pid, (repliesMap.get(pid) || 0) + 1)
  }

  const effectiveFeedSort = videoFeedUserSortLocked ? feedSort : 'random'
  const score = (p) => {
    const likes = canonicalReactions(p)
    const authoritative = hasAuthoritativePostCounters(p)
    const views = Math.max(finiteCount(p?.views), finiteCount(p?.counters?.views), authoritative ? 0 : finiteCount(p?.sort?.views))
    const replies = canonicalReplyCount(p, repliesMap.get(pidOf(p)) || 0)
    switch (effectiveFeedSort) {
      case 'new':
        return Number(p?.ts || 0)
      case 'likes':
        return likes
      case 'views':
        return views
      case 'replies':
        return replies
      case 'top':
        return (likes * 2) + replies + Math.floor(views * 0.2)
      case 'random':
      default:
        return 0
    }
  }

  let only = all.filter((p) => isMediaPostCandidate(p, { isMediaUrl, extractUrlsFromText }))

  const runtimeFeedMode = (() => {
    try {
      if (typeof window === 'undefined') return ''
      const mode = String(window.__ql7ForumGeoFeedMode || '').trim().toLowerCase()
      return mode === 'world' || mode === 'geo' ? mode : ''
    } catch {
      return ''
    }
  })()

  const hasGeoRankedItems = runtimeFeedMode === 'world' ? false : only.some((item) => {
    const mode = String(item?.__ql7ServerFeedMode || '').toLowerCase()
    return mode === 'geo' && (
      Number.isFinite(Number(item?.__ql7GeoFeedRank)) ||
      Number.isFinite(finiteServerRank(item))
    )
  })
  const activeServerMode = runtimeFeedMode || (hasGeoRankedItems ? 'geo' : '')
  const finiteServerRankForActiveMode = (item) => {
    const mode = String(item?.__ql7ServerFeedMode || '').trim().toLowerCase()
    if (activeServerMode === 'geo' && mode !== 'geo') return Number.POSITIVE_INFINITY
    if (activeServerMode === 'world' && mode !== 'world') return Number.POSITIVE_INFINITY
    return finiteServerRank(item)
  }
  const hasServerRankedItems = only.some((item) => Number.isFinite(finiteServerRankForActiveMode(item)))

  if (hasServerRankedItems) {
    const ranked = []
    const unranked = []
    for (const item of only) {
      if (Number.isFinite(finiteServerRankForActiveMode(item))) ranked.push(item)
      else unranked.push(item)
    }
    ranked.sort((a, b) => (finiteServerRankForActiveMode(a) - finiteServerRankForActiveMode(b)) || (Number(b?.ts || 0) - Number(a?.ts || 0)))
    const seedStr = `${String(viewerId || '')}|${String(videoFeedPageSalt || '')}|${String(videoFeedEntryToken || 0)}`
    only = [...ranked, ...vfShuffleStable(unranked, seedStr)]
  } else if (effectiveFeedSort === 'random') {
    const seedStr = `${String(viewerId || '')}|${String(videoFeedPageSalt || '')}|${String(videoFeedEntryToken || 0)}`
    const base = only.slice().sort((a, b) => (Number(b?.ts || 0) - Number(a?.ts || 0)))
    only = vfShuffleStable(base, seedStr)
  } else {
    only = only.sort((a, b) => (score(b) - score(a)) || (Number(b?.ts || 0) - Number(a?.ts || 0)))
  }

  const onlyWithReplyCounts = only.map((p) => {
    const id = pidOf(p)
    const replyCount = canonicalReplyCount(p, id ? (repliesMap.get(id) || 0) : 0)
    return {
      ...p,
      replyCount,
      __repliesCount: replyCount,
    }
  })

  if (hasServerRankedItems) return onlyWithReplyCounts
  return starredFirst(onlyWithReplyCounts, (p) => (p?.userId || p?.accountId))
}
