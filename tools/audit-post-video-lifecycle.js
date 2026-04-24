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
  const policy = read(FILES.policy);

  const signals = {
    softReleaseHelper: /export function __softReleaseVideoEl/.test(runtime),
    hardUnloadPolicyGate: /shouldHardUnloadPostVideo/.test(runtime) && /shouldHardUnloadPostVideo/.test(policy),
    coordinatorSoftReleaseBridge: /__softReleaseVideoEl\(el,\s*`coordinator:\$\{unloadReason\}`\)/.test(coordinator),
    detachedPostLoadKickGuard: /load_kick_skip_detached_post/.test(coordinator),
    candidateWaitRestore: /candidate_wait_restore/.test(coordinator),
    orphanShellDump: /orphanPostVideoShells/.test(coordinator) && /dumpForumVideoLifecycleDiag/.test(runtime),
    restoreSharesKickClock: /__lastLoadKickTs = String\(now\)/.test(runtime),
    restoreSeedsPendingSince: /__loadPendingSince = String\(nowTs\)/.test(runtime),
    recentRestoreLoadHold: /load_kick_skip_recent_restore/.test(coordinator),
    softPauseUsesSoftRelease: /__softReleaseVideoEl\(el,\s*`soft_pause:\$\{reason\}`\)/.test(coordinator),
    foreignPauseUsesSoftRelease: /__softReleaseVideoEl\(node,\s*'foreign_pause'\)/.test(coordinator),
    postPrewarmMetadataResident:
      /const lowPriorityPostPrepare = isPostVideo && !highPriorityReason;/.test(coordinator) &&
      /el\.preload = lowPriorityPostPrepare \? 'metadata' : 'auto'/.test(coordinator),
    postPrewarmDetachedHold: /if \(lowPriorityPostPrepare\) \{[\s\S]{0,220}candidate_metadata_hold[\s\S]{0,220}return false;[\s\S]{0,80}\}/.test(coordinator),
    autoplayRetryWatchdog: /scheduleAutoplayRetry/.test(coordinator) && /load_ready_autoplay/.test(coordinator),
    pendingActivateUsesPlayMedia: /candidate_activate_pending[\s\S]{0,240}pending_ready_play_request[\s\S]{0,220}playMedia\(candidate\)/.test(coordinator),
    leafCoordinatorGuard: /coordinatorOwnsLifecycle/.test(videoLeaf),
    leafCoordinatorPostSrcDetached: /const renderSrc = coordinatorOwnsLifecycle && isPostVideo \? undefined : src/.test(videoLeaf),
    leafPostPreloadNone: /const renderPreload = isPostVideo \? 'none' : preload/.test(videoLeaf),
    leafCoordinatorLoadStateGuard:
      /if \(coordinatorOwnsLifecycle\) \{\s*return undefined\s*\}/.test(videoLeaf) ||
      /if \(coordinatorOwnsLifecycleRef\.current\) \{\s*return undefined\s*\}/.test(videoLeaf),
    leafCoordinatorLoadedHandlerGuard: /if \(!coordinatorOwnsLifecycle\) \{[\s\S]{0,260}__loadPending/.test(videoLeaf),
    leafPosterAttr: /<video[\s\S]{0,320}poster=\{poster \|\| undefined\}/.test(videoLeaf),
    leafPosterDatasetSync: /__posterOriginal/.test(videoLeaf) && /dataset\.poster/.test(videoLeaf),
    postMediaPosterForward: /<VideoMediaComponent[\s\S]{0,420}poster=\{posterUrl \|\| undefined\}/.test(postMediaStack),
    leafPostMountLifecycleReset: /isNewMediaNode\s*&&\s*isPostVideo[\s\S]{0,600}__active\s*=\s*'0'/.test(videoLeaf),
    leafPostMountSrcDetach: /isNewMediaNode\s*&&\s*isPostVideo[\s\S]{0,400}removeAttribute\('src'\)/.test(videoLeaf),
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
  if (!signals.softReleaseHelper) issues.push('missing-soft-release-helper');
  if (!signals.hardUnloadPolicyGate) issues.push('missing-post-hard-unload-gate');
  if (!signals.coordinatorSoftReleaseBridge) issues.push('coordinator-hard-unload-missing-soft-release-bridge');
  if (!signals.detachedPostLoadKickGuard) issues.push('missing-detached-post-load-kick-guard');
  if (!signals.candidateWaitRestore) issues.push('missing-candidate-wait-restore-guard');
  if (!signals.orphanShellDump) issues.push('missing-orphan-shell-diagnostics');
  if (!signals.restoreSharesKickClock) issues.push('restore-load-does-not-share-load-kick-clock');
  if (!signals.restoreSeedsPendingSince) issues.push('restore-does-not-seed-load-pending-since');
  if (!signals.recentRestoreLoadHold) issues.push('missing-recent-restore-load-hold');
  if (!signals.softPauseUsesSoftRelease) issues.push('coordinator-soft-pause-does-not-soft-release-video');
  if (!signals.foreignPauseUsesSoftRelease) issues.push('foreign-pause-does-not-soft-release-video');
  if (!signals.postPrewarmMetadataResident) issues.push('post-video-prewarm-still-uses-hot-auto-preload');
  if (!signals.postPrewarmDetachedHold) issues.push('post-video-prewarm-still-restores-detached-src-too-early');
  if (!signals.autoplayRetryWatchdog) issues.push('missing-autoplay-retry-watchdog');
  if (!signals.pendingActivateUsesPlayMedia) issues.push('pending-activate-path-does-not-promote-candidate-into-play-pipeline');
  if (!signals.leafCoordinatorPostSrcDetached) issues.push('video-leaf-still-forwards-src-to-coordinator-owned-post-video');
  if (!signals.leafPostPreloadNone) issues.push('video-leaf-post-preload-is-not-none');
  if (!signals.leafCoordinatorLoadStateGuard) issues.push('video-leaf-loadstate-effect-still-writes-coordinator-owned-flags');
  if (!signals.leafCoordinatorLoadedHandlerGuard) issues.push('video-leaf-loaded-handler-still-writes-coordinator-owned-flags');
  if (!signals.leafPosterAttr) issues.push('video-leaf-missing-poster-attr');
  if (!signals.leafPosterDatasetSync) issues.push('video-leaf-missing-poster-dataset-sync');
  if (!signals.postMediaPosterForward) issues.push('post-media-stack-missing-poster-forward');
  if (signals.leafPostMountLifecycleReset) issues.push('leaf-post-video-reset-still-mutates-owner-flags');
  if (signals.leafPostMountSrcDetach) issues.push('leaf-post-video-reset-still-detaches-src');

  const report = {
    generatedAt: new Date().toISOString(),
    status: issues.length ? 'warn' : 'pass',
    files: FILES,
    signals,
    ownershipWrites,
    issues,
    notes: [
      'Coordinator remains the decision layer; runtime owns side-effect helpers such as soft release and restore.',
      'VideoMedia must not detach src or zero owner-flags for new post-video mounts.',
      'Restore-originated load kicks must share the same recent-kick guard as coordinator cold-load retries.',
      'PostMediaStack and VideoMedia must keep poster wired through to the DOM video element, otherwise poster-preserve logic is a no-op.',
      'Coordinator-owned post-video should render without a live src attribute until the coordinator explicitly restores it.',
      'Soft pause and foreign pause must demote video state via soft release, otherwise hot resident flags linger and keep churn alive.',
      'Low-priority post-video prewarm should stay metadata-resident; aggressive load kicks are only allowed near actual activation.',
      'Late-loaded active media should keep retrying autoplay through the coordinator until a real play succeeds or the owner loses focus.',
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
