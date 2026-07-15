import { useMemo } from 'react'

function finiteCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function hasAuthoritativeReplyCounter(post) {
  if (!post || typeof post !== 'object') return false
  const source = String(post.__ql7CounterSource || post.counters?.__ql7CounterSource || '').trim()
  return Boolean(
    post.__ql7PostCountersCoreHydrated ||
    post.__ql7PostCountersThreadIndexHydrated ||
    post.__ql7InboxCountersReadFallback ||
    post.counters?.__ql7PostCountersCoreHydrated ||
    post.counters?.__ql7PostCountersThreadIndexHydrated ||
    source === 'forum_core_posts' ||
    source === 'forum_thread_index',
  )
}

function hasAuthoritativePostCounters(post) {
  if (!post || typeof post !== 'object') return false
  const source = String(post.__ql7CounterSource || post.counters?.__ql7CounterSource || '').trim()
  return Boolean(
    post.__ql7PostCountersCoreHydrated ||
    post.counters?.__ql7PostCountersCoreHydrated ||
    source === 'forum_core_posts'
  )
}

function canonicalReplyCount(post) {
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

function readReplyCount(post, childCount = 0) {
  const direct = canonicalReplyCount(post)
  const derived = finiteCount(childCount)
  if (Number.isFinite(direct)) {
    if (direct > 0 || hasAuthoritativeReplyCounter(post) || derived <= 0) return direct
    return Math.max(direct, derived)
  }
  return derived
}

export default function useThreadPostsModel({
  selectedTopicId,
  posts,
  threadRoot,
  postSort,
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

  const childrenByParent = useMemo(() => {
    const map = new Map()
    for (const post of allPosts || []) {
      const parentId = post?.parentId != null ? String(post.parentId) : ''
      if (!parentId) continue
      if (!map.has(parentId)) map.set(parentId, [])
      map.get(parentId).push(idMap.get(String(post.id)) || { ...post, children: [] })
    }
    return map
  }, [allPosts, idMap])

  const flat = useMemo(() => {
    if (!selectedTopicId) return []

    const postScore = (post) => {
      const node = post?.children ? post : (idMap.get(String(post.id)) || post)
      const ts = Number(node.ts || 0)
      const authoritative = hasAuthoritativePostCounters(node)
      const likes = Math.max(finiteCount(node.likes), finiteCount(node.counters?.likes), authoritative ? 0 : finiteCount(node.sort?.likes))
      const views = Math.max(finiteCount(node.views), finiteCount(node.counters?.views), authoritative ? 0 : finiteCount(node.sort?.views))
      const repliesCount = readReplyCount(node, (node.children || []).length)
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

    const serverRank = (post) => {
      const n = Number(post?.__ql7ServerFeedRank ?? post?.__ql7GeoFeedRank)
      return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY
    }
    const hasGeoRank = (post) => (
      Number.isFinite(Number(post?.__ql7GeoFeedRank)) ||
      (String(post?.__ql7ServerFeedMode || '').toLowerCase() === 'geo' && Number.isFinite(serverRank(post)))
    )

    if (!threadRoot) {
      const hasServerRankedRoots = rootPosts.some((post) => Number.isFinite(serverRank(post)))
      const shouldUseServerRank =
        String(postSort || 'random') === 'random' ||
        rootPosts.some(hasGeoRank)
      return rootPosts
        .slice()
        .sort((a, b) => {
          if (hasServerRankedRoots && shouldUseServerRank) {
            const ar = serverRank(a)
            const br = serverRank(b)
            const ah = Number.isFinite(ar)
            const bh = Number.isFinite(br)
            if (ah || bh) {
              if (ah !== bh) return ah ? -1 : 1
              if (ar !== br) return ar - br
            }
          }
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
          repliesCount: readReplyCount(post, (idMap.get(String(post.id))?.children || []).length),
        }))
    }

    const rootId = String(threadRoot.id || threadRoot.postId || '')
    if (!rootId) return []

    const startFromMap = idMap.get(rootId)
    const start = startFromMap || {
      ...threadRoot,
      id: rootId,
      topicId: threadRoot.topicId || selectedTopicId,
      children: childrenByParent.get(rootId) || [],
      __threadOpening: threadRoot.__threadOpening !== false,
    }

    const sortChildren = (list) =>
      [...(list || [])].sort((a, b) => {
        const aPath = String(a?.threadPath || a?.path || a?._threadPath || '').trim()
        const bPath = String(b?.threadPath || b?.path || b?._threadPath || '').trim()
        if (aPath || bPath) return aPath.localeCompare(bPath)

        const aOrder = Number(a?.threadOrder ?? a?._threadOrder ?? a?.order ?? a?.rank)
        const bOrder = Number(b?.threadOrder ?? b?._threadOrder ?? b?.order ?? b?.rank)
        if (Number.isFinite(aOrder) || Number.isFinite(bOrder)) {
          const left = Number.isFinite(aOrder) ? aOrder : Number.POSITIVE_INFINITY
          const right = Number.isFinite(bOrder) ? bOrder : Number.POSITIVE_INFINITY
          if (left !== right) return left - right
        }

        const aTs = Number(a?.ts || 0)
        const bTs = Number(b?.ts || 0)
        if (aTs !== bTs) return aTs - bTs

        return String(a?.id || '').localeCompare(String(b?.id || ''))
      })

    const startChildren = start.children?.length ? start.children : (childrenByParent.get(rootId) || [])
    const rootRepliesCount = readReplyCount(start, (startChildren || []).length)
    const directChildren = sortChildren(startChildren || [])
    const rootRow = {
      ...start,
      id: rootId,
      _lvl: 0,
      repliesCount: rootRepliesCount,
      __threadBranchRoot: true,
    }

    const childRows = directChildren.map((child) => ({
      ...child,
      _lvl: 1,
      repliesCount: readReplyCount(child, (child.children || []).length),
    }))

    return [rootRow, ...childRows]
  }, [
    selectedTopicId,
    threadRoot,
    rootPosts,
    idMap,
    childrenByParent,
    postSort,
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
