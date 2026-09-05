import {describe, expect, it} from 'vitest'
import {executeQl7SupportProductionTurn} from '../../lib/ql7-support/runtime/productionTurn.js'
import {executeQl7SupportScenario} from '../../lib/ql7-support/simulation/executeScenario.js'
import {loadQl7NativeModelManifest} from '../../lib/ql7-support/neural/modelManifest.js'

const text = 'metamrket che eto voobshe'

const nativeOutput = Object.freeze({
  schemaVersion: '2.0.0',
  detectedLocale: 'ru',
  hypotheses: [Object.freeze({
    topicId: 'metamarket',
    openTopicClass: '',
    subject: 'metamrket',
    messageAct: 'informational_question',
    goalId: 'explain_overview',
    confidence: 0.96,
    evidenceSpans: ['metamrket', 'che eto'],
    counterEvidenceCodes: ['no-personal-scope'],
  })],
  dialoguePlan: Object.freeze({responseMode: 'direct_answer', stance: 'warm', detailLevel: 'standard'}),
})

const manifest = Object.freeze({
  ...loadQl7NativeModelManifest({verifyArtifacts:false}),
  runtimeMode: 'loopback_rpc',
  endpoint: 'http://127.0.0.1:17888',
})
const fetchImpl = async () => Object.freeze({ok:true,json:async()=>nativeOutput})
const neuralProviderOptions = Object.freeze({manifest,fetchImpl})

describe('QL7 Support neural understanding production/lab parity', () => {
  it('uses the same local QL7 native gateway owner, decision and bounded authority in both paths', async () => {
    const production = await executeQl7SupportProductionTurn({
      mode: 'test',
      requestId: 'neural-parity',
      conversationId: 'neural-parity',
      userTurnId: 'neural-parity:user',
      selectedLocale: 'ru',
      originalText: text,
      actor: {
        valid: true,
        authMode: 'integration_verified_actor',
        canonicalAccountId: 'integration:neural-parity',
        actorReceiptId: 'actor-receipt:integration:neural-parity',
      },
      verifiedActorId: 'integration:neural-parity',
      actorReceiptId: 'actor-receipt:integration:neural-parity',
      now: '2026-08-23T10:00:00.000Z',
      seed: 'neural-parity',
      neuralProviderOptions,
    })
    const laboratory = await executeQl7SupportScenario({
      id: 'neural-parity',
      input: text,
      locale: 'ru',
      expected: {topic: 'metamarket', noAdapter: true},
      now: '2026-08-23T10:00:00.000Z',
      seed: 'neural-parity',
    }, {neuralProviderOptions})

    const productReceipt = production.runtime.analysis.neuralUnderstandingReceipt
    const labReceipt = laboratory.result.analysis.neuralUnderstandingReceipt
    expect(production.runtime.analysis).toMatchObject({
      topic: 'metamarket',
      messageAct: 'informational_question',
      requiresAdapter: false,
    })
    expect(laboratory.result.analysis).toMatchObject({
      topic: 'metamarket',
      messageAct: 'informational_question',
      requiresAdapter: false,
    })
    expect(productReceipt.disposition).toBe('safe_semantic_override')
    expect(labReceipt.disposition).toBe(productReceipt.disposition)
    expect(labReceipt.proposal.proposalHash).toBe(productReceipt.proposal.proposalHash)
    expect(productReceipt.providerId).toBe('ql7-native')
    expect(productReceipt.adapterAuthorizationGranted).toBe(false)
    expect(laboratory.evidence.neuralUnderstandingReceipt.receiptId).toBe(labReceipt.receiptId)
    expect(laboratory.oracle.ok).toBe(true)
  })
})
