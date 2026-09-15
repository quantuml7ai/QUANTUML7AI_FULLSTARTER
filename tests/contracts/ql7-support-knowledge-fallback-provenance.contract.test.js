import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

import { QL7_SUPPORT_CONTRADICTION_GUARD_VERSION } from '../../lib/ql7-support/response/contradictionGuard.js'
import { QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION } from '../../lib/ql7-support/response/morphosyntacticRealizer.js'

const read = (rel) => fs.readFileSync(rel, 'utf8')

describe('QL7 Support canonical knowledge/fallback provenance contract', () => {
  it('keeps planned-status negation aware instead of treating raw availability tokens as authority', () => {
    const source = read('lib/ql7-support/response/contradictionGuard.js')
    expect(QL7_SUPPORT_CONTRADICTION_GUARD_VERSION).toBe('5.1.2')
    expect(source).toContain('NEGATED_AVAILABILITY')
    expect(source).toContain('hasAffirmedAvailability')
    expect(source).toContain('not\\s+as\\s+')
    expect(source).toContain('availabilityAssertion')
  })

  it('separates fallback realization evidence from canonical knowledge provenance', () => {
    const morphology = read('lib/ql7-support/response/morphosyntacticRealizer.js')
    const human = read('lib/ql7-support/response/humanNaturalRealizer.js')
    const runtime = read('lib/ql7-support/runtime/executeTurn.js')

    expect(QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION).toBe('5.4.0')
    expect(morphology).toContain("schema: 'ql7.support.novelty-delivery-availability-fallback-receipt'")
    expect(morphology).toContain('noveltyFallbackReceipt = Object.freeze')
    expect(morphology).toContain('receiptId: `novelty-fallback:${fallbackReceiptHash}`')
    expect(morphology).toContain('knowledgeReceipt: composed.knowledgeReceipt')
    expect(morphology).toContain('noveltyFallbackReceipt: composed.noveltyFallbackReceipt')
    expect(morphology).toContain('eventPresentation: composed.eventPresentation')
    expect(human).toContain('noveltyFallbackReceipt: morphology.noveltyFallbackReceipt || null')
    expect(runtime).toContain("let canonicalKnowledgeReceipt = realized.knowledgeReceipt?.schema === 'ql7.support.knowledge-realization-receipt'")
    expect(runtime).toContain('knowledgeReceipt: canonicalKnowledgeReceipt || null')
    expect(runtime).toContain('noveltyFallbackReceipt: noveltyFallbackReceipt || null')
    expect(runtime).toContain('noveltyFallbackReceiptHash: ql7Str(realized.noveltyFallbackReceipt?.receiptHash)')
  })

  it('keeps the Windows-failing provider integration bound to direct planned knowledge and separate fallback evidence', () => {
    const integration = read('tests/integration/ql7-support-knowledge-integration.test.js')
    expect(integration).toContain("expect(turn.runtime.qualityGate.coherenceFailures).not.toContain('availability_contradiction')")
    expect(integration).toContain('expect(turn.runtime.noveltyFallbackReceipt).toBeNull()')
    expect(integration).toContain('expect(turn.runtime.realized.knowledgeReceipt.receiptHash).toBe(turn.runtime.knowledgeReceipt.receiptHash)')
  })
})
