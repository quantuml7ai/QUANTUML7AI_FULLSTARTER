import { describe, expect, it } from 'vitest'
import { executeQl7SupportTurnRuntime } from '../../lib/ql7-support/runtime/executeTurn.js'
import { executeQl7SupportScenario } from '../../lib/ql7-support/simulation/executeScenario.js'

const NOW = '2026-08-15T00:00:00.000Z'
const INPUT = 'расскажи про море'

describe('QL7 Support canonical knowledge runtime/simulation regression', () => {
  it('keeps the general-knowledge realization path executable in the canonical runtime', async () => {
    const runtime = await executeQl7SupportTurnRuntime({
      requestId: 'canonical-runtime', conversationId: 'canonical-runtime', turnId: 'canonical-runtime-turn',
      actorIdHash: 'canonical-runtime-actor', text: INPUT, locale: 'ru', now: NOW,
    })
    expect(runtime.discoursePlan.branchId).toBe('dialogue.general-knowledge')
    expect(runtime.realized.text).toBeTruthy()
    expect(runtime.qualityGate.decision).not.toBe('regenerate')
  })

  it('keeps the same knowledge branch reachable through the production-parity simulation adapter', async () => {
    const actor = Object.freeze({
      valid: true,
      authMode: 'laboratory_verified_actor',
      canonicalAccountId: 'simulation:canonical-runtime-scope',
      actorReceiptId: 'actor-receipt:canonical-runtime-scope',
    })
    const requestBoundary = Object.freeze({
      originDecisionReceiptId: 'origin-receipt:canonical-runtime-scope',
      rateLimitBucketId: 'rate-bucket:canonical-runtime-scope',
      idempotencyKeyHash: 'canonical-runtime-scope-idempotency',
    })
    const simulation = await executeQl7SupportScenario({
      id: 'canonical-runtime-scope', locale: 'ru', input: INPUT, seed: 'canonical-runtime-scope', now: NOW,
      actor, requestBoundary, clientMutationId: 'simulation:canonical-runtime-scope',
      routeId: 'lab.simulation.turn', sourceRouteId: 'lab.simulation.turn',
      sourceSurfaceId: 'laboratory.production-parity',
    })
    expect(simulation.result.runtimeParity.sameExecutor).toBe(true)
    expect(simulation.productionTurn.runtime.discoursePlan.branchId).toBe('dialogue.general-knowledge')
    expect(simulation.productionTurn.delivery.textHash).toBeTruthy()
    expect(simulation.oracle.productionDeliveryParity.ok).toBe(true)
  })
})
