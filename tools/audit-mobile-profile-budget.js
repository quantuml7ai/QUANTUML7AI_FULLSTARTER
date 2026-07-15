#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const { loadGovernance, writeJsonReport } = require('./runtime-governance');

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const mobileScenarios = governance.scenarioMatrix.filter((scenario) => {
    return Array.isArray(scenario.deviceMatrix) && scenario.deviceMatrix.some((device) => {
      return ['iphone-safari', 'iphone-chrome', 'android-chrome', 'telegram-webview'].includes(device);
    });
  });

  const mobileProfiles = Object.entries(governance.routeCapabilityProfiles).filter(([, profile]) => {
    return (
      String(profile.decorativeMediaPermission || '').includes('mobile') ||
      String(profile.offscreenLifecyclePolicy || '').includes('cooldown') ||
      Number(profile.maxIframeCount || 0) <= 1
    );
  }).map(([profileId, profile]) => ({ profileId, profile }));

  writeJsonReport(root, 'mobile-matrix.report.json', {
    generatedAt: new Date().toISOString(),
    profiles: mobileProfiles,
    scenarios: mobileScenarios,
    failCriteria: [
      'max-one-live-iframe-on-mobile',
      'offscreen-iframe-must-destroy-before-deadline',
      'wallet-before-intent-is-a-fail',
      'heap-must-recover-after-route-leave',
    ],
  });
  console.log('[audit:mobile-profile-budget] wrote mobile-matrix report');
}

main();
