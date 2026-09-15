#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  loadGovernance,
  writeJsonReport,
} = require('./runtime-governance');

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const report = Object.entries(governance.routeCapabilityProfiles || {}).map(([profileId, profile]) => {
    const priority = Array.isArray(profile?.budget?.ownerArbitrationPriority)
      ? profile.budget.ownerArbitrationPriority
      : [];
    const decorative = /decorative/.test(profileId);
    const warnings = [];
    if (/forum|wallet|auth|exchange/.test(profileId) && priority[0] !== 'content' && priority[0] !== 'widget' && priority[0] !== 'wallet' && priority[0] !== 'auth') {
      warnings.push('unexpected-primary-priority');
    }
    if (decorative && Number(profile.maxDecorativePlayers || 0) > 1) {
      warnings.push('decorative-budget-too-wide');
    }
    return {
      profileId,
      priority,
      maxDecorativePlayers: Number(profile.maxDecorativePlayers || 0),
      warnings,
    };
  });

  writeJsonReport(root, 'route-priority-policies.report.json', {
    generatedAt: new Date().toISOString(),
    report,
  });
  console.log('[audit:route-priority-policies] wrote route-priority-policies.report.json');
}

main();
