import { useMemo } from 'react'

function getAuthorId(resolveProfileAccountIdFn, entity) {
  const raw = entity?.userId || entity?.accountId
  return String(resolveProfileAccountIdFn?.(raw) || raw || '').trim()
}

function postScore(postSort, post, repliesById) {
  const ts = Number(post?.ts || 0)
  const likes = Number(post?.likes || 0)
  const views = Number(post?.views || 0)
  const replies = Number(repliesById?.get?.(String(post?.id || '')) || 0)
  switch (postSort) {
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

export default function useUserPostsBranchModel({
  posts,
  postSort,
  authorFilterUserId,
  visiblePostsCount,
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

  const filteredPosts = useMemo(() => {
    const userId = String(authorFilterUserId || '').trim()
    if (!userId) return []
    return (posts || []).filter((post) => getAuthorId(resolveProfileAccountIdFn, post) === userId)
  }, [authorFilterUserId, posts, resolveProfileAccountIdFn])

  const sortedPosts = useMemo(() => {
    return [...(filteredPosts || [])].sort((a, b) => {
      const bScore = postScore(postSort, b, repliesById)
      const aScore = postScore(postSort, a, repliesById)
      if (bScore !== aScore) return bScore - aScore
      const bTs = Number(b?.ts || 0)
      const aTs = Number(a?.ts || 0)
      if (bTs !== aTs) return bTs - aTs
      return String(b?.id || '').localeCompare(String(a?.id || ''))
    })
  }, [filteredPosts, postSort, repliesById])

  const visiblePosts = useMemo(
    () => (sortedPosts || []).slice(0, Number(visiblePostsCount || 0)),
    [sortedPosts, visiblePostsCount],
  )

  const hasMore = visiblePosts.length < sortedPosts.length

  return {
    filteredPosts,
    sortedPosts,
    visiblePosts,
    hasMore,
  }
}
