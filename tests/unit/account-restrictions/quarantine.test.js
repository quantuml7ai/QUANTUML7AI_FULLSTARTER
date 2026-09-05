import { describe, expect, it } from 'vitest'
import records from '../../../lib/account-restrictions/quarantineRecord.cjs'

describe('REV5 quarantine', () => {
  it('requires deterministic evidence and uses server UTC three days', () => {
    expect(() => records.createQuarantineRecord({ accountId: 'a', proofLevel: 'suspected' })).toThrow(/deterministic/)
    expect(() => records.createQuarantineRecord({ accountId: 'a', proofLevel: 'deterministic' })).toThrow(/evidence/)

    const start = '2026-08-15T00:00:00.000Z'
    const r = records.createQuarantineRecord({
      accountId: 'a',
      proofLevel: 'deterministic',
      deterministicProofHash: 'deterministic-proof:a:2026-08-15',
      evidenceReceiptIds: ['economic-decision:a:1'],
      startedAt: start,
    })
    expect(r.expiresAt).toBe('2026-08-18T00:00:00.000Z')
    expect(records.projectQuarantine(r, Date.parse('2026-08-16T00:00:00Z')).active).toBe(true)
  })

  it('does not expose device or IP internals in public projection', () => {
    const r = records.createQuarantineRecord({
      accountId: 'a',
      proofLevel: 'deterministic',
      deterministicProofHash: 'deterministic-proof:a:privacy',
      evidenceReceiptIds: ['security-receipt:a:privacy'],
      evidence: { ip: '198.51.100.7', deviceId: 'device-secret' },
    })
    const p = records.projectQuarantine(r)
    expect(p).not.toHaveProperty('accountId')
    expect(p).not.toHaveProperty('ip')
    expect(JSON.stringify(p)).not.toContain('198.51.100.7')
    expect(JSON.stringify(p)).not.toContain('device-secret')
  })
})
