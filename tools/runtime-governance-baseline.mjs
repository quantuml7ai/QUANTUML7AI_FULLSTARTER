import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  captureContourCoverage,
  writeJsonReport,
} = require('./runtime-governance.js');

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const command = args[0] || 'capture';

function readArg(flag, fallback = '') {
  const prefix = `${flag}=`;
  const direct = args.find((item) => item.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = args.indexOf(flag);
  if (index >= 0 && args[index + 1]) return args[index + 1];
  return fallback;
}

function readBaseline(stage, label) {
  const file = path.join(repoRoot, `baseline-${label}.${stage}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readOptionalJson(relPath) {
  const file = path.join(repoRoot, relPath);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function diffLists(before = [], after = []) {
  const beforeSet = new Set(before.map((item) => String(item || '')));
  const afterSet = new Set(after.map((item) => String(item || '')));
  return {
    resolved: before.filter((item) => !afterSet.has(String(item || ''))),
    introduced: after.filter((item) => !beforeSet.has(String(item || ''))),
  };
}

function buildDiff(beforeCoverage, afterCoverage) {
  return {
    governanceConfigPresent: {
      before: !!beforeCoverage.governanceConfigPresent,
      after: !!afterCoverage.governanceConfigPresent,
    },
    modeContract: {
      before: beforeCoverage.modeContract || {},
      after: afterCoverage.modeContract || {},
    },
    routeProfilesDelta: afterCoverage.routeProfiles.count - beforeCoverage.routeProfiles.count,
    routeAssignmentsDelta: afterCoverage.routeAssignments.count - beforeCoverage.routeAssignments.count,
    passportFieldsDelta: afterCoverage.passportFields.count - beforeCoverage.passportFields.count,
    regressionMetricsDelta: afterCoverage.regressionMetrics.count - beforeCoverage.regressionMetrics.count,
    scenarioMatrixDelta: afterCoverage.scenarioMatrix.count - beforeCoverage.scenarioMatrix.count,
    scenarioGroupDelta: afterCoverage.scenarioMatrix.groups - beforeCoverage.scenarioMatrix.groups,
    requiredScripts: {
      beforePresent: beforeCoverage.requiredScripts.present,
      afterPresent: afterCoverage.requiredScripts.present,
      total: afterCoverage.requiredScripts.total,
      missingDiff: diffLists(beforeCoverage.requiredScripts.missing, afterCoverage.requiredScripts.missing),
    },
    requiredTools: {
      beforePresent: beforeCoverage.requiredTools.present,
      afterPresent: afterCoverage.requiredTools.present,
      total: afterCoverage.requiredTools.total,
      missingDiff: diffLists(beforeCoverage.requiredTools.missing, afterCoverage.requiredTools.missing),
    },
    requiredArtifacts: {
      beforePresent: beforeCoverage.requiredArtifacts.present,
      afterPresent: afterCoverage.requiredArtifacts.present,
      total: afterCoverage.requiredArtifacts.total,
      missingDiff: diffLists(beforeCoverage.requiredArtifacts.missing, afterCoverage.requiredArtifacts.missing),
    },
    baselineArtifacts: {
      beforePresent: beforeCoverage.baselineArtifacts.present,
      afterPresent: afterCoverage.baselineArtifacts.present,
      total: afterCoverage.baselineArtifacts.total,
      missingDiff: diffLists(beforeCoverage.baselineArtifacts.missing, afterCoverage.baselineArtifacts.missing),
    },
    requiredContracts: {
      beforePresent: beforeCoverage.requiredContracts.present,
      afterPresent: afterCoverage.requiredContracts.present,
      total: afterCoverage.requiredContracts.total,
      missingDiff: diffLists(beforeCoverage.requiredContracts.missing, afterCoverage.requiredContracts.missing),
    },
    requiredUnits: {
      beforePresent: beforeCoverage.requiredUnits.present,
      afterPresent: afterCoverage.requiredUnits.present,
      total: afterCoverage.requiredUnits.total,
      missingDiff: diffLists(beforeCoverage.requiredUnits.missing, afterCoverage.requiredUnits.missing),
    },
    requiredComponents: {
      beforePresent: beforeCoverage.requiredComponents.present,
      afterPresent: afterCoverage.requiredComponents.present,
      total: afterCoverage.requiredComponents.total,
      missingDiff: diffLists(beforeCoverage.requiredComponents.missing, afterCoverage.requiredComponents.missing),
    },
    requiredIntegrations: {
      beforePresent: beforeCoverage.requiredIntegrations.present,
      afterPresent: afterCoverage.requiredIntegrations.present,
      total: afterCoverage.requiredIntegrations.total,
      missingDiff: diffLists(beforeCoverage.requiredIntegrations.missing, afterCoverage.requiredIntegrations.missing),
    },
    requiredSmoke: {
      beforePresent: beforeCoverage.requiredSmoke.present,
      afterPresent: afterCoverage.requiredSmoke.present,
      total: afterCoverage.requiredSmoke.total,
      missingDiff: diffLists(beforeCoverage.requiredSmoke.missing, afterCoverage.requiredSmoke.missing),
    },
    stageGatesDelta: afterCoverage.stageGates.count - beforeCoverage.stageGates.count,
    pipeline: {
      before: beforeCoverage.pipeline,
      after: afterCoverage.pipeline,
    },
  };
}

function capture(stage, label) {
  const relPath = `baseline-${label}.${stage}.json`;
  const coverage = captureContourCoverage(repoRoot);
  const baselineMissing = Array.isArray(coverage?.baselineArtifacts?.missing)
    ? coverage.baselineArtifacts.missing.filter((item) => item !== relPath)
    : [];
  if (coverage?.baselineArtifacts) {
    coverage.baselineArtifacts = {
      ...coverage.baselineArtifacts,
      present: Math.max(0, Number(coverage.baselineArtifacts.total || 0) - baselineMissing.length),
      missing: baselineMissing,
    };
  }
  const payload = {
    stage,
    label,
    generatedAt: new Date().toISOString(),
    coverage,
    runtimePassport: readOptionalJson('runtime-passport.snapshot.json'),
    runtimePassportsAudit: readOptionalJson('runtime-passports.report.json'),
    forumMediaHar: readOptionalJson('forum-media-har.report.json'),
    mediaHeapVerify: readOptionalJson('media-heap.verify.report.json'),
    heapsnapshotAnalysis: readOptionalJson('heapsnapshot-analysis.report.json'),
  };
  writeJsonReport(repoRoot, relPath, payload);
  console.log(`[baseline] wrote ${relPath}`);
}

function diff(stage) {
  const before = readBaseline(stage, 'before');
  const after = readBaseline(stage, 'after');
  const payload = {
    stage,
    generatedAt: new Date().toISOString(),
    diff: buildDiff(before.coverage, after.coverage),
  };
  const relPath = `diff.${stage}.json`;
  writeJsonReport(repoRoot, relPath, payload);
  console.log(`[baseline] wrote ${relPath}`);
}

if (command === 'diff') {
  diff(readArg('--stage', 'stage0'));
} else {
  capture(readArg('--stage', 'stage0'), readArg('--label', 'after'));
}
