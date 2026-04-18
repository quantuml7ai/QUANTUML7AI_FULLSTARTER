import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()
const packageJsonPath = path.join(repoRoot, 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredScripts = [
  'lint',
  'typecheck',
  'verify:env',
  'verify:docs',
  'verify:audits',
  'verify:audits:fast',
  'verify:audits:deep',
  'verify:forum:runtime',
  'verify:auth:fanout',
  'verify:startup:budgets',
  'verify:route:budgets',
  'verify:media:har',
  'verify:media:heap',
  'verify:mobile:matrix',
  'verify:ads:runtime',
  'verify:exchange:widgets',
  'verify:scenario:forum-mobile',
  'verify:scenario:forum-desktop',
  'verify:scenario:forum-route-return',
  'verify:scenario:auth-cascade',
  'verify:scenario:startup-shell',
  'verify:scenario:exchange-route',
  'verify:scenario:decorative-media',
  'verify:scenario:forum-long-scroll',
  'verify:scenario:forum-background-restore',
  'verify:scenario:forum-wallet-untouched',
  'verify:scenario:qcast-mixed',
  'verify:scenario:provider-baseline',
  'verify:scenario:route-teardown',
  'verify:scenario:preload-waste',
  'verify:scenario:console-noise',
  'verify:scenario:adaptive-pressure',
  'verify:scenario:forensic-mode',
  'verify:diff:last-baseline',
  'test:contracts',
  'test:unit',
  'test:component',
  'test:integration',
  'test:smoke',
  'test:codex',
  'verify',
  'build',
]

const issues = []
const nodeMajor = Number(String(process.versions.node || '').split('.')[0] || 0)

if (nodeMajor !== 22) {
  issues.push(`Node 22.x is required, current version is ${process.versions.node}.`)
}

if (!String(packageJson.packageManager || '').startsWith('pnpm@')) {
  issues.push('package.json must declare pnpm in the packageManager field.')
}

if (!fs.existsSync(path.join(repoRoot, 'pnpm-lock.yaml'))) {
  issues.push('pnpm-lock.yaml is missing.')
}

if (!fs.existsSync(path.join(repoRoot, 'node_modules'))) {
  issues.push('node_modules is missing. Run pnpm install before pnpm test:codex.')
}

if (!fs.existsSync(path.join(repoRoot, 'vitest.config.mjs'))) {
  issues.push('vitest.config.mjs is missing.')
}

const missingScripts = requiredScripts.filter((name) => !packageJson.scripts?.[name])
if (missingScripts.length) {
  issues.push(`Missing required scripts: ${missingScripts.join(', ')}`)
}

if (issues.length) {
  console.error('[verify:env] environment validation failed')
  issues.forEach((issue) => console.error(` - ${issue}`))
  process.exit(1)
}

console.log('[verify:env] environment is ready')
console.log(` - node: ${process.versions.node}`)
console.log(` - package manager: ${packageJson.packageManager}`)
console.log(` - scripts checked: ${requiredScripts.length}`)
