import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const json = (relativePath) => JSON.parse(read(relativePath))

describe('QL7 Support Planetary AI canonical governance closeout', () => {
  test('keeps canonical repository verification and documentation commands wired', () => {
    const agents = read('AGENTS.md')
    const pkg = json('package.json')
    expect(agents).toContain('canonical verification command after any project change is `pnpm test:codex`')
    expect(agents).toContain('mandatory command after structural changes is `pnpm project:docs:full`')
    expect(agents).toContain('After `pnpm project:docs:full`, run `pnpm test:codex` again')
    expect(pkg.scripts?.['test:codex']).toBe('node tools/test-codex.mjs')
    expect(pkg.scripts?.['project:docs:full']).toBe('pnpm project:docs && pnpm project:docs:audit')
    expect(pkg.scripts?.['test:contracts']).toContain('vitest run')
  })

  test('keeps generated project documentation synchronized with Support structure', () => {
    const tree = read('PROJECT_TREE.md')
    const routes = read('PROJECT_ROUTES.md')
    const ownership = read('PROJECT_OWNERSHIP.md')
    const dependencies = read('PROJECT_DEPENDENCIES.md')
    const risks = read('PROJECT_RISKS.md')

    const stack = []
    const documentedPaths = new Set()
    for (const line of tree.split(/\r?\n/)) {
      const match = /^(\s*)-\s+`?(.+?)`?\s+—/.exec(line)
      if (!match) continue
      const level = Math.floor(match[1].length / 2)
      const name = match[2].replace(/\/$/, '')
      stack.length = level
      stack[level] = name
      documentedPaths.add(stack.filter(Boolean).join('/'))
    }

    for (const expectedPath of [
      'lib/ql7-support/identityResolver.js',
      'lib/ql7-support/diagnosticRegistry.js',
      'lib/ql7-support/runtime/executeTurn.js',
      'lib/ql7-support/runtime/productionTurn.js',
      'lib/ql7-support/simulation/lab/checkpointJournal.js',
      'tests/contracts/project/ql7-support-governance-contracts.test.js',
    ]) expect(documentedPaths.has(expectedPath), expectedPath).toBe(true)

    expect(tree).not.toContain('docs/ql7-support-planetary-ai-canonical.md')
    expect(tree).not.toContain('docs/ql7-support-canonical-compliance-audit.md')

    expect(routes).toContain('/api/dm/support-state')
    expect(ownership).toContain('lib/ql7-support/server.js')
    expect(dependencies).toContain('lib/ql7-support')
    expect(risks).toContain('lib/ql7-support/server.js')
  })

  test('keeps project documentation audit artifacts green', () => {
    const docsAudit = json('audit/project-docs-audit.json')
    const treeAudit = json('audit/project-tree-audit.json')
    expect(docsAudit.status).toBe('ok')
    expect(treeAudit.status).toBe('ok')
  })


  test('makes generated documentation deterministic for guarded patching', () => {
    const shared = read('tools/project-docs-shared.js')
    const treeGenerator = read('tools/generate-project-tree.js')
    expect(shared).toContain("git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z']")
    expect(treeGenerator).toContain("git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z']")
    expect(shared).toContain('/\\.report\\.json$/i')
    expect(shared).toContain("'audit'")
    expect(treeGenerator).toContain('isGeneratedLocalArtifact')

    for (const file of [
      'tools/generate-project-tree.js',
      'tools/generate-project-routes.js',
      'tools/generate-project-ownership.js',
      'tools/generate-project-dependencies.js',
      'tools/generate-project-risks.js',
      'tools/audit-project-docs.js',
    ]) {
      expect(read(file)).toContain('QL7_PROJECT_DOCS_GENERATED_AT')
    }
  })

  test('keeps the acceptance evidence runner executable and honest about runtime-only gates', () => {
    const source = read('scripts/ql7-support/premium-prelab-suite.mjs')
    expect(source).toContain("READY_FOR_LAB_CALIBRATION:complete&&failures.length===0")
    expect(source).toContain("NATIVE_HUMAN_REVIEW:'PENDING_LAB'")
    expect(source).toContain("EMPIRICAL_CALIBRATION:'PENDING_LAB'")
    expect(source).toContain("LIVE_LARGE_USER_ACCEPTANCE:'PENDING_LAB'")
    expect(source).toContain('READY_FOR_LARGE_CALIBRATION:false')
    expect(source).toContain('EMPIRICAL_RELEASE:false')
    expect(source).toContain('MASTER_TZ_CLOSED:false')
    expect(source).not.toContain('EMPIRICAL_RELEASE:true')
  })
})
