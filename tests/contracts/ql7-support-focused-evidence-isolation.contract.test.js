import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildFocusedEvidencePlan } from '../../scripts/ql7-support/focused-regressions.mjs'

const source = fs.readFileSync('scripts/ql7-support/focused-regressions.mjs', 'utf8')

describe('QL7 Support canonical focused evidence isolation contract', () => {
  it('keeps canonical focused proof artifacts under the caller-selected run directory', () => {
    const out = path.resolve('reports/ql7-support/contract-focused-run/focused-regressions.json')
    const plan = buildFocusedEvidencePlan(['--out', out], { cwd: process.cwd() })
    expect(source).toContain('buildFocusedEvidencePlan')
    expect(source).toContain("argValue(argv, '--out'")
    expect(plan.out).toBe(out)
    expect(plan.evidenceDir).toBe(path.join(path.dirname(out), 'focused-evidence'))
    expect(plan.stages.length).toBeGreaterThanOrEqual(25)
    for (const [, args] of plan.stages) {
      const outIndex = args.indexOf('--out')
      expect(outIndex).toBeGreaterThan(0)
      expect(path.resolve(args[outIndex + 1]).startsWith(`${plan.evidenceDir}${path.sep}`)).toBe(true)
    }
    expect(source).not.toContain('report/QL7_SUPPORT_LAB')
  })

  it('actually invokes the canonical canonical focused Gate A owner', () => {
    expect(source).toContain('runQl7FocusedRegressions')
    expect(source).toContain('export async function runQl7FocusedRegressions')
    expect(source).not.toContain("await import('./canonical-focused-regressions.mjs')")
  })
})
