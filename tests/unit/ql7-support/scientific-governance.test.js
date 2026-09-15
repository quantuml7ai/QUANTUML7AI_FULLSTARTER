import { describe, expect, test } from 'vitest'
import { auditQl7SupportScientificLabContract, runQl7SupportScientificSelfCheck } from '../../../lib/ql7-support/simulation/lab/scientificLabContract.js'
import { auditQl7SupportOntologyManifest } from '../../../lib/ql7-support/ontology/ontologyManifest.js'
import { auditQl7SupportMicrotopicOntology } from '../../../lib/ql7-support/ontology/microtopicOntology.js'
import { buildQl7DecisionMathReceipt, QL7_SUPPORT_DECISION_MATH_VERSION } from '../../../lib/ql7-support/semantics/decisionMath.js'
import { evaluatePowerAdequacy } from '../../../lib/ql7-support/simulation/lab/powerAnalysis.js'
import { punitiveFalsePositiveClaim } from '../../../lib/ql7-support/simulation/lab/statisticalEngine.js'
import { QL7_SUPPORT_REQUIRED_RELEASE_GATES } from '../../../lib/ql7-support/simulation/lab/releaseGate.js'

describe('QL7 Support REV.5.1 scientific governance', () => {
  test('has one reachable scientific owner contract for Gates A-K', async () => {
    const audit = auditQl7SupportScientificLabContract()
    expect(audit.ok).toBe(true)
    expect(audit.requiredGates).toEqual(['A','B','C','D','E','F','G','H','I','J','K'])
    expect(audit.coverageAxes).toHaveLength(18)
    expect(audit.metamorphicTransformCount).toBe(16)
    expect(audit.ownerCount).toBeGreaterThanOrEqual(40)
    const self = await runQl7SupportScientificSelfCheck()
    expect(self.ok).toBe(true)
    expect(self.ablationOk).toBe(true)
    expect(self.deltaDebugOk).toBe(true)
  })

  test('keeps ontology and source-backed microtopics machine-valid', () => {
    expect(auditQl7SupportOntologyManifest().ok).toBe(true)
    const micro = auditQl7SupportMicrotopicOntology()
    expect(micro.ok).toBe(true)
    expect(micro.microtopicCount).toBeGreaterThan(1000)
  })

  test('keeps semantic decision math evidence/cost/abstention explicit', () => {
    const receipt = buildQl7DecisionMathReceipt({
      text: 'Это учебная цитата, я не угрожаю пользователю',
      decisionKind: 'severe_safety',
      hasDeterministicEvidence: false,
      analysis: { topic: 'security', quotedSpeech: true, negatedThreat: true },
      memoryGraph: { activeTopicId: 'education' },
      domain: 'education',
      intentFamily: 'quoted_safety_discussion',
      scoring: {
        topicCandidates: [
          { topic: 'education', total: 8.2, components: { lexicalScore: 4.2, syntaxScore: 2, entityScore: 2 } },
          { topic: 'security', total: 1.8, components: { lexicalScore: 1.2, urgencyScore: .6 } },
        ],
        positiveSignals: [{ topic: 'education', signal: 'quoted_education_context', component: 'syntaxScore', value: 2 }],
        negativeSignals: [],
        confidenceMargin: 6.4,
        semanticEntropy: .18,
        calibrationCellSamples: 1000,
      },
    })
    expect(receipt.schemaVersion).toBe(QL7_SUPPORT_DECISION_MATH_VERSION)
    expect(receipt.semanticEvidencePresent).toBe(true)
    expect(receipt.posteriorMetrics.topProbability).toBeGreaterThan(0)
    expect(receipt.counterEvidence).toBeTruthy()
    expect(receipt.cost).toBeTruthy()
    expect(receipt.abstention).toBeTruthy()
    expect(receipt.coreference).toBeTruthy()
  })

  test('separates exact punitive claim from adequate power', () => {
    expect(punitiveFalsePositiveClaim({ falsePositives: 0, total: 300000 }).ok).toBe(true)
    expect(evaluatePowerAdequacy({ observedSample: 300000, baseline: .00001, minimumRegression: .00005, alpha: .05, power: .8 }).ok).toBe(true)
    expect(QL7_SUPPORT_REQUIRED_RELEASE_GATES).toEqual(['A','B','C','D','E','F','G','H','I','J','K'])
  })
})
