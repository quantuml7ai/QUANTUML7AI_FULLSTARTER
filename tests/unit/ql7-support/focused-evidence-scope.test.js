import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildFocusedEvidencePlan } from '../../../scripts/ql7-support/focused-regressions.mjs'

describe('QL7 Support canonical focused evidence scope', () => {
  it('routes every canonical child proof into the selected run directory', () => {
    const out = path.resolve('tmp/canonical-run/gate-a-focused.json')
    const plan = buildFocusedEvidencePlan(['--out', out, '--fail-on-failures', 'true'])
    expect(plan.out).toBe(out)
    expect(plan.failOnFailures).toBe(true)
    expect(plan.stages.length).toBeGreaterThanOrEqual(11)
    for (const [, args] of plan.stages) {
      const i = args.indexOf('--out')
      expect(i).toBeGreaterThanOrEqual(0)
      expect(path.resolve(args[i + 1]).startsWith(path.dirname(out))).toBe(true)
      expect(args.join(' ')).not.toContain('report/QL7_SUPPORT_LAB')
    }
  })
})
