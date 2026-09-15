import {describe, expect, it} from 'vitest'
import {executeQl7SupportProductionTurn} from '../../lib/ql7-support/runtime/productionTurn.js'
import {executeQl7SupportScenario} from '../../lib/ql7-support/simulation/executeScenario.js'

const text = 'metamrket che eto voobshe'

const neuralProviderOptions = Object.freeze({
  fetchImpl: async () => { throw new Error('production_model_gateway_must_not_be_called') },
})

describe('QL7 Support deterministic understanding production/lab parity', () => {
  it('uses the same signed JS calibration while ignoring laboratory model provider injection', async () => {
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

    const productReceipt = production.runtime.analysis.deterministicUnderstandingReceipt
    const labReceipt = laboratory.result.analysis.deterministicUnderstandingReceipt
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
    expect(productReceipt).toMatchObject({
      runtimeMode: 'deterministic-js',
      externalInferenceUsed: false,
      modelWeightsUsed: false,
      onlineLearningUsed: false,
    })
    expect(labReceipt.calibrationHash).toBe(productReceipt.calibrationHash)
    expect(labReceipt.calibrationVersion).toBe(productReceipt.calibrationVersion)
    expect(laboratory.evidence.deterministicUnderstandingReceipt.receiptId).toBe(labReceipt.receiptId)
    expect(laboratory.oracle.ok).toBe(true)
  })
})
