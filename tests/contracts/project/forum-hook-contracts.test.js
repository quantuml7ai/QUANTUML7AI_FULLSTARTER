import { describe, expect, it } from 'vitest'
import {
  basenameWithoutExtension,
  listProjectFiles,
  readRepoFile,
} from '../../support/projectSurface.js'

const forumHookFiles = listProjectFiles(
  'app/forum',
  (relPath) => /\/hooks\/use[A-Z][^/]*\.jsx?$/.test(relPath),
)

function findExportedHookNames(source) {
  const rx =
    /\bexport\s+(?:default\s+)?function\s+(use[A-Z][A-Za-z0-9_]*)\b|\bexport\s+(?:const|let|var)\s+(use[A-Z][A-Za-z0-9_]*)\b|\bexport\s*\{([^}]*)\}/g

  const names = new Set()
  let match

  while ((match = rx.exec(source)) !== null) {
    if (match[1]) names.add(match[1])
    if (match[2]) names.add(match[2])
    if (match[3]) {
      match[3]
        .split(',')
        .map((chunk) => chunk.trim())
        .forEach((chunk) => {
          const named = chunk.match(/\b(use[A-Z][A-Za-z0-9_]*)\b/)
          if (named?.[1]) names.add(named[1])
        })
    }
  }

  return Array.from(names)
}

describe('Forum hook contracts', () => {
  it('discovers the hook surface of the forum runtime', () => {
    expect(forumHookFiles.length).toBeGreaterThan(40)
  })

  it.each(forumHookFiles)('%s exports at least one hook symbol', (hookFile) => {
    const source = readRepoFile(hookFile)
    const hookName = basenameWithoutExtension(hookFile)
    const exportedHookNames = findExportedHookNames(source)

    expect(exportedHookNames.length).toBeGreaterThan(0)
    expect(hookName.startsWith('use')).toBe(true)
  })

  it('keeps forum diagnostics hook guarded by the master env flag', () => {
    const source = readRepoFile('app/forum/features/diagnostics/hooks/useForumDiagnostics.js')

    expect(source).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED')
    expect(source).toContain('if (!isDiagMasterEnabled()) return false')
  })

  it('keeps PostCardBridge and TopicItem memoized at the list entrypoints', () => {
    const postCardSource = readRepoFile('app/forum/features/feed/components/PostCardBridge.jsx')
    const topicItemSource = readRepoFile('app/forum/features/feed/components/TopicItem.jsx')

    expect(postCardSource).toContain('React.memo')
    expect(postCardSource).toContain('arePostCardBridgePropsEqual')
    expect(topicItemSource).toContain('React.memo')
    expect(topicItemSource).toContain('areTopicItemPropsEqual')
  })

  it('keeps feed panes passing memo-friendly author flags instead of bulky viewer context', () => {
    const videoFeedPane = readRepoFile('app/forum/features/media/components/VideoFeedPane.jsx')
    const threadRepliesPane = readRepoFile('app/forum/features/feed/components/ThreadRepliesPane.jsx')
    const inboxRepliesPane = readRepoFile('app/forum/features/dm/components/InboxRepliesPane.jsx')
    const userPostsPane = readRepoFile('app/forum/features/feed/components/UserPostsPane.jsx')
    const publishedPostsPane = readRepoFile('app/forum/features/feed/components/PublishedPostsPane.jsx')
    const topicsPane = readRepoFile('app/forum/features/feed/components/TopicsPane.jsx')

    ;[
      videoFeedPane,
      threadRepliesPane,
      inboxRepliesPane,
      userPostsPane,
      publishedPostsPane,
    ].forEach((source) => {
      expect(source).toContain('isSelfAuthor={isSelfAuthor}')
      expect(source).toContain('isStarredAuthor={isStarredAuthor}')
      expect(source).not.toContain('viewerId={viewerId}')
      expect(source).not.toContain('starredAuthors={starredAuthors}')
    })

    expect(topicsPane).toContain('isSelfAuthor={isSelfAuthor}')
    expect(topicsPane).toContain('isStarredAuthor={isStarredAuthor}')
    expect(topicsPane).not.toContain('viewerId={viewerId}')
    expect(topicsPane).not.toContain('starredAuthors={starredAuthors}')
  })

  it('keeps heavy card components consuming memo-friendly booleans instead of global viewer sets', () => {
    const forumPostCardSource = readRepoFile('app/forum/features/feed/components/ForumPostCard.jsx')
    const topicItemSource = readRepoFile('app/forum/features/feed/components/TopicItem.jsx')

    expect(forumPostCardSource).toContain('isSelfAuthor = false')
    expect(forumPostCardSource).toContain('isStarredAuthor = false')
    expect(forumPostCardSource).toContain('const isSelf = !!isSelfAuthor')
    expect(forumPostCardSource).toContain('const isStarred = !!isStarredAuthor')
    expect(forumPostCardSource).not.toContain('starredAuthors')

    expect(topicItemSource).toContain('isSelfAuthor = false')
    expect(topicItemSource).toContain('isStarredAuthor = false')
    expect(topicItemSource).toContain('const isSelf = !!isSelfAuthor')
    expect(topicItemSource).toContain('const isStarred = !!isStarredAuthor')
    expect(topicItemSource).not.toContain('starredAuthors')
  })

  it('keeps focus and visibility events from silently rebuilding the visible forum feed', () => {
    const syncLoopSource = readRepoFile('app/forum/features/feed/hooks/useForumSyncLoop.js')
    const visibleSyncMatch = syncLoopSource.match(/const requestVisibleSync = \(\) => \{([\s\S]*?)\n    \}/)

    expect(syncLoopSource).toContain("document.addEventListener('visibilitychange', requestVisibleSync)")
    expect(syncLoopSource).toContain("window.addEventListener('focus', requestVisibleSync)")
    expect(visibleSyncMatch).toBeTruthy()
    expect(visibleSyncMatch[1]).toContain('NO_FOCUS_VISIBLE_REORDER')
    expect(visibleSyncMatch[1]).not.toContain('syncNowRef')
    expect(visibleSyncMatch[1]).not.toContain('runTick')
    expect(visibleSyncMatch[1]).not.toContain('feedPage')
    expect(visibleSyncMatch[1]).not.toContain('bumpFeedRequestGeneration')
  })

  it('keeps Home topic sorting and counters on the server-complete reader contract', () => {
    const topicsRouteSource = readRepoFile('app/api/forum/topics/page/route.js')
    const sortControlsSource = readRepoFile('app/forum/features/ui/components/ForumSearchSortControls.jsx')
    const topicDiscoverySource = readRepoFile('app/forum/features/feed/hooks/useTopicDiscoveryModel.js')

    expect(topicsRouteSource).toContain('forum-server-complete-reader.cjs')
    expect(topicsRouteSource).toContain('readForumTopicsPage')
    expect(sortControlsSource).toContain('setTopicSort(nextSort)')
    expect(topicDiscoverySource).toContain("normalizedTopicSort === 'random' && shouldStabilizeByScroll")
  })

  it('keeps Geo/World rebuilds narrow and clears stale geo rank in World mode', () => {
    const forumRootSource = readRepoFile('app/forum/ForumRoot.jsx')
    const postMergeSource = readRepoFile('app/forum/features/feed/utils/postMerge.js')
    const videoBuilderSource = readRepoFile('app/forum/features/media/utils/videoFeedBuilder.js')

    expect(forumRootSource).toContain('startup_geo_retry_6s_rebuild')
    expect(forumRootSource).toContain('startup_geo_retry_8s_rebuild')
    expect(forumRootSource).toContain('startup_geo_retry_10s_rebuild')
    expect(forumRootSource).toContain('startupRebuildCount')
    expect(forumRootSource).toContain('geo_mode_world_rebuild')
    expect(forumRootSource).toContain('geo_mode_geo_rebuild')
    expect(forumRootSource).not.toContain('forum:home-action-refresh-click')
    expect(forumRootSource).not.toContain('forceFeedScrollTop')
    expect(postMergeSource).toContain('delete out.__ql7GeoFeedRank')
    expect(videoBuilderSource).toContain("mode === 'geo' ? item?.__ql7GeoFeedRank : undefined")
    expect(videoBuilderSource).toContain('finiteServerRankForActiveMode')
    expect(videoBuilderSource).toContain('const hasServerRankedItems = only.some')
    expect(forumRootSource).toContain('pageAgeMs > 10_500')
    expect(readRepoFile('app/forum/features/feed/hooks/useTopicDiscoveryModel.js')).toContain('topicRankForActiveMode')
    expect(readRepoFile('app/forum/features/feed/hooks/useTopicDiscoveryModel.js')).toContain('runtimeGeoFeedMode,')
    expect(readRepoFile('app/forum/features/ui/components/ForumSearchSortControls.jsx')).toContain('forceRandomFeedRebuildForMode')
    expect(readRepoFile('app/forum/features/ui/components/ForumSearchSortControls.jsx')).toContain("writeForumFeedSortPreference('random')")
    expect(readRepoFile('app/forum/features/media/hooks/useForumVideoFeedRuntime.js')).toContain('normalizeVideoFeedSort')
    expect(readRepoFile('app/forum/features/media/hooks/useForumVideoFeedRuntime.js')).toContain('setVideoFeedEntryToken')
    expect(readRepoFile('app/forum/features/media/hooks/useForumVideoFeedRuntime.js')).toContain('setServerVideoPosts([])')
    expect(readRepoFile('app/forum/features/media/hooks/useForumVideoFeedRuntime.js')).toContain('videoFeedHardResetRef.current?.()')
    expect(readRepoFile('app/forum/features/media/hooks/useForumVideoFeedRuntime.js')).toContain('scheduleVideoFeedFirstCardSnap')
    expect(readRepoFile('app/forum/features/media/hooks/useVideoFeedWindowing.js')).toContain('scrollToTopOnHardReset: false')
    expect(readRepoFile('app/forum/features/media/hooks/useVideoFeedState.js')).toContain('const sourceData = videoFeedOpen')
    expect(readRepoFile('app/forum/features/media/hooks/useVideoFeedState.js')).toContain('data: sourceData')
    expect(readRepoFile('app/forum/features/media/utils/videoFeedScroll.js')).toContain('firstVideoFeedPostCard')
    expect(readRepoFile('app/forum/features/media/utils/videoFeedScroll.js')).toContain('markProgrammaticVideoSnap')
    expect(readRepoFile('app/forum/features/media/utils/videoFeedScroll.js')).toContain('data-ql7-video-feed-grid="1"')
  })

  it('keeps topic creation geo-marked privately like posts', () => {
    const mutateRouteSource = readRepoFile('app/api/forum/mutate/route.js')
    const maintenanceSource = readRepoFile('lib/forum/forum-index-maintenance.cjs')
    const sanitizerSource = readRepoFile('lib/forum/public-sanitize.cjs')

    expect(mutateRouteSource).toContain('const requestGeo = resolveRequestGeo(request)')
    expect(mutateRouteSource).toContain('_geoOrigin: forumGeoOrigin')
    expect(mutateRouteSource).toContain('maintainForumIndexesForTopicCreated({ topic, canonicalAuthorId: userId, geoOrigin: forumGeoOrigin })')
    expect(maintenanceSource).toContain('const geo = geoOrigin || t._geoOrigin || null')
    expect(maintenanceSource).toContain('const scopeKeys = scopeKeysFromGeoOrigin(geo)')
    expect(maintenanceSource).toContain('const geoPrivate = { scopeKeys, origin: geo }')
    expect(maintenanceSource).toContain('_geoOrigin: geo, geoPrivate')
    expect(sanitizerSource).toContain("'geoPrivate'")
    expect(sanitizerSource).toContain("'_geoOrigin'")
  })

  it('keeps forum header VIP state on one passed vipActive truth', () => {
    const vipStateSource = readRepoFile('app/forum/features/profile/hooks/useVipSubscriptionState.js')
    const vipPaySource = readRepoFile('app/forum/features/profile/hooks/useVipPayAction.js')
    const vipFlagSource = readRepoFile('app/forum/features/profile/hooks/useVipFlag.js')
    const profileSyncSource = readRepoFile('app/forum/features/profile/hooks/useForumProfileSync.js')
    const headerSource = readRepoFile('app/forum/ForumHeaderPanel.jsx')
    const vipPopoverSource = readRepoFile('app/forum/features/profile/components/VipPopover.jsx')
    const qcoinInlineSource = readRepoFile('app/forum/features/qcoin/components/QCoinInline.jsx')
    const vipControlSource = readRepoFile('app/forum/features/profile/components/ForumVipControl.jsx')

    expect(vipStateSource).toContain('/api/subscription/status')
    expect(vipPaySource).toContain('/api/subscription/status')
    expect(vipFlagSource).toContain('/api/forum/vip/batch')
    expect(profileSyncSource).toContain("safeLocalStorageGet('account')")
    expect(profileSyncSource).toContain("safeLocalStorageGet('wallet')")
    expect(profileSyncSource).toContain("safeLocalStorageGet('asherId')")
    expect(profileSyncSource).toContain("safeLocalStorageGet('ql7_uid')")

    expect(headerSource).toContain('vipActive,')
    expect(headerSource).toContain('vipActive={vipActive}')
    expect(headerSource).toContain('<QCoinInline t={t} userKey={idShown} vipActive={vipActive} />')
    expect(headerSource).toContain('<ForumVipControl')
    expect(headerSource).not.toContain('/api/subscription/status')
    expect(headerSource).not.toContain('/api/forum/vip/batch')
    expect(headerSource).not.toContain('headerVipActive')
    expect(headerSource).not.toContain('readHeaderVipFlag')
    expect(headerSource).not.toContain('HEADER_VIP_PROBE')
    expect(headerSource).not.toContain('forum:vip-status-ready')
    expect(headerSource).not.toContain('fetch(')

    expect(vipPopoverSource).toContain('vipActive ? (')
    expect(vipPopoverSource).not.toContain('fetch(')
    expect(qcoinInlineSource).toContain("cls('qcoinX2', vipActive ? 'vip' : 'needVip'")
    expect(qcoinInlineSource).not.toContain('fetch(')
    expect(vipControlSource).toContain("vipActive ? 'vip is-vip-active' : 'vipGray is-vip-invite'")
    expect(vipControlSource).toContain('vipActive={vipActive}')
    expect(vipControlSource).not.toContain('fetch(')
    expect(vipStateSource).toContain("localStorage.getItem(VIP_KEY) === '1'")
    expect(vipStateSource).toContain("localStorage.getItem(VIP_QUOTA_KEY) === '1'")
    expect(vipStateSource).toContain('const resolvedAccountId = accountId || asherId ||')
    expect(vipStateSource).toContain('writeLocalVipFlag(isVip)')
    expect(vipStateSource).not.toContain('/api/forum/vip/batch')
  })

  it('keeps the forum invite button behind the shared auth continuation gate', () => {
    const actionRowSource = readRepoFile('app/forum/features/ui/components/ForumActionRow.jsx')

    expect(actionRowSource).toContain('runAuthorizedClientAction')
    expect(actionRowSource).toContain("actionKey: 'forum-invite-open'")
    expect(actionRowSource).toContain("source: 'forum-invite-button'")
    expect(actionRowSource).toContain("window.dispatchEvent(new CustomEvent('invite:open'")
    expect(actionRowSource).toContain('accountId,')
    expect(actionRowSource).toContain("source: 'forum-invite-button'")
  })

  it('keeps forum nickname badges capped and fitted instead of ellipsized', () => {
    const forumRootSource = readRepoFile('app/forum/ForumRoot.jsx')
    const forumStylesSource = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const profileStylesSource = readRepoFile('app/forum/styles/modules/profileStyles.js')
    const qcoinStylesSource = readRepoFile('app/forum/styles/modules/qcoinStyles.js')
    const dmStylesSource = readRepoFile('app/forum/styles/modules/dmStyles.js')

    expect(forumRootSource).toContain('function useForumNickBadgeFit()')
    expect(forumRootSource).toContain('const maxBadgeWidthPx = 130')
    expect(forumRootSource).toContain("textEl.style.textOverflow = 'clip'")
    expect(forumRootSource).toContain('textEl.style.fontSize = `${nextFontPx.toFixed(2)}px`')

    for (const source of [forumStylesSource, profileStylesSource, qcoinStylesSource]) {
      expect(source).toContain('max-width:130px')
      expect(source).toContain('text-overflow:clip')
    }

    expect(dmStylesSource).toContain('.dmRow .nick-badge .nick-text{ max-width:100%; }')
  })

  it('keeps initial forum branch loading filled with skeleton cards instead of blank panes', () => {
    const stylesSource = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const topicsPane = readRepoFile('app/forum/features/feed/components/TopicsPane.jsx')
    const threadPane = readRepoFile('app/forum/features/feed/components/ThreadRepliesPane.jsx')
    const videoPane = readRepoFile('app/forum/features/media/components/VideoFeedPane.jsx')
    const publishedPane = readRepoFile('app/forum/features/feed/components/PublishedPostsPane.jsx')
    const inboxPane = readRepoFile('app/forum/features/dm/components/InboxRepliesPane.jsx')
    const dmThreadPane = readRepoFile('app/forum/features/dm/components/DmMessagesPane.jsx')

    expect(stylesSource).toContain('.forumSkeletonPane')
    expect(stylesSource).toContain('.forumSkeletonCard')
    expect(stylesSource).toContain('@keyframes forumSkeletonSweep')

    for (const source of [topicsPane, threadPane, videoPane, publishedPane, inboxPane, dmThreadPane]) {
      expect(source).toContain('function ForumPaneSkeleton')
      expect(source).toContain('forumSkeletonPane')
      expect(source).toContain('forumSkeletonCard')
    }

    expect(topicsPane).toContain('showInitialTopicsSkeleton')
    expect(threadPane).toContain('showInitialThreadSkeleton')
    expect(videoPane).toContain('showInitialVideoSkeleton')
    expect(publishedPane).toContain('showInitialPublishedSkeleton')
    expect(inboxPane).toContain('showInitialRepliesSkeleton')
    expect(dmThreadPane).toContain('showInitialDmThreadSkeleton')
    expect(dmThreadPane).toContain('dmThreadItemCount === 0 && (!!dmThreadLoading || !!dmThreadHasMore)')
  })

  it('keeps DM thread presence status cheap, localized, and scoped to the open dialog header', () => {
    const dmHeader = readRepoFile('app/forum/features/dm/components/DmThreadHeader.jsx')
    const dmThreadPane = readRepoFile('app/forum/features/dm/components/DmMessagesPane.jsx')
    const userPopoverRoute = readRepoFile('app/api/profile/user-popover/route.js')
    const stylesSource = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const dictFiles = [
      'components/i18n-dicts/en.js',
      'components/i18n-dicts/ru.js',
      'components/i18n-dicts/uk.js',
      'components/i18n-dicts/es.js',
      'components/i18n-dicts/tr.js',
      'components/i18n-dicts/ar.js',
      'components/i18n-dicts/zh.js',
    ].map(readRepoFile)

    expect(userPopoverRoute).toContain("require('../../../../lib/mongo/qcoin-primary.cjs')")
    expect(userPopoverRoute).toContain("searchParams.get('presence') === '1'")
    expect(userPopoverRoute).toContain('lastActiveAt: Number(qcoinState?.lastActiveAt || 0)')
    expect(userPopoverRoute).toContain('presenceOnly: true')
    expect(dmHeader).toContain('/api/profile/user-popover?')
    expect(dmHeader).toContain("qs.set('uid', threadUid)")
    expect(dmHeader).toContain('DM_PRESENCE_REFRESH_MS')
    expect(dmHeader).toContain("qs.set('presence', '1')")
    expect(dmHeader).toContain("window.addEventListener('focus', syncIfVisible)")
    expect(dmHeader).toContain("document.addEventListener('visibilitychange', syncIfVisible)")
    expect(dmHeader).toContain('DM_ONLINE_WINDOW_MS')
    expect(dmHeader).toContain('DM_RECENT_WINDOW_MS')
    expect(dmHeader).toContain('dmThreadPresenceBadge')
    expect(dmHeader).toContain('dm_presence_online')
    expect(dmHeader).toContain('dm_presence_recently')
    expect(dmHeader).toContain('dm_presence_long_ago')
    expect(dmThreadPane).toContain('className="dmThreadHeaderRail"')
    expect(stylesSource).toContain('.dmThreadHeaderRail')
    expect(stylesSource).toContain('@keyframes dmPresencePulse')
    for (const source of dictFiles) {
      expect(source).toContain('"dm_presence_online"')
      expect(source).toContain('"dm_presence_recently"')
      expect(source).toContain('"dm_presence_long_ago"')
    }
  })

  it('keeps the composer emoji and sticker switcher as a sticky glass capsule above the scrolling grid', () => {
    const panel = readRepoFile('app/forum/features/ui/components/ComposerEmojiPanel.jsx')
    const stylesSource = readRepoFile('app/forum/styles/ForumStyles.jsx')

    expect(panel).toContain('className="emojiPanelContent p-1"')
    expect(panel).toContain('className="emojiTabs"')
    expect(panel).toContain('const REGIONAL_INDICATOR_RE')
    expect(panel).toContain('const KEYCAP_RE')
    expect(panel).toContain('const BROKEN_COMPOSER_GLYPH_RE')
    expect(panel).toContain('const RENDERABLE_EMOJI_RE')
    expect(panel).toContain("new Set(['flags'])")
    expect(panel).toContain('key={emojiTab}')
    expect(panel).toContain('data-emoji-mode={emojiTab}')
    expect(panel).toContain('el.scrollTop = 0')
    expect(panel).toContain('el.scrollLeft = 0')
    expect(stylesSource).toContain('.emojiPanelContent')
    expect(stylesSource).toContain('.emojiPanelMode, .emojiCategoryBlock, .emojiGrid{ contain:layout paint; }')
    expect(stylesSource).toContain('.emojiTabs{')
    expect(stylesSource).toContain('position:sticky')
    expect(stylesSource).toContain('.emojiTabs::before')
    expect(stylesSource).toContain('backdrop-filter:blur(14px) saturate(1.18)')
  })

  it('keeps Published posts connected to the same tombstone deletion contour as threads', () => {
    const forumRootSource = readRepoFile('app/forum/ForumRoot.jsx')
    const dmRuntimeSource = readRepoFile('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const publishedModelSource = readRepoFile('app/forum/features/feed/hooks/usePublishedPostsModel.js')
    const ownerActionsSource = readRepoFile('app/forum/features/feed/hooks/useForumMutationActions.js')
    const reportControllerSource = readRepoFile('app/forum/features/moderation/hooks/useReportController.js')

    expect(forumRootSource).toContain('tombstones,')
    expect(forumRootSource).toContain('useForumDmRuntime({')
    expect(forumRootSource).toContain('tombstones,')
    expect(dmRuntimeSource).toContain('tombstones = null')
    expect(dmRuntimeSource).toContain('usePublishedPostsModel({')
    expect(dmRuntimeSource).toContain('tombstones,')
    expect(publishedModelSource).toContain('tombstones = null')
    expect(publishedModelSource).toContain('tombstonePostsRef')
    expect(publishedModelSource).toContain('!isPostTombstoned(post)')
    expect(publishedModelSource).toContain('!isPostTombstonedNow(post)')
    expect(ownerActionsSource).toContain('persistTombstones((prev) => {')
    expect(ownerActionsSource).toContain('emitPostDeletedFn?.(postId, post?.topicId)')
    expect(reportControllerSource).toContain('deletedPostIds')
    expect(reportControllerSource).toContain('persistTombstones((prev) => ({')
  })

  it('routes owner edit mode through thread-open preparation and mounted composer focus retries', () => {
    const ownerActionsSource = readRepoFile('app/forum/features/feed/hooks/usePostOwnerActions.js')
    const editModeSource = readRepoFile('app/forum/features/ui/hooks/useForumEditMode.js')
    const forumRootSource = readRepoFile('app/forum/ForumRoot.jsx')
    const composeDockSource = readRepoFile('app/forum/features/ui/components/ComposeDock.jsx')

    expect(ownerActionsSource).toContain('topicId: post?.topicId')
    expect(ownerActionsSource).toContain('post,')
    expect(editModeSource).toContain('prepareEditMode')
    expect(editModeSource).toContain('scheduleComposerFocus')
    expect(editModeSource).toContain("document.getElementById('forum-composer')")
    expect(forumRootSource).toContain('const prepareEditMode = React.useCallback((detail) => {')
    expect(forumRootSource).toContain('openThreadForPost(targetPost, {')
    expect(forumRootSource).toContain('scheduleEditModeBranchAlign(targetPostId)')
    expect(forumRootSource).toContain('revealForumWindowedDomId(`post_${targetPostId}`')
    expect(forumRootSource).toContain('if (profileBranchMode) clearProfileBranch()')
    expect(composeDockSource).toContain('id="forum-composer"')
  })
})
