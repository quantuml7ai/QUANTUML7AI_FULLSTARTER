import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useDmStorageMaps from './useDmStorageMaps.js'
import useDmThreadAutoScroll from './useDmThreadAutoScroll.js'
import useInboxRepliesModel from './useInboxRepliesModel.js'
import useDmVipBatchProbe from './useDmVipBatchProbe.js'
import useDmRepliesSeen from './useDmRepliesSeen.js'
import useDmUnreadState from './useDmUnreadState.js'
import useDmLocalCache from './useDmLocalCache.js'
import useDmLoadLifecycle from './useDmLoadLifecycle.js'
import useDmSeenObservers from './useDmSeenObservers.js'
import useDmDeleteController from './useDmDeleteController.js'
import usePublishedPostsModel from '../../feed/hooks/usePublishedPostsModel.js'
import { mergeForumEntitiesById } from '../../feed/utils/postMerge.js'
import { normalizeQl7SupportOperatorState } from '../../../../../lib/ql7-support/ecosystemCatalog.js'
import { shouldApplyQl7SupportRuntimeEvent } from '../services/ql7SupportRuntimeStateReducer.js'
import { normalizeQl7SupportInputPolicy } from '../../../../../lib/ql7-support/inputPolicy.js'
import { advanceDmThreadOwner, captureDmThreadOwner as captureDmThreadOwnershipToken, isDmThreadOwnerCurrent as isDmThreadOwnershipCurrent } from '../utils/threadOwnership.js'
import { isQl7SupportActive } from '../../../../../lib/ql7-support/config/featureFlag.js'
import {
  fetchQl7SupportAuthenticated,
  resetQl7SupportAuthCircuit,
  readQl7SupportAuthSnapshot,
  isQl7SupportPeerId,
  waitForQl7SupportAuthReady,
} from '../services/supportAuthClient.js'
import {
  dialogMatchesUser,
  dmFetchCached as dmFetchCachedFlow,
  filterServerDeletedDialogs,
  loadDmDialogs as loadDmDialogsFlow,
  loadDmThread as loadDmThreadFlow,
  normalizeServerDeletedDialogs,
  persistDeletedDialogs,
  dedupeDmThreadMessagesExact,
} from '../utils/dmLoaders.js'

const DM_REALTIME_SOURCE = 'messenger_messages'
const DM_THREAD_SEEN_SCAN_EVENT = 'ql7:dm-thread-scan-seen'
const DM_REALTIME_THREAD_RETRY_MS = [0, 350, 900, 1800, 3200]
const DM_REALTIME_MIN_GAP_MS = 650
const QL7_SUPPORT_AUTH_EVENT_DEDUPE_MS = 2500
const QL7_SUPPORT_THREAD_MIN_GAP_MS = 1600

function normalizeQl7SupportUiState(value) {
  return normalizeQl7SupportOperatorState(value)
}

function normalizeDmRealtimeId(value) {
  return String(value || '').trim()
}

function realtimeMessageTs(item) {
  return Number(item?.ts || item?.lastMessage?.ts || 0)
}

function realtimeDedupeMessagesAsc(messages, deletedMap = {}) {
  return dedupeDmThreadMessagesExact(Array.isArray(messages) ? messages : [])
    .filter((item) => !deletedMap[normalizeDmRealtimeId(item?.id)])
    .sort((a, b) => realtimeMessageTs(a) - realtimeMessageTs(b))
}

function isRealtimeOptimisticMessage(item) {
  const id = normalizeDmRealtimeId(item?.id)
  return (
    String(item?.status || '') === 'sending' ||
    (!!id && id.startsWith('tmp_dm_'))
  )
}

function mergeRealtimeThreadItems(existing, incomingDesc, deletedMap = {}, options = {}) {
  const current = Array.isArray(existing) ? existing : []
  const incomingAsc = (Array.isArray(incomingDesc) ? incomingDesc : []).slice().reverse()
  const filteredCurrent = current.filter((item) => !deletedMap[normalizeDmRealtimeId(item?.id)])
  if (!incomingAsc.length) return filteredCurrent

  let base = filteredCurrent
  if (options?.authoritative === true) {
    const incomingIds = new Set(incomingAsc.map((item) => normalizeDmRealtimeId(item?.id)).filter(Boolean))
    const incomingTs = incomingAsc
      .map((item) => realtimeMessageTs(item))
      .filter((ts) => Number.isFinite(ts) && ts > 0)
    const minIncomingTs = incomingTs.length ? Math.min(...incomingTs) : 0
    const maxIncomingTs = incomingTs.length ? Math.max(...incomingTs) : 0
    if (minIncomingTs && maxIncomingTs) {
      base = filteredCurrent.filter((item) => {
        if (isRealtimeOptimisticMessage(item)) return true
        const id = normalizeDmRealtimeId(item?.id)
        if (!id || incomingIds.has(id)) return true
        const ts = realtimeMessageTs(item)
        return !(ts >= minIncomingTs && ts <= maxIncomingTs)
      })
    }
  }

  return realtimeDedupeMessagesAsc([...base, ...incomingAsc], deletedMap)
}

function dispatchDmThreadSeenScan(uid, reason = 'dm-thread-refresh') {
  if (typeof window === 'undefined') return
  const targetUid = normalizeDmRealtimeId(uid)
  if (!targetUid) return
  const detail = {
    uid: targetUid,
    reason: String(reason || '').trim().slice(0, 80),
    ts: Date.now(),
  }
  const emit = () => {
    try {
      window.dispatchEvent(new CustomEvent(DM_THREAD_SEEN_SCAN_EVENT, { detail }))
    } catch {}
  }
  emit()
  try { window.setTimeout(emit, 80) } catch {}
  try { window.setTimeout(emit, 240) } catch {}
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
  if (!detail || typeof detail !== 'object') return false
  if (detail?.clientOnly === true || detail?.localUnreadProjection === true) return false
  const source = normalizeDmRealtimeId(detail?.source || detail?.data?.source || detail?.payload?.source)
  const counts = detail?.counts && typeof detail.counts === 'object' ? detail.counts : null
  const count = Math.max(
    0,
    Number(detail?.count ?? 0) || 0,
    Number(detail?.totalCount ?? 0) || 0,
    Number(counts?.[DM_REALTIME_SOURCE] ?? 0) || 0,
  )
  const sourceMatches = source === DM_REALTIME_SOURCE
  if (sourceMatches && (detail?.forceSync === true || detail?.pushReceived === true)) return true
  return sourceMatches ? count >= 0 : count > 0
}

function restoreDmThreadViewportAfterSupportMerge() {
  if (typeof document === 'undefined') return () => {}
  const root = document.querySelector('.dmThread[data-dm-thread-order="newest-first"]') || document.querySelector('.dmThread')
  if (!root) return () => {}
  const beforeTop = Number(root.scrollTop || 0)
  return () => {
    try {
      root.scrollTop = Math.max(0, beforeTop)
      window.requestAnimationFrame?.(() => {
        try { root.scrollTop = Math.max(0, beforeTop) } catch {}
      })
    } catch {}
  }
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

function persistDmRuntimeMapEntry(storageKey, id, value) {
  const key = String(storageKey || '').trim()
  const safeId = normalizeDmRealtimeId(id)
  if (!key || !safeId || typeof localStorage === 'undefined') return
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}') || {}
    const next = raw && typeof raw === 'object' && !Array.isArray(raw) ? { ...raw } : {}
    next[safeId] = value
    localStorage.setItem(key, JSON.stringify(next))
  } catch {}
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
  locale = '',
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
  const dmDeletedComposeOpenRef = useRef(new Set())

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
  const meId = String(resolveProfileAccountIdFn(auth?.asherId || auth?.accountId || '') || '').trim()
  const dmThreadOwnerRef = useRef({ accountId: '', conversationKind: 'peer_dm', conversationId: '', generation: 0 })
  const ownerInputFor = useCallback((withUserId) => {
    const conversationId = normalizeDmRealtimeId(withUserId)
    return { accountId: meId, conversationKind: isQl7SupportPeerId(conversationId) ? 'system_support' : 'peer_dm', conversationId }
  }, [meId])

  useEffect(() => {
    dmThreadOwnerRef.current = advanceDmThreadOwner(dmThreadOwnerRef.current, ownerInputFor(dmWithUserId))
  }, [dmWithUserId, ownerInputFor])

  const captureDmThreadOwner = useCallback((withUserId) => captureDmThreadOwnershipToken(dmThreadOwnerRef.current, ownerInputFor(withUserId)), [ownerInputFor])
  const isDmThreadOwnerCurrent = useCallback((token) => isDmThreadOwnershipCurrent(dmThreadOwnerRef.current, token), [])
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
  const dmRealtimeRef = useRef({ lastAt: 0, timer: null, inFlight: null, retryTimers: new Set(), supportThreadInFlight: null, supportAuthBlocked: false, supportAuthKey: '', supportAuthVerifiedRetryKey: '', supportAuthEventAt: 0, supportThreadLastAt: 0 })
  const ql7SupportUiTimerRef = useRef(null)
  const [ql7SupportUi, setQl7SupportUi] = useState({
    supportUiState: 'idle',
    caseId: '',
    correlationId: '',
    changedAt: 0,
    nextAfterDelivered: 'idle',
    inputPolicy: null,
    attemptId: '',
    sequence: 0,
    stateVersion: 0,
    phaseRank: 0,
    terminal: false,
    stateReceipt: null,
  })

  const [dmBlockedByReceiverMap, setDmBlockedByReceiverMap] = useState({})

  const dmDialogsLoadingRef = useRef(false)
  const dmThreadLoadingRef = useRef(false)
  const [, setVipPulse] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => () => {
    try {
      if (ql7SupportUiTimerRef.current) window.clearTimeout(ql7SupportUiTimerRef.current)
    } catch {}
  }, [])
  useEffect(() => { dmDialogsLoadingRef.current = !!dmDialogsLoading }, [dmDialogsLoading])
  // dmThreadLoadingRef stores the owning peer id; UI loading boolean is intentionally separate.

  const setQl7SupportUiEvent = useCallback((event = {}) => {
    const changedAt = Number(event.changedAt || Date.now())
    const normalizedPolicy = event.inputPolicy && typeof event.inputPolicy === 'object'
      ? normalizeQl7SupportInputPolicy(event.inputPolicy, { now: Date.now, locale: event.inputPolicy?.locale || locale || 'en' })
      : null
    const requestedState = normalizeQl7SupportUiState(event.supportUiState)
    const supportUiState = requestedState === 'cooldown' && normalizedPolicy?.allowed !== false
      ? 'answer_ready'
      : requestedState
    setQl7SupportUi((prev) => {
      const incomingCorrelation = normalizeDmRealtimeId(event.correlationId || prev?.correlationId)
      const incomingCaseId = normalizeDmRealtimeId(event.caseId || prev?.caseId)
      if (
        event.guardCurrent === true &&
        prev?.correlationId &&
        incomingCorrelation &&
        prev.correlationId !== incomingCorrelation
      ) return prev
      const orderedIncoming = {
        ...event,
        supportUiState,
        correlationId: incomingCorrelation,
        changedAt,
      }
      if (!shouldApplyQl7SupportRuntimeEvent(prev || {}, orderedIncoming)) return prev
      return {
        supportUiState,
        caseId: incomingCaseId,
        correlationId: incomingCorrelation,
        attemptId: normalizeDmRealtimeId(event.attemptId || event?.stateReceipt?.attemptId || prev?.attemptId),
        sequence: Number(event.sequence ?? event?.stateReceipt?.sequence ?? prev?.sequence ?? 0),
        stateVersion: Number(event.stateVersion ?? event?.stateReceipt?.stateVersion ?? prev?.stateVersion ?? 0),
        phaseRank: Number(event.phaseRank ?? event?.stateReceipt?.phaseRank ?? prev?.phaseRank ?? 0),
        terminal: event.terminal === true || event?.stateReceipt?.terminal === true,
        stateReceipt: event?.stateReceipt && typeof event.stateReceipt === 'object' ? event.stateReceipt : (prev?.stateReceipt || null),
        changedAt,
        caseStatus: normalizeDmRealtimeId(event.caseStatus || prev?.caseStatus),
        diagnosticStatus: normalizeDmRealtimeId(event.diagnosticStatus || prev?.diagnosticStatus),
        nextAfterDelivered: normalizeQl7SupportUiState(event.nextAfterDelivered || prev?.nextAfterDelivered || 'idle'),
        inputPolicy: normalizedPolicy || (prev?.inputPolicy || null),
      }
    })
  }, [locale])

  const handleQl7SupportOperatorDelivered = useCallback(({ caseId = '', correlationId = '' } = {}) => {
    const guardCaseId = normalizeDmRealtimeId(caseId)
    const guardCorrelationId = normalizeDmRealtimeId(correlationId)
    let finalState = 'idle'
    setQl7SupportUi((prev) => {
      if (guardCorrelationId && prev?.correlationId && prev.correlationId !== guardCorrelationId) return prev
      if (guardCaseId && prev?.caseId && prev.caseId !== guardCaseId) return prev
      finalState = normalizeQl7SupportUiState(prev?.nextAfterDelivered || 'idle')
      return {
        ...prev,
        supportUiState: 'answer_ready',
        changedAt: Date.now(),
      }
    })
    try {
      if (ql7SupportUiTimerRef.current) window.clearTimeout(ql7SupportUiTimerRef.current)
      ql7SupportUiTimerRef.current = window.setTimeout(() => {
        setQl7SupportUi((prev) => {
          if (guardCorrelationId && prev?.correlationId && prev.correlationId !== guardCorrelationId) return prev
          if (guardCaseId && prev?.caseId && prev.caseId !== guardCaseId) return prev
          if (prev?.supportUiState !== 'answer_ready') return prev
          return {
            ...prev,
            supportUiState: finalState,
            changedAt: Date.now(),
          }
        })
      }, 850)
    } catch {}
  }, [])

  useEffect(() => {
    const rawPolicy = ql7SupportUi?.inputPolicy
    if (!rawPolicy || (rawPolicy?.canSend !== false && rawPolicy?.allowed !== false)) return undefined
    const readyAtMs = Number(
      rawPolicy?.blockedUntilMs ||
      Date.parse(rawPolicy?.blockedUntil || '') ||
      rawPolicy?.readyAtMs ||
      Date.parse(rawPolicy?.readyAt || '') ||
      Date.parse(rawPolicy?.expiresAt || '') ||
      0
    )
    if (!readyAtMs) return undefined
    const release = () => {
      const policy = normalizeQl7SupportInputPolicy(rawPolicy, { now: Date.now, locale: rawPolicy?.locale || locale || 'en' })
      if (policy.allowed === false) return
      setQl7SupportUiEvent({
        supportUiState: 'answer_ready',
        caseId: ql7SupportUi?.caseId,
        correlationId: ql7SupportUi?.correlationId,
        changedAt: Date.now(),
        nextAfterDelivered: 'answer_ready',
        inputPolicy: policy,
      })
    }
    const delay = Math.max(0, readyAtMs - Date.now())
    if (delay <= 0) {
      release()
      return undefined
    }
    const timer = window.setTimeout(release, Math.min(delay + 80, 2147483000))
    return () => window.clearTimeout(timer)
  }, [locale, ql7SupportUi?.caseId, ql7SupportUi?.correlationId, ql7SupportUi?.inputPolicy, setQl7SupportUiEvent])

  useEffect(() => {
    if (!isQl7SupportPeerId(String(dmWithUserId || ''))) return
    const activeStates = new Set(['understanding', 'checking', 'analyzing', 'preparing_response'])
    if (!activeStates.has(String(ql7SupportUi?.supportUiState || ''))) return
    const rows = Array.isArray(dmThreadItems) ? dmThreadItems : []
    const latestReply = [...rows].reverse().find((item) => {
      const from = normalizeDmRealtimeId(item?.fromCanonical || item?.from)
      if (!isQl7SupportPeerId(from)) return false
      if (item?.metadata?.ephemeralEntry === true || item?.metadata?.idleNudge === true) return false
      return item?.metadata?.supportAutoReply === true || normalizeDmRealtimeId(item?.metadata?.correlationId || item?.correlationId)
    })
    if (!latestReply) return
    const replyCorrelation = normalizeDmRealtimeId(latestReply?.metadata?.correlationId || latestReply?.correlationId)
    const activeCorrelation = normalizeDmRealtimeId(ql7SupportUi?.correlationId)
    const replyTs = Number(latestReply?.ts || 0)
    if (activeCorrelation && replyCorrelation && activeCorrelation !== replyCorrelation) return
    if (!replyCorrelation && replyTs && replyTs + 1000 < Number(ql7SupportUi?.changedAt || 0)) return
    const nextStateRaw = normalizeDmRealtimeId(latestReply?.metadata?.nextState || latestReply?.metadata?.caseStatus)
    const nextAfterDelivered = nextStateRaw === 'waiting_choice'
      ? 'needs_clarification'
      : nextStateRaw === 'waiting_admin' || nextStateRaw === 'awaiting_admin' || nextStateRaw === 'admin_notified'
        ? 'attention_required'
        : nextStateRaw === 'waiting_user' || nextStateRaw === 'awaiting_user' || nextStateRaw === 'collecting_context' || nextStateRaw === 'partial'
          ? 'needs_clarification'
          : 'answer_ready'
    const readyPolicy = normalizeQl7SupportInputPolicy({
      ...(ql7SupportUi?.inputPolicy || {}),
      allowed: true,
      canSend: true,
      blockedUntilMs: 0,
      reasonCode: 'ready',
      reasonCategory: 'ready',
      runtimeStage: nextAfterDelivered,
      emergencyOverride: true,
    }, { now: Date.now, locale: ql7SupportUi?.inputPolicy?.locale || locale || 'en' })
    setQl7SupportUiEvent({
      supportUiState: 'answer_ready',
      caseId: normalizeDmRealtimeId(latestReply?.metadata?.caseId || ql7SupportUi?.caseId),
      correlationId: replyCorrelation || activeCorrelation,
      changedAt: replyTs || Date.now(),
      nextAfterDelivered,
      inputPolicy: readyPolicy,
    })
  }, [dmThreadItems, dmWithUserId, locale, ql7SupportUi, setQl7SupportUiEvent])

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

  const { dmUnreadCount: rawDmUnreadCount } = useDmUnreadState({
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
  const dmListMode = !!inboxOpen && inboxTab === 'messages' && !dmWithUserId
  const [dmUnreadCount, setDmUnreadCount] = useState(0)

  useEffect(() => {
    const next = Math.max(0, Number(rawDmUnreadCount) || 0)
    setDmUnreadCount((prevRaw) => {
      const prev = Math.max(0, Number(prevRaw) || 0)
      // The dialog list can be momentarily incomplete during realtime merges.
      // It may raise the local unread projection, but only the open thread
      // viewport + /api/dm/seen contour is allowed to lower it.
      if (dmListMode && next < prev) return prev
      return next
    })
  }, [dmListMode, rawDmUnreadCount])

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
        clientOnly: true,
        localUnreadProjection: true,
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
      dmDeletedKey,
      setDmDeletedMap,
    })
  }, [meId, dmDialogsHasMore, dmBgThrottleMs, dmActiveThrottleMs, dmPageSize, dmFetchCached, dmDeletedKey, setDmDeletedMap])

  const loadDmThread = useCallback(async (withUserId, cursor = null, opts = {}) => {
    const uid = normalizeDmRealtimeId(withUserId)
    const allowDeletedDialogCompose = uid && dmDeletedComposeOpenRef.current.has(uid)
    return loadDmThreadFlow(withUserId, cursor, allowDeletedDialogCompose ? { ...opts, allowDeletedDialogCompose: true } : opts, {
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
      dmDeletedKey,
      setDmDeletedMap,
      setDmDialogs,
      setDmWithUserId,
      setDmThreadItems,
      setDmThreadCursor,
      setDmThreadHasMore,
      setDmThreadSeenTs,
      locale,
      captureThreadOwner: captureDmThreadOwner,
      isThreadOwnerCurrent: isDmThreadOwnerCurrent,
    })
  }, [
    meId,
    dmThreadHasMore,
    dmActiveThrottleMs,
    dmPageSize,
    dmFetchCached,
    dmDeletedMsgMap,
    dmDeletedKey,
    setDmDeletedMap,
    setDmDialogs,
    setDmWithUserId,
    locale,
    captureDmThreadOwner,
    isDmThreadOwnerCurrent,
  ])

  const reopenDeletedDmDialog = useCallback((uid, rawUid = '') => {
    const candidates = [
      uid,
      rawUid,
      resolveProfileAccountIdFn(uid),
      resolveProfileAccountIdFn(rawUid),
    ].map(normalizeDmRealtimeId).filter(Boolean)
    if (!candidates.length) return
    for (const id of candidates) {
      dmDeletedComposeOpenRef.current.add(id)
      const key = `thr:${meId}:${id}::${dmPageSize}`
      try { dmThreadCacheRef.current.delete(key) } catch {}
      try { dmThreadInFlightRef.current.delete(key) } catch {}
    }
    setDmThreadItems([])
    setDmThreadCursor(null)
    setDmThreadHasMore(false)
    setDmThreadLoading(false)
  }, [meId, dmPageSize, resolveProfileAccountIdFn])

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
        'x-forum-locale': String(locale || ''),
        'x-ql7-dm-refresh-reason': String(reason),
      },
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok || !payload?.ok) return payload
    const serverDeleted = normalizeServerDeletedDialogs(payload.deletedDialogs)
    if (Object.keys(serverDeleted).length) {
      persistDeletedDialogs(dmDeletedKey, serverDeleted)
      setDmDeletedMap?.((prev) => {
        const next = { ...(prev || {}) }
        let changed = false
        for (const [key, value] of Object.entries(serverDeleted)) {
          const ts = Number(value || 0)
          if (!key || !ts || Number(next[key] || 0) >= ts) continue
          next[key] = ts
          changed = true
        }
        return changed ? next : prev
      })
    }
    const incoming = filterServerDeletedDialogs(
      (Array.isArray(payload.items) ? payload.items : []).filter((item) => isQl7SupportActive() || !isQl7SupportPeerId(String(item?.userId || ''))),
      serverDeleted,
      meId,
    )
    setDmDialogs((prev) => {
      const existing = filterServerDeletedDialogs(prev, serverDeleted, meId)
      const merged = mergeRealtimeDialogs(existing, incoming, meId)
      return filterServerDeletedDialogs(merged, serverDeleted, meId)
    })
    setDmDialogsCursor(payload.nextCursor || null)
    setDmDialogsHasMore(!!payload.hasMore)
    setDmDialogsLoaded(true)
    return payload
  }, [meId, dmPageSize, dmDeletedKey, setDmDeletedMap, locale])

  const fetchDmThreadRealtime = useCallback(async (withUserId, reason = 'dm-realtime-thread') => {
    const uid = String(withUserId || '').trim()
    if (!meId || !uid) return null
    const ownerToken = captureDmThreadOwner(uid)
    if (!isDmThreadOwnerCurrent(ownerToken)) return { ok: false, stale: true, error: 'dm_thread_owner_changed' }
    const supportRequest = isQl7SupportPeerId(uid)
    if (supportRequest && !isQl7SupportActive()) return { ok: false, error: 'ql7_support_disabled', supportActive: false }
    if (supportRequest && dmRealtimeRef.current?.supportThreadInFlight) {
      return dmRealtimeRef.current.supportThreadInFlight
    }
    if (supportRequest) {
      const elapsed = Date.now() - Number(dmRealtimeRef.current?.supportThreadLastAt || 0)
      const bypassGap = /(?:open-thread|support-auth-ready|send-final|manual)/i.test(String(reason || ''))
      if (!bypassGap && elapsed >= 0 && elapsed < QL7_SUPPORT_THREAD_MIN_GAP_MS) {
        return { ok: true, deferred: true, reason: 'support_thread_coalesced', retryAfterMs: QL7_SUPPORT_THREAD_MIN_GAP_MS - elapsed }
      }
    }

    const run = async () => {
      const qs = new URLSearchParams()
      qs.set('limit', String(dmPageSize))
      qs.set('dir', 'older')
      qs.set('with', uid)
      qs.set('rt', String(Date.now()))
      if (!supportRequest && !/support|realtime|thread|send-final/i.test(String(reason || ''))) {
        try { dmAutoScrollRef.current = true } catch {}
      }

      let response = null
      let payload = null
      if (supportRequest) {
        const auth = await waitForQl7SupportAuthReady({ timeoutMs: 12000 })
        if (!auth?.ready) return { ok: false, deferred: true, error: 'support_auth_not_ready' }
        const result = await fetchQl7SupportAuthenticated(`/api/dm/thread?${qs.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-forum-user-id': String(meId),
            'x-forum-locale': String(locale || ''),
            'x-ql7-dm-refresh-reason': String(reason),
          },
        }, { waitTimeoutMs: 12000, retryOnFreshAuth: true })
        response = result.response
        payload = result.data
        if (response?.status === 401) {
          dmRealtimeRef.current = {
            ...(dmRealtimeRef.current || {}),
            supportAuthBlocked: true,
            supportAuthKey: String(result.auth?.key || ''),
          }
          return payload || { ok: false, error: 'verified_session_required' }
        }
        dmRealtimeRef.current = {
          ...(dmRealtimeRef.current || {}),
          supportAuthBlocked: false,
          supportAuthKey: String(result.auth?.key || auth.key || ''),
          supportAuthVerifiedRetryKey: '',
        }
      } else {
        response = await fetch(`/api/dm/thread?${qs.toString()}`, {
          method: 'GET',
          cache: 'no-store',
          headers: {
            'x-forum-user-id': String(meId),
            'x-auth-account-id': String(meId),
            'x-forum-locale': String(locale || ''),
            'x-ql7-dm-refresh-reason': String(reason),
          },
        })
        payload = await response.json().catch(() => null)
      }

      if (!response?.ok || !payload?.ok) return payload
      if (!isDmThreadOwnerCurrent(ownerToken)) return { ok: false, stale: true, error: 'dm_thread_owner_changed' }
      const incoming = Array.isArray(payload.items) ? payload.items : []
      const dialogDeletedAt = Number(payload.dialogDeletedAt || 0)
      const allowDeletedDialogCompose = dmDeletedComposeOpenRef.current.has(uid)
      if (dialogDeletedAt && !incoming.length) {
        if (!isDmThreadOwnerCurrent(ownerToken)) return { ok: false, stale: true, error: 'dm_thread_owner_changed' }
        const serverDeleted = { [uid]: dialogDeletedAt }
        persistDeletedDialogs(dmDeletedKey, serverDeleted)
        setDmDeletedMap?.((prev) => {
          const next = { ...(prev || {}) }
          if (Number(next[uid] || 0) >= dialogDeletedAt) return prev
          next[uid] = dialogDeletedAt
          return next
        })
        setDmDialogs((prev) => (
          Array.isArray(prev)
            ? prev.filter((dialog) => !dialogMatchesUser(dialog, uid, meId))
            : prev
        ))
        setDmThreadItems([])
        setDmThreadCursor(null)
        setDmThreadHasMore(false)
        setDmThreadSeenTs(Number(payload.peerSeenTs || 0))
        if (!allowDeletedDialogCompose && String(dmWithUserId || '').trim() === uid) setDmWithUserId('')
        return payload
      }
      if (!isDmThreadOwnerCurrent(ownerToken)) return { ok: false, stale: true, error: 'dm_thread_owner_changed' }
      const restoreSupportViewport = supportRequest ? restoreDmThreadViewportAfterSupportMerge() : null
      setDmThreadItems((prev) => mergeRealtimeThreadItems(prev, incoming, dmDeletedMsgMap, { authoritative: true }))
      try { restoreSupportViewport?.() } catch {}
      setDmThreadCursor(payload.nextCursor || null)
      setDmThreadHasMore(!!payload.hasMore)
      setDmThreadSeenTs(Number(payload.peerSeenTs || 0))
      if (supportRequest) {
        dmRealtimeRef.current = { ...(dmRealtimeRef.current || {}), supportThreadLastAt: Date.now() }
      }
      dispatchDmThreadSeenScan(uid, reason)
      return payload
    }

    if (!supportRequest) return run()
    const request = run().finally(() => {
      if (dmRealtimeRef.current?.supportThreadInFlight === request) {
        dmRealtimeRef.current = { ...(dmRealtimeRef.current || {}), supportThreadInFlight: null }
      }
    })
    dmRealtimeRef.current = { ...(dmRealtimeRef.current || {}), supportThreadInFlight: request }
    return request
  }, [
    meId,
    dmPageSize,
    dmDeletedMsgMap,
    dmDeletedKey,
    setDmDeletedMap,
    setDmDialogs,
    dmWithUserId,
    setDmWithUserId,
    locale,,
    captureDmThreadOwner,
    isDmThreadOwnerCurrent,
  ])

  const applyDmRealtimeDeleteImpulse = useCallback((detail = {}) => {
    const source = normalizeDmRealtimeId(detail?.source || detail?.data?.source || detail?.payload?.source)
    if (source && source !== DM_REALTIME_SOURCE) return

    const deletedMessageId = normalizeDmRealtimeId(detail?.dmDeletedMessageId || detail?.data?.dmDeletedMessageId || detail?.payload?.dmDeletedMessageId)
    const deletedPeerId = normalizeDmRealtimeId(detail?.dmDeletedPeerId || detail?.data?.dmDeletedPeerId || detail?.payload?.dmDeletedPeerId)
    const deletedDialog = detail?.dmDeletedDialog === true || detail?.data?.dmDeletedDialog === true || detail?.payload?.dmDeletedDialog === true
    if (!deletedMessageId && !(deletedDialog && deletedPeerId)) return

    if (deletedMessageId) {
      persistDmRuntimeMapEntry(dmDeletedMsgKey, deletedMessageId, 1)
      setDmDeletedMsgMap((prev) => (
        prev?.[deletedMessageId] ? prev : { ...(prev || {}), [deletedMessageId]: 1 }
      ))
      setDmThreadItems((prev) => (
        Array.isArray(prev)
          ? prev.filter((message) => normalizeDmRealtimeId(message?.id) !== deletedMessageId)
          : prev
      ))
      setDmDialogs((prev) => {
        if (!Array.isArray(prev) || !prev.length) return prev
        let changed = false
        const next = prev.filter((dialog) => {
          const lastId = normalizeDmRealtimeId(dialog?.lastMessage?.id)
          if (lastId !== deletedMessageId) return true
          changed = true
          return false
        })
        return changed ? next : prev
      })
    }

    if (deletedDialog && deletedPeerId) {
      const deletedAt = Number(detail?.ts || Date.now()) || Date.now()
      persistDeletedDialogs(dmDeletedKey, { [deletedPeerId]: deletedAt })
      setDmDeletedMap((prev) => {
        const next = { ...(prev || {}) }
        if (Number(next[deletedPeerId] || 0) >= deletedAt) return prev
        next[deletedPeerId] = deletedAt
        return next
      })
      setDmDialogs((prev) => (
        Array.isArray(prev)
          ? prev.filter((dialog) => !dialogMatchesUser(dialog, deletedPeerId, meId))
          : prev
      ))
      if (String(dmWithUserId || '').trim() === deletedPeerId) {
        setDmThreadItems([])
        setDmThreadCursor(null)
        setDmThreadHasMore(false)
        setDmWithUserId('')
      }
    }
  }, [
    dmDeletedKey,
    dmDeletedMsgKey,
    dmWithUserId,
    meId,
    setDmDeletedMap,
    setDmDeletedMsgMap,
    setDmDialogs,
    setDmWithUserId,
  ])

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
          const threadRetryDelays = isQl7SupportPeerId(uid) ? [0] : DM_REALTIME_THREAD_RETRY_MS
          for (const delay of threadRetryDelays) {
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

  const runOpenDmThreadRealtimeImpulse = useCallback((reason = 'dm-thread-impulse') => {
    if (!meId || typeof window === 'undefined') return
    if (!inboxOpen || inboxTab !== 'messages') return
    if (!isRealtimeRuntimeVisible()) return
    const uid = String(dmWithUserId || '').trim()
    if (!uid) return

    const state = dmRealtimeRef.current || {}
    const retryTimers = state.retryTimers instanceof Set ? state.retryTimers : new Set()
    const threadRetryDelays = isQl7SupportPeerId(uid) ? [0] : DM_REALTIME_THREAD_RETRY_MS
    for (const delay of threadRetryDelays) {
      const timer = window.setTimeout(() => {
        if (!isRealtimeRuntimeVisible()) return
        const currentUid = String(dmWithUserId || '').trim()
        if (!currentUid || currentUid !== uid) return
        fetchDmThreadRealtime(uid, `${reason}:thread-${delay}`).catch(() => null)
        try { dmRealtimeRef.current?.retryTimers?.delete?.(timer) } catch {}
      }, delay)
      retryTimers.add(timer)
    }
    dmRealtimeRef.current = {
      ...(dmRealtimeRef.current || {}),
      retryTimers,
    }
  }, [meId, inboxOpen, inboxTab, dmWithUserId, fetchDmThreadRealtime])

  useEffect(() => {
    if (!mounted || !meId) return
    if (!inboxOpen || inboxTab !== 'messages') return
    const uid = String(dmWithUserId || '').trim()
    if (!uid) return
    if (!isRealtimeRuntimeVisible()) return

    // Every real dialog open must ask the server for the latest thread window.
    // This bypasses the old loader throttle/cache path and preserves delivered/seen checks
    // because it still calls the same /api/dm/thread endpoint.
    const openDelays = isQl7SupportPeerId(uid) ? [0] : [0, 250, 900]
    openDelays.forEach((delay) => {
      const timer = window.setTimeout(() => {
        const currentUid = String(dmWithUserId || '').trim()
        if (currentUid !== uid || !isRealtimeRuntimeVisible()) return
        fetchDmThreadRealtime(uid, `open-thread-${delay}`).catch(() => null)
      }, delay)
      try { dmRealtimeRef.current?.retryTimers?.add?.(timer) } catch {}
    })
  }, [mounted, meId, inboxOpen, inboxTab, dmWithUserId, fetchDmThreadRealtime])

  useEffect(() => {
    if (!mounted || !meId || typeof window === 'undefined') return undefined
    const onSupportAuthReady = () => {
      const uid = String(dmWithUserId || '').trim()
      if (!inboxOpen || inboxTab !== 'messages' || !isQl7SupportPeerId(uid)) return
      const auth = readQl7SupportAuthSnapshot()
      if (!auth?.ready || !auth.key) return
      const state = dmRealtimeRef.current || {}
      const now = Date.now()
      const sameProof = String(state.supportAuthKey || '') === String(auth.key)
      const recentlyHandled = sameProof && (now - Number(state.supportAuthEventAt || 0) < QL7_SUPPORT_AUTH_EVENT_DEDUPE_MS)
      const sameProofRetryConsumed = sameProof && String(state.supportAuthVerifiedRetryKey || '') === String(auth.key)
      if (recentlyHandled || (state.supportAuthBlocked && sameProofRetryConsumed)) return

      // A verified event may recover one request that raced ahead of server-side
      // wallet-session persistence. The same proof is never allowed to reopen an
      // unbounded 401 loop; another retry requires a genuinely new auth proof.
      if (!sameProof || state.supportAuthBlocked) resetQl7SupportAuthCircuit()
      dmRealtimeRef.current = {
        ...state,
        supportAuthBlocked: false,
        supportAuthKey: String(auth.key),
        supportAuthVerifiedRetryKey: state.supportAuthBlocked && sameProof ? String(auth.key) : '',
        supportAuthEventAt: now,
      }
      fetchDmThreadRealtime(uid, 'support-auth-ready').catch(() => null)
    }
    window.addEventListener('wallet-session:verified', onSupportAuthReady)
    window.addEventListener('auth:ok', onSupportAuthReady)
    window.addEventListener('auth:success', onSupportAuthReady)
    window.addEventListener('forum:post-auth-ready', onSupportAuthReady)
    return () => {
      window.removeEventListener('wallet-session:verified', onSupportAuthReady)
      window.removeEventListener('auth:ok', onSupportAuthReady)
      window.removeEventListener('auth:success', onSupportAuthReady)
      window.removeEventListener('forum:post-auth-ready', onSupportAuthReady)
    }
  }, [mounted, meId, inboxOpen, inboxTab, dmWithUserId, fetchDmThreadRealtime])

  useEffect(() => {
    if (!mounted || !meId) return undefined
    if (typeof window === 'undefined') return undefined

    const onNotificationState = (event) => {
      if (messengerRealtimeCountFromState(event?.detail || {}) <= 0) return
      runDmRealtimeRefresh('notification-state')
      if (!isQl7SupportPeerId(String(dmWithUserId || ''))) runOpenDmThreadRealtimeImpulse('notification-state')
    }
    const onNotificationCount = (event) => {
      const detail = event?.detail || {}
      if (!isMessengerRealtimePayload(detail)) return
      applyDmRealtimeDeleteImpulse(detail)
      runDmRealtimeRefresh('notification-count')
      if (!isQl7SupportPeerId(String(dmWithUserId || ''))) runOpenDmThreadRealtimeImpulse('notification-count')
    }
    const onOpenNotification = (event) => {
      const detail = event?.detail || {}
      if (!isMessengerRealtimePayload(detail)) return
      applyDmRealtimeDeleteImpulse(detail)
      runDmRealtimeRefresh('open-notification')
      if (!isQl7SupportPeerId(String(dmWithUserId || ''))) runOpenDmThreadRealtimeImpulse('open-notification')
    }
    const onWorkerMessage = (event) => {
      if (event?.data?.type !== 'ql7:notification-received') return
      if (!isMessengerRealtimePayload(event?.data || {})) return
      applyDmRealtimeDeleteImpulse(event?.data || {})
      runDmRealtimeRefresh('service-worker-push')
      if (!isQl7SupportPeerId(String(dmWithUserId || ''))) runOpenDmThreadRealtimeImpulse('service-worker-push')
    }

    window.addEventListener('ql7:notification-state', onNotificationState)
    window.addEventListener('ql7:notification-count', onNotificationCount)
    window.addEventListener('ql7:open-notification', onOpenNotification)
    try { navigator.serviceWorker?.addEventListener?.('message', onWorkerMessage) } catch {}

    const currentState = window.__QL7_NOTIFICATION_STATE__
    if (messengerRealtimeCountFromState(currentState || {}) > 0) {
      runDmRealtimeRefresh('mounted-notification-state')
      if (!isQl7SupportPeerId(String(dmWithUserId || ''))) runOpenDmThreadRealtimeImpulse('mounted-notification-state')
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
  }, [mounted, meId, dmWithUserId, runDmRealtimeRefresh, runOpenDmThreadRealtimeImpulse, applyDmRealtimeDeleteImpulse])

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
    dmDeletePending,
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
    refreshDmThreadRealtime: fetchDmThreadRealtime,
    reopenDeletedDmDialog,
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
    dmDeletePending,
    toggleDmBlock,
    openDmDeletePopover,
    closeDmDeletePopover,
    confirmDmDelete,
    ql7SupportUi,
    setQl7SupportUiEvent,
    handleQl7SupportOperatorDelivered,
  }
}
