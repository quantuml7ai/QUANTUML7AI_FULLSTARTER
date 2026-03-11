import { useCallback, useEffect, useRef, useState } from 'react'
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
import {
  dmFetchCached as dmFetchCachedFlow,
  loadDmDialogs as loadDmDialogsFlow,
  loadDmThread as loadDmThreadFlow,
} from '../utils/dmLoaders'

export default function useForumDmRuntime({
  isBrowserFn,
  auth,
  resolveProfileAccountIdFn,
  dataPosts,
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
  })

  const {
    repliesToMe,
    sortedRepliesToMe,
    visibleRepliesToMe,
    repliesHasMore,
  } = useInboxRepliesModel({
    meId,
    posts: dataPosts,
    visibleRepliesCount,
    resolveProfileAccountIdFn,
  })

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
  })

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

  useDmLocalCache({
    isBrowserFn,
    meId,
    dmWithUserId,
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
    resolveProfileAccountIdFn,
    dmDialogs,
    dmDeletedMap,
    seenDmKey,
  })

  const {
    myPublishedPosts,
    visiblePublishedPosts,
    publishedHasMore,
  } = usePublishedPostsModel({
    meId,
    posts: dataPosts,
    visiblePublishedCount,
    resolveProfileAccountIdFn,
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
    unreadCount,
    dmUnreadCount,
    myPublishedPosts,
    visiblePublishedPosts,
    publishedHasMore,
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
