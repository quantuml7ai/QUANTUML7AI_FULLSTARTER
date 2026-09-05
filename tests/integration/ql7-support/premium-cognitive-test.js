import { describe, it, expect } from 'vitest'
import { runQl7SupportVipDiagnostic } from '../../../lib/ql7-support/vipResolver.js'
import { selectQl7SupportEntryGreetingCoordinated } from '../../../lib/ql7-support/greetingCoordinator.js'
import { realizeQl7HumanEntryGreetingStrategy } from '../../../lib/ql7-support/language/humanVariationPrimitives.js'

describe('QL7 Support canonical integration', () => {
  it('varies semantic greeting strategies deterministically and avoids a recent fingerprint', () => {
    const first = selectQl7SupportEntryGreetingCoordinated({ userId: 'u', locale: 'ru', entryNonce: '1' })
    const second = selectQl7SupportEntryGreetingCoordinated({ userId: 'u', locale: 'ru', entryNonce: '2', recentFingerprints: [first.fingerprint] })
    expect(first.readyToSend).toBe(false)
    expect(first.text).toBeUndefined()
    expect(second.fingerprint).not.toBe(first.fingerprint)
    expect(realizeQl7HumanEntryGreetingStrategy({ strategy: first, seed: 'integration:first' }).text).toBeTruthy()
  })

  it('VIP diagnostic is explicitly read-only even when unavailable', async () => {
    const result = await runQl7SupportVipDiagnostic({ userId: 'missing-test', aliases: [] })
    expect(result.readOnly).toBe(true)
    expect(result.businessCollectionsWritten).toEqual([])
  })
})
