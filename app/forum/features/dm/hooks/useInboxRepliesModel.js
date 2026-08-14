import { useMemo } from 'react'

function directReplyCount(post) {
  const candidates = [
    post?.replyCount,
    post?.repliesCount,
    post?.answersCount,
    post?.commentsCount,
    post?.__repliesCount,
    post?.replies,
    post?.counters?.replies,
    post?.counters?.replyCount,
    post?.counters?.repliesCount,
    post?.counters?.answersCount,
    post?.counters?.commentsCount,
    post?.sort?.replies,
    post?.sort?.replyCount,
    post?.sort?.repliesCount,
    post?.sort?.answersCount,
    post?.sort?.commentsCount,
  ]
  let max = NaN
  for (const value of candidates) {
    const n = Number(value)
    if (Number.isFinite(n) && n >= 0) max = Number.isFinite(max) ? Math.max(max, n) : n
  }
  return max
}

function hasAuthoritativeReplyCounter(post) {
  if (!post || typeof post !== 'object') return false
  return Boolean(
    post.__ql7PostCountersCoreHydrated ||
    post.__ql7PostCountersThreadIndexHydrated ||
    post.__ql7InboxCountersReadFallback ||
    post.counters?.__ql7PostCountersCoreHydrated ||
    post.counters?.__ql7PostCountersThreadIndexHydrated ||
    String(post.__ql7CounterSource || post.counters?.__ql7CounterSource || '').trim(),
  )
}

function resolveReplyCount(post, derived = 0) {
  const direct = directReplyCount(post)
  const fallback = Math.max(0, Number(derived || 0))
  if (Number.isFinite(direct)) {
    if (direct > 0 || hasAuthoritativeReplyCounter(post) || fallback <= 0) return direct
    return Math.max(direct, fallback)
  }
  return fallback
}

export default function useInboxRepliesModel({
  meId,
  posts,
  postSort = 'new',
  visibleRepliesCount,
  resolveProfileAccountIdFn,
}) {
  const repliesById = useMemo(() => {
    const map = new Map()
    for (const post of (posts || [])) {
      const parentId = post?.parentId != null ? String(post.parentId) : ''
      if (!parentId) continue
      map.set(parentId, Number(map.get(parentId) || 0) + 1)
    }
    return map
  }, [posts])

  const myPostIds = useMemo(() => {
    if (!meId) return new Set()
    const ids = new Set()
    for (const post of (posts || [])) {
      const postAuthorId = resolveProfileAccountIdFn(post.userId || post.accountId || '')
      if (String(postAuthorId) === String(meId)) ids.add(String(post.id))
    }
    return ids
  }, [meId, posts, resolveProfileAccountIdFn])

  const repliesToMe = useMemo(() => {
    if (!meId || !myPostIds.size) return []
    return (posts || []).filter((post) => {
      const authorId = resolveProfileAccountIdFn(post.userId || post.accountId || '')
      return post.parentId &&
        myPostIds.has(String(post.parentId)) &&
        String(authorId) !== String(meId)
    })
  }, [posts, myPostIds, meId, resolveProfileAccountIdFn])

  const sortedRepliesToMe = useMemo(
    () => {
      const score = (post) => {
        const ts = Number(post?.ts || 0)
        const likeCount = Number(post?.likes || post?.counters?.likes || 0)
        const dislikeCount = Number(post?.dislikes || post?.counters?.dislikes || 0)
        const likes = Math.max(
          Number(post?.reactions || post?.reactionCount || 0),
          Number(post?.counters?.reactions || post?.counters?.reactionCount || 0),
          Number(post?.sort?.likes || 0),
          (Number.isFinite(likeCount) ? likeCount : 0) + (Number.isFinite(dislikeCount) ? dislikeCount : 0),
        )
        const views = Math.max(Number(post?.views || 0), Number(post?.counters?.views || 0), Number(post?.sort?.views || 0))
        const replies = resolveReplyCount(post, repliesById.get(String(post?.id || '')) || 0)
        switch (String(postSort || 'new')) {
          case 'likes':
            return likes
          case 'views':
            return views
          case 'replies':
            return replies
          case 'top':
            return (likes * 2) + replies + Math.floor(views * 0.2)
          case 'new':
          default:
            return ts
        }
      }

      return (repliesToMe || []).slice().sort((a, b) => {
        const bScore = score(b)
        const aScore = score(a)
        if (bScore !== aScore) return bScore - aScore
        return Number(b?.ts || 0) - Number(a?.ts || 0)
      })
    },
    [postSort, repliesById, repliesToMe],
  )

  const visibleRepliesToMe = useMemo(
    () => sortedRepliesToMe.slice(0, visibleRepliesCount),
    [sortedRepliesToMe, visibleRepliesCount],
  )

  const repliesHasMore = visibleRepliesToMe.length < sortedRepliesToMe.length

  return {
    repliesToMe,
    sortedRepliesToMe,
    visibleRepliesToMe,
    repliesHasMore,
  }
}
