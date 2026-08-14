import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('coordinator runtime contract', () => {
  test('R24 keeps the authoritative autoplay/playback function bodies byte-identical', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const hashSlice = (startToken, endToken) => {
      const start = src.indexOf(startToken)
      const end = src.indexOf(endToken, start)
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeGreaterThan(start)
      return crypto.createHash('sha256').update(src.slice(start, end), 'utf8').digest('hex').toUpperCase()
    }

    expect(hashSlice('const startHtmlMedia =', 'const ensureYouTubeAPI =')).toBe(
      '1C20471B224743C8F176A8165DC65DB372FA7C62AE86B8C48CE91F3FA5C0626D',
    )
    expect(hashSlice('const playMedia =', 'const getCandidateMetrics =')).toBe(
      '11DC3B2696802437AE74F3A6DC5A07F64E6AF5EFA87B03F1B3C39146343EA9E0',
    )
  })

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

  test('VideoMedia keeps coordinator-owned post prewarm metadata-only across rerenders', () => {
    const src = read('app/forum/features/media/components/VideoMedia.jsx')
    expect(src).toContain('const postPlaybackIntent =')
    expect(src).toContain("postPlaybackIntent ? 'auto' : (wantsWarm ? 'metadata' : 'none')")
    expect(src).toContain('Poster-first: with no src attached the coordinator owns the first metadata kick.')
    expect(src).toMatch(/isNewMediaNode && isPostVideo[\s\S]{0,520}el\.preload = 'none'/)
  })

  test('coordinator defers hard unload during settling', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('hard_unload_deferred_settling')
    expect(src).toContain('markSettling')
  })

  test('coordinator keeps post-video resident only inside the light prewarm runway', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain("const isEmergencyHtmlMediaUnloadReason = (reason = 'timeout') => {")
    expect(src).toContain("const isSoftPostVideoUnloadReason = (reason = 'timeout') => {")
    expect(src).toContain("next === 'native_warm_owner_lost'")
    expect(src).toContain("connectedPostVideoOwner && !emergencyHtmlMediaUnload && isSoftPostVideoUnloadReason(unloadReason)")
    const runtimeSrc = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(runtimeSrc).toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_RUNTIME')
    expect(runtimeSrc).toContain('const postLightResidentPx =')
    expect(runtimeSrc).toContain('const postLightHysteresisPx =')
    expect(runtimeSrc).toContain('const postPrewarmRunway =')
    expect(runtimeSrc).toContain('const shouldSoftUnload =')
    expect(runtimeSrc).toContain('(!isPostFeedVideo && !canHardUnload) ||')
    expect(runtimeSrc).toContain("el.preload = isPostFeedVideo ? 'metadata' : (keepWarmFetchOnSoftUnload ? 'auto' : 'metadata')")
    expect(runtimeSrc).not.toContain('nativePrimeHoldActive')
    expect(runtimeSrc).not.toContain('__nativePrimeHoldUntil')
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
    expect(src).toContain('DOWNWARD_UNMOUNT_GRACE_PX = 900')
    expect(src).toContain('DOWNWARD_BEHIND_VIEWPORT_HOLD_ITEMS = 3')
    expect(src).toContain('protectedVisibleStart')
    expect(src).toContain('protectedVisibleEnd')
  })

  test('shared forum windowing suppresses scrollTop compensation and uses reveal locks for targets', () => {
    const src = read('app/forum/shared/hooks/useForumWindowing.js')
    const deeplinkSrc = read('app/forum/features/feed/hooks/useForumDeepLinkFlow.js')
    expect(src).toContain("emitWindowingDiag('anchor_adjust_deferred_active_scroll'")
    expect(src).toContain("emitWindowingDiag('anchor_adjust_skip_native_anchor'")
    expect(src).toContain("emitWindowingDiag('height_above_window_active_skip_native_anchor'")
    expect(src).toContain("emitWindowingDiag('anchor_large_delta_drop'")
    expect(src).toContain('targetLockRef')
    expect(src).toContain('registerForumWindowingTarget')
    expect(src).toContain('const scrollTargets = new Set([window])')
    expect(src).not.toContain("doc.addEventListener('scroll'")
    expect(src).not.toContain("document.addEventListener('scroll', onScroll")
    expect(src).not.toContain("visualViewport?.addEventListener?.('scroll'")
    expect(deeplinkSrc).toContain('revealForumWindowedDomId')
    expect(deeplinkSrc).toContain('revealForumWindowedDomId(`post_${postId}`, { holdMs: 2400 })')
    expect(deeplinkSrc).toContain('document.getElementById(`post_${postId}`)')
    expect(deeplinkSrc).toContain("centerAndFlashPostAfterDomEvent(postId, 'auto')")
  })

  test('media lifecycle runtime exports touch marker for resident policy', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain('export function __markMediaLifecycleTouch')
    expect(src).toContain('shouldKeepResidentPostVideo')
    expect(src).toContain('function isManagedForumVideoKind(el)')
    expect(src).toContain("return kind === 'post' || kind === 'ad'")
    expect(src).toContain('const isPostFeedVideo = isManagedForumVideoKind(el)')
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

  test('native forum video is poster-first with metadata-only near prewarm while active autoplay stays unchanged', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL')
    expect(src).toContain('const allowNearViewportRestore =')
    expect(src).toContain('const keepWarm = highPriorityReason || allowNearViewportRestore;')
    expect(src).toContain('getOwnerViewportGapPx(el) <= getNativePrewarmGapLimit()')
    expect(src).toContain('const scheduleNativePrewarmScan =')
    expect(src).toContain('candidate_predictive_native_prewarm')
    expect(src).toContain('native_prewarm_hold_loading_slot')
    expect(src).toContain('native_prewarm_metadata_kick')
    expect(src).toContain("preloadMode: 'metadata'")
    expect(src).toContain("media.preload = 'metadata'")
    expect(src).toContain('const POST_NATIVE_SRC_CAP = 2')
    expect(src).toContain('Math.min(720, Math.round(viewportH * 0.62))')
    expect(src).toContain('Math.min(640, Math.round(viewportH * 0.54))')
    expect(src).toContain('Math.min(420, Math.round(viewportH * 0.34))')
    expect(src).toContain('const clampPostNativeWarmBuffer =')
    expect(src).toContain('const enforcePostNativeSrcCap =')
    expect(src).toContain('const hardProtected = isKeep || playing || visiblePx > 0;')
    expect(src).toContain("trace('post_native_src_cap_keep_near', item.node, {")
    expect(src).toContain("trace('hard_unload_softened_visible_post_video', media || el, {")
    expect(src).toContain("reason: 'transient_post_surface_error'")
    expect(src).toContain("trace('observe_native_visible_restore', media, { visiblePx, gapPx });")
    expect(src).toContain("trace('post_native_src_cap_release', item.node, {")
    expect(src).toContain('const maxBatch = 1')
    expect(src).not.toContain('const primeNativeFirstFrame =')
    expect(src).not.toContain('native_prime_offscreen_warmup_play')
    expect(src).not.toContain('requestVideoFrameCallback')
    expect(src).not.toContain('__nativePrime')

    const prewarmStart = src.indexOf('const prepareNativePriorityPrewarm =')
    const prewarmEnd = src.indexOf('// Best-effort loop', prewarmStart)
    expect(prewarmStart).toBeGreaterThanOrEqual(0)
    expect(prewarmEnd).toBeGreaterThan(prewarmStart)
    const prewarmBlock = src.slice(prewarmStart, prewarmEnd)
    expect(prewarmBlock).toContain("media.preload = 'metadata'")
    expect(prewarmBlock).not.toMatch(/\.play\s*\(/)

    // Autoplay is not redesigned by R24: a visible active native candidate still
    // enters the same immediate playMedia path, including the iOS pending-ready kick.
    expect(src).toMatch(/candidate_activate_native_pending_play[\s\S]{0,700}playMedia\(active\)/)
    expect(src).toMatch(/traceCandidate\('candidate_activate',[\s\S]{0,520}playMedia\(active\)/)
    expect(src).toContain('video[data-forum-media="video"][data-forum-video="post"],video[data-forum-media="video"][data-forum-video="ad"]')
  })
})
