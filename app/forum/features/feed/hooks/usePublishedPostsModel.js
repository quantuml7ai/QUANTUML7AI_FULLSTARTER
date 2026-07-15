import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { mergeForumEntitiesById } from '../utils/postMerge'

const DEFAULT_SERVER_PAGE_SIZE = 20
const PROFILE_POST_SORT_VALUES = new Set(['new', 'top', 'likes', 'reactions', 'views', 'replies'])

function getAuthorId(resolveProfileAccountIdFn, entity) {
  const raw = entity?.userId || entity?.accountId || entity?.authorId || entity?.canonicalAuthorId
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
  const postId = String(post?.id || post?.postId || '')
  const derived = Number(repliesById?.get?.(postId) || 0)
  const direct = readReplyCountFromPost(post)
  if (Number.isFinite(direct) && direct >= 0) {
    if (direct > 0 || hasAuthoritativeReplyCounter(post) || derived <= 0) return direct
    return Math.max(direct, derived)
  }
  return Math.max(0, derived)
}

function getPostId(post) {
  return String(post?.id || post?.postId || '').trim()
}

function mergeByPostId(existing, incoming) {
  return mergeForumEntitiesById(existing, incoming)
}

function normalizeProfilePostSort(value) {
  const raw = String(value || '').trim().toLowerCase()
  if (raw === 'reactions') return 'likes'
  return PROFILE_POST_SORT_VALUES.has(raw) ? raw : 'new'
}

function normalizeServerItems(result) {
  if (Array.isArray(result?.items)) return result.items
  if (Array.isArray(result?.posts)) return result.posts
  if (Array.isArray(result?.data?.items)) return result.data.items
  if (Array.isArray(result?.data?.posts)) return result.data.posts
  return []
}

function normalizeServerCursor(result) {
  return result?.nextCursor || result?.cursor || result?.data?.nextCursor || result?.data?.cursor || null
}

function normalizeServerHasMore(result, cursor) {
  if (typeof result?.hasMore === 'boolean') return result.hasMore
  if (typeof result?.data?.hasMore === 'boolean') return result.data.hasMore
  return Boolean(cursor)
}

function normalizeServerTotalCount(result, fallback) {
  const candidates = [
    result?.totalCount,
    result?.total,
    result?.data?.totalCount,
    result?.data?.total,
    fallback,
  ]
  for (const value of candidates) {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return 0
}

function dispatchServerItemsMerge(posts) {
  if (typeof window === 'undefined') return
  const items = Array.isArray(posts) ? posts.filter(Boolean) : []
  if (!items.length) return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: { posts: items, topics: [], rev: Date.now(), source: 'published-posts-server-bridge' },
    }))
  } catch {}
}

function scorePost(post, repliesById, postSort) {
  const ts = Number(post?.ts || post?.createdAt || 0)
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

function patchReplyCount(post, repliesById) {
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
}

// QL7_GEO111_PUBLISHED_POSTS_SERVER_BRIDGE_V1
export default function usePublishedPostsModel({
  meId,
  posts,
  tombstones = null,
  postSort = 'new',
  visiblePublishedCount,
  resolveProfileAccountIdFn,
  api = null,
  pageSize = DEFAULT_SERVER_PAGE_SIZE,
}) {
  const pageLimit = Math.max(1, Math.min(80, Math.floor(Number(pageSize || DEFAULT_SERVER_PAGE_SIZE) || DEFAULT_SERVER_PAGE_SIZE)))
  const safePostSort = normalizeProfilePostSort(postSort)
  const serverKey = `${String(meId || '').trim()}|${safePostSort}`
  const requestSeqRef = useRef(0)
  const [serverState, setServerState] = useState(() => ({
    key: '',
    posts: [],
    cursor: null,
    hasMore: false,
    loading: false,
    loaded: false,
    error: null,
    source: '',
    totalCount: 0,
  }))
  const serverStateRef = useRef(serverState)
  useEffect(() => { serverStateRef.current = serverState }, [serverState])
  const tombstonePosts = useMemo(
    () => (tombstones?.posts && typeof tombstones.posts === 'object' ? tombstones.posts : {}),
    [tombstones],
  )
  const tombstonePostsRef = useRef(tombstonePosts)
  useEffect(() => { tombstonePostsRef.current = tombstonePosts }, [tombstonePosts])
  const isPostTombstoned = useCallback((postOrId) => {
    const id = typeof postOrId === 'object' ? getPostId(postOrId) : String(postOrId || '').trim()
    return Boolean(id && tombstonePosts[id])
  }, [tombstonePosts])
  const isPostTombstonedNow = useCallback((postOrId) => {
    const id = typeof postOrId === 'object' ? getPostId(postOrId) : String(postOrId || '').trim()
    return Boolean(id && tombstonePostsRef.current?.[id])
  }, [])

  const repliesById = useMemo(() => {
    const map = new Map()
    for (const post of (posts || [])) {
      const parentId = post?.parentId != null ? String(post.parentId) : ''
      if (!parentId) continue
      map.set(parentId, Number(map.get(parentId) || 0) + 1)
    }
    return map
  }, [posts])

  const buildSortedPublished = useCallback((items) => {
    return (Array.isArray(items) ? items : [])
      .filter((post) => !post?._del && !isPostTombstoned(post))
      .map((post) => patchReplyCount(post, repliesById))
      .slice()
      .sort((a, b) => {
        const bScore = scorePost(b, repliesById, safePostSort)
        const aScore = scorePost(a, repliesById, safePostSort)
        if (bScore !== aScore) return bScore - aScore
        return Number(b?.ts || 0) - Number(a?.ts || 0)
      })
  }, [safePostSort, repliesById, isPostTombstoned])

  const localPublishedPosts = useMemo(() => {
    if (!meId) return []
    return buildSortedPublished((posts || []).filter((post) => {
      const postAuthorId = getAuthorId(resolveProfileAccountIdFn, post)
      return String(postAuthorId) === String(meId)
    }))
  }, [buildSortedPublished, meId, posts, resolveProfileAccountIdFn])

  useEffect(() => {
    setServerState((prev) => {
      const currentPosts = Array.isArray(prev.posts) ? prev.posts : []
      if (!currentPosts.length) return prev
      const nextPosts = currentPosts.filter((post) => !isPostTombstoned(post))
      if (nextPosts.length === currentPosts.length) return prev
      const removed = currentPosts.length - nextPosts.length
      const next = {
        ...prev,
        posts: nextPosts,
        totalCount: Math.max(nextPosts.length, Number(prev.totalCount || 0) - removed),
      }
      serverStateRef.current = next
      return next
    })
  }, [isPostTombstoned])

  const loadPublishedPostsPage = useCallback(async (options = {}) => {
    const reset = options?.reset === true
    const fn = api?.userPostsPage
    const authorId = String(meId || '').trim()
    if (!authorId || typeof fn !== 'function') return { ok: false, skipped: true, reason: 'missing_api_or_user' }
    const current = serverStateRef.current || {}
    if (current.loading) return { ok: false, skipped: true, reason: 'loading' }
    if (!reset && current.loaded && !current.hasMore) return { ok: true, skipped: true, reason: 'complete' }

    const seq = requestSeqRef.current + 1
    requestSeqRef.current = seq
    const cursor = reset ? null : (current.cursor || null)
    setServerState((prev) => ({
      ...prev,
          key: serverKey,
          loading: true,
          error: null,
          ...(reset ? { posts: [], cursor: null, hasMore: false, loaded: false, source: '', totalCount: 0 } : null),
        }))

    try {
      const result = await fn({
        userId: authorId,
        canonicalAuthorId: authorId,
        accountId: authorId,
        sort: safePostSort,
        pageSize: pageLimit,
        limit: pageLimit,
        ...(cursor ? { cursor } : null),
      })
      if (requestSeqRef.current !== seq) return { ok: false, skipped: true, reason: 'stale' }
      const items = normalizeServerItems(result).filter((post) => !isPostTombstonedNow(post))
      const nextCursor = normalizeServerCursor(result)
      const nextHasMore = normalizeServerHasMore(result, nextCursor)
      const nextSource = String(result?.source || result?.data?.source || 'mongo_projection_index')
      setServerState((prev) => {
        const merged = mergeByPostId(reset ? [] : prev.posts, items)
        const totalCount = normalizeServerTotalCount(result, Math.max(merged.length, prev.totalCount || 0))
        const next = {
          ...prev,
          key: serverKey,
          posts: merged,
          cursor: nextCursor,
          hasMore: nextHasMore,
          loading: false,
          loaded: true,
          error: result?.ok === false ? (result?.error || 'server_error') : null,
          source: nextSource,
          totalCount,
        }
        serverStateRef.current = next
        return next
      })
      dispatchServerItemsMerge(items)
      return { ok: result?.ok !== false, count: items.length, hasMore: nextHasMore, source: nextSource }
    } catch (error) {
      if (requestSeqRef.current !== seq) return { ok: false, skipped: true, reason: 'stale_error' }
      setServerState((prev) => {
        const next = {
          ...prev,
          key: serverKey,
          loading: false,
          loaded: false,
          error: String(error?.message || error || 'network_error'),
        }
        serverStateRef.current = next
        return next
      })
      return { ok: false, error: String(error?.message || error || 'network_error') }
    }
  }, [api, meId, pageLimit, safePostSort, serverKey, isPostTombstonedNow])

  useEffect(() => {
    if (!meId || typeof api?.userPostsPage !== 'function') {
      requestSeqRef.current += 1
      setServerState({ key: serverKey, posts: [], cursor: null, hasMore: false, loading: false, loaded: false, error: null, source: '', totalCount: 0 })
      return
    }
    loadPublishedPostsPage({ reset: true })
  }, [api, loadPublishedPostsPage, meId, safePostSort, serverKey])

  useEffect(() => {
    if (!serverState.loaded || serverState.loading || !serverState.hasMore) return
    if (Number(visiblePublishedCount || 0) <= serverState.posts.length) return
    loadPublishedPostsPage()
  }, [loadPublishedPostsPage, serverState.hasMore, serverState.loaded, serverState.loading, serverState.posts.length, visiblePublishedCount])

  const myPublishedPosts = useMemo(() => {
    if (serverState.loaded && !serverState.error) {
      return buildSortedPublished(mergeByPostId(serverState.posts, localPublishedPosts))
    }
    return localPublishedPosts
  }, [buildSortedPublished, localPublishedPosts, serverState.error, serverState.loaded, serverState.posts])

  const visiblePublishedPosts = useMemo(
    () => myPublishedPosts.slice(0, visiblePublishedCount),
    [myPublishedPosts, visiblePublishedCount],
  )

  const publishedHasMore = (serverState.loaded && !serverState.error && serverState.hasMore)
    || visiblePublishedPosts.length < myPublishedPosts.length
  const publishedTotalCount = Math.max(
    Number(serverState.totalCount || 0) || 0,
    myPublishedPosts.length,
    visiblePublishedPosts.length,
  )

  return {
    myPublishedPosts,
    visiblePublishedPosts,
    publishedTotalCount,
    publishedHasMore,
    publishedServerLoading: serverState.loading,
    publishedServerLoaded: serverState.loaded,
    publishedServerSource: serverState.source || (serverState.loaded ? 'mongo_projection_index' : 'local_snapshot_fallback'),
    loadPublishedPostsPage,
  }
}
