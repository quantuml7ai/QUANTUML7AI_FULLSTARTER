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

  test('forum ad slot bridges ads into forum owner lifecycle without rewriting ad core', () => {
    const wrapper = read('app/forum/features/ui/components/ForumAdSlot.jsx')
    const ads = read('app/forum/ForumAds.js')
    expect(wrapper).toContain("data-forum-media-owner")
    expect(wrapper).toContain("data-forum-media-node")
    expect(wrapper).toContain("data-forum-ad-bridge")
    expect(wrapper).toContain("data-forum-external-control")
    expect(wrapper).toContain("forum-media-owner-command")
    expect(wrapper).toContain("data-forum-scope', 'ad'")
    expect(ads).toContain('const shouldPlay = isFocused && isPageActive')
    expect(ads).toContain("const [attachedVideoSrc, setAttachedVideoSrc] = useState('')")
  })

  test('media coordinator removes legacy query ownership toggles and qcast local mute storage', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).not.toContain("qs.get('legacyWarmSweep')")
    expect(src).not.toContain("qs.get('legacyIframePrewarm')")
    expect(src).not.toContain('forum:qcastMuted')
    expect(src).toContain("source === 'media_element' || source === 'external' || source === 'forum-splash'")
    expect(src).toContain("setMutedPref(!!el.muted, 'video')")
    expect(src).toContain('site-media-audible')
    expect(src).toContain("'ad_video', 'ad_youtube', 'ad_tiktok', 'ad_iframe'")
  })

  test('post video restore path avoids immediate duplicate load after src reattach', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain("const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'")
    expect(src).toContain('if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()')
  })

  test('native video ready replay can auto-start owner-driven pending candidate', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain("const coordinatorPlay =")
    expect(src).toContain("!ownerMatchesActive && !manualLease && !hasGesture && !coordinatorPlay")
    expect(src).toContain("reasonTag === 'activate_pending'")
    expect(src).toContain("reasonTag === 'play_wait_ready'")
    expect(src).toContain("markCoordinatorPlayIntent(owner || mediaEl")
  })

  test('boot splash publishes an active gate marker for forum media policy', () => {
    const src = read('components/ForumBootSplash.jsx')
    expect(src).toContain('__forumBootSplashActive')
    expect(src).toContain("forum-boot-splash")
    expect(src).toContain('FORUM_SPLASH_TRY_SOUND_AUTOPLAY = 1')
  })

  test('post media embeds expose stable owner metadata for coordinator policy', () => {
    const src = read('app/forum/features/feed/components/PostMediaStack.jsx')
    expect(src).toContain('data-forum-media-owner="1"')
    expect(src).toContain('data-forum-media-node="1"')
    expect(src).toContain('data-owner-id=')
    expect(src).toContain('data-forum-embed-kind=')
    expect(src).toContain('data-lifecycle-state=')
    expect(src).toContain('data-stable-shell="1"')
  })

  test('media coordinator uses owner-shell selector and centralized html load path', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain(`const ownerSelector = '[data-forum-media-owner="1"]'`)
    expect(src).toContain(`const mediaNodeSelector = '[data-forum-media-node="1"]'`)
    expect(src).toContain('const resolveMediaRefs = (input) => {')
    expect(src).toContain("const requestHtmlMediaLoad = (input, reason = 'generic_load', opts = {}) => {")
    expect(src).not.toContain('.forum-ad-media-slot video, .forum-ad-media-slot iframe')
  })

  test('background audio reacts only to real audible media and still auto-retries on entry gesture', () => {
    const src = read('components/BgAudio.js')
    expect(src).toContain('site-media-audible')
    expect(src).toContain('const isActuallyAudibleMedia = (target) => {')
    expect(src).toContain("window.addEventListener('pointerdown', onGesture, captureOptions)")
  })
})
