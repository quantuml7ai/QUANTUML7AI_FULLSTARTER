#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  'app/forum/features/feed/components/PostMediaStack.jsx',
  'app/forum/features/media/components/VideoMedia.jsx',
];

const SIGNALS = [
  { key: 'dataSrc', rx: /data-src/g },
  { key: 'setSrc', rx: /setAttribute\('src'|setAttribute\("src"|src=/g },
  { key: 'removeSrc', rx: /removeAttribute\('src'|removeAttribute\("src"/g },
  { key: 'restore', rx: /restore|pageshow|visibility|prepareExternalMedia|detachYouTubePlayer/g },
  { key: 'postMessagePause', rx: /postMessage/g },
  { key: 'ytPlayers', rx: /__forumYtPlayers|YT\.Player/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));
  writeJsonReport(root, 'iframe-restore.report.json', {
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log('[audit:iframe-restore] wrote iframe-restore report');
}

main();
