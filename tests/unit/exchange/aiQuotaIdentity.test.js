import { describe, expect, test } from 'vitest'

import {
  AI_QUOTA_LIMIT_SEC,
  normalizeQuotaAccount,
  normalizeQuotaIp,
  needsQuotaIdentitySync,
  planQuotaIncrement,
  resolveEffectiveQuotaUsage,
  selectQuotaClientIp,
} from '../../../lib/exchange/aiQuotaIdentity.js'

describe('AI quota IP + account identity policy', () => {
  test('uses the stricter usage from IP or account', () => {
    expect(resolveEffectiveQuotaUsage({
      ipUsedSec: 550,
      accountUsedSec: 120,
    })).toBe(550)
    expect(resolveEffectiveQuotaUsage({
      ipUsedSec: 90,
      accountUsedSec: 430,
    })).toBe(430)
  })

  test('caps the shared identity at ten minutes', () => {
    expect(planQuotaIncrement({
      ipUsedSec: 550,
      accountUsedSec: 550,
      deltaSec: 90,
    })).toMatchObject({
      currentUsedSec: 550,
      addedSec: 50,
      nextUsedSec: AI_QUOTA_LIMIT_SEC,
      remainingSec: 0,
      capped: true,
    })
  })

  test('carries consumed IP quota into a new account identity', () => {
    expect(planQuotaIncrement({
      ipUsedSec: 550,
      accountUsedSec: 0,
      deltaSec: 1,
    })).toMatchObject({
      currentUsedSec: 550,
      nextUsedSec: 551,
      remainingSec: 49,
    })
  })

  test('carries consumed account quota into a new IP identity', () => {
    expect(planQuotaIncrement({
      ipUsedSec: 0,
      accountUsedSec: 599,
      deltaSec: 1,
    })).toMatchObject({
      currentUsedSec: 599,
      nextUsedSec: 600,
      remainingSec: 0,
    })
  })

  test('marks different IP and account counters for zero-delta identity binding', () => {
    expect(needsQuotaIdentitySync({
      ipUsedSec: 600,
      accountUsedSec: 0,
      hasAccount: true,
    })).toBe(true)
    expect(needsQuotaIdentitySync({
      ipUsedSec: 600,
      accountUsedSec: 600,
      hasAccount: true,
    })).toBe(false)
  })

  test('prefers trusted proxy headers before generic forwarded-for', () => {
    const headers = new Headers({
      'cf-connecting-ip': '203.0.113.8',
      'x-vercel-forwarded-for': '198.51.100.4',
      'x-forwarded-for': '192.0.2.9, 10.0.0.2',
    })
    expect(selectQuotaClientIp(headers)).toBe('203.0.113.8')
  })

  test('normalizes wallet accounts and rejects unsafe IP characters', () => {
    expect(normalizeQuotaAccount(' 0xABCDEFabcdefABCDEFabcdefABCDEFabcdefABCD ')).toBe(
      '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    )
    expect(normalizeQuotaIp(' 203.0.113.7<script> ')).toBe('203.0.113.7c')
  })
})
