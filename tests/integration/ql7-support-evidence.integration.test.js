import { describe, expect, it } from 'vitest'
import { buildQl7SupportScenario } from '../../lib/ql7-support/simulation/scenarioCatalog.js'
import { executeQl7SupportScenario } from '../../lib/ql7-support/simulation/executeScenario.js'

describe('QL7 canonical full delivery evidence', () => {
  it('contains sealed committed delivery, state, policy and replay-compatible data', async () => {
    const scenario = buildQl7SupportScenario(0, { profile: 'gold', seed: 'contract' })
    const row = await executeQl7SupportScenario(scenario)
    expect(row.result.internalProvenance.resolvedExecutorPath).toBe('lib/ql7-support/runtime/executeTurn.js')
    expect(row.productionDelivery.receipt).toMatchObject({
      schemaVersion: '5.1.0',
      commitState: 'committed',
      finalMessageId: row.productionDelivery.finalMessageId,
    })
    expect(row.productionDelivery.surface.integrity.signature).toBe(row.productionDelivery.surfaceHash)
    expect(row.evidence.surface.primarySvg.assetId).toBeTruthy()
    expect(row.evidence.composerPolicy).toBeTruthy()
    expect(row.evidence.scopeReceipt.receiptHash).toBeTruthy()
    expect(row.evidence.qualityGate.decision).toMatch(/^allow/u)
    expect(row.oracle).toBeTruthy()
  })
})
