import { describe, expect, test } from 'vitest'
import { presentQl7SupportDiagnostic } from '../../../lib/ql7-support/diagnosticPresentation.js'
import { assertNoQl7MachineLeak } from '../../../lib/ql7-support/evidencePolicy.js'

describe('QL7 Support canonical.6 evidence-first semantic projection compatibility', () => {
  test('keeps QCoin evidence structured and does not manufacture a theft conclusion', () => {
    const projection = presentQl7SupportDiagnostic({
      topic: 'qcoin', locale: 'ru',
      diagnosticResult: { topic: 'qcoin', branch: 'qcoin_security_evidence', asOf: '2026-07-29T00:17:00Z', evidence: {
        accountFound: true, balance: 22041622.365, ledgerOperationCount: 9,
        outgoingOperationCount: 0, pendingOperationCount: 1,
        windowStart: '2026-07-27T00:00:00Z', windowEnd: '2026-07-29T00:00:00Z',
        amountProvided: false, timeScopeProvided: false, checkedAt: '2026-07-29T00:17:00Z',
      } },
    })
    expect(projection).toMatchObject({
      schema: 'ql7.support.diagnostic-semantic-projection',
      schemaVersion: '16.0.0',
      topic: 'qcoin',
      readyToSend: false,
      finalText: false,
      realizationOwner: 'response/humanNaturalRealizer.js',
    })
    expect(projection.summary).toBe('')
    expect(projection.tableSchema.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'balance', value: 22041622.365 }),
      expect.objectContaining({ key: 'outgoingOperationCount', value: 0 }),
      expect.objectContaining({ key: 'pendingOperationCount', value: 1 }),
    ]))
    expect(assertNoQl7MachineLeak(projection)).toBe(true)
  })

  test('keeps Ads evidence as facts rather than a ready-made package-status sentence', () => {
    const projection = presentQl7SupportDiagnostic({
      topic: 'ads_packages', locale: 'ru',
      diagnosticResult: { topic: 'ads', branch: 'active', active: true, asOf: '2026-07-29T00:17:00Z', evidence: {
        packageName: 'ELITE', active: true, packageStatus: 'active', campaignLimit: 50,
        usedCampaigns: 50, availableCampaigns: 0, activatedAt: '2025-12-27T20:54:00Z',
        expiresAt: '2026-12-27T20:54:00Z', daysLeft: 152,
      } },
    })
    expect(projection.readyToSend).toBe(false)
    expect(projection.summary).toBe('')
    expect(projection.tableSchema.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: 'packageName', value: 'ELITE' }),
      expect.objectContaining({ key: 'availableCampaigns', value: 0 }),
    ]))
    expect(assertNoQl7MachineLeak(projection)).toBe(true)
  })
})
