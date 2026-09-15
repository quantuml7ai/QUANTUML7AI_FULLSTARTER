import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getScenarioGroup,
  loadGovernance,
  writeJsonReport,
} = require('./runtime-governance.js');

const repoRoot = process.cwd();
const groupId = String(process.argv[2] || '').trim();

const DATA_REQUESTS = {
  'forum-mobile': [
    'HAR export for iPhone Safari, Android Chrome and Telegram WebView forum runs',
    'Heap snapshots for cold start, 60s and 180s checkpoints',
  ],
  'forum-desktop': [
    'Desktop Chrome and Safari traces with CPU throttle notes',
  ],
  'forum-route-return': [
    'Enter/leave/re-enter timings with restore notes',
  ],
  'auth-cascade': [
    'Signed-in and signed-out runs with auth prompt open/close trace',
  ],
  'startup-shell': [
    'Startup requests summary before first usable frame',
  ],
  'exchange-route': [
    'Widget failure capture and route-leave cleanup trace',
  ],
  'decorative-media': [
    'Autoplay degradation notes on mobile and desktop',
  ],
  'forum-long-scroll': [
    'Long-scroll trace with heap checkpoints at 30, 60 and 180 seconds',
    'Peak iframe/native/ad counts during scroll and idle plateau notes',
  ],
  'forum-background-restore': [
    'Background/foreground and route-restore traces with runtime passport before and after restore',
  ],
  'forum-wallet-untouched': [
    'Startup capture proving wallet runtime did not initialize before explicit intent',
  ],
  'qcast-mixed': [
    'Shared mute-source evidence and qcast/content coexistence trace',
  ],
  'provider-baseline': [
    'Provider startup counts by route and wallet/auth baseline evidence',
  ],
  'route-teardown': [
    'Enter/leave teardown traces with leftover timers, observers and widgets counts',
  ],
  'preload-waste': [
    'Slow-network preload trace with unused preload classification',
  ],
  'console-noise': [
    'Console export grouped into A/B/C classes with external noise separated',
  ],
  'adaptive-pressure': [
    'Adaptive profile transitions under memory, main-thread and slow-network pressure',
    'Before/after runtime passports with effect degradation tier and adaptive actions counts',
  ],
  'forensic-mode': [
    'Bounded forensic activation trace with ttl, payload size and auto-shutdown evidence',
  ],
};

const governance = loadGovernance(repoRoot);
const scenarios = getScenarioGroup(governance, groupId);

if (!scenarios.length) {
  console.error(`[run-scenario-telemetry] unknown or empty scenario group: ${groupId || 'empty'}`);
  process.exit(1);
}

const payload = {
  generatedAt: new Date().toISOString(),
  groupId,
  scenarios,
  routes: [...new Set(scenarios.map((scenario) => scenario.route))],
  metricGroups: [...new Set(scenarios.flatMap((scenario) => scenario.metricGroups || []))],
  deviceMatrix: [...new Set(scenarios.flatMap((scenario) => scenario.deviceMatrix || []))],
  manualDataRequests: DATA_REQUESTS[groupId] || [
    'Provide HAR, heap and runtime passport snapshots for this scenario group',
  ],
};

writeJsonReport(repoRoot, `scenario.${groupId}.report.json`, payload);
console.log(`[run-scenario-telemetry] wrote scenario.${groupId}.report.json`);
