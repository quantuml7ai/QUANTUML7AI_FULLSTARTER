// app/forum/ForumRoot.jsx

'use client'

import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useI18n } from '../../components/i18n' 
import ForumLayout from './ForumLayout'
import ForumProviders from './ForumProviders'
import GeoSessionTouchClient from './features/geo/GeoSessionTouchClient'
import {
  optimizeForumVideoFastStart,
} from '../../lib/forumVideoTrim'
import useHtmlFlag from './shared/hooks/useHtmlFlag'
import useForumToast from './shared/hooks/useForumToast'
import { isBrowser } from './shared/utils/browser'
import { revealForumWindowedDomId } from './shared/utils/forumWindowingRegistry'
import { formatCount } from './shared/utils/counts'
import { rich } from './shared/utils/richText'
import {
  FORUM_VIDEO_MAX_SECONDS,
  FORUM_AUDIO_MAX_SECONDS,
  FORUM_VIDEO_MAX_BYTES,
  FORUM_VIDEO_FASTSTART_TRANSCODE_MAX_BYTES,
  FORUM_VIDEO_CAMERA_RECORD_EPSILON_SEC,
} from './shared/constants/media'
import { QL7_SUPPORT_ID, isQl7SupportId } from '../../lib/ql7-support/systemActor'
import { isQl7SupportActive } from '../../lib/ql7-support/featureFlag'
import {
  createQl7SupportIdleNudgeMessageV11,
  createQl7SupportInstantGreetingMessageV11,
  isQl7SupportEphemeralEntryMessageV11,
} from '../../lib/ql7-support/entryGreetingLexiconV11.js'
import { buildQl7SupportAuthHeaders, buildQl7SupportRouteContext, fetchQl7SupportAuthenticated, fetchQl7SupportRuntimeState, readQl7SupportAuthSnapshot } from './features/dm/services/supportAuthClient'
import { readForumRuntimeConfig } from './shared/config/runtime'
import useForumNavBridge from './shared/hooks/useForumNavBridge'
import { hasAnyLink } from './shared/utils/linkDetection'
import { openAuthFlow } from './shared/utils/openAuth'
import { shortId, human } from './shared/utils/formatters'
import { getTimeBucket } from './shared/utils/time'
import { ICONS, EMOJI } from './features/ui/constants/emojiCatalog'
import ForumAdSlot from './features/ui/components/ForumAdSlot'
import useForumGlobalPopovers from './features/ui/hooks/useForumGlobalPopovers'
import useForumEditMode from './features/ui/hooks/useForumEditMode'
import useScrollResizeCompensation from './features/ui/hooks/useScrollResizeCompensation'
import useForumHeadCollapse from './features/ui/hooks/useForumHeadCollapse'
import useForumPopoverModeController from './features/ui/hooks/useForumPopoverModeController'
import useForumComposerRuntime from './features/ui/hooks/useForumComposerRuntime'
import useForumSessionShell from './features/ui/hooks/useForumSessionShell'
import useForumViewState from './features/ui/hooks/useForumViewState'
import useForumComposerSubmitRuntime from './features/ui/hooks/useForumComposerSubmitRuntime'
import useForumScreenFlowsRuntime from './features/ui/hooks/useForumScreenFlowsRuntime'
import buildForumRootPropBundles from './features/ui/utils/buildForumRootPropBundles'
import buildForumLayoutProps from './features/ui/utils/buildForumLayoutProps'
import useForumDataRuntime from './features/feed/hooks/useForumDataRuntime'
import useForumMutationActions from './features/feed/hooks/useForumMutationActions'
import useUserRecommendationsRail from './features/feed/hooks/useUserRecommendationsRail'
import useForumFeedRuntime, {
  useForumModeSync,
  useForumScrollAlignmentRuntime,
} from './features/feed/hooks/useForumFeedRuntime'
import { snapVideoFeedToFirstCardTop as snapVideoFeedToFirstCardTopUtil } from './features/media/utils/videoFeedScroll'
import {
  useForumProfileBranchRuntime,
  useForumProfileBranchActions,
} from './features/feed/hooks/useUserPostsBranchModel'
import {
  getScrollSnapshot as getNavScrollSnapshot,
  getEntryOffset as getNavEntryOffset,
  restoreScrollSnapshot as restoreNavScrollSnapshot,
  restoreEntryPosition as restoreNavEntryPosition,
} from './features/feed/utils/navScroll'
import { createFeedRateLimiter } from './features/feed/services/rateLimiter'
import TopicItem from './features/feed/components/TopicItem'
import PostCard from './features/feed/components/PostCardBridge'
import LoadMoreSentinel from './features/feed/components/LoadMoreSentinel'
import { emitPostCreated, emitPostDeleted } from './features/feed/utils/postEvents'
import VideoOverlay from './features/media/components/VideoOverlay'
import {
  readVideoDurationSec,
  readAudioDurationSec,
} from './features/media/utils/mediaRuntime'
import { getForumVideoLimitCopy, getForumVideoTrimCopy, getForumVoiceTapLabel } from './features/media/utils/videoCopy'
import { FEED_URL_RE, extractUrlsFromText, isVideoUrl, isImageUrl, isAudioUrl } from './features/media/utils/urlParsing'
import {
  isYouTubeUrl,
  isTikTokUrl,
  buildSearchVideoMedia,
} from './features/media/utils/mediaLinks'
import { createForumMediaUrlPipeline } from './features/media/utils/mediaUrlPipeline'
import useForumMediaCoordinator from './features/media/hooks/useForumMediaCoordinator'
import useVideoTrimController from './features/media/hooks/useVideoTrimController'
import useVideoCaptureController from './features/media/hooks/useVideoCaptureController'

import {
  fileToJpegBlob as fileToJpegBlobForModeration,
  extractVideoFrames as extractVideoFramesForModeration,
} from './features/media/utils/moderationPrep'
import {
  extractDmStickersFromText,
} from './features/dm/utils/mediaParsing'
import useForumDmRuntime from './features/dm/hooks/useForumDmRuntime'
import {
  resolveProfileAccountId,
  safeReadProfile,
  writeProfileAlias,
  mergeProfileCache,
  resolveNickForDisplay,
  resolveIconForDisplay,
} from './features/profile/utils/profileCache'
import {
  readForumAuth as readAuth,
  useSyncForumPostAuthProfileOnMount,
} from './features/profile/hooks/useForumProfileSync'
import useForumProfileSocialRuntime from './features/profile/hooks/useForumProfileSocialRuntime'
import { VIP_EMOJI, VIP_AVATARS } from './features/profile/constants/vipAssets'
import { normalizeAboutForSave } from './features/profile/utils/aboutText'
import api, { getForumUserId, resetForumFeedSeed } from './services/forumApi'
import useForumDiagnostics from './features/diagnostics/hooks/useForumDiagnostics'
import useForumModerationRuntime from './features/moderation/hooks/useForumModerationRuntime'
// [ADS:IMPORT]
import {
  interleaveAds,
} from './ForumAds';
/* =========================================================
   helpers
========================================================= */
// Оставляем только ASCII (HTTP headers требуют 0x00..0x7F)

const { isMediaUrl, stripMediaUrlsFromText } = createForumMediaUrlPipeline({
  feedUrlRegex: FEED_URL_RE,
  isVideoUrl,
  isImageUrl,
  isAudioUrl,
  isYouTubeUrlFn: isYouTubeUrl,
  isTikTokUrlFn: isTikTokUrl,
})

async function openAuth({ timeoutMs = 15000 } = {}) {
  return openAuthFlow({ readAuth, timeoutMs })
}

// берем из window.__FORUM_CONF__ (его отдаёт сервер из env), иначе — дефолты
const RUNTIME_CFG = readForumRuntimeConfig();
const MIN_INTERVAL_MS = RUNTIME_CFG.minIntervalMs;
const REACTS_PER_MINUTE = RUNTIME_CFG.reactsPerMinute;
const VIEW_TTL_SEC = RUNTIME_CFG.viewTtlSec;
const FORUM_VIEW_TTL_SEC = VIEW_TTL_SEC
const USER_RECOMMENDATIONS_RUNTIME = RUNTIME_CFG.userRecommendations || {}
const TOMBSTONE_TTL_MS = 10 * 60 * 1000;

/* =========================================================
   constants (иконки/эмодзи)
========================================================= */


/* =========================================================
   маленькие поповеры
========================================================= */
export { VideoOverlay }

/* =========================================================
   Основной компонент
========================================================= */
export default function Forum(){
  // ===== FORUM DIAG (writes to /forum-diag.jsonl via API) =====
  const emitDiag = useForumDiagnostics()


  const [profileBump, setProfileBump] = useState(0)
  useSyncForumPostAuthProfileOnMount(() => setProfileBump((x) => x + 1))
  void profileBump
  const { t, locale } = useI18n()
  const toast = useForumToast()
  const videoLimitCopy = useMemo(() => getForumVideoLimitCopy(t), [t]);
  const videoTrimCopy = useMemo(() => getForumVideoTrimCopy(t), [t]);
  const voiceTapLabel = useMemo(() => getForumVoiceTapLabel(locale), [locale]);
  const uiDir = (isBrowser() &&
    (document.documentElement?.dir === 'rtl' ||
      getComputedStyle(document.documentElement).direction === 'rtl'))
    ? 'rtl'
    : 'ltr'  
  const rl = useMemo(
    () =>
      createFeedRateLimiter({
        minIntervalMs: MIN_INTERVAL_MS,
        reactsPerMinute: REACTS_PER_MINUTE,
      }),
    [],
  )
  /* ---- auth ---- */
  const {
    auth,
    viewerId,
    setMediaLock,
    mediaLocked,
    shareUI,
    closeSharePopover,
    openSharePopoverRaw,
    userInfoOpen,
    userInfoUid,
    userInfoPreview,
    userInfoAnchorRef,
    closeUserInfoPopover,
    handleUserInfoToggle,
    requireAuthStrict,
  } = useForumSessionShell({
    readAuthFn: readAuth,
    openAuthFn: openAuth,
    isBrowserFn: isBrowser,
    resolveProfileAccountIdFn: resolveProfileAccountId,
    api,
    t,
    toast,
  })

  const [subscriptionsUI, setSubscriptionsUI] = useState({
    open: false,
    userId: '',
    initialMode: 'followers',
  })

  const openSubscriptionsPopover = useCallback(({ userId, initialMode = 'followers' } = {}) => {
    const raw = String(userId || '').trim()
    const uid = raw
    if (!uid) return
    setSubscriptionsUI({
      open: true,
      userId: uid,
      initialMode: initialMode === 'following' ? 'following' : 'followers',
    })
  }, [])

  const closeSubscriptionsPopover = useCallback(() => {
    setSubscriptionsUI({ open: false, userId: '', initialMode: 'followers' })
    closeUserInfoPopover?.()
  }, [closeUserInfoPopover])

const {
  starMode,
  setStarMode,
  q,
  setQ,
  topicFilterId,
  setTopicFilterId,
  topicSort,
  setTopicSort,
  postSort,
  setPostSort,
  drop,
  setDrop,
  sortOpen,
  setSortOpen,
  visibleVideoCount,
  setVisibleVideoCount,
  visibleTopicsCount,
  setVisibleTopicsCount,
  visibleRepliesCount,
  setVisibleRepliesCount,
  visibleThreadPostsCount,
  setVisibleThreadPostsCount,
  visiblePublishedCount,
  setVisiblePublishedCount,
  questOpen,
  setQuestOpen,
  questSel,
  setQuestSel,
  VIDEO_PAGE_SIZE,
  TOPIC_PAGE_SIZE,
  REPLIES_PAGE_SIZE,
  THREAD_PAGE_SIZE,
  DM_PAGE_SIZE,
  DM_ACTIVE_THROTTLE_MS,
  DM_BG_THROTTLE_MS,
  PUBLISHED_PAGE_SIZE,
} = useForumViewState()

useForumMediaCoordinator({ emitDiag })
const openOnlyRef = useRef(null)
const popoverControlsRef = useRef({})
useForumGlobalPopovers(openOnlyRef)

const {
  starredAuthors,
  myFollowersCount,
  myFollowingCount,
  myFollowersLoading,
  toggleAuthorStar,
  activeStarredAuthors,
  starredFirst,
  vipOpen,
  setVipOpen,
  vipBtnRef,
  vipActive,
  handleVipPay,
  qcoinModalOpen,
  setQcoinModalOpen,
  withdrawBtnRef,
  idShown,
  nickShown,
  iconShown,
  copyId,
  aboutEditing,
  aboutDraft,
  aboutSaved,
  aboutSaving,
  setAboutDraft,
  startAboutEdit,
  cancelAboutEdit,
  saveAbout,
  profileOpen,
  setProfileOpen,
  avatarRef,
} = useForumProfileSocialRuntime({
  auth,
  viewerId,
  api,
  requireAuthStrict,
  starMode,
  toast,
  t,
  profileBump,
  resolveProfileAccountIdFn: resolveProfileAccountId,
  safeReadProfileFn: safeReadProfile,
  resolveNickForDisplayFn: resolveNickForDisplay,
  resolveIconForDisplayFn: resolveIconForDisplay,
  normalizeAboutForSaveFn: normalizeAboutForSave,
  mergeProfileCacheFn: mergeProfileCache,
  writeProfileAliasFn: writeProfileAlias,
})
const {
  tombstones,
  persistTombstones,
  persistSnap,
  data,
  setOverlay,
  pushOp,
  requestFlushSoon,
  enqueuePendingPostView,
  enqueuePendingTopicView,
  syncNowRef,
} = useForumDataRuntime({
  isBrowserFn: isBrowser,
  auth,
  api,
  getForumUserIdFn: getForumUserId,
  writeProfileAliasFn: writeProfileAlias,
  mergeProfileCacheFn: mergeProfileCache,
  setProfileBump,
  tombstoneTtlMs: TOMBSTONE_TTL_MS,
})
const {
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
} = useForumProfileBranchRuntime({
  posts: data?.posts,
  postSort,
  topicSort,
  api,
  resolveProfileAccountIdFn: resolveProfileAccountId,
  threadPageSize: THREAD_PAGE_SIZE,
  activeStarredAuthors,
})

const {
  bindNavActions,
  getScrollEl,
  alignInboxStartUnderTabs,
  pushNavState,
  pushNavStateStable,
} = useForumNavBridge()

const openOnly = useForumPopoverModeController({
  closeSharePopover,
  popoverControlsRef,
})
useEffect(() => {
  openOnlyRef.current = openOnly
}, [openOnly])

const {
  reportUI,
  reportBusy,
  reportPopoverRef,
  closeReportPopover,
  openReportPopover,
  handleReportSelect,
  openSharePopover,
  isAdmin,
  delTopic,
  delPost,
  banUser,
  unbanUser,
  toastI18n,
  reasonKey,
  reasonFallbackEN,
  moderateImageFiles,
  moderateVideoSource,
} = useForumModerationRuntime({
  api,
  readAuth,
  openAuth,
  isBrowserFn: isBrowser,
  persistSnap,
  toast,
  t,
  human,
  persistTombstones,
  tombstoneTtlMs: TOMBSTONE_TTL_MS,
  setMediaLock,
  emitPostDeleted,
  openSharePopoverRaw,
  fileToJpegBlob: fileToJpegBlobForModeration,
  extractVideoFrames: extractVideoFramesForModeration,
})

// QL7_VIDEO_POSTCOMMIT_MODERATION_R1
// Keep the upload/decode path independent: only remember the source here; actual
// frame sampling starts after the server has committed a real post id.
const forumVideoModerationSourcesRef = useRef(new Map())
const forumVideoModerationJobsRef = useRef(new Set())
const forumVideoModerationRetryCountRef = useRef(new Map())
const forumVideoModerationTimersRef = useRef(new Set())
const [forumVideoModerationRetryTick, setForumVideoModerationRetryTick] = useState(0)

const registerForumVideoModerationSource = useCallback(({ mediaUrl, source, actorId }) => {
  const key = String(mediaUrl || '').trim()
  if (!key || !source) return
  forumVideoModerationSourcesRef.current.set(key, {
    source,
    actorId: String(actorId || '').trim(),
    createdAt: Date.now(),
  })
}, [])

useEffect(() => () => {
  for (const timer of forumVideoModerationTimersRef.current) {
    try { clearTimeout(timer) } catch {}
  }
  forumVideoModerationTimersRef.current.clear()
}, [])

useEffect(() => {
  if (typeof moderateVideoSource !== 'function') return undefined
  const posts = Array.isArray(data?.posts) ? data.posts : []
  if (!posts.length) return undefined

  const viewerCandidates = new Set([
    viewerId,
    auth?.asherId,
    auth?.accountId,
    resolveProfileAccountId(viewerId),
    resolveProfileAccountId(auth?.asherId),
    resolveProfileAccountId(auth?.accountId),
  ].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))
  if (!viewerCandidates.size) return undefined

  const scheduleRetry = (jobKey) => {
    const count = Number(forumVideoModerationRetryCountRef.current.get(jobKey) || 0) + 1
    forumVideoModerationRetryCountRef.current.set(jobKey, count)
    const waitMs = Math.min(60000, 12000 + (count * 5000))
    const timer = setTimeout(() => {
      forumVideoModerationTimersRef.current.delete(timer)
      forumVideoModerationJobsRef.current.delete(jobKey)
      setForumVideoModerationRetryTick((value) => value + 1)
    }, waitMs)
    forumVideoModerationTimersRef.current.add(timer)
  }

  for (const post of posts) {
    const status = String(post?.videoModerationStatus || '').trim().toLowerCase()
    const postId = String(post?.id || '').trim()
    if (status !== 'pending' || !postId || /^tmp_/i.test(postId)) continue

    const videoUrl = extractUrlsFromText(post?.text || '').find((url) => isVideoUrl(url)) || ''
    if (!videoUrl) continue
    const remembered = forumVideoModerationSourcesRef.current.get(videoUrl) || null

    const ownerCandidates = new Set([
      post?.userId,
      post?.accountId,
      resolveProfileAccountId(post?.userId),
      resolveProfileAccountId(post?.accountId),
    ].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean))
    const isOwnPost = Array.from(ownerCandidates).some((value) => viewerCandidates.has(value))
    // A remembered source is registered only by this composer's successful create flow.
    // It is therefore a stronger local hand-off than comparing raw/canonical aliases.
    if (!remembered && !isOwnPost) continue

    const jobKey = `forum:${postId}`
    if (forumVideoModerationJobsRef.current.has(jobKey)) continue
    forumVideoModerationJobsRef.current.add(jobKey)

    const actorId = String(remembered?.actorId || resolveProfileAccountId(auth?.asherId || auth?.accountId || viewerId) || auth?.asherId || auth?.accountId || viewerId || '').trim()
    const source = remembered?.source || videoUrl
    if (!actorId || !source) {
      forumVideoModerationJobsRef.current.delete(jobKey)
      continue
    }

    void moderateVideoSource(source, {
      surface: 'forum',
      entityId: postId,
      actorId,
      mediaUrl: videoUrl,
      fallbackSource: videoUrl,
      clientRequestId: `forum-video-${postId}`,
    }).then((result) => {
      const nextStatus = String(result?.status || '').trim().toLowerCase()
      if (nextStatus === 'approved') {
        persistSnap((prev) => ({
          ...prev,
          posts: (prev?.posts || []).map((entry) =>
            String(entry?.id || '') === postId
              ? { ...entry, videoModerationStatus: 'approved' }
              : entry
          ),
        }))
        forumVideoModerationSourcesRef.current.delete(videoUrl)
        forumVideoModerationRetryCountRef.current.delete(jobKey)
        forumVideoModerationJobsRef.current.delete(jobKey)
        return
      }

      if (nextStatus === 'rejected' || nextStatus === 'gone') {
        const deletedIds = Array.from(new Set([
          ...(Array.isArray(result?.raw?.videoModeration?.deletedIds) ? result.raw.videoModeration.deletedIds : []),
          postId,
        ].map((id) => String(id || '').trim()).filter(Boolean)))
        const deletedSet = new Set(deletedIds)
        persistSnap((prev) => ({
          ...prev,
          posts: (prev?.posts || []).filter((entry) => !deletedSet.has(String(entry?.id || ''))),
        }))
        setOverlay((prev) => ({
          ...prev,
          creates: {
            ...(prev?.creates || {}),
            topics: prev?.creates?.topics || [],
            posts: (prev?.creates?.posts || []).filter((entry) => !deletedSet.has(String(entry?.id || entry?.cid || ''))),
          },
        }))
        persistTombstones((prev) => ({
          ...prev,
          posts: {
            ...(prev?.posts || {}),
            ...Object.fromEntries(deletedIds.map((id) => [id, Date.now() + TOMBSTONE_TTL_MS])),
          },
        }))
        deletedIds.forEach((id) => {
          try { emitPostDeleted(id, post?.topicId) } catch {}
        })
        forumVideoModerationSourcesRef.current.delete(videoUrl)
        forumVideoModerationRetryCountRef.current.delete(jobKey)
        forumVideoModerationJobsRef.current.delete(jobKey)
        if (nextStatus === 'rejected') {
          try { toastI18n('warn', 'forum_image_blocked') } catch {}
          try { toastI18n('info', reasonKey(result?.reason || 'unknown')) } catch {}
          if (Number(result?.lockedUntil || 0) > Date.now()) {
            try { setMediaLock({ locked: true, untilMs: Number(result.lockedUntil) }) } catch {}
          }
        }
        return
      }

      scheduleRetry(jobKey)
    }).catch(() => {
      scheduleRetry(jobKey)
    })
  }

  return undefined
}, [
  auth?.accountId,
  auth?.asherId,
  data?.posts,
  forumVideoModerationRetryTick,
  moderateVideoSource,
  persistSnap,
  persistTombstones,
  reasonKey,
  setMediaLock,
  setOverlay,
  toastI18n,
  viewerId,
])

/* ---- выбор темы и построение данных ---- */
const [sel, setSel] = useState(null);
const lastTopicOpenDefaultSortIdRef = useRef('')
useEffect(() => {
  const topicId = String(sel?.id || '').trim()
  if (!topicId) {
    lastTopicOpenDefaultSortIdRef.current = ''
    return
  }
  if (lastTopicOpenDefaultSortIdRef.current === topicId) return
  lastTopicOpenDefaultSortIdRef.current = topicId
  try { setPostSort('new') } catch {}
}, [sel?.id, setPostSort])
const { reactMut, delTopicOwn, delPostOwn } = useForumMutationActions({
  requireAuthStrictFn: requireAuthStrict,
  rateLimiter: rl,
  toast,
  t,
  setOverlay,
  pushOp,
  requestFlushSoon,
  authAsherId: auth?.asherId,
  authAccountId: auth?.accountId,
  api,
  persistTombstones,
  selectedTopicId: sel?.id,
  setSelectedTopic: setSel,
  emitPostDeletedFn: emitPostDeleted,
})
// [HEAD_COLLAPSE:STATE]
const bodyRef = useRef(null);
const [headHidden, setHeadHidden] = useState(false);
const [headPinned, setHeadPinned] = useState(false);
const headHiddenRef = useRef(false);
const headPinnedRef = useRef(false);
const headAutoOpenRef = useRef(false);
const videoFeedOpenRef = useRef(false); 
const inboxMessagesModeRef = useRef(false);
const sortRefreshAlignTimersRef = useRef([]);
const sortRefreshAlignRafsRef = useRef([]);
const sortRefreshAlignPendingRef = useRef(false);
const sortRefreshStartedAtRef = useRef(0);
const videoFeedHardResetBridgeRef = useRef(null);
useEffect(() => { headHiddenRef.current = headHidden }, [headHidden]);
useEffect(() => { headPinnedRef.current = headPinned }, [headPinned]);
useHtmlFlag('data-forum-active', '1');
useHtmlFlag('data-head-hidden', headHidden && !headPinned ? '1' : null);

const {
  requestAlignInboxStartUnderTabs,
  alignNodeToTop,
  canAutoAlignNow,
} = useForumScrollAlignmentRuntime({
  alignInboxStartUnderTabs,
  getScrollEl,
  bodyRef,
  isBrowserFn: isBrowser,
})
const [contentRefreshToken, setContentRefreshToken] = useState(0)
const SURFACE_SNAPSHOT_SYNC_MIN_MS = Math.max(
  60_000,
  Number(process.env.NEXT_PUBLIC_FORUM_SURFACE_SYNC_MIN_MS || 180_000),
)
const lastSurfaceSnapshotSyncAtRef = useRef(0)
const lastSurfaceSyncKeyRef = useRef('')

const requestSurfaceSnapshotSync = useCallback((reason = 'surface_refresh') => {
  try {
    const now = Date.now()
    const last = Number(lastSurfaceSnapshotSyncAtRef.current || 0)
    // QL7_GEO777_SURFACE_SYNC_FORCE_SORT_GEO_V1
    const forceSurfaceSync = /(?:sort|geo|home_feed_refresh|server_feed)/i.test(String(reason || ''))

    if (!forceSurfaceSync && last && now - last < SURFACE_SNAPSHOT_SYNC_MIN_MS) {
      return false
    }

    lastSurfaceSnapshotSyncAtRef.current = now

    setTimeout(() => {
      try {
        syncNowRef.current?.({
          reason,
          forceApply: true,
        })
      } catch {}
    }, 180)

    return true
  } catch {}
  return false
}, [SURFACE_SNAPSHOT_SYNC_MIN_MS, syncNowRef])

const clearSortRefreshAlignHandles = useCallback(() => {
  try {
    sortRefreshAlignTimersRef.current.forEach((timerId) => clearTimeout(timerId))
    sortRefreshAlignTimersRef.current = []
  } catch {}
  try {
    sortRefreshAlignRafsRef.current.forEach((rafId) => cancelAnimationFrame(rafId))
    sortRefreshAlignRafsRef.current = []
  } catch {}
}, [])

const alignSortRefreshNodeToTop = useCallback((node, reason = 'sort_align_node_top') => {
  try {
    if (!(node instanceof Element)) return false
    const scrollEl =
      getScrollEl?.() ||
      bodyRef.current ||
      document.querySelector('[data-forum-scroll="1"]') ||
      null
    const rect = node.getBoundingClientRect?.()
    if (!rect) return false

    const now = Date.now()
    try {
      window.__forumProgrammaticScrollTs = now
      window.__forumProgrammaticScrollReason = String(reason || 'sort_align_node_top')
    } catch {}

    if (scrollEl && scrollEl.scrollHeight > scrollEl.clientHeight + 1) {
      const hostRect = scrollEl.getBoundingClientRect?.() || { top: 0 }
      const targetTop = (scrollEl.scrollTop || 0) + (rect.top - Number(hostRect.top || 0))
      scrollEl.scrollTop = Math.max(0, targetTop)
      return true
    }

    const y = (window.pageYOffset || document.documentElement.scrollTop || 0) + rect.top
    try { window.scrollTo({ top: Math.max(0, y), behavior: 'auto' }) } catch { try { window.scrollTo(0, Math.max(0, y)) } catch {} }
    return true
  } catch {}
  return false
}, [bodyRef, getScrollEl])

const questBtnClass = ''
const setVideoFeedOpenRef = useRef(() => {})
const setVideoFeedOpenBridge = useCallback((next) => {
  try { setVideoFeedOpenRef.current?.(next) } catch {}
}, [])
// [INBOX:RUNTIME]
const {
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
  refreshDmThreadRealtime,
  reopenDeletedDmDialog,
  sortedRepliesToMe,
  visibleRepliesToMe,
  repliesHasMore,
  serverRepliesHasMore,
  serverRepliesLoading,
  loadInboxRepliesPage,
  unreadCount,
  dmUnreadCount,
  myPublishedPosts,
  publishedTotalCount,
  visiblePublishedPosts,
  publishedHasMore,
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
} = useForumDmRuntime({
  isBrowserFn: isBrowser,
  auth,
  resolveProfileAccountIdFn: resolveProfileAccountId,
  dataPosts: data.posts,
  tombstones,
  forumDataReady: data?.rev != null,
  postSort,
  activeStarredAuthors,
  api,
  mergeProfileCacheFn: mergeProfileCache,
  t,
  toast,
  bodyRef,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  requestAlignInboxStartUnderTabs,
  visibleRepliesCount,
  setVisibleRepliesCount,
  repliesPageSize: REPLIES_PAGE_SIZE,
  visiblePublishedCount,
  setVisiblePublishedCount,
  publishedPageSize: PUBLISHED_PAGE_SIZE,
  dmPageSize: DM_PAGE_SIZE,
  dmActiveThrottleMs: DM_ACTIVE_THROTTLE_MS,
  dmBgThrottleMs: DM_BG_THROTTLE_MS,
  locale,
})
const supportActive = isQl7SupportActive()
const dmSupportMode = supportActive && !!dmMode && isQl7SupportId(dmWithUserId)

// QL7_VIDEO_POSTCOMMIT_MODERATION_R1_DM_RESUME
// A sender can navigate/reload after commit. Pending ordinary-DM videos are therefore
// resumed from the canonical remote URL when the sender's thread is loaded again.
const dmVideoModerationJobsRef = useRef(new Set())
const dmVideoModerationRetryCountRef = useRef(new Map())
const dmVideoModerationTimersRef = useRef(new Set())
const [dmVideoModerationRetryTick, setDmVideoModerationRetryTick] = useState(0)

useEffect(() => () => {
  for (const timer of dmVideoModerationTimersRef.current) {
    try { clearTimeout(timer) } catch {}
  }
  dmVideoModerationTimersRef.current.clear()
}, [])

useEffect(() => {
  if (dmSupportMode || typeof moderateVideoSource !== 'function') return undefined
  const actorId = String(meId || auth?.accountId || auth?.asherId || '').trim()
  if (!actorId) return undefined
  const meCanonical = String(resolveProfileAccountId(actorId) || actorId).trim().toLowerCase()

  const videoAttachmentOf = (message) => (Array.isArray(message?.attachments) ? message.attachments : []).find((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const type = String(entry?.type || entry?.mediaType || entry?.mime || '').toLowerCase()
    const url = String(entry?.url || entry?.src || entry?.href || '').trim()
    const pending = String(entry?.moderationStatus || '').toLowerCase() === 'pending'
    return pending && (/video/.test(type) || /\.(?:mp4|webm|mov|m4v|mkv)(?:[?#].*)?$/i.test(url))
  })

  const approveAttachments = (list) => (Array.isArray(list) ? list : []).map((entry) => {
    const type = String(entry?.type || entry?.mediaType || entry?.mime || '').toLowerCase()
    const url = String(entry?.url || entry?.src || entry?.href || '').trim()
    const isVideo = /video/.test(type) || /\.(?:mp4|webm|mov|m4v|mkv)(?:[?#].*)?$/i.test(url)
    return isVideo && String(entry?.moderationStatus || '').toLowerCase() === 'pending'
      ? { ...entry, moderationStatus: 'approved' }
      : entry
  })

  const scheduleRetry = (jobKey) => {
    const nextRetry = Math.min(12, Number(dmVideoModerationRetryCountRef.current.get(jobKey) || 0) + 1)
    dmVideoModerationRetryCountRef.current.set(jobKey, nextRetry)
    const waitMs = Math.min(60000, 12000 + (nextRetry * 5000))
    const timer = setTimeout(() => {
      dmVideoModerationTimersRef.current.delete(timer)
      setDmVideoModerationRetryTick((value) => value + 1)
    }, waitMs)
    dmVideoModerationTimersRef.current.add(timer)
  }

  for (const message of (Array.isArray(dmThreadItems) ? dmThreadItems : [])) {
    const messageId = String(message?.id || '').trim()
    if (!messageId || /^tmp_/i.test(messageId)) continue
    const ownerRaw = String(message?.fromCanonical || message?.from || '').trim()
    if (!ownerRaw) continue
    const ownerCanonical = String(resolveProfileAccountId(ownerRaw) || ownerRaw).trim().toLowerCase()
    if (!ownerCanonical || ownerCanonical !== meCanonical) continue
    const attachment = videoAttachmentOf(message)
    const videoUrl = String(attachment?.url || attachment?.src || attachment?.href || '').trim()
    if (!videoUrl) continue

    const jobKey = `dm:${messageId}`
    if (dmVideoModerationJobsRef.current.has(jobKey)) continue
    dmVideoModerationJobsRef.current.add(jobKey)

    void moderateVideoSource(videoUrl, {
      surface: 'dm',
      entityId: messageId,
      actorId,
      mediaUrl: videoUrl,
      fallbackSource: videoUrl,
      clientRequestId: `dm-video-resume-${messageId}`,
    }).then((result) => {
      const status = String(result?.status || '').toLowerCase()
      if (status === 'approved') {
        setDmThreadItems((prev) => (prev || []).map((entry) => (
          String(entry?.id || '') === messageId
            ? { ...entry, attachments: approveAttachments(entry?.attachments) }
            : entry
        )))
        setDmDialogs((prev) => (prev || []).map((dialog) => {
          const last = dialog?.lastMessage || null
          if (!last || String(last?.id || '') !== messageId) return dialog
          return { ...dialog, lastMessage: { ...last, attachments: approveAttachments(last?.attachments) } }
        }))
        dmVideoModerationRetryCountRef.current.delete(jobKey)
        return
      }
      if (status === 'rejected' || status === 'gone') {
        setDmThreadItems((prev) => (prev || []).filter((entry) => String(entry?.id || '') !== messageId))
        setDmDialogs((prev) => (prev || []).filter((dialog) => String(dialog?.lastMessage?.id || '') !== messageId))
        try { dmDialogsCacheRef.current.clear() } catch {}
        try { dmThreadCacheRef.current.clear() } catch {}
        try { loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 }) } catch {}
        try { loadDmThread(dmWithUserId, null, { force: true, refresh: true, throttleMs: 0 }) } catch {}
        dmVideoModerationRetryCountRef.current.delete(jobKey)
        if (status === 'rejected') {
          try { toastI18n('warn', 'forum_image_blocked') } catch {}
          try { toastI18n('info', reasonKey(result?.reason || 'unknown')) } catch {}
          if (Number(result?.lockedUntil || 0) > Date.now()) {
            try { setMediaLock({ locked: true, untilMs: Number(result.lockedUntil) }) } catch {}
          }
        }
        return
      }
      scheduleRetry(jobKey)
    }).catch(() => {
      scheduleRetry(jobKey)
    }).finally(() => {
      dmVideoModerationJobsRef.current.delete(jobKey)
    })
  }

  return undefined
}, [
  auth?.accountId,
  auth?.asherId,
  dmDialogsCacheRef,
  dmSupportMode,
  dmThreadCacheRef,
  dmThreadItems,
  dmVideoModerationRetryTick,
  dmWithUserId,
  loadDmDialogs,
  loadDmThread,
  meId,
  moderateVideoSource,
  reasonKey,
  setDmDialogs,
  setDmThreadItems,
  setMediaLock,
  toastI18n,
])
const supportEntryOpenRef = useRef(false)
const supportEntryNonceRef = useRef('')
const supportIdleTimerRef = useRef(null)
const supportDeepLinkHandledRef = useRef(false)
const hydrateQl7SupportRuntimeState = useCallback(async () => {
  try {
    const state = await fetchQl7SupportRuntimeState({})
    if (!state) return null
    setQl7SupportUiEvent({
      supportUiState: String(state.state || 'idle'),
      caseId: String(state.caseId || ''),
      correlationId: String(state.correlationId || ''),
      changedAt: Date.parse(state.changedAt || '') || Date.now(),
      inputPolicy: state.inputPolicy && typeof state.inputPolicy === 'object' ? state.inputPolicy : null,
    })
    return state
  } catch {
    return null
  }
}, [setQl7SupportUiEvent])
const openQl7SupportThread = useCallback(() => {
  if (!supportActive) return
  const uid = QL7_SUPPORT_ID
  const snapshot = readQl7SupportAuthSnapshot()
  const entryNonce = `entry:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`
  supportEntryNonceRef.current = entryNonce
  const hasOpenSupportContext = (Array.isArray(dmThreadItems) ? dmThreadItems : []).some((item) => {
    if (!isQl7SupportId(item?.fromCanonical || item?.from) && !isQl7SupportId(item?.toCanonical || item?.to)) return false
    const status = String(item?.metadata?.caseStatus || item?.caseStatus || '').trim()
    return item?.metadata?.openMaterialQuestion === true || (status && !/^(?:closed|resolved|superseded)$/iu.test(status))
  })
  const entryMode = hasOpenSupportContext ? 'continue' : 'fresh'
  const optimisticGreeting = createQl7SupportInstantGreetingMessageV11({
    userId: meId || snapshot?.accountId || snapshot?.walletAddress || '',
    locale,
    entryNonce,
    entryMode,
    now: Date.now(),
  })
  try { openOnly?.(null) } catch {}
  try { closeUserInfoPopover?.() } catch {}
  try { closeReportPopover?.() } catch {}
  try { setDmDeletePopover?.(null) } catch {}
  try { setDmDeleteForAll?.(false) } catch {}
  try { setVideoFeedOpenBridge(false) } catch {}
  try { setSel(null) } catch {}
  try { headAutoOpenRef.current = false } catch {}
  try { setHeadPinned(false) } catch {}
  try { setHeadHidden(true) } catch {}
  try { reopenDeletedDmDialog?.(uid, uid) } catch {}
  try { pushNavState?.(`dm_${uid}`) } catch {}
  try { setInboxOpen(true) } catch {}
  try { setInboxTab('messages') } catch {}
  try { setDmWithUserId(uid) } catch {}
  try {
    setDmThreadItems((prev) => {
      const rows = Array.isArray(prev) ? prev.filter((item) => !isQl7SupportEphemeralEntryMessageV11(item)) : []
      return [...rows, optimisticGreeting]
    })
  } catch {}
  try { requestAlignInboxStartUnderTabs?.({ reason: 'ql7_support_launcher' }) } catch {}
  void hydrateQl7SupportRuntimeState()
  try {
    supportEntryOpenRef.current = true
    void fetchQl7SupportAuthenticated('/api/dm/support-entry', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forum-locale': String(locale || ''), ...buildQl7SupportAuthHeaders(snapshot) },
      body: JSON.stringify({
        locale,
        entryNonce,
        entryVariantId: String(optimisticGreeting?.metadata?.entryVariantId || ''),
        routeContext: { ...buildQl7SupportRouteContext(), entryMode },
      }),
    }, { waitTimeoutMs: 12000, retryOnFreshAuth: true })
      .then((result) => {
        if (!result?.response?.ok || !result?.data?.ok) return null
        return refreshDmThreadRealtime?.(uid, 'support-entry-ack')
      })
      .catch(() => null)
  } catch {}
}, [
  meId,
  pushNavState,
  reopenDeletedDmDialog,
  requestAlignInboxStartUnderTabs,
  hydrateQl7SupportRuntimeState,
  openOnly,
  closeUserInfoPopover,
  closeReportPopover,
  setDmDeletePopover,
  setDmDeleteForAll,
  setVideoFeedOpenBridge,
  setSel,
  setHeadPinned,
  setHeadHidden,
  setDmWithUserId,
  setDmThreadItems,
  setInboxOpen,
  setInboxTab,
  refreshDmThreadRealtime,
  locale,
  dmThreadItems,
  supportActive,
])

useEffect(() => {
  if (!supportActive) return undefined
  const openFromBridge = () => {
    try { window.sessionStorage?.removeItem('ql7_support_open_after_forum') } catch {}
    openQl7SupportThread()
    try {
      const cleanUrl = new URL(window.location.href)
      for (const key of ['ql7SupportOpen', 'dmUser', 'inbox']) cleanUrl.searchParams.delete(key)
      const cleanHref = `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
      window.history.replaceState(window.history.state, '', cleanHref || '/forum')
    } catch {}
  }
  try { window.addEventListener('ql7-support:open-thread', openFromBridge) } catch {}
  try {
    const params = new URLSearchParams(window.location.search || '')
    const shouldOpen = params.get('ql7SupportOpen') === '1' || window.sessionStorage?.getItem('ql7_support_open_after_forum') === '1'
    if (shouldOpen && !supportDeepLinkHandledRef.current) {
      supportDeepLinkHandledRef.current = true
      window.setTimeout(openFromBridge, 80)
    }
  } catch {}
  return () => {
    try { window.removeEventListener('ql7-support:open-thread', openFromBridge) } catch {}
  }
}, [openQl7SupportThread, supportActive])

useEffect(() => {
  if (!dmSupportMode) return
  void hydrateQl7SupportRuntimeState()
}, [dmSupportMode, hydrateQl7SupportRuntimeState])

useEffect(() => {
  if (!dmSupportMode) return undefined
  let cancelled = false
  let timer = 0
  let busy = false
  const active = new Set([
    'understanding',
    'checking',
    'analyzing',
    'preparing_response',
    'needs_clarification',
    'attention_required',
  ])
  const schedule = () => {
    if (cancelled) return
    const delay = active.has(String(ql7SupportUi?.supportUiState || '')) ? 650 : 5000
    timer = window.setTimeout(run, delay)
  }
  const run = async () => {
    if (cancelled || busy) return schedule()
    busy = true
    try { await hydrateQl7SupportRuntimeState() } catch {}
    finally { busy = false; schedule() }
  }
  schedule()
  return () => {
    cancelled = true
    try { if (timer) window.clearTimeout(timer) } catch {}
  }
}, [dmSupportMode, hydrateQl7SupportRuntimeState, ql7SupportUi?.supportUiState])

useEffect(() => {
  const wasOpen = supportEntryOpenRef.current
  if (dmSupportMode) {
    supportEntryOpenRef.current = true
    return
  }
  if (!wasOpen) return
  supportEntryOpenRef.current = false
  try {
    setDmThreadItems((prev) => (
      Array.isArray(prev) ? prev.filter((item) => !isQl7SupportEphemeralEntryMessageV11(item)) : prev
    ))
  } catch {}
  try {
    const snapshot = readQl7SupportAuthSnapshot()
    void fetchQl7SupportAuthenticated('/api/dm/support-entry', {
      method: 'DELETE',
      keepalive: true,
      headers: { 'content-type': 'application/json', 'x-forum-locale': String(locale || ''), ...buildQl7SupportAuthHeaders(snapshot) },
      body: JSON.stringify({ reason: 'support_thread_exit' }),
    }, { waitTimeoutMs: 5000, retryOnFreshAuth: false }).catch(() => null)
  } catch {}
}, [dmSupportMode, locale, setDmThreadItems])

const supportLatestMessage = Array.isArray(dmThreadItems) && dmThreadItems.length
  ? dmThreadItems[dmThreadItems.length - 1]
  : null
const supportLatestAnchor = supportLatestMessage
  ? `${String(supportLatestMessage?.id || '')}:${Number(supportLatestMessage?.ts || 0)}:${String(supportLatestMessage?.metadata?.responseCode || '')}`
  : ''
useEffect(() => {
  if (typeof window === 'undefined') return undefined
  try { if (supportIdleTimerRef.current) window.clearTimeout(supportIdleTimerRef.current) } catch {}
  supportIdleTimerRef.current = null
  if (!supportActive || !dmSupportMode || !supportLatestMessage || supportLatestMessage?.metadata?.idleNudge === true) return undefined
  const waitingState = String(supportLatestMessage?.metadata?.nextState || '')
  if (!['waiting_user', 'waiting_choice'].includes(waitingState) || supportLatestMessage?.metadata?.openMaterialQuestion !== true) return undefined
  const socialOnly = /^(?:привет|здравствуйте|спасибо|благодарю|пока|как дела|как настроение|hello|hi|thanks|thank you|bye|how are you)[!.?\s]*$/iu
  const hasMaterialUserTurn = (Array.isArray(dmThreadItems) ? dmThreadItems : []).some((item) => {
    if (isQl7SupportId(item?.from)) return false
    const text = String(item?.text || '').trim()
    return Boolean(text && !socialOnly.test(text))
  })
  if (!hasMaterialUserTurn) return undefined

  const from = String(supportLatestMessage?.fromCanonical || supportLatestMessage?.from || '').trim()
  const mine = new Set([String(meId || '').trim(), String(auth?.accountId || '').trim(), String(auth?.walletAddress || '').trim()].filter(Boolean))
  if (mine.has(from)) return undefined

  const configured = Number(process.env.NEXT_PUBLIC_QL7_SUPPORT_IDLE_NUDGE_MS || 7 * 60 * 1000)
  const delay = Math.max(5 * 60 * 1000, Math.min(10 * 60 * 1000, Number.isFinite(configured) ? configured : 7 * 60 * 1000))
  const expectedAnchor = supportLatestAnchor
  supportIdleTimerRef.current = window.setTimeout(() => {
    if (!supportEntryOpenRef.current) return
    setDmThreadItems((prev) => {
      const rows = Array.isArray(prev) ? prev : []
      const latest = rows.length ? rows[rows.length - 1] : null
      const latestAnchor = latest
        ? `${String(latest?.id || '')}:${Number(latest?.ts || 0)}:${String(latest?.metadata?.responseCode || '')}`
        : ''
      if (!latest || latestAnchor !== expectedAnchor || latest?.metadata?.idleNudge === true) return prev
      const latestFrom = String(latest?.fromCanonical || latest?.from || '').trim()
      if (mine.has(latestFrom)) return prev
      const nudge = createQl7SupportIdleNudgeMessageV11({
        userId: meId || auth?.accountId || auth?.walletAddress || '',
        locale,
        entryNonce: supportEntryNonceRef.current,
        anchorId: String(latest?.id || latestAnchor),
        now: Date.now(),
      })
      return [...rows, nudge]
    })
  }, delay)
  return () => {
    try { if (supportIdleTimerRef.current) window.clearTimeout(supportIdleTimerRef.current) } catch {}
    supportIdleTimerRef.current = null
  }
}, [auth?.accountId, auth?.walletAddress, dmSupportMode, locale, meId, setDmThreadItems, supportActive, supportLatestAnchor, supportLatestMessage, dmThreadItems])

inboxMessagesModeRef.current = !!inboxOpen && inboxTab === 'messages'
useHtmlFlag('data-inbox-open', inboxOpen ? '1' : null)
const {
  threadRoot,
  setThreadRoot,
  navStackRef,
  navDepth,
  setNavDepth,
  navRestoringRef,
  navPendingThreadRootRef,
  navStateRef,
  allPosts,
  idMap,
  flat,
  visibleFlat,
  threadHasMore,
  topicRootsLoading,
  topicRootsReady,
  topicRootsHasMore,
  loadTopicRootsPage,
  openThreadForPost,
  threadOpening,
  pendingThreadRootIdRef,
  pendingScrollToPostIdRef,
  centerPostAfterDom,
  deeplinkUI,
  bannedSet,
  aggregates,
  results,
  sortedTopics,
  visibleTopics,
  topicsHasMore,
} = useForumFeedRuntime({
  api,
  selectedTopicId: sel?.id,
  setSelectedTopic: setSel,
  data,
  postSort,
  setPostSort,
  topicSort,
  contentRefreshToken,
  topicFilterId,
  authorFilterUserId: profileBranchMode === 'topics' ? normalizedProfileBranchUserId : null,
  query: q,
  activeStarredAuthors,
  visibleThreadPostsCount,
  setVisibleThreadPostsCount,
  threadPageSize: THREAD_PAGE_SIZE,
  visibleTopicsCount,
  setTopicFilterId,
  setInboxOpen,
  setVideoFeedOpenFn: setVideoFeedOpenBridge,
  pushNavStateStable,
  isBrowserFn: isBrowser,
  bodyRef,
  toast,
  t,
  resolveNickForDisplayFn: resolveNickForDisplay,
  extractDmStickersFromTextFn: extractDmStickersFromText,
  stripMediaUrlsFromTextFn: stripMediaUrlsFromText,
  extractUrlsFromTextFn: extractUrlsFromText,
  isImageUrlFn: isImageUrl,
  isVideoUrlFn: isVideoUrl,
  isAudioUrlFn: isAudioUrl,
  isYouTubeUrlFn: isYouTubeUrl,
  isTikTokUrlFn: isTikTokUrl,
  buildSearchVideoMediaFn: buildSearchVideoMedia,
  starredFirstFn: starredFirst,
  resolveProfileAccountIdFn: resolveProfileAccountId,
})

useForumModeSync({
  videoFeedOpenRef,
  questOpen,
  questId: questSel?.id,
  inboxOpen,
  inboxTab,
  dmWithUserId,
  selectedTopicId: sel?.id,
  threadRootId: threadRoot?.id,
  profileBranchMode,
  normalizedProfileBranchUserId,
  navRestoringRef,
  deeplinkActive: deeplinkUI?.active,
  requestAlignInboxStartUnderTabs,
  bodyRef,
  getScrollEl,
  alignNodeToTop,
  headAutoOpenRef,
  setHeadPinned,
  setHeadHidden,
  isBrowserFn: isBrowser,
  topicsCardsCount: visibleTopics?.length || 0,
  canAutoAlignNow,
})

const surfaceSyncKey = useMemo(() => {
  return [
    sel?.id || 'home',
    threadRoot?.id || '',
    inboxOpen ? `inbox:${inboxTab || ''}:${dmWithUserId || ''}` : '',
    questOpen ? `quest:${questSel?.id || questSel || ''}` : '',
    profileBranchMode ? `profile:${profileBranchMode}:${normalizedProfileBranchUserId || ''}` : '',
    topicFilterId || '',
    topicSort || '',
    postSort || '',
    starMode ? 'star' : '',
  ].join('|')
}, [
  sel?.id,
  threadRoot?.id,
  inboxOpen,
  inboxTab,
  dmWithUserId,
  questOpen,
  questSel,
  profileBranchMode,
  normalizedProfileBranchUserId,
  topicFilterId,
  topicSort,
  postSort,
  starMode,
])

useEffect(() => {
  if (!surfaceSyncKey) return

  if (!lastSurfaceSyncKeyRef.current) {
    lastSurfaceSyncKeyRef.current = surfaceSyncKey
    return
  }

  if (lastSurfaceSyncKeyRef.current === surfaceSyncKey) return

  lastSurfaceSyncKeyRef.current = surfaceSyncKey

  // Переход между ветками/режимами: поверхность всё равно меняется или выравнивается,
  // поэтому здесь безопаснее применить накопленные snapshot-события.
  // Внутри requestSurfaceSnapshotSync стоит throttle, поэтому прыжки туда-сюда не засыпают API.
  requestSurfaceSnapshotSync('surface_key_change')
}, [surfaceSyncKey, requestSurfaceSnapshotSync])

const findSortRefreshBranchStartCard = useCallback(() => {
  try {
    const scrollEl =
      getScrollEl?.() ||
      bodyRef.current ||
      document.querySelector('[data-forum-scroll="1"]') ||
      null
    const root = scrollEl || document

    if (profileBranchMode) {
      const profileRoot =
        root.querySelector?.('[data-profile-branch-root="1"]') ||
        document.querySelector?.('[data-profile-branch-root="1"]') ||
        null
      return (
        profileRoot?.querySelector?.('[data-profile-branch-start="1"]') ||
        root.querySelector?.('[data-profile-branch-start="1"]') ||
        profileRoot?.querySelector?.('[data-feed-card="1"]') ||
        root.querySelector?.('[data-feed-card="1"]') ||
        (root !== document
          ? (
              document.querySelector?.('[data-profile-branch-root="1"] [data-profile-branch-start="1"]') ||
              document.querySelector?.('[data-profile-branch-root="1"] [data-feed-card="1"]') ||
              document.querySelector?.('[data-feed-card="1"]') ||
              null
            )
          : null)
      )
    }

    if (inboxOpen) {
      return (
        root.querySelector?.('.inboxBody [data-feed-card="1"]') ||
        root.querySelector?.('[data-feed-card="1"]') ||
        (root !== document
          ? (
              document.querySelector?.('.inboxBody [data-feed-card="1"]') ||
              document.querySelector?.('[data-feed-card="1"]') ||
              null
            )
          : null)
      )
    }

    if (sel?.id) {
      const threadPane =
        root.querySelector?.('[data-thread-replies-pane="1"]') ||
        (root !== document ? document.querySelector?.('[data-thread-replies-pane="1"]') : null) ||
        null
      return (
        threadPane?.querySelector?.('[data-thread-list-first-card="1"][data-feed-card="1"]') ||
        threadPane?.querySelector?.('[data-thread-branch-root="1"][data-feed-card="1"]') ||
        threadPane?.querySelector?.('[data-thread-replies-start="1"]') ||
        root.querySelector?.('[data-thread-replies-pane="1"] [data-thread-list-first-card="1"][data-feed-card="1"]') ||
        root.querySelector?.('[data-thread-replies-pane="1"] [data-thread-branch-root="1"][data-feed-card="1"]') ||
        root.querySelector?.('[data-thread-replies-pane="1"] [data-thread-replies-start="1"]') ||
        root.querySelector?.('[data-forum-thread-start="1"]') ||
        threadPane ||
        (root !== document
          ? (
              document.querySelector?.('[data-thread-replies-pane="1"] [data-thread-list-first-card="1"][data-feed-card="1"]') ||
              document.querySelector?.('[data-thread-replies-pane="1"] [data-thread-branch-root="1"][data-feed-card="1"]') ||
              document.querySelector?.('[data-thread-replies-pane="1"] [data-thread-replies-start="1"]') ||
              document.querySelector?.('[data-forum-thread-start="1"]') ||
              null
            )
          : null)
      )
    }

    return (
      root.querySelector?.('[data-feed-card="1"]') ||
      (root !== document
        ? (
            document.querySelector?.('[data-forum-scroll="1"] [data-feed-card="1"]') ||
            document.querySelector?.('[data-feed-card="1"]') ||
            null
          )
        : null)
    )
  } catch {}
  return null
}, [bodyRef, getScrollEl, inboxOpen, profileBranchMode, sel?.id])

const runSortRefreshAlignment = useCallback((options = {}) => {
  const force = !!options?.force
  if (!force && !canAutoAlignNow?.()) return false
  try { headAutoOpenRef.current = false } catch {}
  try { setHeadPinned(false) } catch {}
  try { setHeadHidden(true) } catch {}

  try {
    if (videoFeedOpenRef.current) {
      snapVideoFeedToFirstCardTopUtil({
        opts: { hideHeader: true },
        isBrowserFn: isBrowser,
        bodyRef,
        headAutoOpenRef,
        setHeadPinned,
        setHeadHidden,
      })
      return true
    }
    if (inboxOpen) {
      requestAlignInboxStartUnderTabs?.()
      return true
    }
    const target = findSortRefreshBranchStartCard()
    if (!(target instanceof Element)) return false
    if (force) return alignSortRefreshNodeToTop(target)
    alignNodeToTop(target)
    return true
  } catch {}
  return false
}, [
  alignSortRefreshNodeToTop,
  alignNodeToTop,
  bodyRef,
  canAutoAlignNow,
  findSortRefreshBranchStartCard,
  inboxOpen,
  requestAlignInboxStartUnderTabs,
  setHeadHidden,
  setHeadPinned,
])

const commitSortChangeRefresh = useCallback((change = {}) => {
  if (String(change?.kind || '').trim() === 'geo_mode') return
  try { headAutoOpenRef.current = false } catch {}
  try { setHeadPinned(false) } catch {}
  try { setHeadHidden(true) } catch {}
  clearSortRefreshAlignHandles()
  sortRefreshStartedAtRef.current = Date.now()
  try {
    window.__forumProgrammaticScrollTs = Date.now()
    window.__forumProgrammaticScrollReason = 'sort_feed_refresh'
  } catch {}

  if (videoFeedOpenRef.current) {
    try { setVisibleVideoCount(VIDEO_PAGE_SIZE) } catch {}
    try { videoFeedHardResetBridgeRef.current?.current?.() } catch {}
  } else if (inboxOpen) {
    try { setVisibleRepliesCount(REPLIES_PAGE_SIZE) } catch {}
    try { setVisiblePublishedCount(PUBLISHED_PAGE_SIZE) } catch {}
  } else if (profileBranchMode === 'posts') {
    try { setVisibleProfilePostsCount(THREAD_PAGE_SIZE) } catch {}
  } else if (sel?.id) {
    try { setVisibleThreadPostsCount(THREAD_PAGE_SIZE) } catch {}
  } else {
    try { setVisibleTopicsCount(TOPIC_PAGE_SIZE) } catch {}
  }

  sortRefreshAlignPendingRef.current = true
  setContentRefreshToken((prev) => prev + 1)
  requestSurfaceSnapshotSync('sort_change_refresh')

  try {
    ;[0, 80, 180, 320].forEach((delay) => {
      const timerId = setTimeout(() => {
        try { runSortRefreshAlignment({ force: true }) } catch {}
      }, delay)
      sortRefreshAlignTimersRef.current.push(timerId)
    })
  } catch {}
}, [
  VIDEO_PAGE_SIZE,
  TOPIC_PAGE_SIZE,
  REPLIES_PAGE_SIZE,
  THREAD_PAGE_SIZE,
  PUBLISHED_PAGE_SIZE,
  clearSortRefreshAlignHandles,
  inboxOpen,
  runSortRefreshAlignment,
  setHeadHidden,
  setHeadPinned,
  setVisibleProfilePostsCount,
  setVisiblePublishedCount,
  setVisibleRepliesCount,
  setVisibleThreadPostsCount,
  setVisibleTopicsCount,
  setVisibleVideoCount,
  profileBranchMode,
  requestSurfaceSnapshotSync,
  sel?.id,
])

const refreshHomeFeedSurface = useCallback((options = {}) => {
  const reason = String(options?.reason || 'home_feed_refresh')
  const alignTop = options?.alignTop !== false
  clearSortRefreshAlignHandles()
  try { resetForumFeedSeed() } catch {}
  try { setTopicSort('random') } catch {}
  if (alignTop) {
    try { headAutoOpenRef.current = false } catch {}
    try { setHeadPinned(false) } catch {}
    try { setHeadHidden(true) } catch {}
    sortRefreshStartedAtRef.current = Date.now()
    sortRefreshAlignPendingRef.current = true
    try {
      window.__forumProgrammaticScrollTs = Date.now()
      window.__forumProgrammaticScrollReason = 'sort_feed_refresh'
    } catch {}
  }
  try { setVisibleVideoCount(VIDEO_PAGE_SIZE) } catch {}
  try { setVisibleTopicsCount(TOPIC_PAGE_SIZE) } catch {}
  try { setVisibleRepliesCount(REPLIES_PAGE_SIZE) } catch {}
  try { setVisibleThreadPostsCount(THREAD_PAGE_SIZE) } catch {}
  try { setVisiblePublishedCount(PUBLISHED_PAGE_SIZE) } catch {}
  try { setVisibleProfilePostsCount(THREAD_PAGE_SIZE) } catch {}
  try { videoFeedHardResetBridgeRef.current?.current?.() } catch {}
  setContentRefreshToken((prev) => prev + 1)
  requestSurfaceSnapshotSync(reason)

  if (alignTop) {
    try {
      ;[0, 120, 260, 520, 900].forEach((delay) => {
        const timerId = setTimeout(() => {
          try { runSortRefreshAlignment({ force: true }) } catch {}
        }, delay)
        sortRefreshAlignTimersRef.current.push(timerId)
      })
    } catch {}
  }
}, [
  VIDEO_PAGE_SIZE,
  TOPIC_PAGE_SIZE,
  REPLIES_PAGE_SIZE,
  THREAD_PAGE_SIZE,
  PUBLISHED_PAGE_SIZE,
  clearSortRefreshAlignHandles,
  requestSurfaceSnapshotSync,
  runSortRefreshAlignment,
  setHeadHidden,
  setHeadPinned,
  setTopicSort,
  setVisibleProfilePostsCount,
  setVisiblePublishedCount,
  setVisibleRepliesCount,
  setVisibleThreadPostsCount,
  setVisibleTopicsCount,
  setVisibleVideoCount,
])

const autoFeedRefreshRef = useRef({ startupRebuildCount: 0, lastStartupRebuildAt: 0, lastModeRefreshAt: 0 })

useEffect(() => {
  if (!isBrowser()) return undefined
  const runStartupRebuild = (reason) => {
    try {
      if (Number(autoFeedRefreshRef.current.startupRebuildCount || 0) >= 4) return false
      const now = Date.now()
      if (now - Number(autoFeedRefreshRef.current.lastStartupRebuildAt || 0) < 900) return false
      const mode = String(window.__ql7ForumGeoFeedMode || 'geo').trim().toLowerCase()
      if (mode === 'world') return false
      const pageAgeMs = typeof performance !== 'undefined' ? Number(performance.now?.() || 0) : 0
      if (pageAgeMs > 12_000) return false
      if (pageAgeMs > 10_500) {
        const lastUserScrollTs = Number(window.__forumUserScrollTs || 0)
        if (lastUserScrollTs > 0) return false
      }
      autoFeedRefreshRef.current.lastStartupRebuildAt = now
      autoFeedRefreshRef.current.startupRebuildCount = Number(autoFeedRefreshRef.current.startupRebuildCount || 0) + 1
      refreshHomeFeedSurface({ reason, alignTop: false })
      return true
    } catch {}
    return false
  }

  const runModeRebuild = (reason) => {
    const now = Date.now()
    if (now - Number(autoFeedRefreshRef.current.lastModeRefreshAt || 0) < 350) return
    autoFeedRefreshRef.current.lastModeRefreshAt = now
    refreshHomeFeedSurface({ reason, alignTop: true })
  }

  const onGeoModeChange = (event) => {
    const detailMode = String(event?.detail?.mode || '').trim().toLowerCase()
    runModeRebuild(detailMode === 'world' ? 'geo_mode_world_rebuild' : 'geo_mode_geo_rebuild')
  }

  const onGeoReady = () => {
    runStartupRebuild('startup_geo_ready_rebuild')
  }

  const timers = [
    window.setTimeout(() => runStartupRebuild('startup_geo_retry_6s_rebuild'), 6000),
    window.setTimeout(() => runStartupRebuild('startup_geo_retry_8s_rebuild'), 8000),
    window.setTimeout(() => runStartupRebuild('startup_geo_retry_10s_rebuild'), 10000),
  ]

  window.addEventListener('forum:geo-feed-mode-change', onGeoModeChange)
  window.addEventListener('forum:geo-session-touch-ready', onGeoReady)
  return () => {
    try { timers.forEach((timerId) => window.clearTimeout(timerId)) } catch {}
    window.removeEventListener('forum:geo-feed-mode-change', onGeoModeChange)
    window.removeEventListener('forum:geo-session-touch-ready', onGeoReady)
  }
}, [refreshHomeFeedSurface])


useEffect(() => {
  if (!sortRefreshAlignPendingRef.current) return undefined

  sortRefreshAlignPendingRef.current = false
  clearSortRefreshAlignHandles()
  const sortRefreshStartedAt = Number(sortRefreshStartedAtRef.current || 0)

  const startUserScrollTs = (() => {
    try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
  })()

  const isOwnSortProgrammaticScroll = (ts) => {
    try {
      const scrollTs = Number(ts || 0)
      const programmaticTs = Number(window.__forumProgrammaticScrollTs || 0)
      const reason = String(window.__forumProgrammaticScrollReason || '')
      if (!scrollTs || !programmaticTs) return false
      if (sortRefreshStartedAt && programmaticTs < sortRefreshStartedAt - 80) return false
      if (!reason.startsWith('sort_')) return false
      return Math.abs(scrollTs - programmaticTs) <= 260
    } catch {}
    return false
  }

  let cancelled = false
  const scheduleAlign = (attempt = 0) => {
    if (cancelled) return
    const currentUserScrollTs = (() => {
      try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
    })()
    if (
      attempt > 0 &&
      currentUserScrollTs > startUserScrollTs &&
      !isOwnSortProgrammaticScroll(currentUserScrollTs)
    ) return
    const aligned = !!runSortRefreshAlignment({ force: true })
    if (aligned) return
    if (attempt >= 12) return
    const delay = attempt <= 1 ? 72 : (attempt <= 6 ? 130 : 200)
    const timerId = setTimeout(() => scheduleAlign(attempt + 1), delay)
    sortRefreshAlignTimersRef.current.push(timerId)
  }

  try {
    const rafA = requestAnimationFrame(() => {
      const rafB = requestAnimationFrame(() => scheduleAlign(0))
      sortRefreshAlignRafsRef.current.push(rafB)
    })
    sortRefreshAlignRafsRef.current.push(rafA)
  } catch {
    const timerId = setTimeout(() => scheduleAlign(0), 0)
    sortRefreshAlignTimersRef.current.push(timerId)
  }

  return () => {
    cancelled = true
    clearSortRefreshAlignHandles()
  }
}, [clearSortRefreshAlignHandles, contentRefreshToken, runSortRefreshAlignment])

useForumHeadCollapse({
  isBrowserFn: isBrowser,
  selId: sel?.id,
  bodyRef,
  navRestoringRef,
  pendingScrollToPostIdRef,
  pendingThreadRootIdRef,
  headAutoOpenRef,
  headHiddenRef,
  headPinnedRef,
  setHeadHidden,
  setHeadPinned,
  videoFeedOpenRef,
  inboxMessagesModeRef,
})

  const {
    text,
    setText,
    replyTo,
    setReplyTo,
    pendingImgs,
    pendingImgsRef,
    pendingImageDraftsRef,
    setPendingImgs,
    removePendingImageAt,
    pendingSticker,
    setPendingSticker,
    composerMediaKind,
    composerActive,
    setComposerActive,
    composerRef,
    saveComposerScroll,
    restoreComposerScroll,
    pendingAudio,
    setPendingAudio,
    recState,
    recElapsed,
    startRecord,
    stopRecord,
    videoState,
    setVideoState,
    videoOpen,
    setVideoOpen,
    videoElapsed,
    setVideoElapsed,
    videoElapsedRef,
    videoTimerRef,
    videoRecordStartedAtRef,
    videoStreamRef,
    videoRecRef,
    videoChunksRef,
    videoStopRequestedRef,
    videoAutoStopAtLimitRef,
    pendingVideoInfoRef,
    pendingVideoBlobMetaRef,
    pendingVideo,
    setPendingVideo,
    pendingVideoRef,
    setVideoProgress,
    mediaBarOn,
    setMediaBarOn,
    mediaPhase,
    setMediaPhase,
    mediaPct,
    setMediaPct,
    formatMediaPhase,
    mediaPipelineOn,
    setMediaPipelineOn,
    mediaAbortRef,
    mediaCancelRef,
    clearMediaAbortController,
    hasComposerMedia,
    stopMediaProg,
    startSoftProgress,
    beginMediaPipeline,
    endMediaPipeline,
    overlayMediaKind,
    setOverlayMediaKind,
    overlayMediaUrl,
    setOverlayMediaUrl,
    overlayImageIndex,
    setOverlayImageIndex,
    openPendingImageFullscreen,
    cooldownLeft,
    setCooldownLeft,
    videoCancelRef,
    videoMirrorRef,
  } = useForumComposerRuntime({
    bodyRef,
    t,
    toast,
    dmMode,
    readAudioDurationSecFn: readAudioDurationSec,
    forumAudioMaxSeconds: FORUM_AUDIO_MAX_SECONDS,
  })

  // === Режим редактирования поста (owner) ===
  const focusDmMessageById = React.useCallback((messageId, reason = 'dm-send-focus') => {
    const id = String(messageId || '').trim()
    if (!id || typeof window === 'undefined' || typeof document === 'undefined') return
    const domId = `dm_msg_${id}`
    try { revealForumWindowedDomId(domId, { holdMs: 2600, reason }) } catch {}

    const attemptFocus = (attempt = 0) => {
      const node = document.getElementById(domId)
      if (node) {
        try { window.__forumProgrammaticScrollTs = Date.now() } catch {}
        try {
          node.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
        } catch {
          try { node.scrollIntoView(false) } catch {}
        }
        return
      }
      if (attempt >= 12) return
      try { window.setTimeout(() => attemptFocus(attempt + 1), attempt < 4 ? 70 : 140) } catch {}
    }

    attemptFocus()
  }, [])

  const [editPostId, setEditPostId] = React.useState(null)
  const editModeAlignTimersRef = React.useRef([])
  const editModeAlignRafsRef = React.useRef([])
  const clearEditModeAlignHandles = React.useCallback(() => {
    try {
      editModeAlignTimersRef.current.forEach((timerId) => clearTimeout(timerId))
      editModeAlignTimersRef.current = []
    } catch {}
    try {
      editModeAlignRafsRef.current.forEach((rafId) => cancelAnimationFrame(rafId))
      editModeAlignRafsRef.current = []
    } catch {}
  }, [])
  React.useEffect(() => clearEditModeAlignHandles, [clearEditModeAlignHandles])

  const scheduleEditModeBranchAlign = React.useCallback((postId) => {
    const targetPostId = String(postId || '').trim()
    if (!targetPostId || !isBrowser()) return

    clearEditModeAlignHandles()

    const startedAt = Date.now()
    const baselineUserScrollTs = (() => {
      try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
    })()

    const alignAttempt = (attempt = 0) => {
      try {
        if ((Date.now() - startedAt) > 3000) return
        const currentUserScrollTs = Number(window.__forumUserScrollTs || 0)
        if (attempt > 0 && currentUserScrollTs > baselineUserScrollTs) return

        try {
          revealForumWindowedDomId(`post_${targetPostId}`, { holdMs: 2200 })
        } catch {}

        const threadRootNode = document.querySelector('[data-thread-branch-root="1"]')
        const targetPostNode = document.getElementById(`post_${targetPostId}`)
        const threadStartNode = document.querySelector('[data-forum-thread-start="1"]')
        const targetNode = threadRootNode || targetPostNode || threadStartNode || null

        if (targetNode instanceof Element) {
          alignNodeToTop(targetNode)
          return
        }

        if (attempt >= 14) return
        const delay = attempt <= 3 ? 64 : (attempt <= 9 ? 120 : 180)
        const timerId = window.setTimeout(() => alignAttempt(attempt + 1), delay)
        editModeAlignTimersRef.current.push(timerId)
      } catch {}
    }

    try {
      const rafA = requestAnimationFrame(() => {
        const rafB = requestAnimationFrame(() => alignAttempt(0))
        editModeAlignRafsRef.current.push(rafB)
      })
      editModeAlignRafsRef.current.push(rafA)
    } catch {
      const timerId = window.setTimeout(() => alignAttempt(0), 0)
      editModeAlignTimersRef.current.push(timerId)
    }
  }, [alignNodeToTop, clearEditModeAlignHandles])

  const prepareEditMode = React.useCallback((detail) => {
    const targetPostId = String(detail?.postId || '').trim()
    if (!targetPostId) return

    const detailPost = detail?.post && String(detail?.post?.id || '') === targetPostId
      ? detail.post
      : null
    const topicId = String(detailPost?.topicId || detail?.topicId || '').trim()
    const targetPost =
      (data?.posts || []).find((item) => String(item?.id || '') === targetPostId) ||
      (detailPost && topicId ? { ...detailPost, topicId } : null) ||
      (topicId ? { id: targetPostId, topicId, text: String(detail?.text || '') } : null)

    try { setReplyTo(null) } catch {}
    try { if (profileBranchMode) clearProfileBranch() } catch {}
    try { if (questOpen) setQuestOpen(false) } catch {}
    try { if (questSel) setQuestSel(null) } catch {}

    if (targetPost?.topicId) {
      try {
        openThreadForPost(targetPost, {
          closeInbox: true,
          closeVideoFeed: true,
          entryId: `post_${targetPostId}`,
        })
      } catch {}
      scheduleEditModeBranchAlign(targetPostId)
      return
    }

    try { setInboxOpen(false) } catch {}
    try { setVideoFeedOpenBridge(false) } catch {}
  }, [
    clearProfileBranch,
    data?.posts,
    openThreadForPost,
    profileBranchMode,
    questOpen,
    questSel,
    scheduleEditModeBranchAlign,
    setInboxOpen,
    setQuestOpen,
    setQuestSel,
    setReplyTo,
    setVideoFeedOpenBridge,
  ])

  useForumEditMode({
    t,
    toast,
    composerRef,
    setEditPostId,
    setText,
    setComposerActive,
    prepareEditMode,
  })

const {
  videoLimitOverlay,
  closeVideoLimitOverlay,
  showVideoLimitOverlay,
  videoTrimPopover,
  closeVideoTrimPopover,
  setVideoTrimStartSec,
  applyVideoTrimPopover,
} = useVideoTrimController({
  emitDiag,
  forumVideoMaxSeconds: FORUM_VIDEO_MAX_SECONDS,
  pendingVideo,
  setPendingVideo,
  pendingVideoRef,
  pendingVideoBlobMetaRef,
  pendingVideoInfoRef,
  setOverlayMediaKind,
  setOverlayMediaUrl,
  setVideoOpen,
  setVideoState,
  saveComposerScroll,
  restoreComposerScroll,
});

const {
  startVideo,
  stopVideo,
  resetVideo,
  cancelMediaOperation,
  acceptMediaFromOverlay,
  resetOrCloseOverlay,
  openPendingVideoFullscreen,
  removePendingVideoAttachment,
} = useVideoCaptureController({
  videoState,
  setVideoState,
  setVideoOpen,
  setVideoElapsed,
  videoElapsedRef,
  videoTimerRef,
  videoRecordStartedAtRef,
  videoStreamRef,
  videoRecRef,
  videoChunksRef,
  videoStopRequestedRef,
  videoAutoStopAtLimitRef,
  videoCancelRef,
  videoMirrorRef,
  pendingVideo,
  setPendingVideo,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  forumVideoMaxSeconds: FORUM_VIDEO_MAX_SECONDS,
  forumVideoCameraRecordEpsilonSec: FORUM_VIDEO_CAMERA_RECORD_EPSILON_SEC,
  saveComposerScroll,
  restoreComposerScroll,
  readVideoDurationSecFn: readVideoDurationSec,
  emitDiag,
  showVideoLimitOverlay,
  toast,
  t,
  setVideoProgress,
  stopMediaProg,
  setMediaPipelineOn,
  mediaCancelRef,
  mediaAbortRef,
  clearMediaAbortController,
  setMediaBarOn,
  setMediaPhase,
  setMediaPct,
  setPendingImgs,
  pendingAudio,
  setPendingAudio,
  setOverlayMediaUrl,
  setOverlayMediaKind,
  overlayMediaKind,
  hasComposerMedia,
  setComposerActive,
});

const composerBusy = React.useMemo(() => {
  const phase = String(mediaPhase || '').toLowerCase()
  const phaseBusy = (
    phase === 'queued' ||
    phase === 'preparing' ||
    phase === 'moderating' ||
    phase === 'processing' ||
    phase === 'optimizing' ||
    phase === 'uploading' ||
    phase === 'sending' ||
    phase === 'transcoding'
  )
  const busyPhase = !!(phaseBusy || (mediaPipelineOn && phase !== 'ready' && phase !== 'idle'))
  const videoBusy = (
    videoState === 'live' ||
    videoState === 'recording' ||
    videoState === 'stopping' ||
    videoState === 'processing' ||
    videoState === 'uploading'
  )
  return !!(busyPhase || videoBusy || recState === 'rec')
}, [mediaPhase, mediaPipelineOn, recState, videoState])
const {
  canSend,
  createTopic,
  postingRef,
  markViewPost,
  markViewTopic,
  emojiOpen,
  setEmojiOpen,
  emojiTab,
  setEmojiTab,
  addEmoji,
  handleComposerVideoButtonClick,
  handleComposerSendButtonClick,
  fileInputRef,
  fileInputAccept,
  handleAttachClick,
  onFilesChosen,
} = useForumComposerSubmitRuntime({
  createTopicArgs: {
    rateLimiter: rl,
    toast,
    t,
    requireAuthStrict,
    resolveProfileAccountId,
    safeReadProfile,
    resolveNickForDisplay,
    resolveIconForDisplay,
    hasAnyLink,
    isBrowserFn: isBrowser,
    setOverlay,
    setSel,
    pushOp,
    syncNowRef,
    setText,
    setPendingImgs,
    setPendingAudio,
    resetVideo,
    setReplyTo,
  },
  createPostArgs: {
    saveComposerScroll,
    restoreComposerScroll,
    editPostId,
    auth,
    getForumUserIdFn: getForumUserId,
    text,
    setText,
    setOverlay,
    pushOp,
    setEditPostId,
    toast,
    t,
    rateLimiter: rl,
    pendingVideo,
    pendingAudio,
    pendingImgs,
    pendingImageDraftsRef,
    pendingSticker,
    beginMediaPipeline,
    moderateImageFiles,
    moderateVideoSource,
    reasonKey,
    setMediaLock,
    registerForumVideoModerationSource,
    startSoftProgress,
    mediaCancelRef,
    pendingVideoRef,
    pendingVideoInfoRef,
    pendingVideoBlobMetaRef,
    forumVideoFaststartTranscodeMaxBytes: FORUM_VIDEO_FASTSTART_TRANSCODE_MAX_BYTES,
    optimizeForumVideoFastStartFn: optimizeForumVideoFastStart,
    emitDiag,
    readVideoDurationSecFn: readVideoDurationSec,
    forumVideoMaxSeconds: FORUM_VIDEO_MAX_SECONDS,
    forumVideoCameraRecordEpsilonSec: FORUM_VIDEO_CAMERA_RECORD_EPSILON_SEC,
    showVideoLimitOverlay,
    endMediaPipeline,
    forumVideoMaxBytes: FORUM_VIDEO_MAX_BYTES,
    viewerId,
    stopMediaProg,
    setMediaPhase,
    setVideoProgress,
    setMediaPct,
    readAudioDurationSecFn: readAudioDurationSec,
    forumAudioMaxSeconds: FORUM_AUDIO_MAX_SECONDS,
    setPendingImgs,
    setPendingSticker,
    setPendingAudio,
    setPendingVideo,
    textLimit,
    dmMode,
    dmSupportMode,
    resolveProfileAccountId,
    dmWithUserId,
    selectedTopic: sel,
    requireAuthStrict,
    vipActive,
    dmBlockedMap,
    setDmThreadItems,
    setDmDialogs,
    dmDialogsCacheRef,
    dmThreadCacheRef,
    loadDmDialogs,
    loadDmThread,
    setDmBlockedByReceiverMap,
    toastI18n,
    locale,
    hasAnyLink,
    safeReadProfile,
    resolveNickForDisplay,
    resolveIconForDisplay,
    replyTo,
    threadRoot,
    data,
    setThreadRoot,
    hasComposerMedia,
    syncNowRef,
    setComposerActive,
    emitPostCreated,
    setMediaPipelineOn,
    setMediaBarOn,
    setReplyTo,
    resetVideo,
    setVideoOpen,
    setVideoState,
    centerPostAfterDom,
    onDmMessageFocus: focusDmMessageById,
    onQl7SupportUiState: setQl7SupportUiEvent,
  },
  viewTrackingArgs: {
    isBrowserFn: isBrowser,
    authAsherId: auth?.asherId,
    authAccountId: auth?.accountId,
    forumViewTtlSec: FORUM_VIEW_TTL_SEC,
    fallbackViewTtlSec: VIEW_TTL_SEC,
    getTimeBucketFn: getTimeBucket,
    dataPosts: data?.posts,
    dataTopics: data?.topics,
    selectedTopicId: sel?.id,
    enqueuePendingPostView,
    enqueuePendingTopicView,
    requestFlushSoon,
    setOverlay,
  },
  emojiArgs: { setText, setPendingSticker },
  actionHandlersArgs: {
    mediaLocked,
    composerMediaKind,
    videoState,
    saveComposerScroll,
    setComposerActive,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setVideoOpen,
    cooldownLeft,
    setVideoState,
    videoOpen,
    setCooldownLeft,
    resetVideo,
  },
  attachmentsArgs: {
    mediaLocked,
    composerMediaKind,
    pendingImgs,
    pendingImgsRef,
    pendingImageDraftsRef,
    saveComposerScroll,
    restoreComposerScroll,
    toast,
    t,
    setMediaPhase,
    setMediaPct,
    setPendingImgs,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setOverlayImageIndex,
    setVideoState,
    setVideoOpen,
    showVideoLimitOverlay,
    readVideoDurationSecFn: readVideoDurationSec,
    forumVideoMaxSeconds: FORUM_VIDEO_MAX_SECONDS,
    forumVideoMaxBytes: FORUM_VIDEO_MAX_BYTES,
    forumVideoFaststartTranscodeMaxBytes: FORUM_VIDEO_FASTSTART_TRANSCODE_MAX_BYTES,
    optimizeForumVideoFastStartFn: optimizeForumVideoFastStart,
    emitDiag,
    pendingVideo,
    setPendingVideo,
    pendingVideoInfoRef,
    pendingVideoBlobMetaRef,
    setVideoProgress,
    beginMediaPipeline,
    endMediaPipeline,
    mediaCancelRef,
  },
  text,
  pendingImgs,
  pendingSticker,
  pendingAudio,
  pendingVideo,
  composerBusy,
})

React.useEffect(() => {
  if (!dmSupportMode) return
  try { setEmojiOpen(false) } catch {}
  try { setPendingImgs([]) } catch {}
  try { setPendingSticker(null) } catch {}
  try { if (pendingAudio && /^blob:/i.test(String(pendingAudio))) URL.revokeObjectURL(pendingAudio) } catch {}
  try { setPendingAudio(null) } catch {}
  try {
    if (pendingVideo && /^blob:/i.test(String(pendingVideo))) {
      pendingVideoBlobMetaRef.current?.delete?.(String(pendingVideo))
      URL.revokeObjectURL(pendingVideo)
    }
  } catch {}
  try { setPendingVideo(null) } catch {}
  try { pendingVideoInfoRef.current = { source: '', durationSec: NaN } } catch {}
  try { setVideoOpen(false) } catch {}
  try { setVideoState('idle') } catch {}
  try { setVideoProgress(0) } catch {}
  try { stopMediaProg() } catch {}
  try { setMediaPipelineOn(false) } catch {}
  try { setMediaBarOn(false) } catch {}
  try { setMediaPhase('idle') } catch {}
  try { setMediaPct(0) } catch {}
}, [
  dmSupportMode,
  pendingAudio,
  pendingVideo,
  pendingVideoBlobMetaRef,
  pendingVideoInfoRef,
  setEmojiOpen,
  setMediaBarOn,
  setMediaPct,
  setMediaPhase,
  setMediaPipelineOn,
  setPendingAudio,
  setPendingImgs,
  setPendingSticker,
  setPendingVideo,
  setVideoOpen,
  setVideoProgress,
  setVideoState,
  stopMediaProg,
])

const {
  openProfilePostsBranch,
  openProfileTopicsBranch,
} = useForumProfileBranchActions({
  resolveProfileAccountIdFn: resolveProfileAccountId,
  resolveNickForDisplayFn: resolveNickForDisplay,
  pushNavStateStable,
  setProfileBranchMode,
  setProfileBranchUserId,
  setProfileBranchUserNick,
  setSelectedTopic: setSel,
  setThreadRoot,
  setReplyTo,
  setInboxOpen,
  setQuestOpen,
  setVideoFeedOpen: setVideoFeedOpenBridge,
  setTopicFilterId,
  setQuery: setQ,
  setDrop,
  setSortOpen,
  setVisibleProfilePostsCount,
  setVisibleTopicsCount,
  threadPageSize: THREAD_PAGE_SIZE,
  topicPageSize: TOPIC_PAGE_SIZE,
})

popoverControlsRef.current = {
  setProfileOpen,
  setVipOpen,
  setQcoinModalOpen,
  setSortOpen,
  setDrop,
}
const {
  videoFeedOpen,
  videoFeed,
  feedSort,
  setFeedSort,
  setVideoFeedUserSortLocked,
  videoHasMore,
  // QL7_GEO111_MEDIA_FEED_ROOT_ARGS_V1
  videoServerLoading,
  videoServerHasMore,
  loadVideoFeedPage,
  refreshVideoFeedWithoutReload,
  openVideoFeed,
  closeVideoFeed,
  openInboxGlobal,
  readEnv,
  QUEST_ENABLED,
  QUESTS,
  meUid,
  claimFx,
  questProg,
  openQuestCardChecked,
  TASK_DELAY_MS,
  getTaskRemainMs,
  markTaskDone,
  isCardCompleted,
  isCardClaimable,
  closeQuestClaimOverlay,
  confirmQuestClaim,
  openQuests,
  handleGlobalBack,
  canGlobalBack,
  goHome,
  adEvery,
  debugAdsSlots,
  pickAdUrlForSlot,
  vfSlots,
  vfWin,
  vfMeasureRef,
  videoFeedContextKey,
  videoFeedHardResetRef,
  dmDeleteText,
  dmDeleteCheckboxLabel,
} = useForumScreenFlowsRuntime({
  videoFeedArgs: {
    data,
    allPosts,
    api,
    locale,
    isMediaUrlFn: isMediaUrl,
    extractUrlsFromTextFn: extractUrlsFromText,
    viewerId,
    starredFirstFn: starredFirst,
    videoFeedOpenRef,
    navRestoringRef,
    emitDiag,
    visibleVideoCount,
    setVisibleVideoCount,
    videoPageSize: VIDEO_PAGE_SIZE,
    isBrowserFn: isBrowser,
    bodyRef,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    pushNavState,
    setInboxOpen,
    setSelectedTopic: setSel,
    setThreadRoot,
    setTopicFilterId,
    activeStarredAuthors,
    inboxOpen,
    questOpen,
    selectedTopic: sel,
    threadRoot,
  },
  dmOpenEventsArgs: {
    isBrowserFn: isBrowser,
    resolveProfileAccountIdFn: resolveProfileAccountId,
    openOnly,
    closeUserInfoPopover,
    closeReportPopover,
    setDmDeletePopover,
    setDmDeleteForAll,
    videoFeedOpenRef,
    setReplyTo,
    setThreadRoot,
    setSel,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    pushNavStateStable,
    setInboxOpen,
    setInboxTab,
    setDmWithUserId,
    reopenDeletedDmDialog,
    requestAlignInboxStartUnderTabs,
  },
  openInboxGlobalArgs: {
    inboxOpen,
    sel,
    threadRoot,
    dmWithUserId,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    openOnly,
    closeUserInfoPopover,
    closeReportPopover,
    setDmDeletePopover,
    setDmDeleteForAll,
    setInboxTab,
    setDmWithUserId,
    openQl7SupportThread,
    requestAlignInboxStartUnderTabs,
    setInboxOpen,
    pushNavStateStable,
    setReplyTo,
    setThreadRoot,
    setSel,
  },
  questArgs: {
    auth,
    pushNavStateStable,
    requireAuthStrict,
    openAuth,
    toast,
    t,
    vipActive,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    setInboxOpen,
    setSelectedTopic: setSel,
    setThreadRoot,
    bodyRef,
    questOpen,
    setQuestOpen,
    questSel,
    setQuestSel,
  },
  navigationArgs: {
    snapshotArgs: {
      navStateRef,
      headHidden,
      headPinned,
      sel,
      threadRoot,
      inboxOpen,
      inboxTab,
      dmWithUserId,
      questOpen,
      questSel,
      profileBranchMode,
      profileBranchUserId: normalizedProfileBranchUserId,
      profileBranchUserNick,
      topicFilterId,
      topicSort,
      postSort,
      starMode,
      q,
      drop,
      sortOpen,
      replyTo,
    },
    navActionsArgs: {
      isBrowserFn: isBrowser,
      bodyRef,
      navStateRef,
      navRestoringRef,
      navStackRef,
      navDepth,
      setNavDepth,
      setHeadHidden,
      setHeadPinned,
      headAutoOpenRef,
      setInboxOpen,
      setInboxTab,
      setDmWithUserId,
      setQuestOpen,
      setQuestSel,
      setProfileBranchMode,
      setProfileBranchUserId,
      setProfileBranchUserNick,
      setTopicFilterId,
      setTopicSort,
      setPostSort,
      setStarMode,
      setQ,
      setDrop,
      setSortOpen,
      data,
      setReplyTo,
      setSel,
      setThreadRoot,
      sel,
      navPendingThreadRootRef,
      idMap,
      restoreNavEntryPosition,
      restoreNavScrollSnapshot,
      getNavScrollSnapshot,
      getNavEntryOffset,
      videoOpen,
      overlayMediaUrl,
      resetOrCloseOverlay,
      inboxOpen,
      dmWithUserId,
      questOpen,
      questSel,
      profileBranchMode,
      clearProfileBranch,
      threadRoot,
    },
    bindNavActions,
    homeActionArgs: {
      headAutoOpenRef,
      setHeadPinned,
      setHeadHidden,
      onHomeFeedRefresh: refreshHomeFeedSurface,
      setInboxOpen,
      setReplyTo,
      setThreadRoot,
      setSel,
      clearProfileBranch,
    },
  },
  adsArgs: { auth },
  windowingArgs: {
    interleaveAdsFn: interleaveAds,
    bodyRef,
    emitDiag,
    isBrowserFn: isBrowser,
  },
  dmDeleteCopyArgs: {
    dmDeletePopover,
    t,
    shortIdFn: shortId,
  },
  setVideoFeedOpenRef,
})

useEffect(() => {
  videoFeedHardResetBridgeRef.current = videoFeedHardResetRef
}, [videoFeedHardResetRef])

useEffect(() => {
  if (!isBrowser()) return undefined

  const openQuestFromQuantumWallet = (event) => {
    const entryId = event?.detail?.entryId || 'quantum_wallet_quest'
    try {
      openQuests?.(entryId)
    } catch {}
  }

  window.addEventListener('quantum-wallet:quest-open', openQuestFromQuantumWallet)
  return () => window.removeEventListener('quantum-wallet:quest-open', openQuestFromQuantumWallet)
}, [openQuests])


const userRecommendationsRail = useUserRecommendationsRail({
  enabled: !!USER_RECOMMENDATIONS_RUNTIME?.enabled,
  videoFeedOpen,
  viewerId,
  feedSort,
  feedContextKey: videoFeedContextKey,
  vfSlots,
  vfWin,
  runtimeConfig: USER_RECOMMENDATIONS_RUNTIME,
  emitDiag,
})

// Scroll Focus Lock (компенсация scroll при росте/сжатии блоков)
const compensateScrollOnResize = useScrollResizeCompensation()
const profileBranchTopicItems = useMemo(() => {
  if (profileBranchMode !== 'topics') return visibleTopics
  return Array.isArray(serverBranchTopics) ? serverBranchTopics : []
}, [profileBranchMode, serverBranchTopics, visibleTopics])
const profileBranchTopicsLoading = useMemo(() => {
  if (profileBranchMode !== 'topics') return false
  if (serverBranchStatus?.loading) return true
  const settledKey = String(serverBranchStatus?.key || '').trim()
  const hasTopics = Array.isArray(serverBranchTopics) && serverBranchTopics.length > 0
  return !settledKey && !hasTopics
}, [profileBranchMode, serverBranchStatus?.key, serverBranchStatus?.loading, serverBranchTopics])
const profileBranchTopicsHasMore = useMemo(() => {
  if (profileBranchMode !== 'topics') return topicsHasMore
  if (profileBranchTopicsLoading && (!Array.isArray(serverBranchTopics) || !serverBranchTopics.length)) return true
  return false
}, [profileBranchMode, profileBranchTopicsLoading, serverBranchTopics, topicsHasMore])
const profileBranchTopicsLength = useMemo(() => {
  if (profileBranchMode !== 'topics') return (sortedTopics || []).length
  if (!Array.isArray(serverBranchTopics) || !serverBranchTopics.length) return 0
  return serverBranchTopics.length
}, [profileBranchMode, serverBranchTopics, sortedTopics])
  const {
    forumHeaderPanelProps,
    mainActionClusterProps,
    threadActionClusterProps,
    topicsSwitchProps,
    threadRepliesPaneProps,
    composerCoreProps,
  } = buildForumRootPropBundles({
    t,
    locale, // QL7_GEO111_SEARCH_SORT_LOCALE_PROP_V1
    q,
    setQ,
    openOnly,
    drop,
    setDrop,
    results,
    headAutoOpenRef,
    setHeadPinned,
    setHeadHidden,
    getScrollEl,
    data,
    pushNavState,
    openQl7SupportThread,
    setTopicFilterId,
    setSel,
    setThreadRoot,
    openThreadForPost,
    sortOpen,
    setSortOpen,
    videoFeedOpen,
    setVideoFeedUserSortLocked,
    setFeedSort,
    feedSort,
    topicSort,
    postSort,
    sel,
    threadRoot,
    inboxTab,
    setPostSort,
    setTopicSort,
    profileBranchMode,
    starMode,
    setStarMode,
    onCommitSortChange: commitSortChangeRefresh,
    questEnabled: QUEST_ENABLED,
    questBtnClass,
    openQuests,
    headHidden,
    headPinned,
    videoState,
    videoOpen,
    isBrowserFn: isBrowser,
    avatarRef,
    nickShown,
    iconShown,
    profileOpen,
    setProfileOpen,
    idShown,
    auth,
    vipActive,
    setProfileBump,
    viewerId,
    myFollowersCount,
    myFollowingCount,
    myFollowersLoading,
    onOpenSubscriptions: openSubscriptionsPopover,
    moderateImageFiles,
    toastI18n,
    reasonKey,
    reasonFallbackEN,
    icons: ICONS,
    vipAvatars: VIP_AVATARS,
    copyId,
    qcoinModalOpen,
    withdrawBtnRef,
    setQcoinModalOpen,
    meUid,
    openAuth,
    aboutSaved,
    aboutDraft,
    aboutEditing,
    aboutSaving,
    startAboutEdit,
    setAboutDraft,
    cancelAboutEdit,
    saveAbout,
    vipBtnRef,
    vipOpen,
    setVipOpen,
    handleVipPay,
    openInboxGlobal,
    inboxOpen,
    mounted,
    unreadCount,
    dmUnreadCount,
    formatCount,
    closeVideoFeed,
    setInboxOpen,
    setReplyTo,
    refreshVideoFeedWithoutReload,
    openVideoFeed,
    goHome,
    canGlobalBack,
    handleGlobalBack,
    createTopic,
    inboxTab,
    setInboxTab,
    setDmWithUserId,
    requestAlignInboxStartUnderTabs,
    myPublishedPosts,
    publishedTotalCount,
    visibleRepliesToMe,
    adEvery,
    interleaveAds,
    debugAdsSlots,
    resolveNickForDisplay,
    openReportPopover,
    openSharePopover,
    reactMut,
    isAdmin,
    delPost,
    delPostOwn,
    banUser,
    unbanUser,
    bannedSet,
    markViewPost,
    starredAuthors,
    toggleAuthorStar,
    handleUserInfoToggle,
    pickAdUrlForSlot,
    compensateScrollOnResize,
    repliesHasMore,
    setVisibleRepliesCount,
    repliesPageSize: REPLIES_PAGE_SIZE,
    sortedRepliesToMe,
    serverRepliesHasMore,
    serverRepliesLoading,
    loadInboxRepliesPage,
    dmWithUserId,
    dmBlockedMap,
    dmBlockedByReceiverMap,
    meId,
    dmThreadRef,
    dmThreadHasMore,
    dmThreadLoading,
    dmThreadCursor,
    loadDmThread,
    dmThreadItems,
    dmDeletedMsgMap,
    dmThreadSeenTs,
    dmTranslateMap,
    setDmTranslateMap,
    resolveProfileAccountId,
    resolveIconForDisplay,
    openDmDeletePopover,
    toggleDmBlock,
    locale,
    dmDialogs,
    dmDeletedMap,
    dmSeenMap,
    stripMediaUrlsFromText,
    dmDialogsHasMore,
    dmDialogsLoading,
    dmDialogsCursor,
    loadDmDialogs,
    dmDialogsLoaded,
    ql7SupportUi,
    onSupportOperatorDelivered: handleQl7SupportOperatorDelivered,
    visiblePublishedPosts,
    publishedHasMore,
    publishedServerLoading,
    loadPublishedPostsPage,
    setVisiblePublishedCount,
    publishedPageSize: PUBLISHED_PAGE_SIZE,
    LoadMoreSentinel,
    PostCard,
    ForumAdSlot,
    vfWin,
    vfSlots,
    vfMeasureRef,
    userRecommendationsRail,
    userRecommendationsRuntime: USER_RECOMMENDATIONS_RUNTIME,
    onOpenUserPosts: openProfilePostsBranch,
    videoHasMore,
    videoServerLoading,
    videoServerHasMore,
    loadVideoFeedPage,
    setVisibleVideoCount,
    visibleVideoCount,
    videoPageSize: VIDEO_PAGE_SIZE,
    videoFeed,
    questOpen,
    quests: QUESTS,
    questProg,
    isCardCompleted,
    isCardClaimable,
    readEnv,
    getTaskRemainMs,
    taskDelayMs: TASK_DELAY_MS,
    openQuestCardChecked,
    setQuestSel,
    markTaskDone,
    questSel,
    profileBranchUserId: normalizedProfileBranchUserId,
    profileBranchUserNick,
    clearProfileBranch,
    visibleProfilePosts,
    profilePostsHasMore,
    setVisibleProfilePostsCount,
    profilePostsPageSize: THREAD_PAGE_SIZE,
    profilePostsLength: (profileBranchAllPosts || []).length,
    visibleTopics: profileBranchTopicItems,
    aggregates,
    markViewTopic,
    delTopic,
    delTopicOwn,
    topicsHasMore: profileBranchTopicsHasMore,
    topicsLoading: profileBranchTopicsLoading,
    setVisibleTopicsCount,
    topicPageSize: TOPIC_PAGE_SIZE,
    sortedTopicsLength: profileBranchTopicsLength,
    TopicItem,
    contentRefreshToken,
    visibleFlat,
    allPosts,
    threadHasMore,
    topicRootsLoading,
    topicRootsReady,
    topicRootsHasMore,
    loadTopicRootsPage,
    threadOpening,
    setVisibleThreadPostsCount,
    threadPageSize: THREAD_PAGE_SIZE,
    flatLength: (flat || []).length,
    threadRoot,
    composerActive,
    mediaBarOn,
    mediaPhase,
    mediaPct,
    formatMediaPhase,
    cancelMediaOperation,
    text,
    textLimit,
    mediaLocked,
    composerMediaKind,
    handleAttachClick,
    setEmojiOpen,
    onVideoButtonClick: handleComposerVideoButtonClick,
    recState,
    voiceTapLabel,
    stopRecord,
    startRecord,
    recElapsed,
    postingRef,
    cooldownLeft,
    canSend,
    composerBusy,
    dmMode,
    dmSupportMode,
    ql7SupportUi,
    onSendClick: handleComposerSendButtonClick,
    setText,
    setComposerActive,
    pendingImgs,
    openPendingImageFullscreen,
    removePendingImageAt,
    pendingSticker,
    setPendingSticker,
    pendingVideo,
    pendingVideoInfoRef,
    pendingVideoBlobMetaRef,
    pendingAudio,
    openPendingVideoFullscreen,
    removePendingVideoAttachment,
    setPendingAudio,
    emojiOpen,
    emojiTab,
    setEmojiTab,
    addEmoji,
    vipEmoji: VIP_EMOJI,
    emoji: EMOJI,
    fileInputRef,
    onFilesChosen,
    fileInputAccept,
  })
  const { overlayStackProps, composerDockProps } = buildForumLayoutProps({
    dmDeletePopover,
    dmDeleteText,
    dmDeleteCheckboxLabel,
    dmDeleteForAll,
    setDmDeleteForAll,
    dmDeletePending,
    closeDmDeletePopover,
    confirmDmDelete,
    t,
    videoOpen,
    videoState,
    videoElapsed,
    videoStreamRef,
    overlayMediaUrl,
    pendingVideo,
    pendingVideoInfoRef,
    pendingVideoBlobMetaRef,
    overlayMediaKind,
    pendingImgs,
    overlayImageIndex,
    setOverlayImageIndex,
    removePendingImageAt,
    acceptMediaFromOverlay,
    startVideo,
    stopVideo,
    resetOrCloseOverlay,
    videoLimitOverlay,
    videoLimitCopy,
    forumVideoMaxSeconds: FORUM_VIDEO_MAX_SECONDS,
    closeVideoLimitOverlay,
    videoTrimPopover,
    videoTrimCopy,
    setVideoTrimStartSec,
    closeVideoTrimPopover,
    applyVideoTrimPopover,
    reportUI,
    closeReportPopover,
    handleReportSelect,
    reportBusy,
    reportPopoverRef,
    uiDir,
    shareUI,
    closeSharePopover,
    toast,
    subscriptionsUI,
    closeSubscriptionsPopover,
    openSubscriptionsPopover,
    handleUserInfoToggle,
    userInfoAnchorRef,
    userInfoOpen,
    closeUserInfoPopover,
    userInfoUid,
    userInfoPreview,
    onOpenUserPosts: openProfilePostsBranch,
    onOpenUserTopics: openProfileTopicsBranch,
    rich,
    formatCount,
    claimFx,
    closeQuestClaimOverlay,
    confirmQuestClaim,
    sel,
    dmMode,
    composerFabVisible: Boolean(auth?.asherId || auth?.accountId),
    composerActive,
    composerRef,
    replyTo,
    threadRoot,
    resolveNickForDisplay,
    composerCoreProps,
    setComposerActive,
  })
  /* ---- render ---- */
  return (
    <ForumProviders>
      <GeoSessionTouchClient accountId={viewerId} />
      <ForumLayout
        sel={sel}
        t={t}
        toastView={toast.view}
        deeplinkUI={deeplinkUI}
        overlayStackProps={overlayStackProps}
        forumHeaderPanelProps={forumHeaderPanelProps}
        mainActionClusterProps={mainActionClusterProps}
        threadActionClusterProps={threadActionClusterProps}
        topicsSwitchProps={topicsSwitchProps}
        bodyRef={bodyRef}
        threadRoot={threadRoot}
        threadRepliesPaneProps={threadRepliesPaneProps}
        composerDockProps={composerDockProps}
      />
    </ForumProviders>
  )
};
