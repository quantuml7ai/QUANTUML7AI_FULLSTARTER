import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { runInNewContext } from 'node:vm'
import { describe, expect, test, vi } from 'vitest'
import { __unloadVideoEl } from '../../../../app/forum/features/media/utils/mediaLifecycleRuntime.js'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('coordinator runtime contract', () => {
  test('detached QCast cleanup releases retention and resets the real audio pipeline', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const start = src.indexOf('const cleanupObservedMediaNode =')
    const end = src.indexOf('const sweepDetachedMediaState =', start)
    const flushStart = src.indexOf('const flushRemovedMediaOwners =')
    const flushEnd = src.indexOf('const scheduleRemovedMediaOwnersFlush =', flushStart)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    expect(flushStart).toBeGreaterThan(end)
    expect(flushEnd).toBeGreaterThan(flushStart)
    const retained = new Set()
    const pending = new Set()
    const drop = vi.fn((node) => retained.delete(node))
    const unload = vi.fn(__unloadVideoEl)
    const noop = () => {}
    const flush = runInNewContext(`${src.slice(start, end)}\n${src.slice(flushStart, flushEnd)}\nflushRemovedMediaOwners`, {
      Element, HTMLVideoElement, HTMLAudioElement, HTMLIFrameElement,
      forEachMediaOwner: (node, fn) => fn(node),
      io: { observe: noop, unobserve: noop }, nearIo: { observe: noop, unobserve: noop },
      observed: new Set(), mediaRegistry: new Set(), pendingReadyGrace: new Map(), ratios: new Map(),
      cancelUnload: noop, clearReadyReplay: noop, invalidatePlayRequest: noop, clearNativePauseRecovery: noop,
      active: null, activeSinceTs: 0, nativePrewarmEl: null, nativePrewarmTs: 0,
      getQCastAudio: (node) => node.querySelector('audio'),
      __dropActiveVideoEl: drop, __unloadVideoEl: unload,
      withSystemPause: (_node, fn) => fn(),
      pendingRemovedMediaOwners: pending, mediaRemovalRaf: 0, publishMediaRegistryState: noop,
    })
    const owner = document.createElement('div')
    owner.setAttribute('data-forum-media', 'qcast')
    const audio = document.createElement('audio')
    audio.setAttribute('src', 'https://media.example.invalid/fixture.mp3')
    audio.pause = vi.fn()
    audio.load = vi.fn()
    audio.muted = true
    owner.append(audio)
    retained.add(audio)

    // A DOM move reattaches before the removal batch: playback must survive.
    document.body.append(owner)
    try {
      pending.add(owner)
      flush()
      expect(drop).not.toHaveBeenCalled()
      expect(unload).not.toHaveBeenCalled()
      expect(audio.getAttribute('src')).toBe('https://media.example.invalid/fixture.mp3')
    } finally { owner.remove() }

    pending.add(owner)
    flush()
    expect(drop).toHaveBeenCalledWith(audio)
    expect(retained.has(audio)).toBe(false)
    expect(audio.pause).toHaveBeenCalledOnce()
    expect(audio.load).toHaveBeenCalledOnce()
    expect(audio.hasAttribute('src')).toBe(false)
    expect(audio.dataset.__hardDetached).toBe('1')
    expect(audio.dataset.__forceHardUnload).toBeUndefined()
    expect(audio.dataset.__pendingHardUnload).toBeUndefined()
    expect(audio.muted).toBe(true)

    const directAudio = document.createElement('audio')
    retained.add(directAudio)
    pending.add(directAudio)
    flush()
    expect(drop).toHaveBeenCalledWith(directAudio)
    expect(retained.size).toBe(0)
  })
  test('strict native src-cap eviction hard detaches even inside the normal near-viewport soft runway', () => {
    const video = document.createElement('video')
    video.setAttribute('data-forum-media', 'video')
    video.setAttribute('data-forum-video', 'post')
    video.setAttribute('src', 'https://media.example.invalid/native-budget.mp4')
    video.dataset.__forceHardUnload = '1'
    video.dataset.__strictNativeSrcCapDetach = '1'
    video.getBoundingClientRect = () => ({ top: 20, bottom: 420, left: 0, right: 320, width: 320, height: 400 })
    video.pause = vi.fn()
    video.load = vi.fn()
    document.body.append(video)

    try {
      __unloadVideoEl(video)
      expect(video.pause).toHaveBeenCalled()
      expect(video.load).toHaveBeenCalled()
      expect(video.hasAttribute('src')).toBe(false)
      expect(video.getAttribute('data-src')).toBe('https://media.example.invalid/native-budget.mp4')
      expect(video.dataset.__hardDetached).toBe('1')
      expect(video.dataset.__strictNativeSrcCapDetach).toBeUndefined()
    } finally {
      video.remove()
    }
  })

  test('R26 periodic registry self-heal releases detached native video and stale prewarm ownership', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const start = src.indexOf('const releaseDetachedManagedVideoPipeline =')
    const end = src.indexOf('const sweepDetachedMediaState =', start)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)

    const connected = document.createElement('video')
    connected.setAttribute('data-forum-media', 'video')
    connected.setAttribute('data-forum-video', 'post')
    connected.setAttribute('src', 'https://media.example.invalid/connected.mp4')
    document.body.append(connected)

    const detached = document.createElement('video')
    detached.setAttribute('data-forum-media', 'video')
    detached.setAttribute('data-forum-video', 'post')
    detached.setAttribute('src', 'https://media.example.invalid/detached.mp4')
    detached.dataset.__active = '1'
    detached.dataset.__resident = '1'
    detached.dataset.__prewarm = '1'
    detached.dataset.__nativePrewarm = '1'
    detached.pause = vi.fn()
    detached.load = vi.fn()

    const registry = new Set([connected, detached])
    const pending = new Set([detached])
    const unobserve = vi.fn()
    const unload = vi.fn(__unloadVideoEl)
    const sourceCooldown = vi.fn()
    const context = {
      Element, HTMLVideoElement, HTMLAudioElement, HTMLIFrameElement,
      forEachMediaOwner: (node, fn) => fn(node),
      io: { unobserve }, nearIo: { unobserve }, observed: new Set(),
      mediaRegistry: registry, pendingRemovedMediaOwners: pending, pendingReadyGrace: new Map(), ratios: new Map(),
      cancelUnload: () => {}, clearExternalPlayKick: () => {}, clearReadyReplay: () => {}, invalidatePlayRequest: () => {},
      clearLoadPending: () => {}, detachYouTubePlayer: () => {}, getQCastAudio: () => null, __dropActiveVideoEl: () => {},
      clearNativePauseRecovery: () => {}, markSourceRewarmCooldown: sourceCooldown,
      withSystemPause: (_node, fn) => fn(), __unloadVideoEl: unload,
      isManagedForumVideoKind: (node) => ['post', 'ad'].includes(String(node?.getAttribute?.('data-forum-video') || '')),
      active: null, activeSinceTs: 0, nativePrewarmEl: detached, nativePrewarmTs: Date.now(),
      mediaRegistryDetachedReleaseCount: 0, mediaRegistrySelfHealCount: 0, trace: () => {},
    }
    const selfHeal = runInNewContext(`${src.slice(start, end)}\nselfHealDisconnectedMediaRegistry`, context)

    try {
      expect(selfHeal('test_sweep')).toBe(1)
      expect(registry.has(connected)).toBe(true)
      expect(registry.has(detached)).toBe(false)
      expect(pending.has(detached)).toBe(false)
      expect(unobserve).toHaveBeenCalled()
      expect(sourceCooldown).toHaveBeenCalledWith(detached, 'detached_registry_release')
      expect(unload).toHaveBeenCalledWith(detached)
      expect(detached.hasAttribute('src')).toBe(false)
      expect(detached.getAttribute('data-src')).toBe('https://media.example.invalid/detached.mp4')
      expect(detached.load).toHaveBeenCalledOnce()
      expect(detached.dataset.__active).toBe('0')
      expect(detached.dataset.__resident).toBe('0')
      expect(detached.dataset.__prewarm).toBe('0')
      expect(detached.dataset.__nativePrewarm).toBe('0')
      expect(context.nativePrewarmEl).toBe(null)
      expect(context.mediaRegistrySelfHealCount).toBe(1)
      expect(context.mediaRegistryDetachedReleaseCount).toBe(1)
    } finally {
      connected.remove()
    }
  })

  test('R26 suppresses speculative same-source rewarm after hard detach without blocking active play', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const limiterStart = src.indexOf('const canKickLoad =')
    const limiterEnd = src.indexOf('const markLoadPending =', limiterStart)
    const hardStart = src.indexOf('const hardUnloadMedia =')
    const hardEnd = src.indexOf('const prepareExternalMedia =', hardStart)
    const prewarmStart = src.indexOf('const prepareNativePriorityPrewarm =')
    const prewarmEnd = src.indexOf('// Best-effort loop', prewarmStart)
    const playStart = src.indexOf('const playMedia =')
    const playEnd = src.indexOf('const getCandidateMetrics =', playStart)
    for (const [startAt, endAt] of [[limiterStart, limiterEnd], [hardStart, hardEnd], [prewarmStart, prewarmEnd], [playStart, playEnd]]) {
      expect(startAt).toBeGreaterThanOrEqual(0)
      expect(endAt).toBeGreaterThan(startAt)
    }
    const limiter = src.slice(limiterStart, limiterEnd)
    const hardUnload = src.slice(hardStart, hardEnd)
    const prewarm = src.slice(prewarmStart, prewarmEnd)
    const play = src.slice(playStart, playEnd)

    expect(limiter).toContain('rewarmBlockedUntil > now')
    expect(limiter).toContain("trace('load_kick_skip_src_rewarm_cooldown'")
    expect(hardUnload).toContain('markSourceRewarmCooldown(el, unloadReason)')
    expect(prewarm).toContain("bypassSrcLimiter: false")
    expect(prewarm).toContain("claimRolledBack: '1'")
    expect(play).toContain('bypassSrcLimiter: true')
    expect(src).toContain("trace('load_kick_skip_detached', media, { channel })")
    expect(src).toContain('const hasAttachedMediaSrc = (el) => !!readAttachedMediaSrc(el)')
  })

  test('R25 keeps R24 autoplay stable and limits playMedia changes to the audited src-budget handoff', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const normalizedSlice = (startToken, endToken) => {
      const start = src.indexOf(startToken)
      const end = src.indexOf(endToken, start)
      expect(start).toBeGreaterThanOrEqual(0)
      expect(end).toBeGreaterThan(start)
      return src.slice(start, end).replace(/\r\n/g, '\n')
    }
    const hashSource = (source) => crypto.createHash('sha256').update(source, 'utf8').digest('hex').toUpperCase()

    expect(hashSource(normalizedSlice('const startHtmlMedia =', 'const ensureYouTubeAPI ='))).toBe(
      '630F36FFCEF7C86797379EB0122A0B23D599C34B7657AD41386D6FA77D793DD7',
    )

    const playMedia = normalizedSlice('const playMedia =', 'const getCandidateMetrics =')
    const r25BudgetHandoff = "    try { enforcePostNativeSrcCap(el, 'play_restore_attach'); } catch {}\n"
    expect(playMedia.split(r25BudgetHandoff)).toHaveLength(2)
    expect(hashSource(playMedia)).toBe(
      '9CF811D828654AD2328019BB2288A03B5AD5A65CB8D309110EC0B051E24960D2',
    )
    expect(hashSource(playMedia.replace(r25BudgetHandoff, ''))).toBe(
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

  test('G7 FIX2 commits a stable native candidate during scroll without waiting for scroll-stop', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('const getSpeculativePrewarmSettleMs = (el) => {')
    expect(src).toContain('const isSpeculativePrewarmScrollHot = (el) => {')
    expect(src).toContain('const schedulePredictivePrewarmAfterScroll = () => {')
    expect(src).toContain('const recordCoordinatorScrollMotion = () => {')
    expect(src).toContain('const getCoordinatorScrollVelocity = () => {')
    expect(src).toContain('const getNativeAutoCommitDelayMs = () => {')
    expect(src).toContain('return isIOSUi ? 48 : (isCoarseUi ? 40 : 32)')
    expect(src).toContain('return isIOSUi ? 96 : (isCoarseUi ? 80 : 64)')
    expect(src).toContain('const commitNativeAutoCandidate = () => {')
    expect(src).toContain('function shouldDeferNativeAutoCandidate(candidate, metrics = null)')
    expect(src).toContain("traceCandidate('candidate_defer_transient_scroll'")
    expect(src).toContain("traceCandidate('candidate_stable_scroll_activate'")
    expect(src).toContain("prepareNativePriorityPrewarm(candidate, 'stable_scroll_candidate')")
    expect(src).toContain('if (deferNativeAutoCandidate) return;')
    expect(src).toContain("deferNativeAutoCandidate ? false : prepareNativePriorityPrewarm(candidate, 'early_native_candidate')")
    expect(src).toMatch(/isNativeAutoCommitScrollHot[\s\S]{0,300}hasManualLease\(candidate\)/)
    expect(src).toContain("scheduleNativePrewarmScan('scroll_settled_native_predictive_scan')")
    expect(src).not.toContain("scheduleNativePrewarmScan('scroll_native_predictive_scan')")
    expect(src).toContain('hotScrollNativeScanSkips += 1')
    expect(src).toContain("traceCandidate('external_prewarm_skip_scroll_hot'")
    expect(src).toContain("if (scrollHot && reason !== 'scroll_settled_native_predictive_scan')")
    expect(src).toContain("playMedia(active)")
    const scrollReaderStart = src.indexOf('const readCoordinatorScrollTop =')
    const scrollReaderEnd = src.indexOf('const updateCoordinatorScrollDirection =', scrollReaderStart)
    const scrollReaderBlock = src.slice(scrollReaderStart, scrollReaderEnd)
    expect(scrollReaderBlock).not.toContain('document.querySelector')
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
    expect(src).toContain('QL7_FORUM_NATIVE_SRC_BUDGET_R25_STRICT_FINAL')
    expect(src).toContain('const POST_NATIVE_SRC_CAP = 2')
    expect(src).toContain("media.dataset.__strictNativeSrcCapDetach = '1'")
    expect(src).toContain('__nativeSrcCapBlockedUntil')
    expect(src).toContain("reasonKey === 'resident_cap_overflow'")
    expect(src).toContain("reason !== 'resident_cap_overflow'")
    expect(src).toContain('Math.min(720, Math.round(viewportH * 0.62))')
    expect(src).toContain('Math.min(640, Math.round(viewportH * 0.54))')
    expect(src).toContain('Math.min(420, Math.round(viewportH * 0.34))')
    expect(src).toContain('const clampPostNativeWarmBuffer =')
    expect(src).toContain('const enforcePostNativeSrcCap =')
    expect(src).toContain('selectNativeSrcBudgetSurvivors(rows, POST_NATIVE_SRC_CAP)')
    expect(src).toContain("hardUnloadMedia(media, 'resident_cap_overflow')")
    expect(src).toContain("trace('hard_unload_softened_visible_post_video', media || el, {")
    expect(src).toContain("reason: 'transient_post_surface_error'")
    expect(src).toContain("trace('observe_native_visible_prewarm', media, { visiblePx, gapPx });")
    expect(src).toContain("trace('post_native_src_cap_release', media, {")
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
  test('passive external prewarm warms only the provider origin and keeps iframe boot for activation', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    const start = src.indexOf('const warmExternalProviderOrigin =')
    const end = src.indexOf('const waitExternalIframeLoad =', start)
    expect(start).toBeGreaterThanOrEqual(0)
    expect(end).toBeGreaterThan(start)
    const block = src.slice(start, end)
    expect(block).toContain("preconnect.rel = 'preconnect'")
    expect(block).toContain("dns.rel = 'dns-prefetch'")
    expect(block).toContain("gate: 'passive_origin_only'")
    expect(block).toContain('return originWarmed')
    expect(block).toContain('if (currentSrc) return true')
    expect(block).toContain("if (passivePrepare) return el.getAttribute('data-forum-origin-prewarmed') === '1'")
    expect(block).not.toContain('passive_external_disabled')
    const passiveStart = block.indexOf('if (!hadSrc && passivePrepare)')
    const activeAttach = block.indexOf("el.setAttribute('src', nextSrc)")
    expect(passiveStart).toBeGreaterThanOrEqual(0)
    expect(activeAttach).toBeGreaterThan(passiveStart)
  })

})
