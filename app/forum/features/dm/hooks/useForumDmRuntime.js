import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useDmStorageMaps from './useDmStorageMaps'
import useDmThreadAutoScroll from './useDmThreadAutoScroll'
import useInboxRepliesModel from './useInboxRepliesModel'
import useDmVipBatchProbe from './useDmVipBatchProbe'
import useDmRepliesSeen from './useDmRepliesSeen'
import useDmUnreadState from './useDmUnreadState'
import useDmLocalCache from './useDmLocalCache'
import useDmLoadLifecycle from './useDmLoadLifecycle'
import useDmSeenObservers from './useDmSeenObservers'
import useDmDeleteController from './useDmDeleteController'
import usePublishedPostsModel from '../../feed/hooks/usePublishedPostsModel'
import { mergeForumEntitiesById } from '../../feed/utils/postMerge'
import {
  dmFetchCached as dmFetchCachedFlow,
  loadDmDialogs as loadDmDialogsFlow,
  loadDmThread as loadDmThreadFlow,
} from '../utils/dmLoaders'

const DM_REALTIME_SOURCE = 'messenger_messages'
const DM_REALTIME_THREAD_RETRY_MS = [0, 350, 900, 1800, 3200]
const DM_REALTIME_MIN_GAP_MS = 650

function normalizeDmRealtimeId(value) {
  return String(value || '').trim()
}

function realtimeMessageTs(item) {
  return Number(item?.ts || item?.lastMessage?.ts || 0)
}

function realtimeDedupeMessagesAsc(messages, deletedMap = {}) {
  const byId = new Map()
  const noId = []
  for (const item of Array.isArray(messages) ? messages : []) {
    const id = normalizeDmRealtimeId(item?.id)
    if (id && deletedMap[id]) continue
    if (!id) {
      noId.push(item)
      continue
    }
    const prev = byId.get(id)
    if (!prev || realtimeMessageTs(item) >= realtimeMessageTs(prev)) byId.set(id, item)
  }
  return [...noId, ...byId.values()]
    .sort((a, b) => realtimeMessageTs(a) - realtimeMessageTs(b))
}

function mergeRealtimeThreadItems(existing, incomingDesc, deletedMap = {}) {
  const current = Array.isArray(existing) ? existing : []
  const incomingAsc = (Array.isArray(incomingDesc) ? incomingDesc : []).slice().reverse()
  if (!incomingAsc.length) return current
  return realtimeDedupeMessagesAsc([...current, ...incomingAsc], deletedMap)
}

function resolveRealtimeDialogPeerId(dialog, meId = '') {
  const direct = normalizeDmRealtimeId(dialog?.userId)
  const last = dialog?.lastMessage || null
  const me = normalizeDmRealtimeId(meId)
  const fromCanonical = normalizeDmRealtimeId(last?.fromCanonical)
  const toCanonical = normalizeDmRealtimeId(last?.toCanonical)
  const fromRaw = normalizeDmRealtimeId(last?.from)
  const toRaw = normalizeDmRealtimeId(last?.to)

  if (me) {
    if (fromCanonical && fromCanonical === me) return toCanonical || toRaw || direct
    if (toCanonical && toCanonical === me) return fromCanonical || fromRaw || direct
    if (fromRaw && fromRaw === me) return toCanonical || toRaw || direct
    if (toRaw && toRaw === me) return fromCanonical || fromRaw || direct
  }
  return direct || fromCanonical || toCanonical || fromRaw || toRaw || ''
}

function mergeRealtimeDialogs(existing, incoming, meId = '') {
  const byUid = new Map()
  const add = (dialog) => {
    const uid = resolveRealtimeDialogPeerId(dialog, meId)
    if (!uid) return
    const normalized = { ...(dialog || {}), userId: uid }
    const prev = byUid.get(uid)
    const prevTs = realtimeMessageTs(prev)
    const nextTs = realtimeMessageTs(normalized)
    if (!prev || nextTs >= prevTs) byUid.set(uid, { ...(prev || {}), ...normalized })
  }
  ;(Array.isArray(existing) ? existing : []).forEach(add)
  ;(Array.isArray(incoming) ? incoming : []).forEach(add)
  return Array.from(byUid.values())
    .sort((a, b) => realtimeMessageTs(b) - realtimeMessageTs(a))
}

function isRealtimeRuntimeVisible() {
  if (typeof document === 'undefined') return false
  try {
    if (document.hidden) return false
    if (document.visibilityState && document.visibilityState !== 'visible') return false
    if (document.documentElement?.getAttribute?.('data-vo-open') === '1') return false
  } catch {}
  return true
}

function isMessengerRealtimePayload(detail) {
  const source = normalizeDmRealtimeId(detail?.source)
  if (source !== DM_REALTIME_SOURCE) return false
  const count = Math.max(0, Number(detail?.count ?? detail?.totalCount ?? 0) || 0)
  return count > 0 || detail?.pushReceived === true || detail?.forceSync === true
}


// QL7_GEO111_INBOX_REPLIES_SERVER_BRIDGE_V1
function mergeInboxReplyRows(existing, incoming) {
  return mergeForumEntitiesById(existing, incoming)
    .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0))
}

function scoreInboxReplyPost(post, postSort = 'new') {
  const ts = Number(post?.ts || 0)
  const likeCount = Number(post?.likes || post?.counters?.likes || 0)
  const dislikeCount = Number(post?.dislikes || post?.counters?.dislikes || 0)
  const likes = Math.max(
    Number(post?.reactions || post?.reactionCount || 0),
    Number(post?.counters?.reactions || post?.counters?.reactionCount || 0),
    Number(post?.sort?.likes || 0),
    (Number.isFinite(likeCount) ? likeCount : 0) + (Number.isFinite(dislikeCount) ? dislikeCount : 0),
  )
  const views = Math.max(Number(post?.views || 0), Number(post?.counters?.views || 0), Number(post?.sort?.views || 0))
  const replies = Math.max(
    Number(post?.replies || 0),
    Number(post?.replyCount || 0),
    Number(post?.repliesCount || 0),
    Number(post?.answersCount || 0),
    Number(post?.commentsCount || 0),
    Number(post?.__repliesCount || 0),
    Number(post?.counters?.replies || 0),
    Number(post?.counters?.replyCount || 0),
    Number(post?.counters?.repliesCount || 0),
    Number(post?.counters?.answersCount || 0),
    Number(post?.counters?.commentsCount || 0),
    Number(post?.sort?.replies || 0),
    Number(post?.sort?.replyCount || 0),
    Number(post?.sort?.repliesCount || 0),
    Number(post?.sort?.answersCount || 0),
    Number(post?.sort?.commentsCount || 0),
  )
  switch (String(postSort || 'new')) {
    case 'likes': return likes
    case 'views': return views
    case 'replies': return replies
    case 'top': return (likes * 2) + replies + Math.floor(views * 0.2)
    case 'new':
    default: return ts
  }
}

function messengerRealtimeCountFromState(detail) {
  const counts = detail?.counts && typeof detail.counts === 'object' ? detail.counts : {}
  return Math.max(0, Number(counts[DM_REALTIME_SOURCE]) || 0)
}

export default function useForumDmRuntime({
  isBrowserFn,
  auth,
  resolveProfileAccountIdFn,
  dataPosts,
  tombstones = null,
  forumDataReady = false,
  postSort = 'new',
  api,
  mergeProfileCacheFn,
  t,
  toast,
  bodyRef,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  requestAlignInboxStartUnderTabs,
  visibleRepliesCount,
  setVisibleRepliesCount,
  repliesPageSize,
  visiblePublishedCount,
  setVisiblePublishedCount,
  publishedPageSize,
  dmPageSize,
  dmActiveThrottleMs,
  dmBgThrottleMs,
}) {
  const [inboxOpen, setInboxOpen] = useState(false)
  const [inboxTab, setInboxTab] = useState('messages')
  const [dmWithUserId, setDmWithUserId] = useState('')
  const dmMode = inboxOpen && inboxTab === 'messages' && !!dmWithUserId
  const textLimit = dmMode ? 600 : 400

  const dmListEnterRef = useRef(false)
  const dmMessagesModeRef = useRef(false)
  const dmThreadRef = useRef(null)
  const dmAutoScrollRef = useRef(false)

  useEffect(() => {
    const isDmList = !!inboxOpen && inboxTab === 'messages' && !dmWithUserId
    if (isDmList && !dmListEnterRef.current) {
      headAutoOpenRef.current = false
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}
      requestAlignInboxStartUnderTabs()
    }
    dmListEnterRef.current = isDmList
  }, [
    inboxOpen,
    inboxTab,
    dmWithUserId,
    requestAlignInboxStartUnderTabs,
    bodyRef,
    headAutoOpenRef,
    setHeadHidden,
    setHeadPinned,
  ])

  useEffect(() => {
    const inMessagesMode = !!inboxOpen && inboxTab === 'messages'
    if (inMessagesMode && !dmMessagesModeRef.current) {
      // Quantum Messenger mode default: header stays collapsed
      // until user opens it manually.
      try { headAutoOpenRef.current = false } catch {}
      try { setHeadPinned(false) } catch {}
      try { setHeadHidden(true) } catch {}
    }
    dmMessagesModeRef.current = inMessagesMode
  }, [inboxOpen, inboxTab, headAutoOpenRef, setHeadHidden, setHeadPinned])

  const [dmDialogs, setDmDialogs] = useState([])
  const dmDialogsCount = dmDialogs?.length || 0
  const [dmDialogsCursor, setDmDialogsCursor] = useState(null)
  const [dmDialogsHasMore, setDmDialogsHasMore] = useState(true)
  const [dmDialogsLoading, setDmDialogsLoading] = useState(false)
  const [dmDialogsLoaded, setDmDialogsLoaded] = useState(false)

  const [dmThreadItems, setDmThreadItems] = useState([])
  const [dmThreadCursor, setDmThreadCursor] = useState(null)
  const [dmThreadHasMore, setDmThreadHasMore] = useState(true)
  const [dmThreadLoading, setDmThreadLoading] = useState(false)
  const [dmThreadSeenTs, setDmThreadSeenTs] = useState(0)
  const [dmTranslateMap, setDmTranslateMap] = useState({})

  const dmDialogsCacheRef = useRef(new Map())
  const dmDialogsInFlightRef = useRef(new Map())
  const dmThreadCacheRef = useRef(new Map())
  const dmThreadInFlightRef = useRef(new Map())
  const dmDialogsLastFetchRef = useRef({ active: 0, bg: 0 })
  const dmThreadLastFetchRef = useRef(new Map())
  const dmVipProbeRef = useRef({ key: '', ts: 0 })
  const dmRealtimeRef = useRef({ lastAt: 0, timer: null, inFlight: null, retryTimers: new Set() })

  const [dmBlockedByReceiverMap, setDmBlockedByReceiverMap] = useState({})

  const dmDialogsLoadingRef = useRef(false)
  const dmThreadLoadingRef = useRef(false)
  const [, setVipPulse] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { dmDialogsLoadingRef.current = !!dmDialogsLoading }, [dmDialogsLoading])
  useEffect(() => { dmThreadLoadingRef.current = !!dmThreadLoading }, [dmThreadLoading])

  const meId = String(resolveProfileAccountIdFn(auth?.asherId || auth?.accountId || '') || '').trim()
  const seenKey = meId ? `forum:seenReplies:${meId}` : null

  const {
    seenDmKey,
    dmBlockedKey,
    dmDeletedKey,
    dmDeletedMsgKey,
    dmSeenMap,
    markDmSeen,
    markDmSeenMany,
    dmBlockedMap,
    setDmBlockedMap,
    dmDeletedMap,
    setDmDeletedMap,
    dmDeletedMsgMap,
    setDmDeletedMsgMap,
  } = useDmStorageMaps({
    meId,
    resolveProfileAccountIdFn,
  })

  useDmThreadAutoScroll({
    inboxOpen,
    inboxTab,
    dmWithUserId,
    dmThreadItems,
    meId,
    resolveProfileAccountIdFn,
    dmAutoScrollRef,
    dmThreadRef,
    bodyRef,
    newestFirst: true,
  })

  const {
    repliesToMe: localRepliesToMe,
    sortedRepliesToMe: localSortedRepliesToMe,
    visibleRepliesToMe: localVisibleRepliesToMe,
    repliesHasMore: localRepliesHasMore,
  } = useInboxRepliesModel({
    meId,
    posts: dataPosts,
    tombstones,
    postSort,
    visibleRepliesCount,
    resolveProfileAccountIdFn,
  })

  const [serverRepliesToMe, setServerRepliesToMe] = useState([])
  const [serverRepliesCursor, setServerRepliesCursor] = useState(null)
  const [serverRepliesHasMore, setServerRepliesHasMore] = useState(false)
  const [serverRepliesLoading, setServerRepliesLoading] = useState(false)
  const [serverRepliesLoaded, setServerRepliesLoaded] = useState(false)
  const serverRepliesInFlightRef = useRef(false)
  const serverRepliesKeyRef = useRef('')

  const emitServerRepliesMerge = useCallback((posts, rev = 0) => {
    if (typeof window === 'undefined') return
    const safePosts = Array.isArray(posts) ? posts.filter(Boolean) : []
    if (!safePosts.length) return
    window.dispatchEvent(new CustomEvent('forum:server-items-merge', {
      detail: {
        source: 'inbox_replies_server_page',
        posts: safePosts,
        topics: [],
        rev: Number(rev || Date.now()) || Date.now(),
      },
    }))
  }, [])

  const loadInboxRepliesPage = useCallback(async ({ reset = false, reason = 'manual' } = {}) => {
    void reason
    if (!meId || typeof api?.inboxRepliesPage !== 'function') return { ok: false, skipped: true, reason: 'missing_api_or_user' }
    if (serverRepliesInFlightRef.current) return { ok: false, skipped: true, reason: 'in_flight' }
    if (!reset && !serverRepliesHasMore && serverRepliesLoaded) return { ok: true, skipped: true, reason: 'no_more' }

    serverRepliesInFlightRef.current = true
    setServerRepliesLoading(true)
    try {
      const limit = Math.max(Number(repliesPageSize || 0) || 0, 20)
      const cursor = reset ? null : serverRepliesCursor
      const payload = { userId: meId, accountId: meId, limit, pageSize: limit }
      if (cursor) payload.cursor = cursor
      const response = await api.inboxRepliesPage(payload)
      if (!response?.ok) return response || { ok: false, error: 'inbox_replies_page_failed' }
      const rows = Array.isArray(response.items)
        ? response.items
        : Array.isArray(response.posts)
          ? response.posts
          : []
      setServerRepliesToMe((prev) => mergeInboxReplyRows(reset ? [] : prev, rows))
      setServerRepliesCursor(response.nextCursor || null)
      setServerRepliesHasMore(Boolean(response.hasMore || response.nextCursor))
      setServerRepliesLoaded(true)
      emitServerRepliesMerge(rows, response.rev)
      return { ok: true, count: rows.length, hasMore: Boolean(response.hasMore || response.nextCursor) }
    } catch (error) {
      return { ok: false, error: String(error?.message || error || 'network') }
    } finally {
      serverRepliesInFlightRef.current = false
      setServerRepliesLoading(false)
    }
  }, [
    api,
    emitServerRepliesMerge,
    meId,
    repliesPageSize,
    serverRepliesCursor,
    serverRepliesHasMore,
    serverRepliesLoaded,
  ])

  useEffect(() => {
    if (!mounted || !meId) return
    if (!inboxOpen || inboxTab !== 'replies') return
    const key = `${meId}:${postSort || 'new'}`
    if (serverRepliesKeyRef.current !== key) {
      serverRepliesKeyRef.current = key
      setServerRepliesToMe([])
      setServerRepliesCursor(null)
      setServerRepliesHasMore(false)
      setServerRepliesLoaded(false)
      setTimeout(() => { loadInboxRepliesPage({ reset: true, reason: 'open_or_sort' }) }, 0)
      return
    }
    if (!serverRepliesLoaded && !serverRepliesLoading) {
      setTimeout(() => { loadInboxRepliesPage({ reset: true, reason: 'open_missing' }) }, 0)
    }
  }, [
    inboxOpen,
    inboxTab,
    loadInboxRepliesPage,
    meId,
    mounted,
    postSort,
    serverRepliesLoaded,
    serverRepliesLoading,
  ])

  useEffect(() => {
    if (!serverRepliesLoaded) return
    if (!inboxOpen || inboxTab !== 'replies') return
    if (!serverRepliesHasMore || serverRepliesLoading) return
    if (visibleRepliesCount < Math.max(0, serverRepliesToMe.length - 2)) return
    loadInboxRepliesPage({ reset: false, reason: 'visible_count_near_tail' })
  }, [
    inboxOpen,
    inboxTab,
    loadInboxRepliesPage,
    serverRepliesHasMore,
    serverRepliesLoaded,
    serverRepliesLoading,
    serverRepliesToMe.length,
    visibleRepliesCount,
  ])

  const serverSortedRepliesToMe = useMemo(() => {
    return mergeInboxReplyRows([], serverRepliesToMe).sort((a, b) => {
      const bScore = scoreInboxReplyPost(b, postSort)
      const aScore = scoreInboxReplyPost(a, postSort)
      if (bScore !== aScore) return bScore - aScore
      return Number(b?.ts || 0) - Number(a?.ts || 0)
    })
  }, [postSort, serverRepliesToMe])

  const repliesToMe = serverRepliesLoaded ? serverSortedRepliesToMe : localRepliesToMe
  const sortedRepliesToMe = serverRepliesLoaded ? serverSortedRepliesToMe : localSortedRepliesToMe
  const visibleRepliesToMe = useMemo(
    () => (serverRepliesLoaded ? serverSortedRepliesToMe.slice(0, visibleRepliesCount) : localVisibleRepliesToMe),
    [localVisibleRepliesToMe, serverRepliesLoaded, serverSortedRepliesToMe, visibleRepliesCount],
  )
  const repliesHasMore = serverRepliesLoaded
    ? (visibleRepliesToMe.length < serverSortedRepliesToMe.length || serverRepliesHasMore)
    : localRepliesHasMore

  useEffect(() => {
    if (!inboxOpen) return
    setVisibleRepliesCount(repliesPageSize)
  }, [inboxOpen, repliesToMe.length, setVisibleRepliesCount, repliesPageSize])

  useEffect(() => {
    if (!inboxOpen) return
    setVisiblePublishedCount(publishedPageSize)
  }, [inboxOpen, meId, dataPosts?.length, setVisiblePublishedCount, publishedPageSize])

  useEffect(() => {
    if (!inboxOpen) {
      setDmWithUserId('')
      return
    }
  }, [inboxOpen])

  useEffect(() => {
    setDmTranslateMap({})
  }, [dmWithUserId])

  useDmVipBatchProbe({
    inboxOpen,
    inboxTab,
    meId,
    dmWithUserId,
    dmDialogs,
    resolveProfileAccountIdFn,
    dmVipProbeRef,
    api,
    mergeProfileCacheFn,
    setVipPulse,
  })

  const { unreadCount } = useDmRepliesSeen({
    seenKey,
    meId,
    mounted,
    inboxOpen,
    inboxTab,
    visibleRepliesToMe,
    repliesToMe,
  })

  const { dmUnreadCount } = useDmUnreadState({
    mounted,
    dmDialogs,
    dmSeenMap,
    dmDeletedMap,
    meId,
    resolveProfileAccountIdFn,
    dmDeletedKey,
    setDmDeletedMap,
    dmWithUserId,
    dmThreadItems,
  })

  useEffect(() => {
    if (!forumDataReady) return
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('ql7:notification-count', {
      detail: {
        source: 'messenger_replies',
        count: Math.max(0, Number(unreadCount) || 0),
        canonicalForumUnread: true,
      },
    }))
  }, [forumDataReady, unreadCount])

  useEffect(() => {
    if (!dmDialogsLoaded) return
    if (typeof window === 'undefined') return
    window.dispatchEvent(new CustomEvent('ql7:notification-count', {
      detail: {
        source: 'messenger_messages',
        count: Math.max(0, Number(dmUnreadCount) || 0),
      },
    }))
  }, [dmDialogsLoaded, dmUnreadCount])

  const dmFetchCached = useCallback(async (cacheRef, inflightRef, key, url, opts = {}) => {
    return dmFetchCachedFlow({
      meId,
      cacheRef,
      inflightRef,
      key,
      url,
      opts,
      fetchImpl: fetch,
    })
  }, [meId])

  const loadDmDialogs = useCallback(async (cursor = null, opts = {}) => {
    return loadDmDialogsFlow(cursor, opts, {
      meId,
      dmDialogsHasMore,
      dmDialogsLoadingRef,
      dmDialogsLastFetchRef,
      DM_BG_THROTTLE_MS: dmBgThrottleMs,
      DM_ACTIVE_THROTTLE_MS: dmActiveThrottleMs,
      DM_PAGE_SIZE: dmPageSize,
      setDmDialogsLoading,
      dmFetchCachedFn: dmFetchCached,
      dmDialogsCacheRef,
      dmDialogsInFlightRef,
      setDmDialogs,
      setDmDialogsCursor,
      setDmDialogsHasMore,
      setDmDialogsLoaded,
    })
  }, [meId, dmDialogsHasMore, dmBgThrottleMs, dmActiveThrottleMs, dmPageSize, dmFetchCached])

  const loadDmThread = useCallback(async (withUserId, cursor = null, opts = {}) => {
    return loadDmThreadFlow(withUserId, cursor, opts, {
      meId,
      dmThreadHasMore,
      dmThreadLoadingRef,
      dmThreadLastFetchRef,
      DM_ACTIVE_THROTTLE_MS: dmActiveThrottleMs,
      DM_PAGE_SIZE: dmPageSize,
      setDmThreadLoading,
      dmFetchCachedFn: dmFetchCached,
      dmThreadCacheRef,
      dmThreadInFlightRef,
      dmDeletedMsgMap,
      setDmThreadItems,
      setDmThreadCursor,
      setDmThreadHasMore,
      setDmThreadSeenTs,
    })
  }, [meId, dmThreadHasMore, dmActiveThrottleMs, dmPageSize, dmFetchCached, dmDeletedMsgMap])

  const fetchDmDialogsRealtime = useCallback(async (reason = 'dm-realtime') => {
    if (!meId) return null
    const qs = new URLSearchParams()
    qs.set('limit', String(dmPageSize))
    qs.set('rt', String(Date.now()))
    const response = await fetch(`/api/dm/dialogs?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-forum-user-id': String(meId),
        'x-auth-account-id': String(meId),
        'x-ql7-dm-refresh-reason': String(reason),
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) return payload
    const incoming = Array.isArray(payload.items) ? payload.items : []
    setDmDialogs((prev) => mergeRealtimeDialogs(prev, incoming, meId))
    setDmDialogsCursor(payload.nextCursor || null)
    setDmDialogsHasMore(!!payload.hasMore)
    setDmDialogsLoaded(true)
    return payload
  }, [meId, dmPageSize])

  const fetchDmThreadRealtime = useCallback(async (withUserId, reason = 'dm-realtime-thread') => {
    const uid = String(withUserId || '').trim()
    if (!meId || !uid) return null
    const qs = new URLSearchParams()
    qs.set('limit', String(dmPageSize))
    qs.set('dir', 'older')
    qs.set('with', uid)
    qs.set('rt', String(Date.now()))
    try { dmAutoScrollRef.current = true } catch {}
    const response = await fetch(`/api/dm/thread?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'x-forum-user-id': String(meId),
        'x-auth-account-id': String(meId),
        'x-ql7-dm-refresh-reason': String(reason),
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) return payload
    const incoming = Array.isArray(payload.items) ? payload.items : []
    setDmThreadItems((prev) => mergeRealtimeThreadItems(prev, incoming, dmDeletedMsgMap))
    setDmThreadCursor(payload.nextCursor || null)
    setDmThreadHasMore(!!payload.hasMore)
    setDmThreadSeenTs(Number(payload.peerSeenTs || 0))
    return payload
  }, [meId, dmPageSize, dmDeletedMsgMap])

  const runDmRealtimeRefresh = useCallback((reason = 'dm-realtime') => {
    if (!meId || typeof window === 'undefined') return
    if (!isRealtimeRuntimeVisible()) return

    const state = dmRealtimeRef.current || {}
    const run = () => {
      const current = dmRealtimeRef.current || {}
      if (current.inFlight) return current.inFlight

      for (const timer of current.retryTimers || []) {
        try { window.clearTimeout(timer) } catch {}
      }
      const retryTimers = new Set()
      const request = Promise.resolve()
        .then(() => fetchDmDialogsRealtime(reason))
        .then(() => {
          const uid = String(dmWithUserId || '').trim()
          if (!uid || !inboxOpen || inboxTab !== 'messages') return null
          for (const delay of DM_REALTIME_THREAD_RETRY_MS) {
            const timer = window.setTimeout(() => {
              if (!isRealtimeRuntimeVisible()) return
              const currentUid = String(dmWithUserId || '').trim()
              if (!currentUid || currentUid !== uid) return
              fetchDmThreadRealtime(uid, `${reason}:thread-${delay}`).catch(() => null)
              try { dmRealtimeRef.current?.retryTimers?.delete?.(timer) } catch {}
            }, delay)
            retryTimers.add(timer)
          }
          return null
        })
        .catch(() => null)
        .finally(() => {
          if (dmRealtimeRef.current?.inFlight === request) {
            dmRealtimeRef.current = {
              ...(dmRealtimeRef.current || {}),
              inFlight: null,
            }
          }
        })

      dmRealtimeRef.current = {
        ...(dmRealtimeRef.current || {}),
        inFlight: request,
        lastAt: Date.now(),
        timer: null,
        retryTimers,
      }
      return request
    }

    if (state.timer) return
    if (state.inFlight) return
    const wait = Math.max(0, DM_REALTIME_MIN_GAP_MS - (Date.now() - Number(state.lastAt || 0)))
    const timer = window.setTimeout(run, wait)
    dmRealtimeRef.current = {
      ...(dmRealtimeRef.current || {}),
      timer,
    }
  }, [
    meId,
    inboxOpen,
    inboxTab,
    dmWithUserId,
    fetchDmDialogsRealtime,
    fetchDmThreadRealtime,
  ])

  useEffect(() => {
    if (!mounted || !meId) return
    if (!inboxOpen || inboxTab !== 'messages') return
    const uid = String(dmWithUserId || '').trim()
    if (!uid) return
    if (!isRealtimeRuntimeVisible()) return

    // Every real dialog open must ask the server for the latest thread window.
    // This bypasses the old loader throttle/cache path and preserves delivered/seen checks
    // because it still calls the same /api/dm/thread endpoint.
    ;[0, 250, 900].forEach((delay) => {
      const timer = window.setTimeout(() => {
        const currentUid = String(dmWithUserId || '').trim()
        if (currentUid !== uid || !isRealtimeRuntimeVisible()) return
        fetchDmThreadRealtime(uid, `open-thread-${delay}`).catch(() => null)
      }, delay)
      try { dmRealtimeRef.current?.retryTimers?.add?.(timer) } catch {}
    })
  }, [mounted, meId, inboxOpen, inboxTab, dmWithUserId, fetchDmThreadRealtime])

  useEffect(() => {
    if (!mounted || !meId) return undefined
    if (typeof window === 'undefined') return undefined

    const onNotificationState = (event) => {
      if (messengerRealtimeCountFromState(event?.detail || {}) <= 0) return
      runDmRealtimeRefresh('notification-state')
    }
    const onNotificationCount = (event) => {
      if (!isMessengerRealtimePayload(event?.detail || {})) return
      runDmRealtimeRefresh('notification-count')
    }
    const onOpenNotification = (event) => {
      if (!isMessengerRealtimePayload(event?.detail || {})) return
      runDmRealtimeRefresh('open-notification')
    }
    const onWorkerMessage = (event) => {
      if (event?.data?.type !== 'ql7:notification-received') return
      if (!isMessengerRealtimePayload(event?.data || {})) return
      runDmRealtimeRefresh('service-worker-push')
    }

    window.addEventListener('ql7:notification-state', onNotificationState)
    window.addEventListener('ql7:notification-count', onNotificationCount)
    window.addEventListener('ql7:open-notification', onOpenNotification)
    try { navigator.serviceWorker?.addEventListener?.('message', onWorkerMessage) } catch {}

    const currentState = window.__QL7_NOTIFICATION_STATE__
    if (messengerRealtimeCountFromState(currentState || {}) > 0) {
      runDmRealtimeRefresh('mounted-notification-state')
    }

    return () => {
      window.removeEventListener('ql7:notification-state', onNotificationState)
      window.removeEventListener('ql7:notification-count', onNotificationCount)
      window.removeEventListener('ql7:open-notification', onOpenNotification)
      try { navigator.serviceWorker?.removeEventListener?.('message', onWorkerMessage) } catch {}
      const state = dmRealtimeRef.current || {}
      if (state.timer) {
        try { window.clearTimeout(state.timer) } catch {}
      }
      for (const timer of state.retryTimers || []) {
        try { window.clearTimeout(timer) } catch {}
      }
      dmRealtimeRef.current = {
        ...(dmRealtimeRef.current || {}),
        timer: null,
        retryTimers: new Set(),
      }
    }
  }, [mounted, meId, runDmRealtimeRefresh])

  useDmLocalCache({
    isBrowserFn,
    meId,
    dmWithUserId,
    dmDeletedMap,
    dmDialogs,
    dmDialogsCursor,
    dmDialogsHasMore,
    dmThreadItems,
    dmThreadCursor,
    dmThreadHasMore,
    dmThreadSeenTs,
    setDmDialogs,
    setDmDialogsCursor,
    setDmDialogsHasMore,
    setDmDialogsLoaded,
    setDmThreadItems,
    setDmThreadCursor,
    setDmThreadHasMore,
    setDmThreadSeenTs,
    setDmThreadLoading,
  })

  useDmLoadLifecycle({
    mounted,
    meId,
    inboxOpen,
    inboxTab,
    dmDialogsLoaded,
    dmDialogsCount,
    dmWithUserId,
    setDmWithUserId,
    loadDmDialogs,
    loadDmThread,
    dmBgThrottleMs,
    dmActiveThrottleMs,
  })

  useDmSeenObservers({
    mounted,
    inboxOpen,
    inboxTab,
    dmWithUserId,
    dmThreadItems,
    meId,
    markDmSeen,
    markDmSeenMany,
    resolveProfileAccountIdFn,
    dmDialogs,
  })

  const {
    myPublishedPosts,
    visiblePublishedPosts,
    publishedHasMore,
    publishedTotalCount,
    publishedServerLoading,
    loadPublishedPostsPage,
  } = usePublishedPostsModel({
    meId,
    posts: dataPosts,
    tombstones,
    postSort,
    visiblePublishedCount,
    resolveProfileAccountIdFn,
    api,
    pageSize: publishedPageSize,
  })

  const {
    dmDeletePopover,
    setDmDeletePopover,
    dmDeleteForAll,
    setDmDeleteForAll,
    toggleDmBlock,
    openDmDeletePopover,
    closeDmDeletePopover,
    confirmDmDelete,
  } = useDmDeleteController({
    meId,
    dmBlockedMap,
    dmBlockedKey,
    setDmBlockedMap,
    dmDialogs,
    setDmDialogs,
    dmThreadItems,
    dmWithUserId,
    setDmWithUserId,
    dmDeletedMap,
    dmDeletedKey,
    setDmDeletedMap,
    dmDeletedMsgMap,
    dmDeletedMsgKey,
    setDmDeletedMsgMap,
    setDmThreadItems,
    loadDmDialogs,
    t,
    toast,
  })

  return {
    inboxOpen,
    setInboxOpen,
    inboxTab,
    setInboxTab,
    dmWithUserId,
    setDmWithUserId,
    dmMode,
    textLimit,
    dmThreadRef,
    dmDialogs,
    setDmDialogs,
    dmDialogsCursor,
    dmDialogsHasMore,
    dmDialogsLoading,
    dmDialogsLoaded,
    dmThreadItems,
    setDmThreadItems,
    dmThreadCursor,
    dmThreadHasMore,
    dmThreadLoading,
    dmThreadSeenTs,
    dmTranslateMap,
    setDmTranslateMap,
    dmDialogsCacheRef,
    dmThreadCacheRef,
    dmBlockedByReceiverMap,
    setDmBlockedByReceiverMap,
    mounted,
    meId,
    dmSeenMap,
    dmBlockedMap,
    dmDeletedMap,
    dmDeletedMsgMap,
    loadDmDialogs,
    loadDmThread,
    repliesToMe,
    sortedRepliesToMe,
    visibleRepliesToMe,
    repliesHasMore,
    serverRepliesHasMore,
    serverRepliesLoading,
    serverRepliesLoaded,
    loadInboxRepliesPage,
    unreadCount,
    dmUnreadCount,
    myPublishedPosts,
    publishedTotalCount,
    visiblePublishedPosts,
    publishedHasMore,
    // QL7_GEO111_PUBLISHED_POSTS_RUNTIME_BRIDGE_V1
    publishedServerLoading,
    loadPublishedPostsPage,
    dmDeletePopover,
    setDmDeletePopover,
    dmDeleteForAll,
    setDmDeleteForAll,
    toggleDmBlock,
    openDmDeletePopover,
    closeDmDeletePopover,
    confirmDmDelete,
  }
}
