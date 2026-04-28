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
    expect(src).toContain("source === 'media_element' || source === 'external' || source === 'forum-splash'")
    expect(src).toContain("setMutedPref(!!el.muted, 'video')")
  })

  test('post video restore path avoids immediate duplicate load after src reattach', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain("const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'")
    expect(src).toContain('if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()')
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
})
