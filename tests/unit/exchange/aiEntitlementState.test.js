import { describe, expect, test } from 'vitest'

import {
  AI_ACCESS_MODE,
  AI_ENTITLEMENT_LIMIT_SEC,
  canAnalyzeWithEntitlement,
  createUnknownEntitlement,
  getQuotaReconciliationDelta,
  hydrateEntitlementSnapshot,
  mergeAuthoritativeEntitlement,
  tickEntitlementSnapshot,
} from '../../../lib/exchange/aiEntitlementState.js'

const NOW = Date.parse('2026-07-21T12:00:00.000Z')
const DATE = '20260721'

function freeSnapshot(overrides = {}) {
  return {
    ...createUnknownEntitlement(NOW),
    mode: AI_ACCESS_MODE.FREE,
    serverDate: DATE,
    usedSec: 120,
    remainingSec: 480,
    exhausted: false,
    authoritative: true,
    checkedAt: NOW,
    ...overrides,
  }
}

function exhaustedSnapshot(overrides = {}) {
  return freeSnapshot({
    mode: AI_ACCESS_MODE.EXHAUSTED,
    usedSec: AI_ENTITLEMENT_LIMIT_SEC,
    remainingSec: 0,
    exhausted: true,
    ...overrides,
  })
}

describe('AI entitlement state machine', () => {
  test('hydrates cached exhausted directly without a false free frame', () => {
    expect(
      hydrateEntitlementSnapshot({
        stored: { ...exhaustedSnapshot(), version: 2 },
        now: NOW,
      }).mode,
    ).toBe(AI_ACCESS_MODE.EXHAUSTED)
  })

  test('keeps exhausted on same-date refresh even when the server reports a lower value', () => {
    const next = mergeAuthoritativeEntitlement(
      exhaustedSnapshot(),
      { ok: true, date: DATE, usedSec: 10, limitSec: 600, remainingSec: 590 },
      { now: NOW + 1000 },
    )
    expect(next.mode).toBe(AI_ACCESS_MODE.EXHAUSTED)
    expect(next.usedSec).toBe(600)
  })

  test('keeps exhausted on network-shaped invalid payload', () => {
    expect(
      mergeAuthoritativeEntitlement(exhaustedSnapshot(), null, { now: NOW + 1000 }),
    ).toMatchObject({ mode: AI_ACCESS_MODE.EXHAUSTED, exhausted: true })
  })

  test('allows a new authoritative server date to reset exhausted', () => {
    const next = mergeAuthoritativeEntitlement(
      exhaustedSnapshot(),
      { ok: true, date: '20260722', usedSec: 0, limitSec: 600, remainingSec: 600 },
      { now: NOW + 86_400_000 },
    )
    expect(next).toMatchObject({ mode: AI_ACCESS_MODE.FREE, exhausted: false, usedSec: 0 })
  })


  test('ignores previous-day local usage when an authoritative new server date arrives', () => {
    const next = mergeAuthoritativeEntitlement(
      exhaustedSnapshot(),
      { ok: true, date: '20260722', usedSec: 4, limitSec: 600, remainingSec: 596 },
      { localUsedSec: 600, now: NOW + 86_400_000 },
    )
    expect(next).toMatchObject({
      mode: AI_ACCESS_MODE.FREE,
      exhausted: false,
      usedSec: 4,
      remainingSec: 596,
    })
  })

  test('hydrates a stale free snapshot as fail-closed unknown', () => {
    const hydrated = hydrateEntitlementSnapshot({
      stored: { ...freeSnapshot(), version: 2, checkedAt: NOW - 61_000 },
      now: NOW,
    })
    expect(hydrated).toMatchObject({
      mode: AI_ACCESS_MODE.UNKNOWN,
      authoritative: false,
      exhausted: false,
    })
  })

  test('promotes exhausted to VIP without erasing the preserved free quota usage', () => {
    const next = mergeAuthoritativeEntitlement(
      exhaustedSnapshot(),
      {
        ok: true,
        date: DATE,
        usedSec: 0,
        limitSec: null,
        remainingSec: null,
        isVip: true,
        unlimited: true,
        untilISO: '2026-08-21T12:00:00.000Z',
        daysLeft: 31,
      },
      { accountMarker: 'wallet-A', now: NOW },
    )
    expect(next).toMatchObject({ mode: AI_ACCESS_MODE.VIP, usedSec: 600, exhausted: true })
  })

  test('does not treat an expired VIP payload as free before quota is known', () => {
    const next = mergeAuthoritativeEntitlement(
      freeSnapshot({
        mode: AI_ACCESS_MODE.VIP,
        isVip: true,
        vipUntil: '2026-07-20T12:00:00.000Z',
        vipAccountMarker: 'wallet-A',
      }),
      {
        ok: true,
        date: DATE,
        isVip: true,
        unlimited: true,
        untilISO: '2026-07-20T12:00:00.000Z',
      },
      { accountMarker: 'wallet-A', now: NOW },
    )
    expect(next.mode).toBe(AI_ACCESS_MODE.UNKNOWN)
  })

  test('preserves monotonic used seconds on the same server date', () => {
    const next = mergeAuthoritativeEntitlement(
      freeSnapshot({ usedSec: 300, remainingSec: 300 }),
      { ok: true, date: DATE, usedSec: 210, limitSec: 600, remainingSec: 390 },
      { localUsedSec: 330, now: NOW + 1000 },
    )
    expect(next.usedSec).toBe(330)
    expect(next.remainingSec).toBe(270)
  })

  test('removes cached VIP when the authenticated account changes', () => {
    const hydrated = hydrateEntitlementSnapshot({
      stored: {
        ...freeSnapshot(),
        version: 2,
        mode: AI_ACCESS_MODE.VIP,
        isVip: true,
        vipUntil: '2026-08-21T12:00:00.000Z',
        vipAccountMarker: 'wallet-A',
      },
      accountMarker: 'wallet-B',
      now: NOW,
    })
    expect(hydrated.isVip).toBe(false)
    expect(hydrated.mode).toBe(AI_ACCESS_MODE.UNKNOWN)
  })

  test('preserves IP-based exhausted state when cached VIP belongs to another account', () => {
    const hydrated = hydrateEntitlementSnapshot({
      stored: {
        ...exhaustedSnapshot(),
        version: 2,
        mode: AI_ACCESS_MODE.VIP,
        isVip: true,
        vipUntil: '2026-08-21T12:00:00.000Z',
        vipAccountMarker: 'wallet-A',
      },
      accountMarker: 'wallet-B',
      now: NOW,
    })
    expect(hydrated).toMatchObject({ isVip: false, mode: AI_ACCESS_MODE.EXHAUSTED })
  })

  test('starts urgent state at exactly 59 seconds', () => {
    const atSixty = tickEntitlementSnapshot(
      freeSnapshot({ usedSec: 539, remainingSec: 61 }),
      1,
      NOW + 1000,
    )
    const atFiftyNine = tickEntitlementSnapshot(atSixty, 1, NOW + 2000)
    expect(atSixty).toMatchObject({ mode: AI_ACCESS_MODE.FREE, remainingSec: 60 })
    expect(atFiftyNine).toMatchObject({ mode: AI_ACCESS_MODE.FREE_URGENT, remainingSec: 59 })
  })

  test('moves immediately to exhausted at zero', () => {
    expect(
      tickEntitlementSnapshot(
        freeSnapshot({ mode: AI_ACCESS_MODE.FREE_URGENT, usedSec: 599, remainingSec: 1 }),
        1,
        NOW + 1000,
      ),
    ).toMatchObject({ mode: AI_ACCESS_MODE.EXHAUSTED, exhausted: true, remainingSec: 0 })
  })

  test('reconciles the terminal local batch when the same-day server usage is lower', () => {
    const delta = getQuotaReconciliationDelta(
      exhaustedSnapshot(),
      {
        ok: true,
        date: DATE,
        usedSec: 550,
        limitSec: 600,
        remainingSec: 50,
        isVip: false,
        unlimited: false,
      },
      NOW + 1000,
    )
    expect(delta).toBe(50)
  })

  test('does not reconcile quota across a new server date or an active VIP response', () => {
    expect(
      getQuotaReconciliationDelta(
        exhaustedSnapshot(),
        {
          ok: true,
          date: '20260722',
          usedSec: 0,
          limitSec: 600,
          remainingSec: 600,
        },
        NOW + 86_400_000,
      ),
    ).toBe(0)

    expect(
      getQuotaReconciliationDelta(
        exhaustedSnapshot(),
        {
          ok: true,
          date: DATE,
          usedSec: 0,
          limitSec: null,
          remainingSec: null,
          isVip: true,
          unlimited: true,
        },
        NOW + 1000,
      ),
    ).toBe(0)
  })

  test('allows Brain analysis only for free, urgent and VIP states', () => {
    expect(canAnalyzeWithEntitlement(AI_ACCESS_MODE.UNKNOWN)).toBe(false)
    expect(canAnalyzeWithEntitlement(AI_ACCESS_MODE.EXHAUSTED)).toBe(false)
    expect(canAnalyzeWithEntitlement(AI_ACCESS_MODE.FREE)).toBe(true)
    expect(canAnalyzeWithEntitlement(AI_ACCESS_MODE.FREE_URGENT)).toBe(true)
    expect(canAnalyzeWithEntitlement(AI_ACCESS_MODE.VIP)).toBe(true)
  })
})
