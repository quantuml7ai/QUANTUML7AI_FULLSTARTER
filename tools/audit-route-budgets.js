#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';

const {
  loadGovernance,
  scanFiles,
  writeJsonReport,
  fileExists,
} = require('./runtime-governance');

const ROOT_FILES = ['app/layout.js', 'app/providers.jsx', 'components/ForumShellGate.jsx'];
const DECORATIVE_FILES = ['app/about/page.js', 'app/ads/home.js', 'app/academy/page.js'];

const SIGNALS = [
  { key: 'wallet', rx: /\bcreateWeb3Modal\b|\bWagmiProvider\b|\bdefaultWagmiConfig\b/g },
  { key: 'analytics', rx: /\bAnalytics\b|\bSpeedInsights\b/g },
  { key: 'topBar', rx: /<TopBar\b|\bTopBar\b/g },
  { key: 'forumShellGate', rx: /\bForumShellGate\b/g },
  { key: 'widgets', rx: /\bTradingView\b|\bBinance\b|\bwidget\b|\bscript\b/g },
  { key: 'autoplay', rx: /\bautoPlay\b|\bplaysInline\b|\bmuted\b/g },
  { key: 'iframe', rx: /<iframe\b/gi },
  { key: 'video', rx: /<video\b/gi },
];

function readRouteRow(root, routeAssignment) {
  const rows = scanFiles(root, routeAssignment.files || [], SIGNALS);
  const totals = rows.reduce((acc, row) => {
    Object.keys(row.counts).forEach((key) => {
      acc[key] = (acc[key] || 0) + Number(row.counts[key] || 0);
    });
    return acc;
  }, {});

  return {
    route: routeAssignment.route,
    type: routeAssignment.type,
    profile: routeAssignment.profile || routeAssignment.profiles || null,
    files: rows.map((row) => row.file),
    totals,
  };
}

function main() {
  const root = process.cwd();
  const governance = loadGovernance(root);
  const routeRows = governance.routeAssignments.map((assignment) => readRouteRow(root, assignment));
  const rootRows = scanFiles(root, ROOT_FILES, SIGNALS);
  const decorativeRows = scanFiles(root, DECORATIVE_FILES, SIGNALS);

  const rootHeavyProviders = rootRows.reduce((sum, row) => {
    return sum + row.counts.wallet * 5 + row.counts.analytics * 3 + row.counts.topBar * 2;
  }, 0);

  const widgetBleed = routeRows
    .filter((row) => row.route !== '/exchange')
    .reduce((sum, row) => sum + Number(row.totals.widgets || 0), 0);

  const decorativePolicy = decorativeRows.map((row) => ({
    file: row.file,
    autoplaySignals: row.counts.autoplay,
    iframeSignals: row.counts.iframe,
    videoSignals: row.counts.video,
  }));

  const routeBudgetReport = {
    generatedAt: new Date().toISOString(),
    profiles: governance.routeCapabilityProfiles,
    routeAssignments: routeRows,
    checks: {
      rootHeavyProviders,
      routeLocalWidgetIsolation: {
        exchangeFilesPresent: fileExists(root, 'app/exchange/page.js'),
        widgetBleedOutsideExchange: widgetBleed,
      },
      globalShellBleed: {
        appLayoutHasTopBar: !!rootRows.find((row) => row.file === 'app/layout.js')?.counts?.topBar,
        appLayoutHasWallet: !!rootRows.find((row) => row.file === 'app/providers.jsx')?.counts?.wallet,
      },
      startupRouteCapabilityMatrix: {
        profileCount: Object.keys(governance.routeCapabilityProfiles || {}).length,
        assignmentCount: governance.routeAssignments.length,
      },
      forumShellSeparation: {
        forumShellGatePresent: !!rootRows.find((row) => row.file === 'components/ForumShellGate.jsx'),
        forumLayoutPresent: fileExists(root, 'app/forum/layout.js'),
      },
      decorativeRouteBaselinePolicy: decorativePolicy,
    },
  };

  const startupBudgetReport = {
    generatedAt: new Date().toISOString(),
    rootHeavyProviders,
    walletSignals: rootRows.reduce((sum, row) => sum + Number(row.counts.wallet || 0), 0),
    analyticsSignals: rootRows.reduce((sum, row) => sum + Number(row.counts.analytics || 0), 0),
    startupMediaSignals: rootRows.reduce((sum, row) => sum + Number(row.counts.autoplay || 0), 0),
  };

  const widgetIsolationReport = {
    generatedAt: new Date().toISOString(),
    routeRows: routeRows.map((row) => ({
      route: row.route,
      widgetSignals: row.totals.widgets || 0,
      iframeSignals: row.totals.iframe || 0,
      files: row.files,
    })),
    widgetBleedOutsideExchange: widgetBleed,
  };

  const decorativeBudgetReport = {
    generatedAt: new Date().toISOString(),
    report: decorativePolicy,
  };

  writeJsonReport(root, 'route-budget.report.json', routeBudgetReport);
  writeJsonReport(root, 'startup-budget.report.json', startupBudgetReport);
  writeJsonReport(root, 'widget-isolation.report.json', widgetIsolationReport);
  writeJsonReport(root, 'decorative-media-budget.report.json', decorativeBudgetReport);
  console.log('[audit:route-budgets] wrote route-budget/startup-budget/widget-isolation/decorative-media-budget reports');
}

main();
