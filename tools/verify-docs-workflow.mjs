import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const requiredDocs = [
  {
    file: 'README.md',
    tokens: ['pnpm test:codex', 'pnpm verify', 'verify:audits', 'test:contracts'],
  },
  {
    file: 'AGENTS.md',
    tokens: ['pnpm test:codex', 'pnpm project:docs:full', 'verify:audits', 'test:contracts'],
  },
  {
    file: 'docs/verification-pipeline.md',
    tokens: [
      'pnpm test:codex',
      'verify:audits',
      'test:contracts',
      'tests/contracts',
      'tests/unit',
      'tests/component',
      'tests/integration',
      'tests/smoke',
    ],
  },
]

const issues = []

for (const item of requiredDocs) {
  const abs = path.join(repoRoot, item.file)
  if (!fs.existsSync(abs)) {
    issues.push(`${item.file} is missing.`)
    continue
  }
  const content = fs.readFileSync(abs, 'utf8').replace(/^\uFEFF/, '')
  const missingTokens = item.tokens.filter((token) => !content.includes(token))
  if (missingTokens.length) {
    issues.push(`${item.file} is missing required references: ${missingTokens.join(', ')}`)
  }
}

if (issues.length) {
  console.error('[verify:docs] workflow documentation validation failed')
  issues.forEach((issue) => console.error(` - ${issue}`))
  process.exit(1)
}

console.log('[verify:docs] verification workflow docs are consistent')
