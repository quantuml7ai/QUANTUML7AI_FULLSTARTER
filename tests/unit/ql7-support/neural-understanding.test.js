import {describe, expect, it} from 'vitest'
import {enrichQl7SupportSemanticUnderstanding} from '../../../lib/ql7-support/neural/understandingCoordinator.js'
import {validateQl7SupportNeuralUnderstanding} from '../../../lib/ql7-support/neural/understandingContract.js'

function proposal(overrides = {}) {
  return {
    schemaVersion: '2.0.0',
    detectedLocale: 'ru',
    hypotheses: [{
      topicId: 'metamarket',
      openTopicClass: '',
      subject: 'metamrket',
      messageAct: 'informational_question',
      goalId: 'explain_overview',
      confidence: 0.94,
      evidenceSpans: ['metamrket'],
      counterEvidenceCodes: ['no-personal-scope'],
      ...(overrides.hypothesis || {}),
    }],
    dialoguePlan: {
      responseMode: 'direct_answer',
      stance: 'warm',
      detailLevel: 'standard',
      ...(overrides.dialoguePlan || {}),
    },
    ...(overrides.root || {}),
  }
}

function baseline() {
  return Object.freeze({
    version: 'test-baseline',
    locale: 'ru',
    safety: Object.freeze({category: 'none'}),
    tone: Object.freeze({}),
    route: Object.freeze({topic: 'support_system', messageAct: 'ambiguous_request', requiredAdapter: ''}),
    analysis: Object.freeze({
      topic: 'support_system',
      messageAct: 'ambiguous_request',
      role: 'ambiguous_request',
      safety: Object.freeze({category: 'none', operatorRequired: false, selfHarm: false, threat: false}),
      adapterEligibility: Object.freeze({mongoReadAllowed: false}),
      requiresAdapter: false,
      needsChoice: true,
      clarificationRequired: true,
      userClarificationRequired: true,
      fingerprint: 'baseline-fingerprint',
    }),
  })
}

describe('QL7 Support bounded native neural understanding', () => {
  it('accepts only the current semantic-hypothesis schema and rejects final text or fact payloads', () => {
    const valid = validateQl7SupportNeuralUnderstanding(proposal(), {sourceText: 'metamrket che eto voobshe'})
    expect(valid.ok).toBe(true)
    expect(valid.value.schemaVersion).toBe('2.0.0')
    const invalid = validateQl7SupportNeuralUnderstanding(proposal({root: {finalText: 'Invented answer'}}), {
      sourceText: 'metamrket che eto voobshe',
    })
    expect(invalid.ok).toBe(false)
    expect(invalid.failures).toContain('response:unexpected_key:finalText')
  })

  it('forbids injected external/provider intelligence from overriding canonical semantics', async () => {
    const semantic = await enrichQl7SupportSemanticUnderstanding({
      semantic: baseline(),
      text: 'metamrket che eto voobshe',
      locale: 'ru',
      provider: async () => ({status: 'ok', output: proposal()}),
    })
    expect(semantic.analysis).toMatchObject({
      topic: 'support_system',
      messageAct: 'ambiguous_request',
      requiresAdapter: false,
      needsChoice: true,
    })
    expect(semantic.analysis.neuralUnderstandingReceipt).toMatchObject({
      disposition: 'deterministic_fallback_native_unavailable',
      neuralInfluenceApplied: false,
      adapterAuthorizationGranted: false,
      factsChanged: false,
      safetyChanged: false,
    })
  })

  it('never lets an injected model-only personal-read proposal open Mongo', async () => {
    const semantic = await enrichQl7SupportSemanticUnderstanding({
      semantic: baseline(),
      text: 'qcoin maybe mine',
      locale: 'en',
      provider: async () => ({
        status: 'ok',
        output: proposal({
          hypothesis: {
            topicId: 'qcoin',
            subject: 'qcoin',
            messageAct: 'personal_status_request',
            goalId: 'personal_read',
            confidence: 0.97,
            evidenceSpans: ['qcoin'],
            counterEvidenceCodes: ['no-explicit-action'],
          },
        }),
      }),
    })
    expect(semantic.analysis.topic).toBe('support_system')
    expect(semantic.analysis.requiresAdapter).toBe(false)
    expect(semantic.analysis.adapterEligibility.mongoReadAllowed).toBe(false)
    expect(semantic.analysis.neuralUnderstandingReceipt).toMatchObject({
      disposition: 'deterministic_fallback_native_unavailable',
      adapterAuthorizationGranted: false,
      neuralInfluenceApplied: false,
    })
  })
})
