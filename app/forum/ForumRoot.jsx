// app/forum/ForumRoot.jsx
 
'use client'
 
import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react'
import { useI18n } from '../../components/i18n' 
import ForumLayout from './ForumLayout'
import ForumProviders from './ForumProviders'
import {
  optimizeForumVideoFastStart,
} from '../../lib/forumVideoTrim'
import useHtmlFlag from './shared/hooks/useHtmlFlag'
import useForumToast from './shared/hooks/useForumToast'
import { isBrowser } from './shared/utils/browser'
import { formatCount } from './shared/utils/counts'
import { rich } from './shared/utils/richText'
import {
  FORUM_VIDEO_MAX_SECONDS,
  FORUM_AUDIO_MAX_SECONDS,
  FORUM_VIDEO_MAX_BYTES,
  FORUM_VIDEO_FASTSTART_TRANSCODE_MAX_BYTES,
  FORUM_VIDEO_CAMERA_RECORD_EPSILON_SEC,
} from './shared/constants/media'
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
import { createUnmirroredFrontStream } from './features/media/utils/frontCameraMirror'

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
import api, { getForumUserId } from './services/forumApi'
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
} = useForumProfileBranchRuntime({
  posts: data?.posts,
  postSort,
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

/* ---- выбор темы и построение данных ---- */
const [sel, setSel] = useState(null);
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
} = useForumDmRuntime({
  isBrowserFn: isBrowser,
  auth,
  resolveProfileAccountIdFn: resolveProfileAccountId,
  dataPosts: data.posts,
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
})
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
  openThreadForPost,
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
  selectedTopicId: sel?.id,
  setSelectedTopic: setSel,
  data,
  postSort,
  topicSort,
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
      return (
        root.querySelector?.('[data-thread-branch-root="1"]') ||
        root.querySelector?.('[data-forum-thread-start="1"] ~ [data-feed-card="1"]') ||
        root.querySelector?.('[data-feed-card="1"]') ||
        (root !== document
          ? (
              document.querySelector?.('[data-thread-branch-root="1"]') ||
              document.querySelector?.('[data-forum-thread-start="1"] ~ [data-feed-card="1"]') ||
              document.querySelector?.('[data-feed-card="1"]') ||
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

const runSortRefreshAlignment = useCallback(() => {
  if (!canAutoAlignNow?.()) return false
  try { headAutoOpenRef.current = false } catch {}
  try { setHeadPinned(false) } catch {}
  try { setHeadHidden(true) } catch {}

  try {
    if (videoFeedOpenRef.current) {
      snapVideoFeedToFirstCardTopUtil({
        opts: { hideHeader: true, anchorOnly: true },
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
    alignNodeToTop(target)
    return true
  } catch {}
  return false
}, [
  alignNodeToTop,
  bodyRef,
  canAutoAlignNow,
  findSortRefreshBranchStartCard,
  inboxOpen,
  requestAlignInboxStartUnderTabs,
  setHeadHidden,
  setHeadPinned,
])

const commitSortChangeRefresh = useCallback(() => {
  try { headAutoOpenRef.current = false } catch {}
  try { setHeadPinned(false) } catch {}
  try { setHeadHidden(true) } catch {}
  clearSortRefreshAlignHandles()

  if (videoFeedOpenRef.current) {
    try { setVisibleVideoCount(VIDEO_PAGE_SIZE) } catch {}
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
}, [
  VIDEO_PAGE_SIZE,
  TOPIC_PAGE_SIZE,
  REPLIES_PAGE_SIZE,
  THREAD_PAGE_SIZE,
  PUBLISHED_PAGE_SIZE,
  clearSortRefreshAlignHandles,
  inboxOpen,
  setHeadHidden,
  setHeadPinned,
  setVisibleProfilePostsCount,
  setVisiblePublishedCount,
  setVisibleRepliesCount,
  setVisibleThreadPostsCount,
  setVisibleTopicsCount,
  setVisibleVideoCount,
  profileBranchMode,
  sel?.id,
])

useEffect(() => {
  if (!sortRefreshAlignPendingRef.current) return undefined

  sortRefreshAlignPendingRef.current = false
  clearSortRefreshAlignHandles()

  const startUserScrollTs = (() => {
    try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
  })()

  let cancelled = false
  let rafA = 0
  let rafB = 0

  const scheduleAlign = (attempt = 0) => {
    if (cancelled) return
    const currentUserScrollTs = (() => {
      try { return Number(window.__forumUserScrollTs || 0) } catch { return 0 }
    })()
    if (attempt > 0 && currentUserScrollTs > startUserScrollTs) return
    const aligned = !!runSortRefreshAlignment()
    if (aligned) return
    if (attempt >= 12) return
    const delay = attempt <= 1 ? 72 : (attempt <= 6 ? 130 : 200)
    const timerId = setTimeout(() => scheduleAlign(attempt + 1), delay)
    sortRefreshAlignTimersRef.current.push(timerId)
  }

  try {
    rafA = requestAnimationFrame(() => {
      rafB = requestAnimationFrame(() => scheduleAlign(0))
      sortRefreshAlignRafsRef.current.push(rafB)
    })
    sortRefreshAlignRafsRef.current.push(rafA)
  } catch {
    const timerId = setTimeout(() => scheduleAlign(0), 0)
    sortRefreshAlignTimersRef.current.push(timerId)
  }

  return () => {
    cancelled = true
    try { if (rafB) cancelAnimationFrame(rafB) } catch {}
    try { if (rafA) cancelAnimationFrame(rafA) } catch {}    
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
    setPendingImgs,
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
  const [editPostId, setEditPostId] = React.useState(null)
  useForumEditMode({
    t,
    toast,
    composerRef,
    setEditPostId,
    setText,
    setComposerActive,
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
  createUnmirroredFrontStreamFn: createUnmirroredFrontStream,
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
    pendingSticker,
    beginMediaPipeline,
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
    setDmBlockedByReceiverMap,
    toastI18n,
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
    saveComposerScroll,
    restoreComposerScroll,
    beginMediaPipeline,
    endMediaPipeline,
    toast,
    t,
    moderateImageFiles,
    toastI18n,
    reasonKey,
    stopMediaProg,
    setMediaPhase,
    setMediaPct,
    startSoftProgress,
    setPendingImgs,
    setOverlayMediaKind,
    setOverlayMediaUrl,
    setVideoState,
    setVideoOpen,
    viewerId,
    showVideoLimitOverlay,
    readVideoDurationSecFn: readVideoDurationSec,
    forumVideoMaxSeconds: FORUM_VIDEO_MAX_SECONDS,
    forumVideoMaxBytes: FORUM_VIDEO_MAX_BYTES,
    forumVideoFaststartTranscodeMaxBytes: FORUM_VIDEO_FASTSTART_TRANSCODE_MAX_BYTES,
    optimizeForumVideoFastStartFn: optimizeForumVideoFastStart,
    emitDiag,
    setPendingVideo,
    pendingVideoInfoRef,
    setVideoProgress,
  },
  text,
  pendingImgs,
  pendingSticker,
  pendingAudio,
  pendingVideo,
})

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
  dmDeleteText,
  dmDeleteCheckboxLabel,
} = useForumScreenFlowsRuntime({
  videoFeedArgs: {
    data,
    allPosts,
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
  const {
    forumHeaderPanelProps,
    mainActionClusterProps,
    threadActionClusterProps,
    topicsSwitchProps,
    threadRepliesPaneProps,
    composerCoreProps,
  } = buildForumRootPropBundles({
    t,
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
    setTopicFilterId,
    setSel,
    setThreadRoot,
    openThreadForPost,
    sortOpen,
    setSortOpen,
    videoFeedOpen,
    setVideoFeedUserSortLocked,
    setFeedSort,
    sel,
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
    myFollowersLoading,
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
    myPublishedPosts,
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
    visiblePublishedPosts,
    publishedHasMore,
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
    setVisibleVideoCount,
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
    visibleTopics,
    aggregates,
    markViewTopic,
    delTopic,
    delTopicOwn,
    topicsHasMore,
    setVisibleTopicsCount,
    topicPageSize: TOPIC_PAGE_SIZE,
    sortedTopicsLength: (sortedTopics || []).length,
    TopicItem,
    contentRefreshToken,
    visibleFlat,
    allPosts,
    threadHasMore,
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
    dmMode,
    onSendClick: handleComposerSendButtonClick,
    setText,
    setComposerActive,
    pendingImgs,
    setPendingImgs,
    pendingSticker,
    setPendingSticker,
    pendingVideo,
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
    closeDmDeletePopover,
    confirmDmDelete,
    t,
    videoOpen,
    videoState,
    videoElapsed,
    videoStreamRef,
    overlayMediaUrl,
    pendingVideo,
    overlayMediaKind,
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
    userInfoAnchorRef,
    userInfoOpen,
    closeUserInfoPopover,
    userInfoUid,
    onOpenUserPosts: openProfilePostsBranch,
    onOpenUserTopics: openProfileTopicsBranch,
    rich,
    formatCount,
    claimFx,
    closeQuestClaimOverlay,
    confirmQuestClaim,
    sel,
    dmMode,
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

