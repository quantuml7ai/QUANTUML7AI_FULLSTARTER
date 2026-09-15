#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/layout.js',
  'app/providers.jsx',
  'components/AuthNavClient.jsx',
  'components/ForumBootSplash.jsx',
  'app/exchange/page.js',
  'app/ads/home.js',
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'app/forum/features/media/utils/mediaLifecycleRuntime.js',
  'lib/databroker.js',
  'lib/adsCore.js',
];

const SIGNALS = [
  { key: 'consoleError', rx: /\bconsole\.error\b/g },
  { key: 'consoleWarn', rx: /\bconsole\.warn\b/g },
  { key: 'magic401', rx: /401|auth\/session\/refresh|Magic/g },
  { key: 'forcedReflow', rx: /forced reflow|getBoundingClientRect|offsetHeight|offsetWidth/g },
  { key: 'thirdPartyNoise', rx: /TradingView|Binance|contentScript|CSP|CORB/g },
  { key: 'mediaChurn', rx: /206|cancel|sameSrc|restoreLoad/g },
];

function classify(row) {
  if ((row.counts.mediaChurn || 0) > 0 || (row.counts.forcedReflow || 0) > 0) return 'A';
  if ((row.counts.magic401 || 0) > 0) return 'B';
  if ((row.counts.thirdPartyNoise || 0) > 0) return 'C';
  return 'B';
}

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    noiseClass: classify(row),
  }));
  const summary = report.reduce((acc, row) => {
    acc[row.noiseClass] = (acc[row.noiseClass] || 0) + 1;
    return acc;
  }, {});
  writeJsonReport(root, 'console-noise-classification.report.json', {
    generatedAt: new Date().toISOString(),
    summary,
    report,
  });
  console.log('[audit:console-noise] wrote console-noise-classification report');
}

main();
