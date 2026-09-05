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
  'app/forum/features/diagnostics/hooks/useForumDiagnostics.js',
  'src/shared/runtime/modes/runtimeModes.js',
  'src/shared/runtime/modes/runtimeModeGuards.js',
  'src/shared/runtime/mode/runtimeModeResolver.js',
  'src/shared/runtime/mode/runtimeModeGuards.js',
  'src/shared/runtime/adaptive/productionAdaptiveCore.js',
];

const SIGNALS = [
  { key: 'verboseConsole', rx: /\bconsole\.(log|warn|error)\b/g },
  { key: 'deepTrace', rx: /__forumVideoTrace|dumpForumVideoTrace|traceCandidate|timeline|owner graph/gi },
  { key: 'deepPanels', rx: /RuntimePassportPanel|Budget Pressure Panel|Media Ownership Panel/gi },
  { key: 'modeGuards', rx: /allowDeepDiagnostics|allowForensicCapture|resolveRuntimeMode|resolveRuntimeModeSummary/g },
  { key: 'adaptive', rx: /createProductionAdaptiveCore|degrade-effects|adaptive-route-downgrade|background-throttle/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    prodLeakRisk:
      Number(row.counts.verboseConsole || 0) +
      Number(row.counts.deepTrace || 0) +
      Number(row.counts.deepPanels || 0),
    guardedAdaptiveSignals: Number(row.counts.modeGuards || 0) + Number(row.counts.adaptive || 0),
  }));

  writeJsonReport(root, 'prod-lite-discipline.report.json', {
    generatedAt: new Date().toISOString(),
    summary: {
      filesScanned: report.length,
      deepLeakSignals: report.reduce((sum, row) => sum + Number(row.prodLeakRisk || 0), 0),
      adaptiveSignals: report.reduce((sum, row) => sum + Number(row.guardedAdaptiveSignals || 0), 0),
    },
    report,
  });
  console.log('[audit:prod-lite-discipline] wrote prod-lite-discipline.report.json');
}

main();
