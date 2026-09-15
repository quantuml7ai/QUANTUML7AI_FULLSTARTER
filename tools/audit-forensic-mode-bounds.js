#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'src/shared/runtime/forensics/forensicMode.js',
];

const SIGNALS = [
  { key: 'ttl', rx: /DEFAULT_TTL_MS|ttlMs|ttl-expired/g },
  { key: 'maxEvents', rx: /DEFAULT_MAX_EVENTS|maxEvents|createRingBuffer/g },
  { key: 'allowGate', rx: /allow|activate|deactivate/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));

  writeJsonReport(root, 'forensic-bounds.report.json', {
    generatedAt: new Date().toISOString(),
    summary: {
      ttlBounded: (report[0]?.counts?.ttl || 0) > 0,
      payloadBounded: (report[0]?.counts?.maxEvents || 0) > 0,
      activationGuarded: (report[0]?.counts?.allowGate || 0) > 0,
    },
    report,
  });
  console.log('[audit:forensic-mode-bounds] wrote forensic-bounds.report.json');
}

main();
