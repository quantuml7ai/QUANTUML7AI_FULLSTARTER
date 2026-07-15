import { useEffect } from 'react'
import { forumEntityId, mergeForumEntitiesById, mergeForumEntityPreserving } from '../utils/postMerge'

function str(value) {
  return String(value ?? '').trim()
}

const mergeByForumId = mergeForumEntitiesById

function normalizeServerPosts(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  return items
    .map((item) => {
      if (item?.post && typeof item.post === 'object') {
        return {
          ...item.post,
          id: str(item.post.id || item.post.postId || item.postId || item.id),
          postId: str(item.post.postId || item.post.id || item.postId || item.id),
          topicId: str(item.post.topicId || item.topicId),
          counters: item.post.counters && typeof item.post.counters === 'object' ? item.post.counters : item.counters,
          sort: item.post.sort && typeof item.post.sort === 'object' ? item.post.sort : item.sort,
          topic: item.topic && typeof item.topic === 'object' ? item.topic : item.post.topic,
          __ql7PostCountersCoreHydrated: Boolean(item.post.__ql7PostCountersCoreHydrated || item.__ql7PostCountersCoreHydrated),
          __ql7PostCountersThreadIndexHydrated: Boolean(item.post.__ql7PostCountersThreadIndexHydrated || item.__ql7PostCountersThreadIndexHydrated),
          __ql7InboxCountersReadFallback: Boolean(item.post.__ql7InboxCountersReadFallback || item.__ql7InboxCountersReadFallback),
          __ql7CounterSource: str(item.post.__ql7CounterSource || item.__ql7CounterSource),
        }
      }
      if (item?.item && typeof item.item === 'object' && String(item.kind || '').toLowerCase() === 'post') {
        return { ...item.item, id: str(item.item.id || item.postId || item.entityId || item.id) }
      }
      if (item && typeof item === 'object' && (item.postId || item.text || item.body)) {
        return { ...item, id: str(item.id || item.postId) }
      }
      return null
    })
    .filter(Boolean)
}

function normalizeServerTopics(payload) {
  const items = Array.isArray(payload?.items) ? payload.items : []
  return items
    .map((item) => {
      if (item?.topic && typeof item.topic === 'object') {
        return {
          ...item.topic,
          id: str(item.topic.id || item.topic.topicId || item.topicId || item.id),
          topicId: str(item.topic.topicId || item.topic.id || item.topicId || item.id),
          __ql7TopicCountersCoreHydrated: Boolean(item.topic.__ql7TopicCountersCoreHydrated || item.__ql7TopicCountersCoreHydrated),
          __ql7TopicCountersPostTotalsHydrated: Boolean(item.topic.__ql7TopicCountersPostTotalsHydrated || item.__ql7TopicCountersPostTotalsHydrated),
          __ql7CounterSource: str(item.topic.__ql7CounterSource || item.__ql7CounterSource),
        }
      }
      if (item?.item && typeof item.item === 'object' && String(item.kind || '').toLowerCase() === 'topic') {
        return { ...item.item, id: str(item.item.id || item.topicId || item.entityId || item.id) }
      }
      if (item && typeof item === 'object' && (item.topicId || item.title)) {
        return { ...item, id: str(item.id || item.topicId) }
      }
      return null
    })
    .filter(Boolean)
}

// QL7_GEO888_STAGE1A_EXPLICIT_RANDOM_I18N_SORT_FIX_V14A
const QL7_FORUM_FEED_SORT_VALUES = new Set(['random', 'new', 'top', 'likes', 'reactions', 'views', 'replies'])
const QL7_FORUM_FEED_SORT_EXPLICIT_KEY = 'ql7_forum_feed_sort_explicit_v14a'
const QL7_FORUM_GEO_MODE_STORAGE_KEYS = ['ql7_forum_geo_mode', 'ql7_forum_geo_feed_mode']
const QL7_FORUM_SORT_STORAGE_KEYS = ['ql7_forum_feed_sort', QL7_FORUM_FEED_SORT_EXPLICIT_KEY]
let ql7ForumSyncRuntimePreferencesBootstrapped = false

function bootstrapForumFeedRuntimeDefaults() {
  if (typeof window === 'undefined') return
  if (ql7ForumSyncRuntimePreferencesBootstrapped) return
  ql7ForumSyncRuntimePreferencesBootstrapped = true
  try {
    const mode = String(window.__ql7ForumGeoFeedMode || '').trim().toLowerCase()
    window.__ql7ForumGeoFeedMode = mode === 'world' ? 'world' : 'geo'
  } catch {}
  try {
    const rawSort = String(window.__ql7ForumFeedSort || '').trim().toLowerCase()
    const explicit = String(window.__ql7ForumFeedSortExplicit || '').trim() === '1'
    window.__ql7ForumFeedSort = explicit && QL7_FORUM_FEED_SORT_VALUES.has(rawSort) ? rawSort : 'random'
    window.__ql7ForumFeedSortExplicit = explicit && QL7_FORUM_FEED_SORT_VALUES.has(rawSort) ? '1' : ''
  } catch {}
  try {
    const stores = [window.localStorage, window.sessionStorage].filter(Boolean)
    stores.forEach((store) => {
      ;[...QL7_FORUM_GEO_MODE_STORAGE_KEYS, ...QL7_FORUM_SORT_STORAGE_KEYS].forEach((key) => {
        try { store.removeItem(key) } catch {}
      })
    })
  } catch {}
}

function readStoredForumValue(keys = []) {
  if (typeof window === 'undefined') return ''
  bootstrapForumFeedRuntimeDefaults()
  for (const key of keys) {
    try {
      const value = key === '__ql7ForumGeoFeedMode' || key === '__ql7ForumFeedSort'
        ? window[key]
        : ''
      const text = str(value)
      if (text) return text
    } catch {}
  }
  return ''
}

function readServerFeedModePreference() {
  const raw = readStoredForumValue(['__ql7ForumGeoFeedMode', 'ql7_forum_geo_mode', 'ql7_forum_geo_feed_mode']).toLowerCase()
  return raw === 'world' ? 'world' : 'geo'
}

function hasExplicitForumFeedSortPreference() {
  bootstrapForumFeedRuntimeDefaults()
  try {
    return String(window.__ql7ForumFeedSortExplicit || '').trim() === '1'
  } catch { return false }
}
function readServerFeedSortPreference() {
  try {
    const raw = readStoredForumValue(['__ql7ForumFeedSort', 'ql7_forum_feed_sort']).toLowerCase()
    if (hasExplicitForumFeedSortPreference() && QL7_FORUM_FEED_SORT_VALUES.has(raw)) return raw
    if (!hasExplicitForumFeedSortPreference() && raw && raw !== 'random') {
      try { window.__ql7ForumFeedSort = 'random' } catch {}
    }
  } catch {}
  return 'random'
}

function finiteRank(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : Number.POSITIVE_INFINITY
}

function decorateServerFeedPosts(posts, payload, { sort = 'random', reason = 'sync' } = {}) {
  const mode = str(payload?.mode || readServerFeedModePreference()) || 'geo'
  const mapKey = str(payload?.feedMapKey?.key || payload?.feedMapKey || '')
  return (Array.isArray(posts) ? posts : []).map((post, index) => {
    const rank = index
    const next = {
      ...post,
      __ql7ServerFeedRank: rank,
      __ql7ServerFeedMode: mode,
      __ql7ServerFeedSort: sort,
      __ql7ServerFeedMapKey: mapKey,
      __ql7ServerFeedSurface: 'home',
      __ql7ServerFeedReason: reason,
    }
    if (mode === 'geo') next.__ql7GeoFeedRank = rank
    else delete next.__ql7GeoFeedRank
    return next
  })
}

function topicsFromServerFeedPosts(posts) {
  const map = new Map()
  for (const post of Array.isArray(posts) ? posts : []) {
    const topicId = str(post?.topicId || post?.topic?.topicId || post?.topic?.id)
    if (!topicId) continue
    const rank = finiteRank(post?.__ql7GeoFeedRank ?? post?.__ql7ServerFeedRank)
    const topic = post?.topic && typeof post.topic === 'object' ? post.topic : {}
    const prev = map.get(topicId)
    if (prev && finiteRank(prev.__ql7GeoFeedRank ?? prev.__ql7ServerFeedRank) <= rank) continue
    const mode = str(post?.__ql7ServerFeedMode || '')
    const nextTopic = {
      ...topic,
      id: str(topic.id || topic.topicId || topicId),
      topicId: str(topic.topicId || topic.id || topicId),
      __ql7ServerFeedRank: rank,
      __ql7ServerFeedSurface: 'home',
      __ql7ServerFeedMode: mode,
      __ql7ServerFeedSort: str(post?.__ql7ServerFeedSort || ''),
    }
    if (mode.toLowerCase() === 'geo') nextTopic.__ql7GeoFeedRank = rank
    else delete nextTopic.__ql7GeoFeedRank
    map.set(topicId, nextTopic)
  }
  return Array.from(map.values())
}

function dispatchServerFeedApplied({ feed, mode, sort, reason }) {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('forum:server-feed-applied', {
      detail: {
        mode: str(feed?.mode || mode || ''),
        sort: str(feed?.sort || sort || ''),
        feedMapKey: feed?.feedMapKey || null,
        count: Number(feed?.count || 0) || 0,
        reason: str(reason || 'sync'),
        ts: Date.now(),
      },
    }))
  } catch {}
}

function mergeFreshProjectionEntity(prev, item, id) {
  const fresh = { ...item, id }
  if (!prev || typeof prev !== 'object') return fresh
  const out = { ...prev, ...fresh }
  if (str(fresh.__ql7ServerFeedMode).toLowerCase() !== 'geo') {
    delete out.__ql7GeoFeedRank
  }
  if (fresh.counters && typeof fresh.counters === 'object') {
    out.counters = {
      ...(prev.counters && typeof prev.counters === 'object' ? prev.counters : {}),
      ...fresh.counters,
    }
  }
  if (fresh.sort && typeof fresh.sort === 'object') {
    out.sort = {
      ...(prev.sort && typeof prev.sort === 'object' ? prev.sort : {}),
      ...fresh.sort,
    }
  }
  if (fresh.topic && typeof fresh.topic === 'object') {
    out.topic = {
      ...(prev.topic && typeof prev.topic === 'object' ? prev.topic : {}),
      ...fresh.topic,
    }
  }
  return out
}

function keepPreviousBranchPost(item) {
  if (!item || typeof item !== 'object') return false
  const parentId = str(item.parentId || item.replyToPostId || item.thread?.parentId)
  if (parentId) return true
  if (item.__threadBranchRoot || item.__ql7TopicRootsHydrated) return true
  const depth = Number(item?.thread?.depth ?? item?.depth)
  return Number.isFinite(depth) && depth > 0
}

function mergeProjectionPosts(prevItems, freshItems, { replaceOrder = false } = {}) {
  const rankedFresh = (Array.isArray(freshItems) ? freshItems : [])
    .filter((item) => Number.isFinite(finiteRank(item?.__ql7GeoFeedRank ?? item?.__ql7ServerFeedRank)))
    .sort((a, b) => finiteRank(a.__ql7GeoFeedRank ?? a.__ql7ServerFeedRank) - finiteRank(b.__ql7GeoFeedRank ?? b.__ql7ServerFeedRank))
  if (!rankedFresh.length) return replaceOrder ? mergeProjectionTopics(prevItems, freshItems, { replaceOrder: true }) : mergeByForumId(prevItems, freshItems)
  const byId = new Map()
  for (const item of Array.isArray(prevItems) ? prevItems : []) {
    const id = forumEntityId(item)
    if (id) byId.set(id, item)
  }
  const used = new Set()
  const out = []
  for (const item of rankedFresh) {
    const id = forumEntityId(item)
    if (!id || used.has(id)) continue
    const prev = byId.get(id)
    out.push(prev ? (replaceOrder ? mergeFreshProjectionEntity(prev, item, id) : mergeForumEntityPreserving(prev, { ...item, id })) : { ...item, id })
    used.add(id)
  }
  if (!replaceOrder) {
    for (const item of Array.isArray(prevItems) ? prevItems : []) {
      const id = forumEntityId(item)
      if (!id || used.has(id)) continue
      out.push(item)
      used.add(id)
    }
  } else {
    for (const item of Array.isArray(prevItems) ? prevItems : []) {
      const id = forumEntityId(item)
      if (!id || used.has(id) || !keepPreviousBranchPost(item)) continue
      out.push(item)
      used.add(id)
    }
  }
  return out
}

function mergeProjectionTopics(prevItems, freshItems, { replaceOrder = false } = {}) {
  const fresh = Array.isArray(freshItems) ? freshItems : []
  if (!replaceOrder) return mergeByForumId(prevItems, fresh)

  const previousById = new Map()
  for (const item of Array.isArray(prevItems) ? prevItems : []) {
    const id = forumEntityId(item)
    if (id) previousById.set(id, item)
  }

  const used = new Set()
  const out = []
  for (const item of fresh) {
    const id = forumEntityId(item)
    if (!id || used.has(id)) continue
    const prev = previousById.get(id)
    out.push(prev ? (replaceOrder ? mergeFreshProjectionEntity(prev, item, id) : mergeForumEntityPreserving(prev, { ...item, id })) : { ...item, id })
    used.add(id)
  }
  return out
}

export default function useForumSyncLoop({
  isBrowserFn,
  flushMutations,
  tombstonesRef,
  snapRef,
  lastFullSnapshotRef,
  sseHintRef,
  pruneTombstonesRef,
  persistSnapRef,
  persistTombstonesRef,
  syncInFlightRef,
  syncNowRef,
  api,
  writeProfileAlias,
  mergeProfileCache,
  setProfileBump,
}) {
  useEffect(() => {
    if (!isBrowserFn()) return undefined
    let stop = false
    const TICK_MS = Math.max(
      60_000,
      Number(process.env.NEXT_PUBLIC_FORUM_SYNC_TICK_MS || 180_000),
    )

    const readScrollIdleState = () => {
      try {
        const now = Date.now()
        const lastUserScrollTs = Number(window.__forumUserScrollTs || 0)
        const lastProgrammaticScrollTs = Number(window.__forumProgrammaticScrollTs || 0)
        const lastScrollTs = Math.max(lastUserScrollTs, lastProgrammaticScrollTs)
        const coarse = !!window?.matchMedia?.('(pointer: coarse)')?.matches
        const idleMs = coarse ? 1600 : 1200
        return { now, coarse, idle: (now - lastScrollTs) >= idleMs }
      } catch {
        return { now: Date.now(), coarse: false, idle: true }
      }
    }

    const canApplyProjectionPagesNow = (forceApply = false) => {
      if (forceApply || !snapRef.current?.rev) return true
      try {
        const state = readScrollIdleState()
        if (!state.idle) return false
        const scrollEl = document.querySelector?.('[data-forum-scroll="1"]') || null
        const innerTop = Number(scrollEl?.scrollTop || 0)
        const winTop = Number(window.pageYOffset || document.documentElement?.scrollTop || document.body?.scrollTop || 0)
        const top = Math.max(innerTop, winTop)
        if (top > (state.coarse ? 360 : 280)) return false
        return true
      } catch {
        return true
      }
    }

    const hydrateProfilesForItems = async (posts, topics) => {
      const idsSet = new Set()
      try {
        for (const t of (topics || [])) {
          const id = str(t?.authorId || t?.userId || t?.ownerId || t?.uid || t?.canonicalAuthorId || t?.accountId)
          if (id) idsSet.add(id)
        }
        for (const p of (posts || [])) {
          const id = str(p?.authorId || p?.userId || p?.ownerId || p?.uid || p?.canonicalAuthorId || p?.accountId)
          if (id) idsSet.add(id)
        }
      } catch {}
      const ids = Array.from(idsSet)
      if (!ids.length) return
      try {
        const pm = await api.profileBatch(ids)
        if (pm?.ok && pm?.map && typeof pm.map === 'object') {
          const aliases = pm.aliases && typeof pm.aliases === 'object' ? pm.aliases : {}
          Object.entries(aliases).forEach(([rawId, accountId]) => writeProfileAlias(rawId, accountId))
          Object.entries(pm.map).forEach(([accountId, profile]) => {
            mergeProfileCache(accountId, {
              nickname: profile?.nickname || '',
              icon: profile?.icon || '',
              updatedAt: Date.now(),
            })
          })
          Object.entries(aliases).forEach(([rawId, accountId]) => {
            const profile = pm.map?.[accountId]
            if (!profile) return
            mergeProfileCache(rawId, {
              nickname: profile?.nickname || '',
              icon: profile?.icon || '',
              updatedAt: Date.now(),
            })
          })
          setProfileBump((x) => x + 1)
        }
      } catch {}
    }

    const applyProjectionPages = async ({ forceApply = false, reason = 'sync' } = {}) => {
      // QL7_GEO111_NO_HEAVY_SNAPSHOT_PRIMARY_V1
      const canApply = canApplyProjectionPagesNow(forceApply)
      if (!canApply) return false
      const requestGeneration = feedRequestGenerationRef.current
      const pageSize = reason === 'bootstrap' ? 40 : 24
      const feedSort = readServerFeedSortPreference()
      const feedMode = readServerFeedModePreference()
      const [feed, topics] = await Promise.all([
        typeof api?.feedPage === 'function'
          ? api.feedPage({ pageSize, limit: pageSize, sort: feedSort, mode: feedMode, surface: 'home' })
          : Promise.resolve(null),
        typeof api?.topicsPage === 'function'
          ? api.topicsPage({ pageSize: 40, limit: 40, sort: feedSort })
          : Promise.resolve(null),
      ])
      if (requestGeneration !== feedRequestGenerationRef.current) return false
      if (feedMode !== readServerFeedModePreference() || feedSort !== readServerFeedSortPreference()) {
        return false
      }
      const posts = feed?.ok ? decorateServerFeedPosts(normalizeServerPosts(feed), feed, { sort: feedSort, reason }) : []
      const feedTopics = topicsFromServerFeedPosts(posts)
      const topicItems = topics?.ok ? mergeByForumId(feedTopics, normalizeServerTopics(topics)) : feedTopics
      if (!posts.length && !topicItems.length) {
        if (feed?.ok) dispatchServerFeedApplied({ feed, mode: feedMode, sort: feedSort, reason })
        return false
      }
      await hydrateProfilesForItems(posts, topicItems)
      const rev = Math.max(
        Number(feed?.rev || 0) || 0,
        Number(topics?.rev || 0) || 0,
        Number(sseHintRef.current || 0) || 0,
        Date.now(),
      )
      persistSnapRef.current((prev) => ({
        ...prev,
        topics: mergeProjectionTopics(prev?.topics || [], topicItems, {
          replaceOrder: reason === 'bootstrap' || forceApply,
        }),
        posts: mergeProjectionPosts(prev?.posts || [], posts, {
          replaceOrder: reason === 'bootstrap' || forceApply,
        }),
        rev,
        cursor: prev?.cursor ?? null,
      }))
      lastFullSnapshotRef.current = Date.now()
      if (Number(sseHintRef.current || 0) <= rev) sseHintRef.current = 0
      dispatchServerFeedApplied({ feed, mode: feedMode, sort: feedSort, reason })
      return true
    }

    const pendingRunRef = { current: null }
    const feedRequestGenerationRef = { current: 0 }

    const bumpFeedRequestGeneration = () => {
      feedRequestGenerationRef.current += 1
      return feedRequestGenerationRef.current
    }

    const runTick = async (options = {}) => {
      if (stop) return

      if (syncInFlightRef.current) {
        if (options?.forceApply || options?.full) {
          const prev = pendingRunRef.current || {}
          pendingRunRef.current = {
            ...prev,
            ...options,
            forceApply: !!(prev.forceApply || options?.forceApply),
            full: !!(prev.full || options?.full),
            reason: options?.reason || prev.reason || 'queued_force',
          }
        }
        return
      }

      const forceApply = !!options?.forceApply
      const forceFull = !!options?.full
      const reason = str(options?.reason || (forceFull ? 'forced' : 'interval')) || 'interval'

      syncInFlightRef.current = true
      try {
        await flushMutations()
        const tombstones = tombstonesRef.current || { topics: {}, posts: {} }
        try {
          if (typeof document !== 'undefined' && document.hidden && !forceApply) return
        } catch {}

        const sinceNow = Number(snapRef.current?.rev || 0)
        const bootstrap = forceApply || forceFull || !sinceNow
        if (!bootstrap && typeof api?.rev === 'function') {
          const rr = await api.rev()
          const liveRev = Number(rr?.rev || 0) || 0
          if (!rr?.ok || liveRev <= sinceNow) {
            const cleaned = pruneTombstonesRef.current(tombstones)
            const same =
              JSON.stringify(cleaned.topics) === JSON.stringify(tombstones.topics) &&
              JSON.stringify(cleaned.posts) === JSON.stringify(tombstones.posts)
            if (!same) persistTombstonesRef.current(cleaned)
            return
          }
          sseHintRef.current = Math.max(Number(sseHintRef.current || 0), liveRev)
        }

        await applyProjectionPages({ forceApply: bootstrap || forceApply, reason: bootstrap ? 'bootstrap' : reason })

        const cleaned = pruneTombstonesRef.current(tombstones)
        const same =
          JSON.stringify(cleaned.topics) === JSON.stringify(tombstones.topics) &&
          JSON.stringify(cleaned.posts) === JSON.stringify(tombstones.posts)
        if (!same) persistTombstonesRef.current(cleaned)
      } catch (e) {
        console.error('sync tick error', e)
      } finally {
        syncInFlightRef.current = false
        const pending = pendingRunRef.current
        if (pending && !stop) {
          pendingRunRef.current = null
          setTimeout(() => {
            try { runTick(pending) } catch {}
          }, 0)
        }
      }
    }

    syncNowRef.current = (options = {}) => runTick(options)
    runTick({ reason: 'bootstrap', forceApply: true })

    const id = setInterval(() => {
      runTick({ reason: 'interval' })
    }, TICK_MS)

    const requestServerFeedSortRefresh = () => {
      bumpFeedRequestGeneration()
      setTimeout(() => {
        try {
          syncNowRef.current?.({ reason: 'server_feed_sort_change', full: true, forceApply: true })
        } catch {}
      }, 60)
    }

    const requestVisibleSync = () => {
      // QL7_GEO888_STAGE1_NO_FOCUS_VISIBLE_REORDER_V14
      // Focus/visibility may refresh hidden maps in a later stage, but must not reorder visible feed.
    }

    try {
      document.addEventListener('visibilitychange', requestVisibleSync)
      window.addEventListener('focus', requestVisibleSync)
      window.addEventListener('forum:server-feed-sort-change', requestServerFeedSortRefresh)
    } catch {}

    return () => {
      stop = true
      syncNowRef.current = () => {}
      clearInterval(id)
      try {
        document.removeEventListener('visibilitychange', requestVisibleSync)
        window.removeEventListener('focus', requestVisibleSync)
        window.removeEventListener('forum:server-feed-sort-change', requestServerFeedSortRefresh)
      } catch {}
    }
  }, [
    isBrowserFn,
    flushMutations,
    tombstonesRef,
    snapRef,
    lastFullSnapshotRef,
    sseHintRef,
    pruneTombstonesRef,
    persistSnapRef,
    persistTombstonesRef,
    syncInFlightRef,
    syncNowRef,
    api,
    writeProfileAlias,
    mergeProfileCache,
    setProfileBump,
  ])
}
