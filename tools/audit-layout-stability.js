#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'components/ForumBootSplash.jsx',
  'app/about/page.js',
  'app/ads/home.js',
  'app/forum/features/feed/components/PostMediaStack.jsx',
  'app/forum/features/media/components/VideoMedia.jsx',
  'app/forum/features/media/hooks/useForumMediaCoordinator.js',
  'components/ScrollTopPulse.js',
];

const SIGNALS = [
  { key: 'aspectRatio', rx: /\baspect-ratio\b|\baspectRatio\b/g },
  { key: 'fixedDimensions', rx: /\bwidth=\{|\bheight=\{|width:\s*['"\d]|height:\s*['"\d]/g },
  { key: 'layoutReads', rx: /\bgetBoundingClientRect\b|\boffsetHeight\b|\boffsetWidth\b|\bscrollHeight\b/g },
  { key: 'raf', rx: /\brequestAnimationFrame\s*\(/g },
  { key: 'video', rx: /<video\b/gi },
  { key: 'image', rx: /<Image\b|<img\b/gi },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    stabilityScore:
      (row.counts.aspectRatio || 0) * 3 +
      (row.counts.fixedDimensions || 0) * 2 -
      (row.counts.layoutReads || 0) * 2 -
      (row.counts.raf || 0),
  }));
  writeJsonReport(root, 'layout-stability.report.json', {
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log('[audit:layout-stability] wrote layout-stability report');
}

main();
