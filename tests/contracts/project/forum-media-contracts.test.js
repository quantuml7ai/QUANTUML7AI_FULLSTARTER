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

  test('post video restore path avoids immediate duplicate load after src reattach and keeps connected nodes on soft unload', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain("const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'")
    expect(src).toContain('const connectedPostVideoSoftUnload =')
    expect(src).toContain('if (connectedPostVideoSoftUnload || !canHardUnload || shouldKeepResidentPostVideo) {')
    expect(src).toContain('if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()')
    expect(src).toContain('__isVideoNearViewport(el, 900)')
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
    expect(adsSrc).toContain('const hadSrc = (() => {')
    expect(adsSrc).toContain("videoEl.dataset.__adWarmOwner = '0';")
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
    expect(coreSrc).toContain('registerForumWindowingTarget')
    expect(focusSrc).toContain('revealForumWindowedDomId')
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
