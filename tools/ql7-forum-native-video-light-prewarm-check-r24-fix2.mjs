#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const fail = (code) => {
  console.error(`QL7_FORUM_NATIVE_VIDEO_LIGHT_PREWARM_R24_FIX2_CHECK_FAILED:${code}`)
  process.exit(1)
}
const need = (src, token, code) => { if (!src.includes(token)) fail(code) }
const forbid = (src, token, code) => { if (src.includes(token)) fail(code) }
const sliceBetween = (src, start, end) => {
  const a = src.indexOf(start)
  if (a < 0) fail(`missing_start:${start}`)
  const b = src.indexOf(end, a + start.length)
  if (b < 0) fail(`missing_end:${end}`)
  return src.slice(a, b)
}

const coordinator = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
const lifecycle = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
const leaf = read('app/forum/features/media/components/VideoMedia.jsx')
const dmRenderer = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
const forumAds = read('app/forum/ForumAds.js')
const globalAds = read('app/ads.js')

need(coordinator, 'QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL', 'marker_missing')
need(coordinator, 'const POST_NATIVE_SRC_CAP = 2', 'native_src_cap_not_two')
need(coordinator, 'Math.max(420, Math.min(720, Math.round(viewportH * 0.62)))', 'ios_runway_missing')
need(coordinator, 'Math.max(360, Math.min(640, Math.round(viewportH * 0.54)))', 'coarse_runway_missing')
need(coordinator, 'Math.max(220, Math.min(420, Math.round(viewportH * 0.34)))', 'desktop_runway_missing')
need(coordinator, "preloadMode = 'auto'", 'load_gate_default_missing')
need(coordinator, "preloadMode: 'metadata'", 'metadata_prewarm_missing')
need(coordinator, "const mode = preloadMode === 'metadata' ? 'metadata' : 'auto'", 'metadata_gate_missing')
need(coordinator, "trace('native_prewarm_metadata_kick'", 'metadata_trace_missing')
forbid(coordinator, 'const primeNativeFirstFrame =', 'synthetic_prime_function_present')
forbid(coordinator, 'native_prime_offscreen_warmup_play', 'offscreen_warmup_play_present')
forbid(coordinator, 'nativePrimeSrcState', 'prime_src_state_present')
forbid(coordinator, '__nativePrime', 'prime_dataset_state_present')
forbid(coordinator, 'requestVideoFrameCallback', 'first_frame_callback_present')

const prewarm = sliceBetween(
  coordinator,
  "const prepareNativePriorityPrewarm = (el, reason = 'native_priority_prewarm') => {",
  '// Best-effort loop для iframe',
)
need(prewarm, "media.preload = 'metadata'", 'prewarm_not_metadata')
need(prewarm, "preloadMode: 'metadata'", 'prewarm_load_not_metadata')
forbid(prewarm, '.play(', 'prewarm_calls_play')
forbid(prewarm, 'playMedia(', 'prewarm_calls_playMedia')
forbid(prewarm, 'startHtmlMedia(', 'prewarm_calls_startHtmlMedia')

// Autoplay/manual playback ownership must remain on the active candidate path.
need(coordinator, "traceCandidate('candidate_activate_native_pending_play'", 'pending_autoplay_activation_missing')
need(coordinator, "traceCandidate('candidate_activate'", 'autoplay_activation_missing')
need(coordinator, 'playMedia(active);', 'active_playMedia_missing')
need(coordinator, "startHtmlMedia(el, el.muted ? 'play_pending_muted' : 'play_pending_user_sound')", 'pending_startHtmlMedia_missing')
need(coordinator, "startHtmlMedia(el, 'play_now')", 'play_now_missing')

need(lifecycle, 'QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_RUNTIME', 'lifecycle_marker_missing')
need(lifecycle, 'const postLightResidentPx =', 'resident_runway_missing')
need(lifecycle, 'const postLightHysteresisPx =', 'hysteresis_runway_missing')
need(lifecycle, "el.preload = isPostFeedVideo ? 'metadata' : (keepWarmFetchOnSoftUnload ? 'auto' : 'metadata')", 'paused_prewarm_metadata_guard_missing')
forbid(lifecycle, '__nativePrime', 'lifecycle_prime_state_present')

need(leaf, "const renderPreload = coordinatorOwnsPostLifecycle ? 'none' : (isPostVideo ? 'metadata' : preload)", 'leaf_initial_preload_guard_missing')
need(leaf, "postPlaybackIntent ? 'auto' : (wantsWarm ? 'metadata' : 'none')", 'leaf_play_intent_preload_guard_missing')
need(leaf, 'Poster-first: with no src attached the coordinator owns the first metadata kick.', 'leaf_poster_first_marker_missing')

// Scope guard: this feature belongs to forum feed lifecycle. DM and ads renderers remain separate consumers.
need(dmRenderer, 'function DmMediaRenderer', 'dm_renderer_missing')
forbid(dmRenderer, 'QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2', 'dm_prewarmer_leak')
forbid(forumAds, 'QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2', 'forum_ads_runtime_leak')
forbid(globalAds, 'QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2', 'global_ads_runtime_leak')

console.log('QL7_FORUM_NATIVE_VIDEO_LIGHT_PREWARM_R24_FIX2_CHECK_OK ' + JSON.stringify({
  marker: 'QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL',
  scope: 'forum-native-feed-only',
  offscreenPresentation: 'poster-first',
  nearViewportPrewarm: 'metadata-only',
  syntheticWarmupPlay: false,
  autoplayOwnership: 'preserved-active-candidate-path',
  attachedNativeBudget: 2,
}))
