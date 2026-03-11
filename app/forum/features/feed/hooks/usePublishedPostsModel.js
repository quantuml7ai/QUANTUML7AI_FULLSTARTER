import { useMemo } from 'react'

export default function usePublishedPostsModel({
  meId,
  posts,
  visiblePublishedCount,
  resolveProfileAccountIdFn,
}) {
  const myPublishedPosts = useMemo(() => {
    if (!meId) return []
    return (posts || [])
      .filter((post) => {
        const postAuthorId = resolveProfileAccountIdFn(post.userId || post.accountId || '')
        return !post?._del && String(postAuthorId) === String(meId)
      })
      .slice()
      .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
  }, [meId, posts, resolveProfileAccountIdFn])

  const visiblePublishedPosts = useMemo(
    () => myPublishedPosts.slice(0, visiblePublishedCount),
    [myPublishedPosts, visiblePublishedCount],
  )

  const publishedHasMore = visiblePublishedPosts.length < myPublishedPosts.length

  return {
    myPublishedPosts,
    visiblePublishedPosts,
    publishedHasMore,
  }
}
