#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const { loadGovernance, readText, scanFiles, writeJsonReport } = require('./runtime-governance');

const FILES = [
  '.env.local.example',
  'README.md',
  'docs/verification-pipeline.md',
  'docs/stage0-engineering-report.md',
  'src/shared/runtime/mode/runtimeModeResolver.js',
  'src/shared/runtime/mode/runtimeModeServer.js',
  'src/shared/runtime/mode/runtimeModeClient.js',
  'src/shared/runtime/mode/runtimeModeGuards.js',
];

const SIGNALS = [
  { key: 'serverEnv', rx: /APP_RUNTIME_MODE|APP_DIAGNOSTICS_MODE|APP_FORENSIC_MODE|APP_TELEMETRY_LEVEL|APP_ADAPTIVE_CORE_MODE/g },
  { key: 'publicEnv', rx: /NEXT_PUBLIC_RUNTIME_MODE|NEXT_PUBLIC_DIAGNOSTICS_MODE|NEXT_PUBLIC_ADAPTIVE_CORE|NEXT_PUBLIC_FORENSIC_ALLOWED|NEXT_PUBLIC_ROUTE_BUDGET_DEBUG|NEXT_PUBLIC_CONSOLE_NOISE_CLASSIFIER/g },
  { key: 'resolutionPath', rx: /bounded-forensic-override|explicit-stage-override|explicit-qa-override|production-deployment-detection|development-fallback/g },
  { key: 'safeFallback', rx: /safe-production-fallback|prodLiteSafe|safeFallbackActivated/g },
];

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));

  writeJsonReport(root, 'mode-contract.validation.report.json', {
    generatedAt: new Date().toISOString(),
    modeContract: governance.modeContract,
    summary: {
      runtimeModes: governance.modeContract?.runtimeModes?.length || 0,
      diagnosticsModes: governance.modeContract?.diagnosticsModes?.length || 0,
      forensicModes: governance.modeContract?.forensicModes?.length || 0,
      envKeysDocumented: report.some((row) => row.file === '.env.local.example' && row.counts.serverEnv > 0),
      docsMentionContract: /APP_RUNTIME_MODE/.test(readText(root, 'README.md')) && /APP_RUNTIME_MODE/.test(readText(root, 'docs/stage0-engineering-report.md')),
    },
    report,
  });
  console.log('[audit:mode-contract] wrote mode-contract.validation.report.json');
}

main();
