import { describe, expect, it } from 'vitest'
import { QL7_SUPPORT_BEHAVIOR_MANIFEST } from '../../lib/ql7-support/config/behaviorManifest.js'
import { QL7_SUPPORT_SEMANTIC_BANK_VERSION, getQl7SemanticBankCoverage } from '../../lib/ql7-support/language/semanticBanks.js'
import { QL7_SUPPORT_HUMAN_VARIATION_VERSION, getQl7HumanVariationCoverage } from '../../lib/ql7-support/language/humanVariationPrimitives.js'
import { QL7_SUPPORT_HUMAN_TOPIC_ONTOLOGY_VERSION, auditQl7SupportHumanTopicOntology } from '../../lib/ql7-support/knowledge/humanTopicOntology.js'
import { QL7_SUPPORT_CRISIS_CONCEPT_BANK_VERSION, auditQl7SupportCrisisConceptBank } from '../../lib/ql7-support/safety/crisisConceptBank.js'
import { QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION } from '../../lib/ql7-support/response/morphosyntacticRealizer.js'

describe('canonical full-unit closure contract', () => {
  it('pins current canonical owners and scales upward without reviving stale compatibility versions', () => {
    expect(QL7_SUPPORT_SEMANTIC_BANK_VERSION).toBe('15.5.0')
    expect(QL7_SUPPORT_HUMAN_VARIATION_VERSION).toBe('16.0.1-primitives-only')
    expect(QL7_SUPPORT_HUMAN_TOPIC_ONTOLOGY_VERSION).toBe('5.3.3-open-world-135-hierarchy')
    expect(QL7_SUPPORT_CRISIS_CONCEPT_BANK_VERSION).toBe('5.4.0')
    expect(QL7_SUPPORT_MORPHOSYNTACTIC_REALIZER_VERSION).toBe('5.4.0')
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.semanticBankVersion).toBe(QL7_SUPPORT_SEMANTIC_BANK_VERSION)
    expect(QL7_SUPPORT_BEHAVIOR_MANIFEST.rules.humanVariationPrimitivesVersion).toBe(QL7_SUPPORT_HUMAN_VARIATION_VERSION)
    expect(getQl7SemanticBankCoverage()).toMatchObject({ localeCount: 32 })
    expect(getQl7SemanticBankCoverage().totalTerms).toBeGreaterThanOrEqual(180000)
    expect(getQl7HumanVariationCoverage()).toMatchObject({ ok: true, localeCount: 32, readyToSendRows: 0, primitiveOnly: true })
    expect(auditQl7SupportHumanTopicOntology()).toMatchObject({ ok: true })
    expect(auditQl7SupportHumanTopicOntology()).toMatchObject({ specificityHierarchy: true })
    expect(auditQl7SupportHumanTopicOntology().categoryCount).toBeGreaterThanOrEqual(135)
    expect(auditQl7SupportHumanTopicOntology().dominanceEdgeCount).toBeGreaterThanOrEqual(16)
    expect(auditQl7SupportHumanTopicOntology().rollupRuleCount).toBeGreaterThanOrEqual(1)
    expect(auditQl7SupportCrisisConceptBank()).toMatchObject({ ok: true, localeCount: 32 })
  })
})
