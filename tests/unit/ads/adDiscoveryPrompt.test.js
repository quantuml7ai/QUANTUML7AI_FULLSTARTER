import { describe, expect, test } from 'vitest'

import {
  AD_DISCOVERY_FIRST_DELAY_MS,
  AD_DISCOVERY_PROMPT_VARIANTS,
  AD_DISCOVERY_REPEAT_INTERVAL_MS,
  AD_DISCOVERY_VISIBLE_MS,
  buildAdDiscoveryVariantOrder,
  getAdDiscoveryThresholdMs,
} from '../../../lib/ads/adDiscoveryPrompt.js'

describe('ad discovery prompt schedule', () => {
  test('uses the requested 3s / 45s / 10s cadence', () => {
    expect(AD_DISCOVERY_FIRST_DELAY_MS).toBe(3000)
    expect(AD_DISCOVERY_REPEAT_INTERVAL_MS).toBe(45000)
    expect(AD_DISCOVERY_VISIBLE_MS).toBe(10000)
    expect(getAdDiscoveryThresholdMs(0)).toBe(3000)
    expect(getAdDiscoveryThresholdMs(1)).toBe(48000)
    expect(getAdDiscoveryThresholdMs(2)).toBe(93000)
  })

  test('ships seven distinct localized prompt key pairs', () => {
    expect(AD_DISCOVERY_PROMPT_VARIANTS).toHaveLength(7)
    expect(new Set(AD_DISCOVERY_PROMPT_VARIANTS.map((row) => row.titleKey)).size).toBe(7)
    expect(new Set(AD_DISCOVERY_PROMPT_VARIANTS.map((row) => row.bodyKey)).size).toBe(7)
  })

  test('builds a complete non-repeating randomized cycle', () => {
    const values = [0.51, 0.76]
    const order = buildAdDiscoveryVariantOrder(7, () => values.shift() ?? 0)
    expect(order).toHaveLength(7)
    expect(new Set(order).size).toBe(7)
    expect([...order].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})
