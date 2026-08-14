import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const PROFILE_BRANCH_SORT_VALUES = new Set(['new', 'top', 'likes', 'reactions', 'views', 'replies'])

function normalizeProfileBranchSort(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'reactions') return 'likes'
  return PROFILE_BRANCH_SORT_VALUES.has(raw) ? raw : 'new'
}

function getAuthorId(resolveProfileAccountIdFn, entity) {
  const raw = entity?.userId || entity?.accountId
  return String(resolveProfileAccountIdFn?.(raw) || raw || '').trim()
}

function readReplyCountFromPost(post) {
  const authoritative = hasAuthoritativeReplyCounter(post)
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
    authoritative ? undefined : post?.sort?.replies,
    authoritative ? undefined : post?.sort?.replyCount,
    authoritative ? undefined : post?.sort?.repliesCount,
    authoritative ? undefined : post?.sort?.answersCount,
    authoritative ? undefined : post?.sort?.commentsCount,
  ]
  let max = NaN
  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) max = Number.isFinite(max) ? Math.max(max, parsed) : parsed
  }
  return max
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

function resolveReplyCount(post, repliesById) {
  const postId = String(post?.id || '')
  const derived = Number(repliesById?.get?.(postId) || 0)
  const direct = readReplyCountFromPost(post)
  if (Number.isFinite(direct) && direct >= 0) {
    if (direct > 0 || hasAuthoritativeReplyCounter(post) || derived <= 0) return direct
    return Math.max(direct, derived)
  }
  return Math.max(0, derived)
}

function postScore(postSort, post, repliesById) {
  const safeSort = normalizeProfileBranchSort(postSort)
  const ts = Number(post?.ts || 0)
  const likeCount = Number(post?.likes || post?.counters?.likes || 0)
  const dislikeCount = Number(post?.dislikes || post?.counters?.dislikes || 0)
  const authoritative = hasAuthoritativePostCounters(post)
  const likes = Math.max(
    Number(post?.reactions || post?.reactionCount || 0),
    Number(post?.counters?.reactions || post?.counters?.reactionCount || 0),
    authoritative ? 0 : Number(post?.sort?.likes || 0),
    (Number.isFinite(likeCount) ? likeCount : 0) + (Number.isFinite(dislikeCount) ? dislikeCount : 0),
  )
  const views = Math.max(Number(post?.views || 0), Number(post?.counters?.views || 0), authoritative ? 0 : Number(post?.sort?.views || 0))
  const replies = resolveReplyCount(post, repliesById)
  switch (safeSort) {
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

function normalizeServerItems(json, mode) {
  const items = Array.isArray(json?.items) ? json.items : []
  if (mode === 'topics') return { posts: [], topics: items }
  return { posts: items, topics: [] }
}

function dispatchServerItemsMerge(payload) {
  try {
    if (typeof window === 'undefined') return
    const posts = Array.isArray(payload?.posts) ? payload.posts : []
    const topics = Array.isArray(payload?.topics) ? payload.topics : []
    if (!posts.length && !topics.length) return
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: {
        source: 'profile_branch_server_projection',
        posts,
        topics,
        rev: Date.now(),
      },
    }))
  } catch {}
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
    const safePostSort = normalizeProfileBranchSort(postSort)
    return [...(filteredPosts || [])].sort((a, b) => {
      const bScore = postScore(safePostSort, b, repliesById)
      const aScore = postScore(safePostSort, a, repliesById)
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
  topicSort,
  api,
  resolveProfileAccountIdFn,
  threadPageSize,
}) {
  const [profileBranchMode, setProfileBranchMode] = useState(null)
  const [profileBranchUserId, setProfileBranchUserId] = useState(null)
  const [profileBranchUserNick, setProfileBranchUserNick] = useState('')
  const [visibleProfilePostsCount, setVisibleProfilePostsCount] = useState(
    Number(threadPageSize || 0),
  )
  const requestSeqRef = useRef(0)
  const [serverBranchStatus, setServerBranchStatus] = useState({
    key: '',
    loading: false,
    count: 0,
    source: '',
    error: '',
  })
  const [serverBranchTopics, setServerBranchTopics] = useState([])

  const clearProfileBranch = useCallback(() => {
    setProfileBranchMode(null)
    setProfileBranchUserId(null)
    setProfileBranchUserNick('')
    setServerBranchTopics([])
    setServerBranchStatus({ key: '', loading: false, count: 0, source: '', error: '' })
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

  useEffect(() => {
    if (profileBranchMode === 'topics') return
    setServerBranchTopics([])
  }, [profileBranchMode])

  // QL7_GEO111_PROFILE_BRANCH_SERVER_HYDRATE_V1
  useEffect(() => {
    const mode = profileBranchMode === 'topics' ? 'topics' : (profileBranchMode === 'posts' ? 'posts' : '')
    const userId = String(normalizedProfileBranchUserId || '').trim()
    if (!mode || !userId || !api) return undefined

    const seq = requestSeqRef.current + 1
    requestSeqRef.current = seq
    const safeBranchSort = mode === 'topics' ? normalizeProfileBranchSort(topicSort) : normalizeProfileBranchSort(postSort)
    const key = `${mode}:${userId}:${safeBranchSort}`
    let cancelled = false
    if (mode === 'topics') setServerBranchTopics([])
    setServerBranchStatus({ key, loading: true, count: 0, source: '', error: '' })

    const load = async () => {
      try {
        const pageSize = Math.max(80, Number(threadPageSize || 30) * 4)
        const json = mode === 'topics'
          ? await api.userTopicsPage({ userId, sort: safeBranchSort, pageSize, limit: pageSize })
          : await api.userPostsPage({ userId, sort: safeBranchSort, pageSize, limit: pageSize })
        if (cancelled || requestSeqRef.current !== seq) return
        if (!json?.ok) throw new Error(json?.error || `HTTP ${json?.status || 0}`)
        const merged = normalizeServerItems(json, mode)
        dispatchServerItemsMerge(merged)
        if (mode === 'topics') setServerBranchTopics(merged.topics)
        setServerBranchStatus({
          key,
          loading: false,
          count: Number(json?.count || merged.posts.length || merged.topics.length || 0),
          source: String(json?.source || 'mongo_projection_index'),
          error: '',
        })
      } catch (error) {
        if (cancelled || requestSeqRef.current !== seq) return
        setServerBranchStatus({
          key,
          loading: false,
          count: 0,
          source: '',
          error: String(error?.message || error || 'profile_branch_server_hydrate_failed'),
        })
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [api, normalizedProfileBranchUserId, postSort, profileBranchMode, threadPageSize, topicSort])

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
    serverBranchTopics,
    serverBranchStatus,
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
    const nowTs = Date.now()

    try {
      window.__forumForceModeAlign = 'profile_branch'
      window.__forumForceModeAlignUntil = nowTs + 2800
    } catch {}

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

    try {
      const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
      if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
        scrollEl.scrollTop = 0
      } else {
        window.scrollTo?.({ top: 0, behavior: 'auto' })
      }
      window.__forumProgrammaticScrollTs = nowTs
      window.__forumProgrammaticScrollReason = 'profile_branch_open'
    } catch {}

    try {
      const baselineUserScrollTs = Number(window.__forumUserScrollTs || 0)
      const startedAt = Date.now()
      let rafA = 0
      let rafB = 0
      let timerId = 0

      const alignStartCard = () => {
        try {
          const marker =
            document.querySelector?.('[data-profile-branch-root="1"] [data-profile-branch-start="1"]') ||
            document.querySelector?.('[data-profile-branch-root="1"] [data-feed-card="1"]') ||
            document.querySelector?.('[data-profile-branch-root="1"] .item[data-feed-kind="topic"]') ||
            null
          if (!(marker instanceof Element)) return false
          const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
          const rect = marker.getBoundingClientRect?.()
          if (!rect) return false
          if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
            const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
            const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
            scrollEl.scrollTop = Math.max(0, targetTop)
          } else {
            const y = (window.pageYOffset || document.documentElement?.scrollTop || 0) + rect.top
            try { window.scrollTo?.({ top: Math.max(0, y), behavior: 'auto' }) } catch {}
          }
          window.__forumProgrammaticScrollTs = Date.now()
          window.__forumProgrammaticScrollReason = 'profile_branch_align_start'
          return true
        } catch {}
        return false
      }

      const scheduleAlign = (attempt = 0) => {
        try {
          if ((Date.now() - startedAt) > 2600) return
          const nowUserScrollTs = Number(window.__forumUserScrollTs || 0)
          if (attempt > 0 && nowUserScrollTs > baselineUserScrollTs) return
          if (alignStartCard()) return
          if (attempt >= 14) return
          const delay = attempt <= 3 ? 64 : (attempt <= 9 ? 110 : 170)
          timerId = window.setTimeout(() => scheduleAlign(attempt + 1), delay)
        } catch {}
      }

      rafA = window.requestAnimationFrame(() => {
        rafB = window.requestAnimationFrame(() => scheduleAlign(0))
      })
      window.setTimeout(() => {
        try { if (rafA) window.cancelAnimationFrame(rafA) } catch {}
        try { if (rafB) window.cancelAnimationFrame(rafB) } catch {}
        try { if (timerId) clearTimeout(timerId) } catch {}
      }, 3200)
    } catch {}
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
