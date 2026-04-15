import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const repoRoot = process.cwd()

const audits = [
  {
    label: 'Runtime hotspots',
    script: 'tools/audit-runtime-hotspots.js',
    outputs: ['runtime-hotspots.report.json'],
  },
  {
    label: 'Forum media ownership',
    script: 'tools/audit-media-ownership.js',
    outputs: ['forum-media-ownership.report.json'],
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
]

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

console.log(`\n[verify:audits] ${audits.length} static audit passes completed`)
