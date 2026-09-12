#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  fileExists,
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const FILES = [
  'src/shared/runtime/adaptive/deviceProfileResolver.js',
  'src/shared/runtime/adaptive/effectDegradation.js',
  'src/shared/runtime/adaptive/runtimePriority.js',
  'src/shared/runtime/adaptive/productionAdaptiveCore.js',
  'src/shared/runtime/budgets/routeProfiles.js',
];

const SIGNALS = [
  { key: 'deviceProfile', rx: /resolveDeviceProfile|lowMemory|slowNetwork|weakCpu/g },
  { key: 'effectDegradation', rx: /resolveEffectDegradationTier|SURVIVAL_MODE|STATIC_FALLBACK/g },
  { key: 'priorityArbiter', rx: /classifyRuntimePriority|prioritizeRuntimeEntries|getPriorityScore/g },
  { key: 'adaptiveActions', rx: /degrade-effects|suppress-decorative-runtime|aggressive-offscreen-demotion|background-throttle|adaptive-route-downgrade/g },
  { key: 'pressureLadder', rx: /PRESSURE_LADDER|resolvePressureTier|survival-profile-enforced/g },
];

function main() {
  const root = process.cwd();
  const report = scanFiles(root, FILES, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
  }));

  writeJsonReport(root, 'adaptive-core.report.json', {
    generatedAt: new Date().toISOString(),
    summary: {
      hasProductionAdaptiveCore: fileExists(root, 'src/shared/runtime/adaptive/productionAdaptiveCore.js'),
      filesScanned: report.length,
    },
    report,
  });
  console.log('[audit:adaptive-core] wrote adaptive-core.report.json');
}

main();
