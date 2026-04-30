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

  test('VideoMedia post-video cleanup hard unloads only during component unmount', () => {
    const src = read('app/forum/features/media/components/VideoMedia.jsx')
    expect(src).toContain('if (!isPostVideo) return')
    expect(src).toContain("el.dataset.__resident = '0'")
    expect(src).toContain("el.dataset.__playRequested = '0'")
    expect(src).toContain("el.preload = 'metadata'")
    expect(src).toContain("el.dataset.__forceHardUnload = '1'")
    expect(src).toContain('unloadVideoElFn(el)')
  })

  test('coordinator defers hard unload during settling', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('hard_unload_deferred_settling')
    expect(src).toContain('markSettling')
  })

  test('coordinator keeps post-video resident only inside the prewarm runway', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain("const isEmergencyHtmlMediaUnloadReason = (reason = 'timeout') => {")
    expect(src).toContain("const isSoftPostVideoUnloadReason = (reason = 'timeout') => {")
    expect(src).toContain("next === 'native_warm_owner_lost'")
    expect(src).toContain("connectedPostVideoOwner && !emergencyHtmlMediaUnload && isSoftPostVideoUnloadReason(unloadReason)")
    const runtimeSrc = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(runtimeSrc).toContain('const postPrewarmRunway =')
    expect(runtimeSrc).toContain('const shouldSoftUnload =')
    expect(runtimeSrc).toContain('(!isPostFeedVideo && !canHardUnload) ||')
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
    const src = read('app/forum/shared/hooks/useForumWindowing.js')
    expect(src).toContain('windowStickyMs = DEFAULT_WINDOW_STICKY_MS')
    expect(src).toContain('recentWindowChange')
    expect(src).toContain('stickyItems')
  })

  test('shared forum windowing suppresses scrollTop compensation and uses reveal locks for targets', () => {
    const src = read('app/forum/shared/hooks/useForumWindowing.js')
    const deeplinkSrc = read('app/forum/features/feed/hooks/useForumDeepLinkFlow.js')
    expect(src).toContain("emitWindowingDiag('anchor_adjust_suppressed'")
    expect(src).toContain("emitWindowingDiag('anchor_deferred_drop'")
    expect(src).toContain('targetLockRef')
    expect(src).toContain('registerForumWindowingTarget')
    expect(deeplinkSrc).toContain('revealForumWindowedDomId')
  })

  test('media lifecycle runtime exports touch marker for resident policy', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain('export function __markMediaLifecycleTouch')
    expect(src).toContain('shouldKeepResidentPostVideo')
    expect(src).toContain("const isPostFeedVideo = String(el?.getAttribute?.('data-forum-video') || '') === 'post'")
  })

  test('post-video restore delegates network kicks to the coordinator load gate', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain("String(el.dataset?.__resident || '') === '1'")
    expect(src).toContain('Native post-video network starts are owned by the coordinator load gate.')
    expect(src).toContain("el.preload = isPostFeedVideo ? 'none' : (shouldAutoPreload ? 'auto' : 'metadata')")
    expect(src).toContain('if (!isPostFeedVideo && !isLoading && canRestoreLoad()) el.load?.()')
    expect(src).not.toContain('const shouldKickLoad =')
    expect(src).not.toContain('__isVideoNearViewport(el, 900)')
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
    expect(src).toContain('const scheduleNativePrewarmScan =')
    expect(src).toContain('candidate_predictive_native_prewarm')
    expect(src).toContain('native_prewarm_hold_loading_slot')
    expect(src).toContain("scheduleHardUnload(prev, isIOSUi ? 260 : 220, 'native_warm_owner_lost')")
    expect(src).toContain('const warmupOnlyPrime =')
    expect(src).toContain('const maxBatch = 1')
  })
})
