import { describe, expect, it } from 'vitest'
import { executeQl7SupportProductionTurn } from '../../lib/ql7-support/runtime/productionTurn.js'
import { executeQl7SupportScenario } from '../../lib/ql7-support/simulation/executeScenario.js'

const SCENARIO_ID = 'canonical-parity-scenario'
const ACTOR = Object.freeze({
  valid: true,
  authMode: 'laboratory_verified_actor',
  canonicalAccountId: `simulation:${SCENARIO_ID}`,
  actorReceiptId: 'actor-receipt:canonical-production-lab-parity',
})
const REQUEST_BOUNDARY = Object.freeze({
  originDecisionReceiptId: 'origin-receipt:canonical-production-lab-parity',
  rateLimitBucketId: 'rate-bucket:canonical-production-lab-parity',
  idempotencyKeyHash: 'canonical-production-lab-parity-idempotency-hash',
})
const NOW = '2026-08-15T00:00:00.000Z'
const INPUT = 'расскажи про море'
const CLIENT_MUTATION_ID = 'simulation:canonical-parity-scenario'

function productionInput() {
  return {
    mode: 'simulation',
    requestId: SCENARIO_ID,
    conversationId: SCENARIO_ID,
    userTurnId: `user:${SCENARIO_ID}`,
    caseId: 'case:simulation',
    selectedLocale: 'ru',
    originalText: INPUT,
    priorMemoryGraph: {},
    adapterReceipts: [],
    analysis: {},
    baseAnalysisTrust: false,
    route: {},
    actor: ACTOR,
    verifiedActorId: ACTOR.canonicalAccountId,
    actorReceiptId: ACTOR.actorReceiptId,
    profile: {},
    contacts: null,
    forceOperatorCase: false,
    now: NOW,
    seed: 'canonical-parity',
    priorMemoryGraph: null,
    priorNoveltyLedger: null,
    openCases: [],
    runtimeCapability: null,
    entryEvent: null,
    eventEnvelope: undefined,
    contextualFollowup: false,
    productionQuestionCode: '',
    clientMutationId: CLIENT_MUTATION_ID,
    routeId: 'lab.simulation.turn',
    sourceRouteId: 'lab.simulation.turn',
    sourceSurfaceId: 'laboratory.production-parity',
    requestBoundary: REQUEST_BOUNDARY,
  }
}

function scenarioInput() {
  return {
    id: SCENARIO_ID,
    locale: 'ru',
    input: INPUT,
    seed: 'canonical-parity',
    now: NOW,
    actor: ACTOR,
    requestBoundary: REQUEST_BOUNDARY,
    clientMutationId: CLIENT_MUTATION_ID,
    routeId: 'lab.simulation.turn',
    sourceRouteId: 'lab.simulation.turn',
    sourceSurfaceId: 'laboratory.production-parity',
  }
}

describe('QL7 Support REV.5.1 production/laboratory parity', () => {
  it('keeps the production boundary fail-closed when a laboratory-shaped direct call omits verified actor evidence', async () => {
    const invalid = productionInput()
    delete invalid.actor
    delete invalid.verifiedActorId
    delete invalid.actorReceiptId
    await expect(executeQl7SupportProductionTurn(invalid)).rejects.toThrow(/verified_actor_required,actor_receipt_required/u)
  })

  it('uses one production adapter with a production-shaped verified envelope and preserves final semantic hashes', async () => {
    const production = await executeQl7SupportProductionTurn(productionInput())
    const simulation = await executeQl7SupportScenario(scenarioInput())

    expect(production.runtimeInput.requestEnvelope.boundaryComplete).toBe(true)
    expect(simulation.productionTurn.runtimeInput.requestEnvelope.boundaryComplete).toBe(true)
    expect(production.runtimeInput.requestEnvelope.actorReceiptId).toBe(ACTOR.actorReceiptId)
    expect(simulation.productionTurn.runtimeInput.requestEnvelope.actorReceiptId).toBe(ACTOR.actorReceiptId)

    const productionParity = production.runtime.runtimeParity
    const simulationParity = simulation.result.runtimeParity
    expect(simulationParity.sameExecutor).toBe(true)
    for (const key of [
      'executorId',
      'behaviorManifestHash',
      'scopeReceiptHash',
      'semanticPlanHash',
      'discoursePlanHash',
      'qualityGateHash',
      'knowledgeReceiptHash',
    ]) {
      expect(simulationParity[key], key).toBe(productionParity[key])
    }

    expect(simulation.productionTurn.delivery.textHash).toBe(production.delivery.textHash)
    expect(simulation.productionTurn.delivery.surfaceHash).toBe(production.delivery.surfaceHash)
    expect(simulation.productionTurn.delivery.actionIds).toEqual(production.delivery.actionIds)
    expect(simulation.result.text).toBe(simulation.productionDelivery.text)
    expect(simulation.oracle.productionDeliveryParity.ok).toBe(true)
  })

  it('replays the same production-shaped input deterministically for parity-critical hashes', async () => {
    const first = await executeQl7SupportProductionTurn(productionInput())
    const second = await executeQl7SupportProductionTurn(productionInput())
    expect(second.runtime.runtimeParity).toEqual(first.runtime.runtimeParity)
    expect(second.delivery.textHash).toBe(first.delivery.textHash)
    expect(second.delivery.surfaceHash).toBe(first.delivery.surfaceHash)
    expect(second.delivery.actionIds).toEqual(first.delivery.actionIds)
  })
})
