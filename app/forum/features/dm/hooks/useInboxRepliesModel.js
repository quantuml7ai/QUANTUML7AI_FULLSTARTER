import { useMemo } from 'react'

export default function useInboxRepliesModel({
  meId,
  posts,
  visibleRepliesCount,
  resolveProfileAccountIdFn,
}) {
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
    () => (repliesToMe || []).slice().sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0)),
    [repliesToMe],
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
