import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const isQuickMode = process.argv.includes('--quick')
const shouldRunDeepDiagnosticGate = !isQuickMode && process.argv.includes('--deep')
const commandEnv = {
  ...process.env,
  CI: process.env.CI || 'true',
}
const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
const require = createRequire(import.meta.url)
const { loadGovernance, matchesSensitiveRuntimePath } = require('./runtime-governance.js')

function detectChangedFiles() {
  const result = spawnSync('git', ['status', '--short'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: commandEnv,
  })
  if (result.error || typeof result.stdout !== 'string') return []
  return result.stdout
    .split(/\r?\n/)
    .map((line) => String(line || '').replace(/\r$/, ''))
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const rawPath = line.slice(3).trim()
      if (rawPath.includes(' -> ')) return rawPath.split(' -> ').pop()
      return rawPath
    })
    .filter(Boolean)
}

const governance = loadGovernance(process.cwd())
const changedFiles = detectChangedFiles()
const shouldRunRuntimeCriticalGate =
  !isQuickMode && changedFiles.some((relPath) => matchesSensitiveRuntimePath(relPath, governance))

console.log(`\n[test:codex] changed files detected: ${changedFiles.length}`)
console.log(`[test:codex] runtime-critical gate: ${shouldRunRuntimeCriticalGate ? 'enabled' : 'skipped'}`)
console.log(`[test:codex] deep diagnostic gate: ${shouldRunDeepDiagnosticGate ? 'enabled' : 'skipped'}`)

const stages = isQuickMode
  ? [
      ['Environment', 'verify:env'],
      ['Documentation Contracts', 'verify:docs'],
      ['Static Audits L0', 'verify:audits:fast'],
      ['Lint', 'lint'],
      ['Typecheck', 'typecheck'],
      ['Project Contracts', 'test:contracts'],
      ['Unit Tests', 'test:unit'],
      ['Component Tests', 'test:component'],
    ]
  : [
      ['Environment', 'verify:env'],
      ['Documentation Contracts', 'verify:docs'],
      ['Static Audits L0', 'verify:audits:fast'],
      ['Lint', 'lint'],
      ['Typecheck', 'typecheck'],
      ['Project Contracts', 'test:contracts'],
      ['Unit Tests', 'test:unit'],
      ['Component Tests', 'test:component'],
    ]

if (shouldRunRuntimeCriticalGate) {
  stages.push(
    ['Forum Runtime Gate L1', 'verify:forum:runtime'],
    ['Auth Fanout Gate L1', 'verify:auth:fanout'],
    ['Route Budget Gate L1', 'verify:route:budgets'],
    ['Startup Budget Gate L1', 'verify:startup:budgets'],
    ['Ads Runtime Gate L1', 'verify:ads:runtime'],
  )
}

if (!isQuickMode) {
  stages.push(
    ['Integration Tests', 'test:integration'],
    ['Smoke Tests', 'test:smoke'],
  )
}

if (shouldRunDeepDiagnosticGate) {
  stages.push(
    ['Static Audits L2', 'verify:audits:deep'],
    ['Media HAR Gate L2', 'verify:media:har'],
    ['Media Heap Gate L2', 'verify:media:heap'],
    ['Mobile Matrix Gate L2', 'verify:mobile:matrix'],
    ['Exchange Widgets Gate L2', 'verify:exchange:widgets'],
  )
}

if (!isQuickMode) {
  stages.push(['Production Build', 'build'])
}

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
