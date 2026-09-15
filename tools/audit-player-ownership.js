#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  loadGovernance,
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  'app/forum/features/media/components/VideoMedia.jsx',
  'app/forum/features/feed/components/PostMediaStack.jsx',
  'app/forum/ForumAds.js',
  'app/forum/features/media/components/QCastPlayer.jsx',
];

const SIGNALS = [
  { key: 'ownerId', rx: /data-owner-id=/g },
  { key: 'embedKind', rx: /data-forum-embed-kind=/g },
  { key: 'lifecycleState', rx: /data-lifecycle-state=/g },
  { key: 'coordinatorOwnsLifecycle', rx: /coordinatorOwnsLifecycle/g },
  { key: 'siteMediaPlay', rx: /site-media-play/g },
  { key: 'legacyWarmSweep', rx: /legacyWarmSweep/g },
  { key: 'legacyIframePrewarm', rx: /legacyIframePrewarm/g },
  { key: 'forumQcastMuted', rx: /forum:qcastMuted/g },
  { key: 'restoreGuard', rx: /restoreLoad|canRestoreLoad|prepareExternalMedia/g },
  { key: 'sameSrcGuard', rx: /sameSrcGroup|__restoreLoadCount|__restoreLoadBlockedUntil/g },
  { key: 'sharedMute', rx: /writeMuted|setMutedPref|MEDIA_MUTED_KEY/g },
];

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const rows = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));

  const issues = [];
  const postStack = rows.find((row) => /PostMediaStack\.jsx$/.test(row.file));
  const videoLeaf = rows.find((row) => /VideoMedia\.jsx$/.test(row.file));
  const coordinator = rows.find((row) => /useForumMediaCoordinator\.js$/.test(row.file));
  const qcast = rows.find((row) => /QCastPlayer\.jsx$/.test(row.file));

  if (!postStack?.counts.ownerId) issues.push('missing-stable-owner-id-metadata');
  if (!postStack?.counts.embedKind) issues.push('missing-embed-kind-metadata');
  if (!postStack?.counts.lifecycleState) issues.push('missing-lifecycle-state-metadata');
  if ((coordinator?.counts.legacyWarmSweep || 0) > 0) issues.push('legacy-warm-sweep-still-present');
  if ((coordinator?.counts.legacyIframePrewarm || 0) > 0) issues.push('legacy-iframe-prewarm-still-present');
  if ((coordinator?.counts.forumQcastMuted || 0) > 0 || (qcast?.counts.forumQcastMuted || 0) > 0) {
    issues.push('qcast-local-mute-world-detected');
  }
  if ((videoLeaf?.counts.coordinatorOwnsLifecycle || 0) === 0) issues.push('leaf-has-no-coordinator-ownership-branch');

  const qcastOwnership = {
    generatedAt: new Date().toISOString(),
    issues: issues.filter((issue) => issue.includes('qcast')),
    sharedMuteSignals: (qcast?.counts.sharedMute || 0) + (coordinator?.counts.sharedMute || 0),
    restoreGuardSignals: qcast?.counts.restoreGuard || 0,
  };

  const playerBudget = {
    generatedAt: new Date().toISOString(),
    issues,
    files: rows,
    relevantProfiles: {
      forumFeedMobile: governance.routeCapabilityProfiles['forum-feed-mobile'],
      forumFeedDesktop: governance.routeCapabilityProfiles['forum-feed-desktop'],
      forumThread: governance.routeCapabilityProfiles['forum-thread'],
    },
  };

  writeJsonReport(root, 'player-budget.report.json', playerBudget);
  writeJsonReport(root, 'qcast-ownership.report.json', qcastOwnership);
  console.log('[audit:player-ownership] wrote player-budget and qcast-ownership reports');
}

main();
