import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = process.cwd()
function source(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8') }

describe('QL7 Support canonical runtime-scope contract', () => {
  it('binds knowledge realization to an explicit locale profile instead of a free identifier', () => {
    const text = source('lib/ql7-support/response/morphosyntacticRealizer.js')
    expect(text).toMatch(/function\s+realizeKnowledge\s*\(\{[^}]*profile\s*=\s*strictProfile\(locale\)/u)
    expect(text).toContain('publicFigureFactSentence(contentPlan,collector,profile)')
  })

  it('normalizes semantic and safety clocks before freshness/restriction calculations', () => {
    const semantic = source('lib/ql7-support/semantics/analyzeTurn.js')
    const safety = source('lib/ql7-support/safety/evaluateTurn.js')
    expect(semantic).toContain('function semanticNowMs(now=Date.now)')
    expect(semantic).toContain('auditQl7SupportKnowledgeSourceReceipt(candidateKnowledgeSourceReceipt,{now:semanticNowMs(now)})')
    expect(safety).toContain('function safetyNowMs(now=Date.now)')
    expect(safety).toContain('new Date(safetyNowMs(now)).toISOString()')
    expect(safety).toContain('const current=safetyNowMs(now)')
  })

  it('ships a dependency-free runtime regression proof and permanent unit/integration coverage', () => {
    for (const rel of [
      'scripts/ql7-support/runtime-scope-regression-proof.mjs',
      'tests/unit/ql7-support/runtime-scope-regressions.test.js',
      'tests/integration/ql7-support-runtime-scope.integration.test.js',
    ]) expect(fs.existsSync(path.join(ROOT, rel)), rel).toBe(true)
  })
})
