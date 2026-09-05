import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('forum bounded session caches', () => {
  test('VIP probe cache has TTL and hard cap', () => {
    const src = read('app/forum/features/profile/hooks/useVipFlag.js')
    expect(src).toMatch(/VIP_PROBE_CACHE_LIMIT\s*=\s*1000/)
    expect(src).toMatch(/VIP_PROBE_TTL_MS\s*=\s*60\s*\*\s*1000/)
    expect(src).toContain('const VIP_BATCH_MAX = 250')
    expect(src).toContain('pruneBoundedMap(vipProbeOnce)')
    expect(src).toContain('scheduleNearestVipExpiry()')
    expect(src).toContain('for (const subscriber of vipSubscribers.values())')
    expect(src).not.toContain('vipObserved')
    expect(src).not.toContain('setInterval(')
  })

  test('ad slot histories have hard cap while existing media caches stay intact', () => {
    const src = read('app/forum/ForumAds.js')
    expect(src).toMatch(/ADS_SLOT_HISTORY_LIMIT\s*=\s*512/)
    expect(src).toContain('setBoundedSlotHistory(this.lastBySeedKey')
    expect(src).toContain('setBoundedSlotHistory(adMediaLastIndexByKey')
    expect(src).toContain('setBoundedSlotHistory(lastMediaIndexByKey')
    expect(src).toMatch(/imageProbeCache\.size\s*>\s*360/)
  })
})
