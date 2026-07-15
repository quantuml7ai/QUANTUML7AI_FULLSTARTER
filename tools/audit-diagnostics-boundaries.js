#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  fileExists,
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'src/shared/runtime/modes/runtimeModes.js',
  'src/shared/runtime/modes/runtimeModeGuards.js',
  'src/shared/runtime/mode/runtimeModeResolver.js',
  'src/shared/runtime/mode/runtimeModeServer.js',
  'src/shared/runtime/mode/runtimeModeClient.js',
  'src/shared/runtime/mode/runtimeModeGuards.js',
  'src/shared/runtime/adaptive/productionAdaptiveCore.js',
  'src/shared/runtime/forensics/forensicMode.js',
  'app/forum/features/diagnostics/hooks/useForumDiagnostics.js',
  'app/api/debug/forum-diag/route.js',
];

const SIGNALS = [
  { key: 'modeBoundary', rx: /allowDeepDiagnostics|allowForensicCapture|createModeBoundarySummary|resolveRuntimeMode|resolveRuntimeModeSummary/g },
  { key: 'forensicBoundary', rx: /NEXT_PUBLIC_RUNTIME_FORENSICS|ttl|expiresAt|maxEvents|allowlist/gi },
  { key: 'prodAdaptive', rx: /createProductionAdaptiveCore|resolveAdaptiveContext|planAdaptiveActions/g },
  { key: 'debugSurface', rx: /forum-diag|RuntimePassportPanel|debug/gi },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));

  writeJsonReport(root, 'diagnostics-boundaries.report.json', {
    generatedAt: new Date().toISOString(),
    summary: {
      runtimeModesPresent: fileExists(root, 'src/shared/runtime/modes/runtimeModes.js'),
      modeGuardsPresent: fileExists(root, 'src/shared/runtime/modes/runtimeModeGuards.js'),
      runtimeModeResolverPresent: fileExists(root, 'src/shared/runtime/mode/runtimeModeResolver.js'),
      runtimeModeServerPresent: fileExists(root, 'src/shared/runtime/mode/runtimeModeServer.js'),
      runtimeModeClientPresent: fileExists(root, 'src/shared/runtime/mode/runtimeModeClient.js'),
      forensicModePresent: fileExists(root, 'src/shared/runtime/forensics/forensicMode.js'),
      prodAdaptiveCorePresent: fileExists(root, 'src/shared/runtime/adaptive/productionAdaptiveCore.js'),
    },
    report,
  });
  console.log('[audit:diagnostics-boundaries] wrote diagnostics-boundaries.report.json');
}

main();
