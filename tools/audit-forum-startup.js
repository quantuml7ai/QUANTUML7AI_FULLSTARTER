#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('fs');
const path = require('path');

const targets = [
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
  'app/forum/layout.js',
  'app/forum/page.js',
  'app/forum/ForumRoot.jsx',
];

const checks = [
  { key: 'dynamicImport', rx: /\bdynamic\s*\(/g },
  { key: 'ssrFalseDynamic', rx: /ssr\s*:\s*false/g },
  { key: 'providerGateNull', rx: /\breturn\s+null\b/g },
  { key: 'web3Modal', rx: /\bcreateWeb3Modal\b|\buseWeb3Modal\b/g },
  { key: 'wagmi', rx: /\bWagmiProvider\b|\bdefaultWagmiConfig\b|\buseAccount\b/g },
  { key: 'analytics', rx: /\bAnalytics\b|\bSpeedInsights\b/g },
  { key: 'beforeInteractiveScript', rx: /strategy\s*=\s*["']beforeInteractive["']/g },
  { key: 'topBarMount', rx: /<TopBar\b/g },
  { key: 'forumBootSplash', rx: /<ForumBootSplash\b/g },
];

function scanFile(file) {
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const counts = {};
  checks.forEach((check) => {
    counts[check.key] = (text.match(check.rx) || []).length;
  });
  const startupMarks = lines
    .map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter((row) => row.text.includes('markForumStartup'))
    .slice(0, 20);
  const riskFlags = [];
  if (counts.providerGateNull > 0) riskFlags.push('provider returns null during startup path');
  if (counts.web3Modal > 0 && /app[\\/]+providers\.jsx$/i.test(file)) riskFlags.push('wallet runtime participates in root providers');
  if (counts.analytics > 0 && /app[\\/]+layout\.js$/i.test(file)) riskFlags.push('global analytics mounts in root layout');
  if (counts.forumBootSplash > 0 && /app[\\/]+forum[\\/]+page\.js$/i.test(file)) riskFlags.push('forum route mounts splash before feed');
  return {
    file,
    counts,
    startupMarks,
    riskFlags,
  };
}

function main() {
  const root = process.cwd();
  const resolved = targets
    .map((target) => path.join(root, target))
    .filter((file) => fs.existsSync(file));
  const report = resolved.map(scanFile).sort((a, b) => {
    const score = (row) =>
      row.counts.dynamicImport * 2 +
      row.counts.ssrFalseDynamic * 2 +
      row.counts.providerGateNull * 6 +
      row.counts.web3Modal * 4 +
      row.counts.wagmi * 3 +
      row.counts.analytics * 2 +
      row.counts.beforeInteractiveScript * 2 +
      row.counts.forumBootSplash * 2 +
      row.riskFlags.length * 3;
    return score(b) - score(a);
  });

  console.log('\n=== Forum Startup Audit ===\n');
  report.forEach((row) => {
    console.log(`- ${row.file}`);
    console.log(
      `  dynamic=${row.counts.dynamicImport} ssrFalse=${row.counts.ssrFalseDynamic} providerNull=${row.counts.providerGateNull} web3=${row.counts.web3Modal} wagmi=${row.counts.wagmi} analytics=${row.counts.analytics} splash=${row.counts.forumBootSplash}`
    );
    row.riskFlags.forEach((flag) => console.log(`  ! ${flag}`));
    row.startupMarks.slice(0, 3).forEach((mark) => console.log(`  mark@${mark.line}: ${mark.text}`));
    console.log('');
  });

  const outPath = path.join(root, 'forum-startup.audit.report.json');
  fs.writeFileSync(outPath, JSON.stringify({
    root,
    generatedAt: new Date().toISOString(),
    report,
  }, null, 2), 'utf8');
  console.log(`Saved: ${outPath}\n`);
}

main();
