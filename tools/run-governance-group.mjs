import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const repoRoot = process.cwd();
const group = String(process.argv[2] || '').trim();
const groupArg = process.argv[3] ? String(process.argv[3]) : '';

function runNodeScript(script, args = [], outputs = []) {
  const scriptPath = path.join(repoRoot, script);
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    stdio: 'inherit',
    env: {
      ...process.env,
      CI: process.env.CI || 'true',
    },
  });

  if (result.error) {
    console.error(`[run-governance-group] failed to start ${script}: ${result.error.message}`);
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`[run-governance-group] ${script} failed with exit code ${result.status}`);
    process.exit(result.status || 1);
  }

  const missing = outputs.filter((output) => !fs.existsSync(path.join(repoRoot, output)));
  if (missing.length) {
    console.error(`[run-governance-group] ${script} did not produce: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function writeSkippedReport(relPath, reason, extra = {}) {
  const target = path.join(repoRoot, relPath);
  fs.writeFileSync(target, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    status: 'skipped',
    reason,
    ...extra,
  }, null, 2)}\n`, 'utf8');
}

const GROUPS = {
  'forum-runtime': [
    ['tools/audit-forum-startup.js', ['forum-startup.audit.report.json']],
    ['tools/audit-media-budget.js', ['media-budget.audit.report.json']],
    ['tools/audit-player-ownership.js', ['player-budget.report.json', 'qcast-ownership.report.json']],
    ['tools/audit-post-video-lifecycle.js', ['native-post-video.audit.report.json']],
    ['tools/audit-iframe-restore.js', ['iframe-restore.report.json']],
    ['tools/audit-same-src-thrash.js', ['same-src-thrash.report.json']],
    ['tools/audit-forum-scroll-runtime.js', ['forum-scroll.audit.report.json']],
    ['tools/audit-forum-media-churn.js', ['forum-media-churn.audit.report.json']],
    ['tools/audit-runtime-passports.js', ['runtime-passport.snapshot.json']],
  ],
  'auth-fanout': [
    ['tools/audit-auth-bus.js', ['auth-bus.audit.report.json']],
    ['tools/audit-account-sync.js', ['account-sync-audit.report.json']],
    ['tools/audit-auth-cascade.js', ['auth-cascade.report.json']],
  ],
  'startup-budgets': [
    ['tools/audit-provider-baseline.js', ['provider-baseline.report.json']],
    ['tools/audit-route-budgets.js', ['route-budget.report.json', 'startup-budget.report.json']],
    ['tools/audit-preload-waste.js', ['preload-waste.report.json']],
    ['tools/audit-prod-lite-discipline.js', ['prod-lite-discipline.report.json']],
  ],
  'route-budgets': [
    ['tools/audit-route-budgets.js', ['route-budget.report.json', 'widget-isolation.report.json', 'decorative-media-budget.report.json']],
    ['tools/audit-route-teardown.js', ['route-teardown.report.json', 'timer-cleanup.report.json', 'observer-cleanup.report.json']],
    ['tools/audit-runtime-passports.js', ['runtime-passport.snapshot.json']],
    ['tools/audit-route-priority-policies.js', ['route-priority-policies.report.json']],
  ],
  'ads-runtime': [
    ['tools/audit-ad-runtime.js', ['ad-runtime.audit.report.json']],
    ['tools/audit-player-ownership.js', ['player-budget.report.json', 'qcast-ownership.report.json']],
    ['tools/audit-route-budgets.js', ['route-budget.report.json']],
  ],
  'exchange-widgets': [
    ['tools/audit-route-budgets.js', ['widget-isolation.report.json']],
    ['tools/audit-route-teardown.js', ['route-teardown.report.json']],
    ['tools/audit-console-noise.js', ['console-noise-classification.report.json']],
  ],
  'mobile-matrix': [
    ['tools/audit-mobile-profile-budget.js', ['mobile-matrix.report.json']],
    ['tools/audit-layout-stability.js', ['layout-stability.report.json']],
    ['tools/audit-adaptive-core.js', ['adaptive-core.report.json']],
  ],
};

if (group === 'media-har') {
  const input = groupArg || process.env.FORUM_MEDIA_HAR_PATH || '';
  if (!input || !fs.existsSync(path.resolve(repoRoot, input))) {
    writeSkippedReport('forum-media-har.report.json', 'missing-har-input', {
      expectedEnv: 'FORUM_MEDIA_HAR_PATH',
    });
    console.log('[run-governance-group] media-har skipped (missing input)');
    process.exit(0);
  }
  runNodeScript('tools/analyze-forum-media-har.js', [input], ['forum-media-har.report.json']);
  process.exit(0);
}

if (group === 'media-heap') {
  const input = groupArg || process.env.FORUM_HEAPSNAPSHOT_PATH || '';
  if (!input || !fs.existsSync(path.resolve(repoRoot, input))) {
    writeSkippedReport('media-heap.verify.report.json', 'missing-heapsnapshot-input', {
      expectedEnv: 'FORUM_HEAPSNAPSHOT_PATH',
    });
    console.log('[run-governance-group] media-heap skipped (missing input)');
    process.exit(0);
  }
  runNodeScript('tools/analyze-heapsnapshot.js', [input], [
    'heapsnapshot-analysis.report.json',
    'media-heap.verify.report.json',
  ]);
  process.exit(0);
}

const steps = GROUPS[group];
if (!steps) {
  console.error(`[run-governance-group] unknown group: ${group || 'empty'}`);
  process.exit(1);
}

for (const [script, outputs] of steps) {
  runNodeScript(script, [], outputs);
}

console.log(`[run-governance-group] group ${group} completed`);
