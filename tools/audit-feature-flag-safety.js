#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'app/layout.js',
  'app/api/debug/forum-diag/route.js',
  'app/forum/features/diagnostics/hooks/useForumDiagnostics.js',
  'src/shared/runtime/modes/runtimeModes.js',
  'src/shared/runtime/modes/runtimeModeGuards.js',
  'src/shared/runtime/mode/runtimeModeResolver.js',
  'src/shared/runtime/mode/runtimeModeServer.js',
  'src/shared/runtime/mode/runtimeModeClient.js',
  'src/shared/runtime/mode/runtimeModeGuards.js',
  'src/shared/runtime/forensics/forensicMode.js',
];

const SIGNALS = [
  { key: 'forumDiagFlags', rx: /NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED|NEXT_PUBLIC_FORUM_DIAG|NEXT_PUBLIC_FORUM_PERF_TRACE/g },
  { key: 'runtimeFlags', rx: /NEXT_PUBLIC_RUNTIME_MODE|APP_RUNTIME_MODE|APP_DIAGNOSTICS_MODE|APP_FORENSIC_MODE|APP_TELEMETRY_LEVEL|APP_ADAPTIVE_CORE_MODE|NEXT_PUBLIC_DIAGNOSTICS_MODE|NEXT_PUBLIC_ADAPTIVE_CORE|NEXT_PUBLIC_FORENSIC_ALLOWED/g },
  { key: 'guardFunctions', rx: /allowDeepDiagnostics|allowForensicCapture|resolveRuntimeMode|resolveRuntimeModeSummary/g },
  { key: 'samplingHints', rx: /sampling|ring buffer|maxEvents|ttl/gi },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));

  writeJsonReport(root, 'feature-flag-safety.report.json', {
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log('[audit:feature-flag-safety] wrote feature-flag-safety.report.json');
}

main();
