import { describe, expect, it } from 'vitest'
import {
  QL7_SUPPORT_HUMAN_TOPIC_ONTOLOGY_VERSION,
  QL7_SUPPORT_HUMAN_TOPIC_CATEGORIES,
  auditQl7SupportHumanTopicOntology,
} from '../../lib/ql7-support/knowledge/humanTopicOntology.js'

describe('canonical human-topic specificity hierarchy contract', () => {
  it('pins the expanded ontology and its semantic hierarchy without lowering existing floors', () => {
    expect(QL7_SUPPORT_HUMAN_TOPIC_ONTOLOGY_VERSION).toBe('5.3.3-open-world-135-hierarchy')
    expect(QL7_SUPPORT_HUMAN_TOPIC_CATEGORIES).toContain('science')
    expect(QL7_SUPPORT_HUMAN_TOPIC_CATEGORIES).toContain('mma_ufc')
    expect(auditQl7SupportHumanTopicOntology()).toMatchObject({
      ok: true,
      categoryCount: 135,
      openSubjectSupported: true,
      fuzzyTypoMatching: true,
      multiscriptAliases: true,
      sourceRequiredOnOpenSubject: true,
      specificityHierarchy: true,
      rollupRuleCount: 1,
      scienceRollupMinimumSignals: 2,
      failures: [],
    })
    expect(auditQl7SupportHumanTopicOntology().dominanceEdgeCount).toBeGreaterThanOrEqual(16)
  })
})
