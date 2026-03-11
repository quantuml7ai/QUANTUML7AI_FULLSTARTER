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

  const pidOf = (x) => {
    const v = (x?.id ?? x?._id ?? x?.uuid ?? x?.key ?? null)
    return v == null ? '' : String(v)
  }

  const parentIdOf = (x) => {
    const v = (x?.parentId ?? x?._parentId ?? null)
    return v == null ? '' : String(v)
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
    const likes = Number(p?.likes || 0)
    const views = Number(p?.views || 0)
    const replies = repliesMap.get(pidOf(p)) || 0
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

  if (effectiveFeedSort === 'random') {
    const seedStr = `${String(viewerId || '')}|${String(videoFeedPageSalt || '')}|${String(videoFeedEntryToken || 0)}`
    const base = only.slice().sort((a, b) => (Number(b?.ts || 0) - Number(a?.ts || 0)))
    only = vfShuffleStable(base, seedStr)
  } else {
    only = only.sort((a, b) => (score(b) - score(a)) || (Number(b?.ts || 0) - Number(a?.ts || 0)))
  }

  const onlyWithReplyCounts = only.map((p) => {
    const id = pidOf(p)
    const replyCount = id ? (repliesMap.get(id) || 0) : 0
    return {
      ...p,
      replyCount,
      __repliesCount: replyCount,
    }
  })

  return starredFirst(onlyWithReplyCounts, (p) => (p?.userId || p?.accountId))
}

