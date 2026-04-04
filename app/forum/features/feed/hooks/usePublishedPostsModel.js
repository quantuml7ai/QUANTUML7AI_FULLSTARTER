import { useMemo } from 'react'

function readReplyCountFromPost(post) {
  const candidates = [
    post?.replyCount,
    post?.repliesCount,
    post?.answersCount,
    post?.commentsCount,
    post?.__repliesCount,
  ]
  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return NaN
}

function resolveReplyCount(post, repliesById) {
  const postId = String(post?.id || '')
  const derived = Number(repliesById?.get?.(postId) || 0)
  const direct = readReplyCountFromPost(post)
  if (Number.isFinite(direct) && direct >= 0) {
    return Math.max(direct, derived)
  }
  return Math.max(0, derived)
}

export default function usePublishedPostsModel({
  meId,
  posts,
  postSort = 'new',
  activeStarredAuthors = null,
  visiblePublishedCount,
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

  const myPublishedPosts = useMemo(() => {
    if (!meId) return []
    const score = (post) => {
      const ts = Number(post?.ts || 0)
      const likes = Number(post?.likes || 0)
      const views = Number(post?.views || 0)
      const replies = resolveReplyCount(post, repliesById)
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
    return (posts || [])
      .filter((post) => {
        const postAuthorId = resolveProfileAccountIdFn(post.userId || post.accountId || '')
        return !post?._del && String(postAuthorId) === String(meId)
      })
      .slice()
      .sort((a, b) => {
        const bStar = starRank(b)
        const aStar = starRank(a)
        if (bStar !== aStar) return bStar - aStar
        const bScore = score(b)
        const aScore = score(a)
        if (bScore !== aScore) return bScore - aScore
        return Number(b?.ts || 0) - Number(a?.ts || 0)
      })
      .map((post) => {
        const nextReplyCount = resolveReplyCount(post, repliesById)
        const currentReplyCount = readReplyCountFromPost(post)
        const currentShadowReplyCount = Number(post?.__repliesCount)
        const shouldPatchReplyCount =
          !Number.isFinite(currentReplyCount) || currentReplyCount < nextReplyCount
        const shouldPatchShadowReplyCount =
          !Number.isFinite(currentShadowReplyCount) || currentShadowReplyCount !== nextReplyCount
        if (!shouldPatchReplyCount && !shouldPatchShadowReplyCount) return post
        const patchedPost = { ...post }
        if (shouldPatchReplyCount) patchedPost.replyCount = nextReplyCount
        if (shouldPatchShadowReplyCount) patchedPost.__repliesCount = nextReplyCount
        return patchedPost
      })
  }, [activeStarredAuthors, meId, posts, postSort, repliesById, resolveProfileAccountIdFn])

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
