#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_FILE = path.join(ROOT, 'native-post-video.audit.report.json');

const FILES = {
  runtime: 'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  coordinator: 'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  videoLeaf: 'app/forum/features/media/components/VideoMedia.jsx',
  postMediaStack: 'app/forum/features/feed/components/PostMediaStack.jsx',
  policy: 'app/forum/features/media/utils/mediaStatePolicy.js',
};

function read(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

function count(rx, text) {
  const matches = text.match(rx);
  return Array.isArray(matches) ? matches.length : 0;
}

function main() {
  const runtime = read(FILES.runtime);
  const coordinator = read(FILES.coordinator);
  const videoLeaf = read(FILES.videoLeaf);
  const postMediaStack = read(FILES.postMediaStack);
  const signals = {
    legacyWarmSweepRemoved:
      !/legacyWarmSweep|NEXT_PUBLIC_FORUM_LEGACY_WARM_SWEEP|warmSweepMode/.test(coordinator),
    legacyIframePrewarmRemoved:
      !/legacyIframePrewarm|NEXT_PUBLIC_FORUM_LEGACY_IFRAME_PREWARM|legacyIframePrewarmMode/.test(coordinator),
    coordinatorSingleOwner: /Single owner for forum media warmup/.test(coordinator),
    nativePosterFirstLightPrewarm:
      /QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL/.test(coordinator) &&
      /let nativePrewarmEl = null/.test(coordinator) &&
      /const prepareNativePriorityPrewarm =/.test(coordinator) &&
      /preloadMode: 'metadata'/.test(coordinator) &&
      /native_prewarm_metadata_kick/.test(coordinator),
    nativeAggressiveFirstFramePrimeRemoved:
      !/const primeNativeFirstFrame =/.test(coordinator) &&
      !/native_prime_offscreen_warmup_play/.test(coordinator) &&
      !/requestVideoFrameCallback/.test(coordinator) &&
      !/__nativePrime/.test(coordinator),
    nativeLightRunwayBounded:
      /Math\.max\(420, Math\.min\(720, Math\.round\(viewportH \* 0\.62\)\)\)/.test(coordinator) &&
      /Math\.max\(360, Math\.min\(640, Math\.round\(viewportH \* 0\.54\)\)\)/.test(coordinator) &&
      /Math\.max\(220, Math\.min\(420, Math\.round\(viewportH \* 0\.34\)\)\)/.test(coordinator) &&
      /const POST_NATIVE_SRC_CAP = 2/.test(coordinator),
    predictiveNativePrewarm:
      /const scheduleNativePrewarmScan =/.test(coordinator) &&
      /candidate_predictive_native_prewarm/.test(coordinator) &&
      /native_prewarm_hold_loading_slot/.test(coordinator) &&
      /const maxBatch = 1/.test(coordinator),
    existingFetchHold:
      /const isHtmlMediaLoadingOrBuffered = \(el\) =>/.test(coordinator) &&
      /load_kick_hold_existing_fetch/.test(coordinator),
    pendingActivateUsesPlayMedia:
      /candidate_activate_native_pending_play[\s\S]{0,520}playMedia\(active\)/.test(coordinator),
    restoreDelegatesPostLoad:
      /Native post-video network starts are owned by the coordinator load gate\./.test(runtime) &&
      !/const shouldKickLoad =/.test(runtime) &&
      !/__isVideoNearViewport\(el, 900\)/.test(runtime),
    runtimePostRunwayUnload:
      /QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_RUNTIME/.test(runtime) &&
      /const postLightResidentPx =/.test(runtime) &&
      /const postLightHysteresisPx =/.test(runtime) &&
      /const postPrewarmRunway =/.test(runtime) &&
      /const shouldSoftUnload =/.test(runtime) &&
      /\(!isPostFeedVideo && !canHardUnload\) \|\|/.test(runtime) &&
      /el\.preload = isPostFeedVideo \? 'metadata' : \(keepWarmFetchOnSoftUnload \? 'auto' : 'metadata'\)/.test(runtime) &&
      !/__nativePrime/.test(runtime),
    runtimeNativePosterRemoved: !/data-poster|__posterOriginal|__posterMediaKey|__posterRevealed/.test(runtime),
    leafCoordinatorGuard: /coordinatorOwnsLifecycle/.test(videoLeaf),
    leafPostPreloadMetadata:
      /const renderPreload = coordinatorOwnsPostLifecycle \? 'none' : \(isPostVideo \? 'metadata' : preload\)/.test(videoLeaf) &&
      /postPlaybackIntent \? 'auto' : \(wantsWarm \? 'metadata' : 'none'\)/.test(videoLeaf) &&
      /Poster-first: with no src attached the coordinator owns the first metadata kick\./.test(videoLeaf),
    leafCoordinatorLoadStateGuard: /const leafMayWriteLifecycle = !coordinatorOwnsPostLifecycle/.test(videoLeaf),
    leafCoordinatorLoadedHandlerGuard:
      /if \(!coordinatorOwnsPostLifecycle\) \{[\s\S]{0,260}__loadPending/.test(videoLeaf),
    leafPassiveNativePoster:
      /poster: nativeVideoPoster/.test(videoLeaf) &&
      /poster=\{shouldMirrorVideo \? undefined : renderPoster\}/.test(videoLeaf) &&
      !/data-poster/.test(videoLeaf) &&
      /data-front-camera-feed-poster-layer=\"1\"/.test(videoLeaf),
    postMediaPassivePoster:
      /poster=\{i === 0 && posterUrl \? posterUrl : undefined\}/.test(postMediaStack) &&
      !/data-poster/.test(postMediaStack),
    leafPostMountLifecycleReset: /isNewMediaNode\s*&&\s*isPostVideo[\s\S]{0,600}__active\s*=\s*'0'/.test(videoLeaf),
  };

  const ownershipWrites = {
    coordinator: {
      active: count(/__active\s*=\s*'1'|__active\s*=\s*'0'/g, coordinator),
      prewarm: count(/__prewarm\s*=\s*'1'|__prewarm\s*=\s*'0'/g, coordinator),
      resident: count(/__resident\s*=\s*'1'|__resident\s*=\s*'0'/g, coordinator),
      loadPending: count(/__loadPending\s*=\s*'1'|__loadPending\s*=\s*'0'/g, coordinator),
      warmReady: count(/__warmReady\s*=\s*'1'|__warmReady\s*=\s*'0'/g, coordinator),
    },
    runtime: {
      active: count(/__active\s*=\s*'1'|__active\s*=\s*'0'/g, runtime),
      prewarm: count(/__prewarm\s*=\s*'1'|__prewarm\s*=\s*'0'/g, runtime),
      resident: count(/__resident\s*=\s*'1'|__resident\s*=\s*'0'/g, runtime),
      loadPending: count(/__loadPending\s*=\s*'1'|__loadPending\s*=\s*'0'/g, runtime),
      warmReady: count(/__warmReady\s*=\s*'1'|__warmReady\s*=\s*'0'/g, runtime),
    },
    videoLeaf: {
      active: count(/__active\s*=\s*'1'|__active\s*=\s*'0'/g, videoLeaf),
      prewarm: count(/__prewarm\s*=\s*'1'|__prewarm\s*=\s*'0'/g, videoLeaf),
      resident: count(/__resident\s*=\s*'1'|__resident\s*=\s*'0'/g, videoLeaf),
      loadPending: count(/__loadPending\s*=\s*'1'|__loadPending\s*=\s*'0'/g, videoLeaf),
      warmReady: count(/__warmReady\s*=\s*'1'|__warmReady\s*=\s*'0'/g, videoLeaf),
    },
  };

  const issues = [];
  if (!signals.legacyWarmSweepRemoved) issues.push('legacy-warm-sweep-still-present');
  if (!signals.legacyIframePrewarmRemoved) issues.push('legacy-iframe-prewarm-still-present');
  if (!signals.coordinatorSingleOwner) issues.push('missing-single-owner-coordinator-marker');
  if (!signals.nativePosterFirstLightPrewarm) issues.push('missing-native-poster-first-light-prewarm');
  if (!signals.nativeAggressiveFirstFramePrimeRemoved) issues.push('aggressive-native-first-frame-prime-still-present');
  if (!signals.nativeLightRunwayBounded) issues.push('native-light-prewarm-runway-not-bounded');
  if (!signals.predictiveNativePrewarm) issues.push('missing-predictive-native-prewarm');
  if (!signals.existingFetchHold) issues.push('missing-existing-fetch-hold');
  if (!signals.restoreDelegatesPostLoad) issues.push('post-restore-still-owns-network-load');
  if (!signals.runtimePostRunwayUnload) issues.push('post-video-runtime-unload-not-runway-bounded');
  if (!signals.runtimeNativePosterRemoved) issues.push('runtime-native-poster-logic-still-present');
  if (!signals.pendingActivateUsesPlayMedia) issues.push('pending-activate-path-does-not-promote-candidate-into-play-pipeline');
  if (!signals.leafPostPreloadMetadata) issues.push('video-leaf-post-preload-is-not-metadata');
  if (!signals.leafCoordinatorLoadStateGuard) issues.push('video-leaf-loadstate-effect-still-writes-coordinator-owned-flags');
  if (!signals.leafCoordinatorLoadedHandlerGuard) issues.push('video-leaf-loaded-handler-still-writes-coordinator-owned-flags');
  if (!signals.leafPassiveNativePoster) issues.push('video-leaf-passive-native-poster-missing');
  if (!signals.postMediaPassivePoster) issues.push('post-media-stack-passive-poster-forwarding-missing');
  if (signals.leafPostMountLifecycleReset) issues.push('leaf-post-video-reset-still-mutates-owner-flags');

  const report = {
    generatedAt: new Date().toISOString(),
    status: issues.length ? 'warn' : 'pass',
    files: FILES,
    signals,
    ownershipWrites,
    issues,
    notes: [
      'Coordinator is the single decision layer for native post-video metadata prewarm, focus playback, and unload.',
      'Persisted poster owns offscreen presentation; native prewarm is metadata-only inside a short near-viewport runway.',
      'Synthetic offscreen play/seek/frame priming is forbidden; real decode/play stays on the existing active autoplay/manual path.',
      'Native post-video prewarm keeps a predictive one-slot scan so the next candidate can prepare metadata before viewport/focus.',
      'Runtime restore may attach/reconcile src, but native post-video network starts must go through coordinator load gates.',
      'Post-video soft residency uses a short hysteresis runway; far ready sources cannot veto a forced cap detach.',
      'Paused/native-prewarm forum sources remain preload=metadata; only active playback intent may upgrade to auto.',
      'Persisted immutable native-video poster forwarding is passive HTML presentation only; runtime poster mutation/reveal logic remains forbidden.',
      'VideoMedia should not zero coordinator-owned active/prewarm/resident flags on mount.',
      'Existing fetches must be held instead of restarted to avoid Range 206 cancel loops.',
    ],
  };

  fs.writeFileSync(OUT_FILE, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log('[audit:post-video-lifecycle] status:', report.status);
  if (issues.length) {
    issues.forEach((issue) => console.log(`- ${issue}`));
  } else {
    console.log('- no lifecycle ownership regressions detected');
  }
  console.log(`Saved: ${OUT_FILE}`);
}

main();
