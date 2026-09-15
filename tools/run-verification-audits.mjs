import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()
const args = process.argv.slice(2)
const mode = (() => {
  const direct = args.find((arg) => arg.startsWith('--mode='))
  if (direct) return direct.slice('--mode='.length)
  const index = args.indexOf('--mode')
  if (index >= 0 && args[index + 1]) return args[index + 1]
  return 'fast'
})()

const fastAudits = [
  {
    label: 'Runtime hotspots',
    script: 'tools/audit-runtime-hotspots.js',
    outputs: ['runtime-hotspots.report.json'],
  },
  {
    label: 'Effects leak',
    script: 'tools/audit-effects.js',
    outputs: ['effects-leak.report.json'],
  },
  {
    label: 'Auth bus',
    script: 'tools/audit-auth-bus.js',
    outputs: ['auth-bus.audit.report.json'],
  },
  {
    label: 'Forum dependency graph',
    script: 'tools/audit-forum-deps.js',
    outputs: ['forum-deps-audit.report.json'],
  },
  {
    label: 'Provider baseline',
    script: 'tools/audit-provider-baseline.js',
    outputs: ['provider-baseline.report.json'],
  },
  {
    label: 'Route budgets',
    script: 'tools/audit-route-budgets.js',
    outputs: [
      'route-budget.report.json',
      'startup-budget.report.json',
      'widget-isolation.report.json',
      'decorative-media-budget.report.json',
    ],
  },
  {
    label: 'Player ownership',
    script: 'tools/audit-player-ownership.js',
    outputs: ['player-budget.report.json', 'qcast-ownership.report.json'],
  },
  {
    label: 'Runtime passports',
    script: 'tools/audit-runtime-passports.js',
    outputs: ['runtime-passport.snapshot.json', 'runtime-passports.report.json'],
  },
  {
    label: 'Production lite discipline',
    script: 'tools/audit-prod-lite-discipline.js',
    outputs: ['prod-lite-discipline.report.json'],
  },
  {
    label: 'Diagnostics boundaries',
    script: 'tools/audit-diagnostics-boundaries.js',
    outputs: ['diagnostics-boundaries.report.json'],
  },
  {
    label: 'Adaptive core',
    script: 'tools/audit-adaptive-core.js',
    outputs: ['adaptive-core.report.json'],
  },
  {
    label: 'Runtime mode resolution',
    script: 'tools/audit-runtime-mode-resolution.js',
    outputs: ['runtime-mode-resolution.report.json'],
  },
  {
    label: 'Adaptive actions',
    script: 'tools/audit-adaptive-actions.js',
    outputs: ['adaptive-actions.report.json', 'pressure-ladder.report.json'],
  },
  {
    label: 'Mode contract',
    script: 'tools/audit-mode-contract.js',
    outputs: ['mode-contract.validation.report.json'],
  },
]

const deepOnlyAudits = [
  {
    label: 'Full forum deep audit',
    script: 'tools/audit-full-forum.js',
    outputs: ['deep-audit.report.json'],
  },
  {
    label: 'Media deep audit',
    script: 'tools/audit-media.js',
    outputs: ['media-audit.report.json'],
  },
  {
    label: 'Heavy zones audit',
    script: 'tools/audit-heavy.js',
    outputs: ['heavy-audit.report.json'],
  },
  {
    label: 'Forum startup audit',
    script: 'tools/audit-forum-startup.js',
    outputs: ['forum-startup.audit.report.json'],
  },
  {
    label: 'Media budget audit',
    script: 'tools/audit-media-budget.js',
    outputs: ['media-budget.audit.report.json'],
  },
  {
    label: 'Ad runtime audit',
    script: 'tools/audit-ad-runtime.js',
    outputs: ['ad-runtime.audit.report.json'],
  },
  {
    label: 'Account sync audit',
    script: 'tools/audit-account-sync.js',
    outputs: ['account-sync-audit.report.json'],
  },
  {
    label: 'Forum scroll runtime audit',
    script: 'tools/audit-forum-scroll-runtime.js',
    outputs: ['forum-scroll.audit.report.json'],
  },
  {
    label: 'Forum media churn audit',
    script: 'tools/audit-forum-media-churn.js',
    outputs: ['forum-media-churn.audit.report.json'],
  },
  {
    label: 'Route teardown audit',
    script: 'tools/audit-route-teardown.js',
    outputs: ['route-teardown.report.json', 'timer-cleanup.report.json', 'observer-cleanup.report.json'],
  },
  {
    label: 'Console noise audit',
    script: 'tools/audit-console-noise.js',
    outputs: ['console-noise-classification.report.json'],
  },
  {
    label: 'Layout stability audit',
    script: 'tools/audit-layout-stability.js',
    outputs: ['layout-stability.report.json'],
  },
  {
    label: 'Preload waste audit',
    script: 'tools/audit-preload-waste.js',
    outputs: ['preload-waste.report.json'],
  },
  {
    label: 'Mobile profile budget audit',
    script: 'tools/audit-mobile-profile-budget.js',
    outputs: ['mobile-matrix.report.json'],
  },
  {
    label: 'Auth cascade audit',
    script: 'tools/audit-auth-cascade.js',
    outputs: ['auth-cascade.report.json'],
  },
  {
    label: 'Iframe restore audit',
    script: 'tools/audit-iframe-restore.js',
    outputs: ['iframe-restore.report.json'],
  },
  {
    label: 'Same-src thrash audit',
    script: 'tools/audit-same-src-thrash.js',
    outputs: ['same-src-thrash.report.json'],
  },
  {
    label: 'Route priority policies audit',
    script: 'tools/audit-route-priority-policies.js',
    outputs: ['route-priority-policies.report.json'],
  },
  {
    label: 'Feature flag safety audit',
    script: 'tools/audit-feature-flag-safety.js',
    outputs: ['feature-flag-safety.report.json'],
  },
  {
    label: 'Forensic mode bounds audit',
    script: 'tools/audit-forensic-mode-bounds.js',
    outputs: ['forensic-bounds.report.json'],
  },
]

const audits = mode === 'deep' ? [...fastAudits, ...deepOnlyAudits] : fastAudits

for (const audit of audits) {
  console.log(`\n[verify:audits] ${audit.label}`)
  const scriptPath = path.join(repoRoot, audit.script)
  const result = spawnSync(
    process.execPath,
    [scriptPath],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        CI: process.env.CI || 'true',
      },
    },
  )

  if (result.error) {
    console.error(`[verify:audits] failed to start ${audit.script}: ${result.error.message}`)
    process.exit(1)
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`[verify:audits] ${audit.script} failed with exit code ${result.status}`)
    process.exit(result.status || 1)
  }

  const missingOutputs = audit.outputs.filter((file) => !fs.existsSync(path.join(repoRoot, file)))
  if (missingOutputs.length) {
    console.error(`[verify:audits] ${audit.script} did not produce expected outputs: ${missingOutputs.join(', ')}`)
    process.exit(1)
  }
}

console.log(`\n[verify:audits] ${audits.length} static audit passes completed (${mode})`)
