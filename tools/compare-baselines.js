#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { writeJsonReport } = require('./runtime-governance');

function readArg(args, flag, fallback = '') {
  const prefix = `${flag}=`;
  const direct = args.find((item) => item.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = args.indexOf(flag);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function pickComparablePassport(payload = {}) {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.route && payload.routeBudgetProfile) return payload;
  if (Array.isArray(payload.routeSnapshots) && payload.routeSnapshots.length) {
    return payload.routeSnapshots.find((snapshot) => String(snapshot.route || '') === '/forum')
      || payload.routeSnapshots[0]
      || {};
  }
  return {};
}

function numberOrZero(value) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function readNestedValue(target, pathParts = []) {
  return pathParts.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), target);
}

const REGRESSION_POLARITY = Object.freeze({
  countActiveIframe: 'lower-better',
  countActiveNativeVideo: 'lower-better',
  countActiveAdMedia: 'lower-better',
  observersCount: 'lower-better',
  timersCount: 'lower-better',
  sameSrcPressureScore: 'lower-better',
  currentBudgetPressureScore: 'lower-better',
  budgetPressureScore: 'lower-better',
  teardownCleanlinessScore: 'higher-better',
  startupHeavinessScore: 'lower-better',
  layoutTurbulenceScore: 'lower-better',
  authFanoutScore: 'lower-better',
  currentEffectDegradationTier: 'lower-better',
  adaptiveTier: 'lower-better',
  priorityArbitrationActionsCount: 'lower-better',
  decorativeSuppressionsCount: 'contextual',
  offscreenAggressiveDemotionsCount: 'contextual',
  lowMemoryFallbackActivations: 'contextual',
  mainThreadSurvivalModeActivations: 'lower-better',
  backgroundThrottleActivations: 'contextual',
  adaptiveRouteDowngradeCount: 'lower-better',
  mainThreadPressureScore: 'lower-better',
  memoryPressureScore: 'lower-better',
  degradeActionsTakenCount: 'lower-better',
  blockedPromotionsCount: 'lower-better',
  partial206Entries: 'lower-better',
  cancelledMediaEntries: 'lower-better',
  repeatedForumMp4Count: 'lower-better',
  maxRepeatOnSingleForumMp4: 'lower-better',
  repeatRequestCount: 'lower-better',
  repeatedWindowCount: 'lower-better',
  highRepeatWindowCount: 'lower-better',
  cancelledAfterPartialCount: 'lower-better',
  heapNodeCount: 'lower-better',
  heapDetachedNodes: 'lower-better',
  heapDetachedSelfSizeMB: 'lower-better',
  heapMediaDomHits: 'lower-better',
  heapObserverHits: 'lower-better',
  heapSdkRuntimeHits: 'lower-better',
});

function classifyMetricChange(key, delta) {
  const polarity = REGRESSION_POLARITY[key] || 'contextual';
  if (delta === 0) return 'unchanged';
  if (polarity === 'higher-better') return delta > 0 ? 'improved' : 'regressed';
  if (polarity === 'lower-better') return delta < 0 ? 'improved' : 'regressed';
  return 'ambiguous';
}

function createRuntimeDiffReport(before = {}, after = {}) {
  const numericKeys = Object.keys(REGRESSION_POLARITY);
  const diff = numericKeys.reduce((acc, key) => {
    acc[key] = {
      before: numberOrZero(before[key]),
      after: numberOrZero(after[key]),
      delta: numberOrZero(after[key]) - numberOrZero(before[key]),
    };
    return acc;
  }, {
    route: {
      before: String(before.route || ''),
      after: String(after.route || ''),
    },
    profile: {
      before: String(before.routeBudgetProfile || ''),
      after: String(after.routeBudgetProfile || ''),
    },
    adaptiveProfile: {
      before: String(before.activeAdaptiveProfile || ''),
      after: String(after.activeAdaptiveProfile || ''),
    },
  });

  const classification = {
    improved: 0,
    regressed: 0,
    unchanged: 0,
    ambiguous: 0,
  };
  for (const key of numericKeys) {
    classification[classifyMetricChange(key, numberOrZero(diff[key]?.delta))] += 1;
  }
  let overall = 'unchanged';
  if (classification.regressed > 0 && classification.improved === 0) overall = 'regressed';
  else if (classification.improved > 0 && classification.regressed === 0) overall = 'improved';
  else if (classification.regressed > 0 && classification.improved > 0) overall = classification.regressed > classification.improved ? 'needs-forensic' : 'ambiguous';
  else if (classification.ambiguous > 0) overall = 'ambiguous';
  diff.classification = { overall, stats: classification };
  return diff;
}

function createLabArtifactDiff(before = {}, after = {}, metricDefinitions = []) {
  const beforeStatus = String(before?.status || (before && Object.keys(before).length ? 'ok' : 'missing'));
  const afterStatus = String(after?.status || (after && Object.keys(after).length ? 'ok' : 'missing'));
  const metrics = metricDefinitions.reduce((acc, definition) => {
    const beforeValue = numberOrZero(readNestedValue(before, definition.path));
    const afterValue = numberOrZero(readNestedValue(after, definition.path));
    const delta = afterValue - beforeValue;
    acc[definition.key] = {
      before: beforeValue,
      after: afterValue,
      delta,
      classification: classifyMetricChange(definition.key, delta),
    };
    return acc;
  }, {});

  const classification = {
    improved: 0,
    regressed: 0,
    unchanged: 0,
    ambiguous: 0,
  };
  Object.values(metrics).forEach((entry) => {
    classification[String(entry.classification || 'ambiguous')] += 1;
  });

  let overall = 'unchanged';
  if ((beforeStatus === 'skipped' || beforeStatus === 'missing') && afterStatus === 'ok') overall = 'calibrated';
  else if (beforeStatus !== afterStatus) overall = 'changed';
  else if (classification.regressed > 0 && classification.improved === 0) overall = 'regressed';
  else if (classification.improved > 0 && classification.regressed === 0) overall = 'improved';
  else if (classification.regressed > 0 && classification.improved > 0) overall = 'ambiguous';
  else if (classification.ambiguous > 0) overall = 'ambiguous';

  return {
    beforeStatus,
    afterStatus,
    metrics,
    classification: {
      overall,
      stats: classification,
    },
  };
}

function main() {
  const root = process.cwd();
  const args = process.argv.slice(2);
  const stage = readArg(args, '--stage', 'stage0');
  const beforeFile = path.join(root, `baseline-before.${stage}.json`);
  const afterFile = path.join(root, `baseline-after.${stage}.json`);

  const before = readJson(beforeFile);
  const after = readJson(afterFile);
  const runtimeDiff = createRuntimeDiffReport(
    pickComparablePassport(before.runtimePassport || {}),
    pickComparablePassport(after.runtimePassport || {}),
  );
  const labDiff = {
    forumMediaHar: createLabArtifactDiff(before.forumMediaHar || {}, after.forumMediaHar || {}, [
      { key: 'partial206Entries', path: ['partial206Entries'] },
      { key: 'cancelledMediaEntries', path: ['cancelledMediaEntries'] },
      { key: 'repeatedForumMp4Count', path: ['repeatedForumMp4Count'] },
      { key: 'maxRepeatOnSingleForumMp4', path: ['maxRepeatOnSingleForumMp4'] },
      { key: 'repeatRequestCount', path: ['metrics', 'repeatRequestCount'] },
      { key: 'repeatedWindowCount', path: ['metrics', 'repeatedWindowCount'] },
      { key: 'highRepeatWindowCount', path: ['metrics', 'highRepeatWindowCount'] },
      { key: 'cancelledAfterPartialCount', path: ['metrics', 'cancelledAfterPartialCount'] },
    ]),
    mediaHeapVerify: createLabArtifactDiff(before.mediaHeapVerify || {}, after.mediaHeapVerify || {}, [
      { key: 'heapNodeCount', path: ['snapshot', 'nodeCount'] },
      { key: 'heapDetachedNodes', path: ['heapDiscipline', 'detachedNodes'] },
      { key: 'heapDetachedSelfSizeMB', path: ['heapDiscipline', 'detachedSelfSizeMB'] },
      { key: 'heapMediaDomHits', path: ['runtimeGroups', 'mediaDom', 'total'] },
      { key: 'heapObserverHits', path: ['runtimeGroups', 'observers', 'total'] },
      { key: 'heapSdkRuntimeHits', path: ['runtimeGroups', 'sdkRuntimes', 'total'] },
    ]),
  };
  const payload = {
    stage,
    generatedAt: new Date().toISOString(),
    contourDiff: {
      beforeCoverage: before.coverage || {},
      afterCoverage: after.coverage || {},
    },
    runtimeDiff,
    labDiff,
  };
  const outPath = writeJsonReport(root, `diff.${stage}.json`, payload);
  console.log(`[compare-baselines] wrote ${path.relative(root, outPath)}`);
}

main();
