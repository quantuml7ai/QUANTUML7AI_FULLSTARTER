import { useMemo } from 'react'
import { getStarredEntityRank } from '../../subscriptions/utils/starred'

export default function useThreadPostsModel({
  selectedTopicId,
  posts,
  threadRoot,
  postSort,
  activeStarredAuthors,
  visibleThreadPostsCount,
  resolveProfileAccountIdFn,
}) {
  const allPosts = useMemo(
    () => (
      selectedTopicId
        ? (posts || []).filter((post) => String(post.topicId) === String(selectedTopicId))
        : []
    ),
    [posts, selectedTopicId],
  )

  const rootPosts = useMemo(
    () => allPosts
      .filter((post) => !post.parentId)
      .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0)),
    [allPosts],
  )

  const idMap = useMemo(() => {
    const map = new Map(allPosts.map((post) => [String(post.id), { ...post, children: [] }]))
    for (const node of map.values()) {
      const parentId = node.parentId != null ? String(node.parentId) : null
      if (parentId && map.has(parentId)) map.get(parentId).children.push(node)
    }
    return map
  }, [allPosts])

  const flat = useMemo(() => {
    if (!selectedTopicId) return []

    const postScore = (post) => {
      const node = post?.children ? post : (idMap.get(String(post.id)) || post)
      const ts = Number(node.ts || 0)
      const likes = Number(node.likes || 0)
      const views = Number(node.views || 0)
      const repliesCount = Number((node.children || []).length || 0)
      switch (postSort) {
        case 'likes':
          return likes
        case 'views':
          return views
        case 'replies':
          return repliesCount
        case 'top':
          return (likes * 2) + repliesCount + Math.floor(views * 0.2)
        case 'new':
        default:
          return ts
      }
    }

    const starRank = (post) => {
      return getStarredEntityRank(post, activeStarredAuthors, resolveProfileAccountIdFn)
    }

    if (!threadRoot) {
      return rootPosts
        .slice()
        .sort((a, b) => {
          const aStar = starRank(a)
          const bStar = starRank(b)
          if (bStar !== aStar) return bStar - aStar

          const bScore = postScore(b)
          const aScore = postScore(a)
          if (bScore !== aScore) return bScore - aScore

          const bTs = Number(b.ts || 0)
          const aTs = Number(a.ts || 0)
          if (bTs !== aTs) return bTs - aTs

          return String(b.id || '').localeCompare(String(a.id || ''))
        })
        .map((post) => ({
          ...post,
          _lvl: 0,
          repliesCount: (idMap.get(String(post.id))?.children || []).length,
        }))
    }

    const start = idMap.get(String(threadRoot.id))
    if (!start) return []

    const sortChildren = (list) =>
      [...(list || [])].sort((a, b) => {
        const aStar = starRank(a)
        const bStar = starRank(b)
        if (bStar !== aStar) return bStar - aStar

        const aScore = postScore(a)
        const bScore = postScore(b)
        if (bScore !== aScore) return bScore - aScore

        const aTs = Number(a.ts || 0)
        const bTs = Number(b.ts || 0)
        if (bTs !== aTs) return bTs - aTs

        return String(b.id || '').localeCompare(String(a.id || ''))
      })

    const rootRepliesCount = Number((start.children || []).length || 0)
    const directChildren = sortChildren(start.children || [])
    const rootRow = {
      ...start,
      _lvl: 0,
      repliesCount: rootRepliesCount,
      __threadBranchRoot: true,
    }

    const childRows = directChildren.map((child) => ({
      ...child,
      _lvl: 1,
      repliesCount: Number((child.children || []).length || 0),
    }))

    return [rootRow, ...childRows]
  }, [
    selectedTopicId,
    threadRoot,
    rootPosts,
    idMap,
    postSort,
    activeStarredAuthors,
    resolveProfileAccountIdFn,
  ])

  const visibleFlat = useMemo(
    () => (flat || []).slice(0, visibleThreadPostsCount),
    [flat, visibleThreadPostsCount],
  )

  const threadHasMore = visibleFlat.length < (flat || []).length

  return {
    allPosts,
    idMap,
    flat,
    visibleFlat,
    threadHasMore,
  }
}
