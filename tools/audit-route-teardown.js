#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  loadGovernance,
  scanFiles,
  writeJsonReport,
} = require('./runtime-governance');

const SIGNALS = [
  { key: 'timers', rx: /\bsetInterval\s*\(|\bsetTimeout\s*\(/g },
  { key: 'timerCleanup', rx: /\bclearInterval\b|\bclearTimeout\b/g },
  { key: 'observers', rx: /\bIntersectionObserver\b|\bMutationObserver\b|\bResizeObserver\b/g },
  { key: 'observerCleanup', rx: /\bdisconnect\b/g },
  { key: 'listeners', rx: /\baddEventListener\s*\(/g },
  { key: 'listenerCleanup', rx: /\bremoveEventListener\b/g },
  { key: 'destroyCalls', rx: /\bdestroy\b|\bclose\b/g },
];

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const files = governance.routeAssignments.flatMap((assignment) => assignment.files || []);
  const rows = scanFiles(root, files, SIGNALS).map((row) => ({
    file: row.file,
    counts: row.counts,
    teardownScore:
      (row.counts.timerCleanup || 0) +
      (row.counts.observerCleanup || 0) +
      (row.counts.listenerCleanup || 0) +
      (row.counts.destroyCalls || 0),
  }));

  const routeTeardown = {
    generatedAt: new Date().toISOString(),
    report: rows,
  };

  const timerCleanup = {
    generatedAt: new Date().toISOString(),
    report: rows.map((row) => ({
      file: row.file,
      timers: row.counts.timers || 0,
      timerCleanup: row.counts.timerCleanup || 0,
    })),
  };

  const observerCleanup = {
    generatedAt: new Date().toISOString(),
    report: rows.map((row) => ({
      file: row.file,
      observers: row.counts.observers || 0,
      observerCleanup: row.counts.observerCleanup || 0,
      listeners: row.counts.listeners || 0,
      listenerCleanup: row.counts.listenerCleanup || 0,
    })),
  };

  writeJsonReport(root, 'route-teardown.report.json', routeTeardown);
  writeJsonReport(root, 'timer-cleanup.report.json', timerCleanup);
  writeJsonReport(root, 'observer-cleanup.report.json', observerCleanup);
  console.log('[audit:route-teardown] wrote route-teardown/timer-cleanup/observer-cleanup reports');
}

main();
