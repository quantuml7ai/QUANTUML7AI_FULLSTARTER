import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const isQuickMode = process.argv.includes('--quick')
const commandEnv = {
  ...process.env,
  CI: process.env.CI || 'true',
}
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')

const stages = isQuickMode
  ? [
      ['Environment', 'verify:env'],
      ['Documentation Contracts', 'verify:docs'],
      ['Static Audits', 'verify:audits'],
      ['Lint', 'lint'],
      ['Typecheck', 'typecheck'],
      ['Project Contracts', 'test:contracts'],
      ['Unit Tests', 'test:unit'],
      ['Component Tests', 'test:component'],
    ]
  : [
      ['Environment', 'verify:env'],
      ['Documentation Contracts', 'verify:docs'],
      ['Static Audits', 'verify:audits'],
      ['Lint', 'lint'],
      ['Typecheck', 'typecheck'],
      ['Project Contracts', 'test:contracts'],
      ['Unit Tests', 'test:unit'],
      ['Component Tests', 'test:component'],
      ['Integration Tests', 'test:integration'],
      ['Smoke Tests', 'test:smoke'],
      ['Production Build', 'build'],
    ]

const total = stages.length

function runScript(script) {
  if (process.platform === 'win32') {
    return spawnSync(
      'cmd.exe',
      ['/d', '/s', '/c', `pnpm run ${script}`],
      {
        stdio: 'inherit',
        env: commandEnv,
      },
    )
  }

  return spawnSync(
    'pnpm',
    ['run', script],
    {
      stdio: 'inherit',
      env: commandEnv,
    },
  )
}

function runStage(script) {
  if (script !== 'build' || !fs.existsSync(tsconfigPath)) {
    return runScript(script)
  }

  const originalTsconfig = fs.readFileSync(tsconfigPath, 'utf8')

  try {
    return runScript(script)
  } finally {
    const nextTsconfig = fs.readFileSync(tsconfigPath, 'utf8')
    if (nextTsconfig !== originalTsconfig) {
      fs.writeFileSync(tsconfigPath, originalTsconfig, 'utf8')
    }
  }
}

for (let index = 0; index < stages.length; index += 1) {
  const [label, script] = stages[index]
  const stageNumber = index + 1
  console.log(`\n[${stageNumber}/${total}] ${label}`)
  console.log(`> pnpm run ${script}`)

  const result = runStage(script)

  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`\n[FAIL] ${label} failed while running "pnpm run ${script}"`)
    process.exit(result.status || 1)
  }

  if (result.error) {
    console.error(`\n[FAIL] ${label} failed to start: ${result.error.message}`)
    process.exit(1)
  }
}

console.log(`\n[SUCCESS] pnpm test:codex completed (${isQuickMode ? 'quick' : 'full'} mode)`)
