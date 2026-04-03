#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const targets = [
  'app/forum/ForumAds.js',
  'app/forum/features/ui/components/ForumAdSlot.jsx',
  'app/forum/features/ui/hooks/useForumAdsRuntime.js',
  'lib/adsCore.js',
];

const runtimeChecks = [
  { key: 'videoTag', rx: /<video\b/gi },
  { key: 'iframeTag', rx: /<iframe\b/gi },
  { key: 'intersectionObserver', rx: /\bIntersectionObserver\b/g },
  { key: 'mapUsage', rx: /\bnew\s+Map\s*\(/g },
  { key: 'fetchCalls', rx: /\bfetch\s*\(/g },
  { key: 'imageProbe', rx: /\bnew\s+window\.Image\s*\(/g },
  { key: 'ytPlayer', rx: /\bYT\.Player\b|\bonYouTubeIframeAPIReady\b/g },
  { key: 'intervals', rx: /\bsetInterval\s*\(/g },
  { key: 'raf', rx: /\brequestAnimationFrame\s*\(/g },
  { key: 'preloadAttr', rx: /\bpreload\s*=/gi },
];

const businessChecks = [
  { key: 'purchase', rx: /\bpurchase\b/gi },
  { key: 'activation', rx: /\bactivation\b/gi },
  { key: 'placement', rx: /\bplacement\b/gi },
  { key: 'rotation', rx: /\brotation\b/gi },
  { key: 'package', rx: /\bpackage\b/gi },
];

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const runtime = {};
  const business = {};
  runtimeChecks.forEach((check) => {
    runtime[check.key] = (text.match(check.rx) || []).length;
  });
  businessChecks.forEach((check) => {
    business[check.key] = (text.match(check.rx) || []).length;
  });
  return {
    file,
    runtime,
    business,
    runtimeScore: Object.values(runtime).reduce((sum, value) => sum + Number(value || 0), 0),
    businessScore: Object.values(business).reduce((sum, value) => sum + Number(value || 0), 0),
  };
}

function main() {
  const root = process.cwd();
  const report = targets
    .map((target) => path.join(root, target))
    .filter((file) => fs.existsSync(file))
    .map(scanFile)
    .sort((a, b) => b.runtimeScore - a.runtimeScore || String(a.file).localeCompare(String(b.file)));

  console.log('\n=== Ad Runtime Audit ===\n');
  report.forEach((row) => {
    console.log(`- ${row.file}`);
    console.log(
      `  runtimeScore=${row.runtimeScore} businessScore=${row.businessScore} video=${row.runtime.videoTag} iframe=${row.runtime.iframeTag} observer=${row.runtime.intersectionObserver} maps=${row.runtime.mapUsage} fetch=${row.runtime.fetchCalls} yt=${row.runtime.ytPlayer}`
    );
    if (/lib[\\/]adsCore\.js$/i.test(row.file) && row.runtimeScore > 0) {
      console.log('  ! shared business module also contains runtime-style signals');
    }
    console.log('');
  });

  const outPath = path.join(root, 'ad-runtime.audit.report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    root,
    generatedAt: new Date().toISOString(),
    report,
  }, null, 2), 'utf8');
  console.log(`Saved: ${outPath}\n`);
}

main();
