import { useMemo } from 'react'

export default function useThreadPostsModel({
  selectedTopicId,
  posts,
  threadRoot,
  postSort,
  activeStarredAuthors,
  visibleThreadPostsCount,
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
      if (!activeStarredAuthors?.size) return 0
      const authorId = String(post?.userId || post?.accountId || '').trim()
      return authorId && activeStarredAuthors.has(authorId) ? 1 : 0
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

    const out = []
    const countDeep = (node) =>
      (node.children || []).reduce((acc, child) => acc + 1 + countDeep(child), 0)

    const walk = (node, level = 0) => {
      out.push({ ...node, _lvl: level, repliesCount: countDeep(node) })
      const kids = [...(node.children || [])].sort((a, b) => {
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
      kids.forEach((child) => walk(child, level + 1))
    }

    walk(start, 0)
    return out
  }, [selectedTopicId, threadRoot, rootPosts, idMap, postSort, activeStarredAuthors])

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
