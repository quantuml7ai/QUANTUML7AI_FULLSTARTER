#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'tools/ingest/normalizeHar.js',
];

const SIGNALS = [
  { key: 'sameSrcGroup', rx: /sameSrcGroup/g },
  { key: 'restoreLoadCount', rx: /__restoreLoadCount/g },
  { key: 'restoreLoadBlockedUntil', rx: /__restoreLoadBlockedUntil/g },
  { key: 'restoreLoadWindowStart', rx: /__restoreLoadWindowStart/g },
  { key: 'lastWarmLoadKickTs', rx: /__lastWarmLoadKickTs/g },
  { key: 'loadPending', rx: /__loadPending/g },
  { key: 'currentSrc', rx: /currentSrc/g },
  { key: 'dataSrc', rx: /data-src/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    guardScore:
      (row.counts.sameSrcGroup || 0) +
      (row.counts.restoreLoadCount || 0) +
      (row.counts.restoreLoadBlockedUntil || 0) +
      (row.counts.restoreLoadWindowStart || 0),
  }));
  writeJsonReport(root, 'same-src-thrash.report.json', {
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log('[audit:same-src-thrash] wrote same-src-thrash report');
}

main();
