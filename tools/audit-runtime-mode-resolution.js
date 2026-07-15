#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const { writeJsonReport } = require('./runtime-governance');

function detectDeploymentEnvironment(env = {}) {
  const vercelEnv = String(env.VERCEL_ENV || '').trim().toLowerCase();
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  const nodeEnv = String(env.NODE_ENV || '').trim().toLowerCase();
  if (nodeEnv === 'production') return 'production';
  if (nodeEnv === 'test') return 'qa';
  return 'development';
}

function resolveSummary(env = {}, overrides = {}) {
  const deploymentEnvironment = detectDeploymentEnvironment(env);
  const runtimeMode = overrides.forensicRequested && overrides.forensicAuthorized && env.APP_FORENSIC_MODE === 'bounded'
    ? 'emergency-forensics'
    : env.APP_RUNTIME_MODE
      || (deploymentEnvironment === 'production'
        ? 'production-adaptive'
        : deploymentEnvironment === 'preview'
          ? 'stage-pre-release'
          : deploymentEnvironment === 'qa'
            ? 'qa-calibration'
            : 'development-research');
  const diagnosticsMode = runtimeMode === 'production-adaptive'
    ? (env.APP_DIAGNOSTICS_MODE === 'lite' ? 'lite' : 'off')
    : runtimeMode === 'emergency-forensics'
      ? 'lite'
      : env.APP_DIAGNOSTICS_MODE || 'deep';
  const telemetryLevel = runtimeMode === 'production-adaptive'
    ? (env.APP_TELEMETRY_LEVEL === 'T1' ? 'T1' : 'T0')
    : runtimeMode === 'emergency-forensics'
      ? 'T1'
      : env.APP_TELEMETRY_LEVEL || (runtimeMode === 'stage-pre-release' ? 'T2' : 'T3');
  const adaptiveCoreMode = runtimeMode === 'production-adaptive' && env.APP_ADAPTIVE_CORE_MODE === 'off'
    ? 'enforced'
    : env.APP_ADAPTIVE_CORE_MODE || (runtimeMode === 'production-adaptive' ? 'enforced' : 'shadow');
  const resolutionPath = [];
  if (runtimeMode === 'emergency-forensics') resolutionPath.push('bounded-forensic-override');
  else if (runtimeMode === 'stage-pre-release') resolutionPath.push('explicit-stage-override');
  else if (runtimeMode === 'qa-calibration') resolutionPath.push('explicit-qa-override');
  else if (deploymentEnvironment === 'production') resolutionPath.push('production-deployment-detection');
  else resolutionPath.push('development-fallback');

  return {
    runtimeMode,
    diagnosticsMode,
    telemetryLevel,
    telemetryLabel: {
      T0: 'minimal-prod-counters',
      T1: 'smart-prod-diagnostics',
      T2: 'stage-deep-runtime',
      T3: 'dev-research',
    }[telemetryLevel],
    adaptiveCoreMode,
    prodLiteSafe: runtimeMode === 'production-adaptive' && diagnosticsMode !== 'deep',
    forensicModeActive: runtimeMode === 'emergency-forensics',
    safeFallbackActivated: false,
    deploymentEnvironment,
    resolutionPath,
  };
}

function main() {
  const root = process.cwd();

  const cases = [
    {
      id: 'development-research',
      summary: resolveSummary({
        NODE_ENV: 'development',
        APP_RUNTIME_MODE: 'development-research',
        APP_DIAGNOSTICS_MODE: 'deep',
        APP_TELEMETRY_LEVEL: 'T3',
        APP_ADAPTIVE_CORE_MODE: 'shadow',
      }),
    },
    {
      id: 'qa-calibration',
      summary: resolveSummary({
        NODE_ENV: 'test',
        APP_RUNTIME_MODE: 'qa-calibration',
        APP_DIAGNOSTICS_MODE: 'deep',
        APP_TELEMETRY_LEVEL: 'T2',
      }),
    },
    {
      id: 'stage-pre-release',
      summary: resolveSummary({
        NODE_ENV: 'production',
        VERCEL_ENV: 'preview',
        APP_RUNTIME_MODE: 'stage-pre-release',
        APP_DIAGNOSTICS_MODE: 'lite',
        APP_TELEMETRY_LEVEL: 'T2',
      }),
    },
    {
      id: 'production-adaptive',
      summary: resolveSummary({
        NODE_ENV: 'production',
        VERCEL_ENV: 'production',
        APP_RUNTIME_MODE: 'production-adaptive',
        APP_DIAGNOSTICS_MODE: 'deep',
        APP_TELEMETRY_LEVEL: 'T3',
        APP_ADAPTIVE_CORE_MODE: 'off',
      }),
    },
    {
      id: 'emergency-forensics',
      summary: resolveSummary(
        {
          NODE_ENV: 'production',
          VERCEL_ENV: 'production',
          APP_RUNTIME_MODE: 'production-adaptive',
          APP_FORENSIC_MODE: 'bounded',
          APP_DIAGNOSTICS_MODE: 'lite',
        },
        {
          forensicRequested: true,
          forensicAuthorized: true,
        },
      ),
    },
  ];

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      cases: cases.length,
      safeFallbackCases: cases.filter((entry) => entry.summary.safeFallbackActivated).length,
      forensicCases: cases.filter((entry) => entry.summary.forensicModeActive).length,
      prodLiteCases: cases.filter((entry) => entry.summary.prodLiteSafe).length,
    },
    cases,
  };

  writeJsonReport(root, 'runtime-mode-resolution.report.json', payload);
  console.log('[audit:runtime-mode-resolution] wrote runtime-mode-resolution.report.json');
}

main();
