import { useMemo } from 'react'

export default function useInboxRepliesModel({
  meId,
  posts,
  postSort = 'new',
  activeStarredAuthors = null,
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
        const likes = Number(post?.likes || 0)
        const views = Number(post?.views || 0)
        const replies = Number(repliesById.get(String(post?.id || '')) || 0)
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

      const starRank = (post) => {
        if (!activeStarredAuthors?.size) return 0
        const authorId = String(resolveProfileAccountIdFn(post?.userId || post?.accountId || '') || '').trim()
        return authorId && activeStarredAuthors.has(authorId) ? 1 : 0
      }

      return (repliesToMe || []).slice().sort((a, b) => {
        const bStar = starRank(b)
        const aStar = starRank(a)
        if (bStar !== aStar) return bStar - aStar
        const bScore = score(b)
        const aScore = score(a)
        if (bScore !== aScore) return bScore - aScore
        return Number(b?.ts || 0) - Number(a?.ts || 0)
      })
    },
    [activeStarredAuthors, postSort, repliesById, repliesToMe, resolveProfileAccountIdFn],
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
