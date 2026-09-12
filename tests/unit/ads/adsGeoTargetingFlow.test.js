import { describe, expect, it } from 'vitest'
import {
  countAdsGeoRegions,
  getAdsGeoConfirmationState,
  isAdsCampaignBasicsReady,
  normalizeAdsGeoCountries,
  normalizeAdsGeoRegions,
} from '../../../lib/adsGeoTargetingFlow'

describe('ads geo targeting flow', () => {
  it('keeps the existing link-only creative path eligible for the geo step', () => {
    expect(
      isAdsCampaignBasicsReady({
        hasActivePkg: true,
        name: 'Campaign',
        clickUrl: 'https://example.com',
      }),
    ).toBe(true)

    expect(
      isAdsCampaignBasicsReady({
        hasActivePkg: true,
        name: 'Campaign',
        clickUrl: '',
      }),
    ).toBe(false)
  })

  it('normalizes countries and regions without mutating business payload shape', () => {
    expect(normalizeAdsGeoCountries(['ua', 'US', 'ua', '', null])).toEqual([
      'UA',
      'US',
    ])
    expect(
      normalizeAdsGeoRegions({
        ua: ['od', 'KY', 'od'],
        us: [],
      }),
    ).toEqual({
      UA: ['OD', 'KY'],
    })
    expect(countAdsGeoRegions({ UA: ['OD', 'KY'], US: ['CA'] })).toBe(3)
  })

  it('blocks confirmation without a country or above the package limit', () => {
    expect(
      getAdsGeoConfirmationState({
        countries: [],
        remaining: 3,
      }),
    ).toMatchObject({
      missing: true,
      limitExceeded: false,
      canConfirm: false,
    })

    expect(
      getAdsGeoConfirmationState({
        countries: ['UA', 'US'],
        remaining: 1,
      }),
    ).toMatchObject({
      missing: false,
      limitExceeded: true,
      canConfirm: false,
    })

    expect(
      getAdsGeoConfirmationState({
        countries: ['UA'],
        remaining: 1,
      }),
    ).toMatchObject({
      missing: false,
      limitExceeded: false,
      canConfirm: true,
    })
  })
})
