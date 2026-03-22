import { useCallback, useEffect, useMemo, useState } from 'react'

function getAuthorId(resolveProfileAccountIdFn, entity) {
  const raw = entity?.userId || entity?.accountId
  return String(resolveProfileAccountIdFn?.(raw) || raw || '').trim()
}

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

function postScore(postSort, post, repliesById) {
  const ts = Number(post?.ts || 0)
  const likes = Number(post?.likes || 0)
  const views = Number(post?.views || 0)
  const replies = resolveReplyCount(post, repliesById)
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

  const sortedPostsWithReplyCount = useMemo(() => {
    return (sortedPosts || []).map((post) => {
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
  }, [sortedPosts, repliesById])

  const visiblePosts = useMemo(
    () => (sortedPostsWithReplyCount || []).slice(0, Number(visiblePostsCount || 0)),
    [sortedPostsWithReplyCount, visiblePostsCount],
  )

  const hasMore = visiblePosts.length < sortedPostsWithReplyCount.length

  return {
    filteredPosts,
    sortedPosts: sortedPostsWithReplyCount,
    visiblePosts,
    hasMore,
  }
}

export function useForumProfileBranchRuntime({
  posts,
  postSort,
  resolveProfileAccountIdFn,
  threadPageSize,
}) {
  const [profileBranchMode, setProfileBranchMode] = useState(null)
  const [profileBranchUserId, setProfileBranchUserId] = useState(null)
  const [profileBranchUserNick, setProfileBranchUserNick] = useState('')
  const [visibleProfilePostsCount, setVisibleProfilePostsCount] = useState(
    Number(threadPageSize || 0),
  )

  const clearProfileBranch = useCallback(() => {
    setProfileBranchMode(null)
    setProfileBranchUserId(null)
    setProfileBranchUserNick('')
  }, [])

  const normalizedProfileBranchUserId = useMemo(() => {
    const raw = String(profileBranchUserId || '').trim()
    if (!raw) return ''
    return String(resolveProfileAccountIdFn(raw) || raw).trim()
  }, [profileBranchUserId, resolveProfileAccountIdFn])

  const {
    filteredPosts: profileBranchAllPosts,
    visiblePosts: visibleProfilePosts,
    hasMore: profilePostsHasMore,
  } = useUserPostsBranchModel({
    posts,
    postSort,
    authorFilterUserId: profileBranchMode === 'posts' ? normalizedProfileBranchUserId : '',
    visiblePostsCount: visibleProfilePostsCount,
    resolveProfileAccountIdFn,
  })

  useEffect(() => {
    if (profileBranchMode !== 'posts') return
    setVisibleProfilePostsCount(Number(threadPageSize || 0))
  }, [profileBranchMode, profileBranchUserId, postSort, threadPageSize])

  return {
    profileBranchMode,
    setProfileBranchMode,
    profileBranchUserId,
    setProfileBranchUserId,
    profileBranchUserNick,
    setProfileBranchUserNick,
    visibleProfilePostsCount,
    setVisibleProfilePostsCount,
    normalizedProfileBranchUserId,
    clearProfileBranch,
    profileBranchAllPosts,
    visibleProfilePosts,
    profilePostsHasMore,
  }
}

export function useForumProfileBranchActions({
  resolveProfileAccountIdFn,
  resolveNickForDisplayFn,
  pushNavStateStable,
  setProfileBranchMode,
  setProfileBranchUserId,
  setProfileBranchUserNick,
  setSelectedTopic,
  setThreadRoot,
  setReplyTo,
  setInboxOpen,
  setQuestOpen,
  setVideoFeedOpen,
  setTopicFilterId,
  setQuery,
  setDrop,
  setSortOpen,
  setVisibleProfilePostsCount,
  setVisibleTopicsCount,
  threadPageSize,
  topicPageSize,
}) {
  const openProfileBranch = useCallback((mode, payload = {}) => {
    const rawUserId = String(payload?.userId || '').trim()
    if (!rawUserId) return

    const resolvedUserId = String(resolveProfileAccountIdFn(rawUserId) || rawUserId).trim()
    const branchMode = mode === 'posts' ? 'posts' : 'topics'

    try { pushNavStateStable(`profile_${branchMode}_${resolvedUserId}`) } catch {}

    setProfileBranchMode(branchMode)
    setProfileBranchUserId(resolvedUserId)

    const displayNick = String(
      payload?.nickname || resolveNickForDisplayFn(resolvedUserId, '') || rawUserId,
    ).trim()
    setProfileBranchUserNick(displayNick)

    setSelectedTopic(null)
    setThreadRoot(null)
    setReplyTo(null)
    setInboxOpen(false)
    setQuestOpen(false)
    setVideoFeedOpen(false)
    setTopicFilterId(null)
    setQuery('')
    setDrop(false)
    setSortOpen(false)

    if (branchMode === 'posts') {
      setVisibleProfilePostsCount(Number(threadPageSize || 0))
    } else {
      setVisibleTopicsCount(Number(topicPageSize || 0))
    }
  }, [
    resolveProfileAccountIdFn,
    resolveNickForDisplayFn,
    pushNavStateStable,
    setProfileBranchMode,
    setProfileBranchUserId,
    setProfileBranchUserNick,
    setSelectedTopic,
    setThreadRoot,
    setReplyTo,
    setInboxOpen,
    setQuestOpen,
    setVideoFeedOpen,
    setTopicFilterId,
    setQuery,
    setDrop,
    setSortOpen,
    setVisibleProfilePostsCount,
    setVisibleTopicsCount,
    threadPageSize,
    topicPageSize,
  ])

  const openProfilePostsBranch = useCallback((payload) => {
    openProfileBranch('posts', payload)
  }, [openProfileBranch])

  const openProfileTopicsBranch = useCallback((payload) => {
    openProfileBranch('topics', payload)
  }, [openProfileBranch])

  return {
    openProfilePostsBranch,
    openProfileTopicsBranch,
  }
}
