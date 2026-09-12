#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  countMatches,
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/layout.js',
  'app/providers.jsx',
  'components/TopBar.js',
  'components/AuthNavClient.jsx',
  'components/BgAudio.js',
  'components/InviteFriendProvider.jsx',
  'components/QCoinDropFX.jsx',
  'components/ScrollTopPulse.js',
  'components/NotRobot.jsx',
  'components/ForumBootSplash.jsx',
];

const SIGNALS = [
  { key: 'dynamicImport', rx: /\bdynamic\s*\(/g },
  { key: 'analytics', rx: /\bAnalytics\b|\bSpeedInsights\b/g },
  { key: 'wallet', rx: /\bcreateWeb3Modal\b|\buseWeb3Modal\b|\bWagmiProvider\b|\bdefaultWagmiConfig\b/g },
  { key: 'authUi', rx: /\bauth:ok\b|\bauth:success\b|\bopen-auth\b|\bMagic\b/g },
  { key: 'startupMedia', rx: /\bForumBootSplash\b|\bautoPlay\b|\bplaysInline\b/g },
  { key: 'timers', rx: /\bsetInterval\s*\(|\bsetTimeout\s*\(/g },
  { key: 'listeners', rx: /\baddEventListener\s*\(/g },
];

function buildRiskFlags(row) {
  const flags = [];
  if (row.counts.wallet > 0 && /app\/providers\.jsx$/.test(row.file)) flags.push('wallet-runtime-in-root');
  if (row.counts.analytics > 0 && /app\/layout\.js$/.test(row.file)) flags.push('analytics-mounted-in-root');
  if (row.counts.startupMedia > 0 && /ForumBootSplash/.test(row.text)) flags.push('startup-media-present');
  if (row.counts.timers > 0 && row.counts.listeners > 0) flags.push('long-lived-runtime-signals');
  return flags;
}

function main() {
  const root = process.cwd();
  const rows = scanFiles(root, FILES, SIGNALS).map((row) => {
    const riskFlags = buildRiskFlags(row);
    return {
      file: row.file,
      counts: row.counts,
      riskFlags,
      score:
        row.counts.wallet * 5 +
        row.counts.analytics * 3 +
        row.counts.authUi * 2 +
        row.counts.startupMedia * 2 +
        row.counts.timers * 2 +
        row.counts.listeners +
        riskFlags.length * 4,
    };
  }).sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));

  const summary = rows.reduce((acc, row) => {
    Object.keys(row.counts).forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row.counts[key] || 0);
    });
    return acc;
  }, {});

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      heavyProviders: countMatches(JSON.stringify(summary), /\d/g),
      signalTotals: summary,
      filesScanned: rows.length,
    },
    report: rows,
  };

  const outPath = writeJsonReport(root, 'provider-baseline.report.json', payload);
  console.log(`[audit:provider-baseline] wrote ${outPath}`);
}

main();
