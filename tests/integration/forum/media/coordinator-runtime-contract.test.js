import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('coordinator runtime contract', () => {
  test('VideoMedia does not run local post-video src detach recovery', () => {
    const src = read('app/forum/features/media/components/VideoMedia.jsx')
    expect(src).toContain("if (String(dataForumVideo || '') === 'post' || coordinatorOwnsLifecycle)")
  })

  test('coordinator defers hard unload during settling', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('hard_unload_deferred_settling')
    expect(src).toContain('markSettling')
  })

  test('iframe resident cap keeps visible and near-viewport embeds off the victim list', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('const enforceIframeResidentCap = (keepEl = null) => {')
    expect(src).toContain('const visiblePx = getOwnerVisiblePx(frame);')
    expect(src).toContain("if (visiblePx > 48) return false;")
    expect(src).toContain('isNearViewportElement(frame, isIOSUi ? 1200 : (isCoarseUi ? 980 : 1100))')
  })

  test('coordinator holds an existing html-media fetch instead of calling load again', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('const getHtmlMediaNetworkSnapshot = (el) => {')
    expect(src).toContain('const isHtmlMediaLoadingOrBuffered = (el) => {')
    expect(src).toContain("trace('load_kick_hold_existing_fetch', media, {")
  })

  test('coordinator respects splash gate and keeps qcast on the shared mute source', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('isSplashGateActive')
    expect(src).toContain('play_skip_splash_gate')
    expect(src).toContain('forum-boot-splash')
    expect(src).not.toContain('forum:qcastMuted')
    expect(src).toContain('isAuthoritativeMuteSource')
    expect(src).toContain("source === 'media_element' ||")
    expect(src).toContain("source === 'external' ||")
    expect(src).toContain("source === 'forum-splash' ||")
  })

  test('video feed windowing keeps a sticky hold before shrinking the rendered window', () => {
    const src = read('app/forum/features/media/hooks/useVideoFeedWindowing.js')
    expect(src).toContain('VF_WINDOW_STICKY_MS')
    expect(src).toContain('recentWindowChange')
    expect(src).toContain('stickyItems')
  })

  test('video feed windowing keeps anchored scroll compensation narrow instead of deferred suppression', () => {
    const src = read('app/forum/features/media/hooks/useVideoFeedWindowing.js')
    expect(src).toContain('const vfAdjustScrollBy = useCallback((delta) => {')
    expect(src).toContain('vfAdjustScrollBy(delta)')
    expect(src).not.toContain('video_feed_anchor_adjust_suppressed')
    expect(src).not.toContain('video_feed_anchor_deferred_drop')
  })

  test('media lifecycle runtime exports touch marker for resident policy', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain('export function __markMediaLifecycleTouch')
    expect(src).toContain('shouldKeepResidentPostVideo')
    expect(src).toContain("const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'")
  })

  test('post-video restore kicks load when src is attached but the element is still network-empty near the viewport', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain('const shouldKickLoad =')
    expect(src).toContain("String(el.dataset?.__resident || '') === '1'")
    expect(src).toContain('__isVideoNearViewport(el, 900)')
    expect(src).toContain("el.dataset.__loadPending = '1'")
    expect(src).toContain('try { el.load?.() } catch {}')
  })

  test('coordinator sorts near-prewarm by scroll direction and DOM order, then repeats viewport kicks for external media', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('const mediaDomOrder = new WeakMap();')
    expect(src).toContain('const getNearQueuePlacement = (el, dir = 1) => {')
    expect(src).toContain('const scheduleExternalPlayKick = (el, runner, reason = \'external_viewport_kick\') => {')
    expect(src).toContain('scheduleExternalPlayKick(el, kickYoutube, \'youtube_viewport_autoplay\')')
    expect(src).toContain('scheduleExternalPlayKick(el, kickExternalFrame, `${kind}_viewport_autoplay`)')
  })

  test('native post-video can prewarm near the viewport before activation and primes the first frame through coordinator', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('const allowNearViewportRestore =')
    expect(src).toContain('const keepWarm = highPriorityReason || allowNearViewportRestore;')
    expect(src).toContain('getOwnerViewportGapPx(el) <= (isIOSUi ? 280 : (isCoarseUi ? 320 : 220))')
    expect(src).toContain('if (!primeNativeFirstFrame(media, reason)) {')
  })
})
