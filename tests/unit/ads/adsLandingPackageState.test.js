import { describe, expect, test } from 'vitest'

import {
  canOpenAdsLandingCabinet,
  getAdsLandingPackageSnapshot,
} from '../../../lib/adsLandingPackageState.js'

describe('ads landing package state', () => {
  test('keeps the personal cabinet locked when no package was purchased', () => {
    expect(getAdsLandingPackageSnapshot(null)).toMatchObject({
      exists: false,
      active: false,
      expired: false,
    })
    expect(canOpenAdsLandingCabinet({ packageInfo: null })).toBe(false)
  })

  test('normalizes an active package and derives its remaining time', () => {
    const now = Date.parse('2026-07-21T10:00:00.000Z')
    const pkg = {
      pkgType: 'ELITE',
      status: 'active',
      startsAt: '2026-07-20T10:00:00.000Z',
      expiresAt: '2026-07-23T10:00:00.000Z',
      maxCampaigns: 50,
      usedCampaigns: 3,
    }

    expect(getAdsLandingPackageSnapshot(pkg, now)).toEqual({
      exists: true,
      active: true,
      expired: false,
      type: 'elite',
      status: 'active',
      startsAt: '2026-07-20T10:00:00.000Z',
      expiresAt: '2026-07-23T10:00:00.000Z',
      daysLeft: 2,
      maxCampaigns: 50,
      usedCampaigns: 3,
    })
  })

  test('marks a package expired by time while retaining cabinet history access', () => {
    const now = Date.parse('2026-07-21T10:00:00.000Z')
    const pkg = {
      type: 'pro',
      status: 'active',
      expiresAt: '2026-07-20T10:00:00.000Z',
    }

    expect(getAdsLandingPackageSnapshot(pkg, now)).toMatchObject({
      exists: true,
      active: false,
      expired: true,
      type: 'pro',
      daysLeft: 0,
    })
    expect(canOpenAdsLandingCabinet({ packageInfo: pkg, nowMs: now })).toBe(true)
  })

  test('keeps test mode cabinet access available without a paid package', () => {
    expect(
      canOpenAdsLandingCabinet({ testMode: true, packageInfo: null }),
    ).toBe(true)
  })
})
