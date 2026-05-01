import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

describe('forum media contracts', () => {
  test('layout keeps early diag master-gated and not forumPath auto-started', () => {
    const src = read('app/layout.js')
    expect(src).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED')
    expect(src).not.toContain('var forumPath = /^\\\\/forum')
    expect(src).not.toContain('traceEnabled = !!(forumPath')
  })

  test('media lifecycle runtime does not hard-reset persisted mute on startup', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).not.toMatch(/localStorage\.setItem\(MEDIA_MUTED_KEY,\s*['"]1['"]\)/)
    expect(src).not.toMatch(/localStorage\.setItem\(MEDIA_VIDEO_MUTED_KEY,\s*['"]1['"]\)/)
  })

  test('qcast toggle does not use its own local mute storage', () => {
    const src = read('app/forum/features/media/components/QCastPlayer.jsx')
    expect(src).not.toContain('forum:qcastMuted')
    expect(src).toContain('writeMuted(!!audio.muted)')
    expect(src).toContain('__persistMuteUntil')
    expect(src).toContain('crossOrigin="anonymous"')
  })

  test('forum ads autoplay fallback does not persist global mute', () => {
    const src = read('app/forum/ForumAds.js')
    expect(src).not.toMatch(/forum-ads-autoplay-fallback[\s\S]*writeMutedPrefToStorage\(true/)
  })

  test('media coordinator removes legacy query ownership toggles and qcast local mute storage', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).not.toContain("qs.get('legacyWarmSweep')")
    expect(src).not.toContain("qs.get('legacyIframePrewarm')")
    expect(src).not.toContain('forum:qcastMuted')
    expect(src).toContain('const isAuthoritativeMuteSource =')
    expect(src).toContain("source === 'media_element' ||")
    expect(src).toContain("source === 'external' ||")
    expect(src).toContain("source === 'forum-splash' ||")
    expect(src).toContain("setMutedPref(!!el.muted, 'video')")
  })

  test('post video restore path delegates native network starts and keeps connected nodes on soft unload', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain("const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'")
    expect(src).toContain('const postPrewarmRunway =')
    expect(src).toContain('const shouldSoftUnload =')
    expect(src).toContain('(!isPostFeedVideo && !canHardUnload) ||')
    expect(src).toContain('if (shouldSoftUnload) {')
    expect(src).toContain('Native post-video network starts are owned by the coordinator load gate.')
    expect(src).toContain('if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()')
    expect(src).not.toContain('__isVideoNearViewport(el, 900)')
  })

  test('boot splash publishes an active gate marker for forum media policy', () => {
    const src = read('components/ForumBootSplash.jsx')
    expect(src).toContain('__forumBootSplashActive')
    expect(src).toContain("forum-boot-splash")
  })

  test('post media embeds expose stable owner metadata for coordinator policy', () => {
    const src = read('app/forum/features/feed/components/PostMediaStack.jsx')
    expect(src).toContain('data-owner-id=')
    expect(src).toContain('data-forum-embed-kind=')
    expect(src).toContain('data-lifecycle-state=')
    expect(src).toContain('data-stable-shell="1"')
  })

  test('post cards keep the shared post body frame shell for card and inline text content', () => {
    const cardSrc = read('app/forum/features/feed/components/ForumPostCard.jsx')
    const bodySrc = read('app/forum/features/feed/components/PostBodyContent.jsx')
    expect(cardSrc).toContain('data-forum-post-card="1"')
    expect(cardSrc).toContain('<div className="postBodyFrame">')
    expect(bodySrc).toContain('className="postBodyFrame"')
    expect(bodySrc).toContain('className="postBodyContent text-[15px] leading-relaxed postBody whitespace-pre-wrap break-words"')
    expect(bodySrc).not.toContain('className="postTextFrame"')
  })

  test('forum styles keep the shared post body frame treatment and video-feed root hooks', () => {
    const src = read('app/forum/styles/ForumStyles.jsx')
    expect(src).toContain('.postBodyFrame{')
    expect(src).toContain('.postBodyFrame .postImages,')
    expect(src).toContain('.postBodyFrame .postVideo,')
    expect(src).toContain('.postBodyFrame .postAudio{')
    expect(src).toContain('html[data-video-feed="1"] .head.head--collapsed{')
    expect(src).toContain('html[data-video-feed="1"] .forum_root .body{ padding-top:0; }')
  })

  test('coordinator and ads keep existing fetches instead of reloading empty shells', () => {
    const coordinatorSrc = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const adsSrc = read('app/forum/ForumAds.js')
    expect(coordinatorSrc).toContain('const isHtmlMediaLoadingOrBuffered = (el) => {')
    expect(coordinatorSrc).toContain("trace('load_kick_hold_existing_fetch', media, {")
    expect(coordinatorSrc).toContain('const allowNearViewportRestore =')
    expect(coordinatorSrc).toContain('const keepWarm = highPriorityReason || allowNearViewportRestore;')
    expect(adsSrc).toContain('const playAdNativeVideo = React.useCallback')
    expect(adsSrc).toContain("videoEl.dataset.__adWarmOwner = '0';")
    expect(adsSrc).toContain('function detachAdNativeVideo(videoEl, opts = {})')
    expect(adsSrc).toContain('videoEl.removeAttribute(\'src\')')
    expect(adsSrc).toContain("detachAdNativeVideo(node, { hard: true, reason: 'src_change' })")
    expect(adsSrc).toContain("videoEl.preload = 'none';")
    expect(adsSrc).toContain("detachAdNativeVideo(v, { hard: true, reason: 'warm_owner_denied' })")
    expect(adsSrc).toContain('const nextShouldWinViewport =')
    expect(adsSrc).toContain("v.dataset.__adTransientErrorTs = String(now);")
    expect(adsSrc).toContain('const keepVisibleSurface =')
    expect(adsSrc).toContain("videoEl.dataset.__adSurfaceHeld = keepVisibleSurface ? '1' : '0';")
    expect(adsSrc).toContain("v.dataset.__adSurfaceHeldReason = 'warm_owner_denied';")
  })

  test('ads video upload uses the shared faststart path before blob storage', () => {
    const src = read('app/ads/home.js')
    expect(src).toContain("import { optimizeForumVideoFastStart } from '../../lib/forumVideoTrim'")
    expect(src).toContain('FORUM_VIDEO_FASTSTART_TRANSCODE_MAX_BYTES')
    expect(src).toContain('const fast = await optimizeForumVideoFastStart(file, {')
    expect(src).toContain('contentType: uploadContentType || file.type || \'video/mp4\'')
  })

  test('video feed windowing routes through the shared forum windowing core with reveal safety', () => {
    const videoSrc = read('app/forum/features/media/hooks/useVideoFeedWindowing.js')
    const coreSrc = read('app/forum/shared/hooks/useForumWindowing.js')
    const focusSrc = read('app/forum/features/feed/utils/postFocus.js')
    expect(videoSrc).toContain('useForumWindowing')
    expect(videoSrc).toContain("diagPrefix: 'video_feed'")
    expect(videoSrc).toContain("listId: 'forum:video-feed'")
    expect(coreSrc).toContain('targetLockRef')
    expect(coreSrc).toContain("emitWindowingDiag('anchor_adjust_suppressed'")
    expect(coreSrc).toContain('const stickyItems = velocity > 1.2 ? 2 : 1')
    expect(coreSrc).toContain('function hasStableMediaShell(node)')
    expect(coreSrc).toContain('STABLE_MEDIA_SHELL_SELECTOR')
    expect(coreSrc).toContain("emitWindowingDiag('stable_media_height_shrink_deferred'")
    expect(coreSrc).toContain("emitWindowingDiag('media_height_deferred_during_scroll'")
    expect(coreSrc).toContain("applyPendingMeasuredHeights('scroll_settled')")
    expect(coreSrc).toContain('registerForumWindowingTarget')
    expect(focusSrc).toContain('revealForumWindowedDomId')
  })

  test('interleaved forum feed slots keep stable item keys by content id', () => {
    const src = read('app/forum/ForumAds.js')
    expect(src).toContain('const resolveItemKey = (item, index) => {')
    expect(src).toContain("return { type: 'item', item, key: `item:${itemKey}` };")
    expect(src).not.toContain("key: `i:${i}`")
  })

  test('forum ad heights use one shared windowing contract for real slots and placeholders', () => {
    const presetsSrc = read('app/forum/shared/utils/forumWindowingPresets.js')
    const forumStylesSrc = read('app/forum/styles/ForumStyles.jsx')
    const foundationSrc = read('app/forum/styles/modules/foundationStyles.js')
    const adsSrc = read('app/forum/ForumAds.js')
    const adSlotSrc = read('app/forum/features/ui/components/ForumAdSlot.jsx')
    expect(presetsSrc).toContain('mobile: 520')
    expect(presetsSrc).toContain('tablet: 620')
    expect(presetsSrc).toContain('desktop: 650')
    expect(forumStylesSrc).toContain('--mb-ad-h-mobile: 520px;')
    expect(forumStylesSrc).toContain('--mb-ad-h-tablet: 620px;')
    expect(forumStylesSrc).toContain('--mb-ad-h-desktop: 650px;')
    expect(foundationSrc).toContain('--mb-ad-h-mobile: 520px;')
    expect(foundationSrc).toContain('--mb-ad-h-tablet: 620px;')
    expect(foundationSrc).toContain('--mb-ad-h-desktop: 650px;')
    expect(adsSrc).toContain('mobile: 520')
    expect(adsSrc).toContain('tablet: 620')
    expect(adsSrc).toContain('desktop: 650')
    expect(adsSrc).toContain('data-stable-shell="1"')
    expect(adsSrc).toContain('height: var(--ad-slot-h-m);')
    expect(adsSrc).toContain('.forum-ad-card .forum-ad-media-slot[data-layout="fixed"]')
    expect(adSlotSrc).toContain('data-stable-shell="1"')
    expect(adSlotSrc).toContain("height: 'var(--mb-ad-h)'")
  })

  test('forum ads are interleaved into public post-card branches but not private dm messages', () => {
    const publishedSrc = read('app/forum/features/feed/components/PublishedPostsPane.jsx')
    const userPostsSrc = read('app/forum/features/feed/components/UserPostsPane.jsx')
    const inboxSrc = read('app/forum/features/dm/components/InboxPane.jsx')
    const dmMessagesSrc = read('app/forum/features/dm/components/DmMessagesPane.jsx')
    const slotsSrc = read('app/forum/features/ui/utils/adsSlots.js')

    expect(publishedSrc).toContain("debugAdsSlots(\n        'published'")
    expect(publishedSrc).toContain("slotKind=\"published\"")
    expect(userPostsSrc).toContain("debugAdsSlots(\n        'profile'")
    expect(userPostsSrc).toContain("slotKind=\"profile\"")
    expect(inboxSrc).toContain('adEvery={adEvery}')
    expect(inboxSrc).toContain('ForumAdSlot={ForumAdSlot}')
    expect(dmMessagesSrc).not.toContain('ForumAdSlot')
    expect(dmMessagesSrc).not.toContain('interleaveAds')
    expect(slotsSrc).toContain('const stableSlotKey =')
    expect(slotsSrc).toContain('sess.bySlot.has(stableSlotKey)')
  })

  test('native videos keep loop playback without ended-hold refetch traps', () => {
    const coordinatorSrc = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const videoMediaSrc = read('app/forum/features/media/components/VideoMedia.jsx')
    const adsSrc = read('app/forum/ForumAds.js')
    expect(coordinatorSrc).not.toContain('play_skip_native_ended_hold')
    expect(coordinatorSrc).toContain('el.loop = true')
    expect(videoMediaSrc).toContain('loop={isPostVideo ? true : loop}')
    expect(videoMediaSrc).not.toContain("el.dataset.__endedHold = '1'")
    expect(adsSrc).toMatch(/\n\s+loop\s*\n\s+onPlaying/)
    expect(adsSrc).not.toContain("if (reason === 'focus_retry') return false")
  })

  test('faststart worker defragments fragmented MP4 instead of preserving moof ranges', () => {
    const workerSrc = read('public/workers/forum-trim-worker.js')
    const trimSrc = read('lib/forumVideoTrim.js')
    expect(workerSrc).toContain('function hasMp4Atom(bytesLike, atomType)')
    expect(workerSrc).toContain('hasMp4Atom(bytes, "moof")')
    expect(workerSrc).toContain('hasMp4Atom(copied, "moof")')
    expect(workerSrc).toContain('worker_faststart_defragment_transcode')
    expect(workerSrc).toContain('"-crf", "16"')
    expect(trimSrc).toContain('pipeline: String(msg.pipeline || "worker_faststart")')
    expect(trimSrc).toContain('pipeline,')
  })

  test('mute document sync does not write hydration-sensitive body dataset flags', () => {
    const runtimeSrc = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    const adsSrc = read('app/forum/ForumAds.js')
    expect(runtimeSrc).not.toContain('body.dataset.forumMediaMuted =')
    expect(runtimeSrc).not.toContain('body.dataset.forumMediaSoundUnlocked =')
    expect(adsSrc).not.toContain('body.dataset.forumMediaMuted =')
    expect(adsSrc).not.toContain('body.dataset.forumMediaSoundUnlocked =')
  })
})
