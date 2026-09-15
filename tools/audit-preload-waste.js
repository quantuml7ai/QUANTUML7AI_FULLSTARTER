#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/layout.js',
  'app/about/page.js',
  'app/ads/home.js',
  'components/ForumBootSplash.jsx',
];

const SIGNALS = [
  { key: 'preload', rx: /\bpreload\b/g },
  { key: 'fontHint', rx: /fonts\.reown\.com|woff2/g },
  { key: 'startupMedia', rx: /<video\b|autoPlay|playsInline/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    preloadWasteScore: (row.counts.preload || 0) + (row.counts.fontHint || 0) * 2,
  }));
  writeJsonReport(root, 'preload-waste.report.json', {
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log('[audit:preload-waste] wrote preload-waste report');
}

main();
