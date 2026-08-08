#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const targets = [
  'app/forum/features/feed/components/PostMediaStack.jsx',
  'app/forum/features/media/components/VideoMedia.jsx',
  'app/forum/features/media/components/QCastPlayer.jsx',
  'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'app/forum/features/media/hooks/useVideoFeedWindowing.js',
  'app/forum/ForumAds.js',
];

const signals = [
  { key: 'videoTag', rx: /<video\b/gi },
  { key: 'iframeTag', rx: /<iframe\b/gi },
  { key: 'audioTag', rx: /<audio\b/gi },
  { key: 'playCall', rx: /\.play\s*\(/g },
  { key: 'pauseCall', rx: /\.pause\s*\(/g },
  { key: 'loadCall', rx: /\.load\s*\(/g },
  { key: 'preloadAttr', rx: /\bpreload\s*=/gi },
  { key: 'prewarmFlag', rx: /__prewarm/g },
  { key: 'residentFlag', rx: /__resident/g },
  { key: 'loadPendingFlag', rx: /__loadPending/g },
  { key: 'userPauseFlag', rx: /__userPaused/g },
  { key: 'systemPauseFlag', rx: /__systemPause/g },
  { key: 'manualLeaseFlag', rx: /__manualLeaseUntil/g },
  { key: 'rectReads', rx: /\bgetBoundingClientRect\s*\(/g },
  { key: 'intersectionObserver', rx: /\bIntersectionObserver\b/g },
];

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const counts = {};
  signals.forEach((signal) => {
    counts[signal.key] = (text.match(signal.rx) || []).length;
  });
  const responsibilities = [];
  if (counts.playCall || counts.pauseCall) responsibilities.push('playback-control');
  if (counts.loadCall || counts.preloadAttr || counts.loadPendingFlag) responsibilities.push('load-policy');
  if (counts.prewarmFlag || counts.residentFlag) responsibilities.push('budget-state');
  if (counts.userPauseFlag || counts.systemPauseFlag || counts.manualLeaseFlag) responsibilities.push('pause-semantics');
  if (counts.rectReads || counts.intersectionObserver) responsibilities.push('viewport-orchestration');
  const score =
    counts.videoTag * 4 +
    counts.playCall * 3 +
    counts.pauseCall * 3 +
    counts.loadCall * 4 +
    counts.preloadAttr * 2 +
    counts.prewarmFlag +
    counts.residentFlag +
    counts.rectReads * 2 +
    responsibilities.length * 4;
  return { file, counts, responsibilities, score };
}

function main() {
  const root = process.cwd();
  const report = targets
    .map((target) => path.join(root, target))
    .filter((file) => fs.existsSync(file))
    .map(scanFile)
    .sort((a, b) => b.score - a.score || String(a.file).localeCompare(String(b.file)));

  console.log('\n=== Media Budget Audit ===\n');
  report.forEach((row) => {
    console.log(`- ${row.file}`);
    console.log(
      `  score=${row.score} video=${row.counts.videoTag} iframe=${row.counts.iframeTag} audio=${row.counts.audioTag} play=${row.counts.playCall} pause=${row.counts.pauseCall} load=${row.counts.loadCall} preload=${row.counts.preloadAttr}`
    );
    if (row.responsibilities.length) {
      console.log(`  responsibilities=${row.responsibilities.join(', ')}`);
    }
    console.log('');
  });

  const outPath = path.join(root, 'media-budget.audit.report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    root,
    generatedAt: new Date().toISOString(),
    report,
  }, null, 2), 'utf8');
  console.log(`Saved: ${outPath}\n`);
}

main();
