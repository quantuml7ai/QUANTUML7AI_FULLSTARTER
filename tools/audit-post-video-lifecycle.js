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
    nativePriorityPrewarm:
      /let nativePrewarmEl = null/.test(coordinator) &&
      /const prepareNativePriorityPrewarm =/.test(coordinator) &&
      /const primeNativeFirstFrame =/.test(coordinator),
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
      /const postPrewarmRunway =/.test(runtime) &&
      /const shouldSoftUnload =/.test(runtime) &&
      /\(!isPostFeedVideo && !canHardUnload\) \|\|/.test(runtime),
    runtimeNativePosterRemoved: !/data-poster|__posterOriginal|__posterMediaKey|__posterRevealed/.test(runtime),
    leafCoordinatorGuard: /coordinatorOwnsLifecycle/.test(videoLeaf),
    leafPostPreloadMetadata: /const renderPreload = isPostVideo \? 'metadata' : preload/.test(videoLeaf),
    leafCoordinatorLoadStateGuard: /const leafMayWriteLifecycle = !coordinatorOwnsPostLifecycle/.test(videoLeaf),
    leafCoordinatorLoadedHandlerGuard:
      /if \(!coordinatorOwnsPostLifecycle\) \{[\s\S]{0,260}__loadPending/.test(videoLeaf),
    leafNativePosterRemoved:
      /poster: nativeVideoPoster/.test(videoLeaf) &&
      !/data-poster/.test(videoLeaf) &&
      !/poster=\{/.test(videoLeaf),
    postMediaPosterRemoved:
      !/<VideoMediaComponent[\s\S]{0,420}poster=\{posterUrl \|\| undefined\}/.test(postMediaStack) &&
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
  if (!signals.nativePriorityPrewarm) issues.push('missing-native-priority-prewarm');
  if (!signals.predictiveNativePrewarm) issues.push('missing-predictive-native-prewarm');
  if (!signals.existingFetchHold) issues.push('missing-existing-fetch-hold');
  if (!signals.restoreDelegatesPostLoad) issues.push('post-restore-still-owns-network-load');
  if (!signals.runtimePostRunwayUnload) issues.push('post-video-runtime-unload-not-runway-bounded');
  if (!signals.runtimeNativePosterRemoved) issues.push('runtime-native-poster-logic-still-present');
  if (!signals.pendingActivateUsesPlayMedia) issues.push('pending-activate-path-does-not-promote-candidate-into-play-pipeline');
  if (!signals.leafPostPreloadMetadata) issues.push('video-leaf-post-preload-is-not-metadata');
  if (!signals.leafCoordinatorLoadStateGuard) issues.push('video-leaf-loadstate-effect-still-writes-coordinator-owned-flags');
  if (!signals.leafCoordinatorLoadedHandlerGuard) issues.push('video-leaf-loaded-handler-still-writes-coordinator-owned-flags');
  if (!signals.leafNativePosterRemoved) issues.push('video-leaf-native-poster-logic-still-present');
  if (!signals.postMediaPosterRemoved) issues.push('post-media-stack-still-forwards-native-poster');
  if (signals.leafPostMountLifecycleReset) issues.push('leaf-post-video-reset-still-mutates-owner-flags');

  const report = {
    generatedAt: new Date().toISOString(),
    status: issues.length ? 'warn' : 'pass',
    files: FILES,
    signals,
    ownershipWrites,
    issues,
    notes: [
      'Coordinator is the single decision layer for native post-video prewarm, first-frame priming, focus playback, and unload.',
      'Native post-video prewarm has a predictive one-slot scan so the next candidate starts before viewport/focus.',
      'Runtime restore may attach/reconcile src, but native post-video network starts must go through coordinator load gates.',
      'Post-video soft residency is bounded to the viewport/prewarm runway; far connected videos must hard detach src.',
      'Poster forwarding/preservation for native post video is intentionally removed to avoid competing with warmup/playback.',
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
