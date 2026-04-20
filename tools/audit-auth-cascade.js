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
  'components/TopBar.js',
  'app/forum/features/ui/hooks/useForumSessionShell.js',
  'app/forum/features/profile/hooks/useForumProfileSync.js',
  'components/InviteFriendProvider.jsx',
  'components/QCoinDropFX.jsx',
  'app/exchange/BattleCoin.jsx',
  'app/subscribe/subscribe.client.jsx',
  'app/forum/shared/utils/openAuth.js',
];

const SIGNALS = [
  { key: 'authOk', rx: /auth:ok/g },
  { key: 'authSuccess', rx: /auth:success/g },
  { key: 'authLogout', rx: /auth:logout/g },
  { key: 'openAuth', rx: /open-auth/g },
  { key: 'magic401', rx: /Magic|401|auth\/session\/refresh/g },
  { key: 'wallet', rx: /\bcreateWeb3Modal\b|\bWagmiProvider\b|\buseAccount\b/g },
  { key: 'postAuthEffects', rx: /\buseEffect\b|\bfetch\s*\(/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    fanoutScore:
      (row.counts.authOk || 0) +
      (row.counts.authSuccess || 0) +
      (row.counts.authLogout || 0) +
      (row.counts.openAuth || 0) * 2 +
      (row.counts.postAuthEffects || 0),
  }));
  writeJsonReport(root, 'auth-cascade.report.json', {
    generatedAt: new Date().toISOString(),
    repeatedMagic401Baseline: report.reduce((sum, row) => sum + Number(row.counts.magic401 || 0), 0),
    report,
  });
  console.log('[audit:auth-cascade] wrote auth-cascade report');
}

main();
