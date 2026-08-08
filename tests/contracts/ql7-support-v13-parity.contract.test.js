import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support canonical production parity', () => {
  it('server, simulation, provider and live-read resolve one production adapter and one canonical runtime', () => {
    const server = read('lib/ql7-support/server.js')
    const scenario = read('lib/ql7-support/simulation/executeScenario.js')
    const provider = read('scripts/ql7-support/v14-provider-translate-smoke.mjs')
    const liveRead = read('lib/ql7-support/simulation/liveRead.js')
    const productionTurn = read('lib/ql7-support/runtime/productionTurn.js')

    for (const source of [server, scenario, provider, liveRead]) {
      expect(source).toContain('executeQl7SupportProductionTurn')
      expect(source).toContain('runtime/productionTurn.js')
      expect(source).not.toContain('executeTurnV14.js')
    }

    expect(server).toContain('finalizeQl7SupportProductionDelivery')
    expect(scenario).toContain('finalizeQl7SupportProductionDelivery')
    expect(provider).toContain('productionDelivery: productionTurn.delivery')
    expect(liveRead).toContain('const productionDelivery = productionTurn.delivery')
    expect(productionTurn).toContain("import { executeQl7SupportTurnRuntime } from './executeTurn.js'")
    expect(productionTurn).toContain('const runtime = executeQl7SupportTurnRuntime(runtimeInput, adapters)')
    expect(productionTurn).toContain("deliveryStage: 'final-user-visible'")
  })

  it('legacy V12/V13 paths are compatibility consumers, not production owners', () => {
    const v12 = read('lib/ql7-support/v12/factualSimulationV12.js')
    const facade = read('lib/ql7-support/v13/runtimeV13.js')
    const canonical = read('lib/ql7-support/runtime/executeTurn.js')
    expect(v12).toContain("from '../runtime/executeTurn.js'")
    expect(facade).toContain('compatibility facade')
    expect(facade).toContain("export * from '../runtime/executeTurn.js'")
    expect(canonical.match(/export function executeQl7SupportTurnRuntime\(/gu) || []).toHaveLength(1)
  })

  it('legacy planner is not a production server import', () => {
    expect(read('lib/ql7-support/server.js')).not.toContain("from './responsePlan.js'")
  })

  it('kill switch is fail closed', () => {
    const canonical = read('lib/ql7-support/config/featureFlag.js')
    const facade = read('lib/ql7-support/featureFlag.js')
    expect(canonical).toContain("=== '1'")
    expect(canonical).toContain('SUPPORT_ACTIVE')
    expect(facade).toContain("export * from './config/featureFlag.js'")
    expect(facade).toContain('compatibility facade')
  })

  it('every support message uses a SupportSurface', () => {
    const source = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    expect(source).toContain('Ql7SupportMessageSurface')
    expect(source).toContain('!fromIsSupport')
  })

  it('canonical writer is V4 with legacy readers', () => {
    const source = read('lib/ql7-support/contracts/supportCard.js')
    expect(source).toContain('QL7_SUPPORT_CARD_VERSION = 4')
    expect(source).toContain('validateQl7SupportCardV2')
    expect(source).toContain('buildQl7SupportCardV4')
    expect(read('lib/ql7-support/cards.js')).toContain('compatibility facade')
  })

  it('greeting and translation routes never write V3 cards', () => {
    const server = read('lib/ql7-support/server.js')
    const route = read('app/api/dm/support-card-translate/route.js')
    expect(server).toContain('card:buildQl7SupportCard({...unsigned,locale})')
    expect(route).toContain('buildQl7SupportCard({ ...unsigned, locale: targetLanguage })')
    expect(route).not.toContain('buildQl7SupportCardV3(')
  })
})
