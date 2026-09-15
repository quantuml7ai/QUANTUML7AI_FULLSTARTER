import { describe, expect, test } from 'vitest'
import {
  shouldPersistGlobalMute,
  shouldKeepResidentPostVideo,
  computeSettlingUntil,
  selectNativeSrcBudgetSurvivors,
} from '../../../../app/forum/features/media/utils/mediaStatePolicy.js'

describe('mediaStatePolicy', () => {
  test('persists global mute only for approved sources', () => {
    expect(shouldPersistGlobalMute('forum-coordinator')).toBe(true)
    expect(shouldPersistGlobalMute('video')).toBe(true)
    expect(shouldPersistGlobalMute('forum-ads-toggle')).toBe(true)
    expect(shouldPersistGlobalMute('forum-ad-slot-toggle')).toBe(true)
    expect(shouldPersistGlobalMute('forum-ad-surface-activate')).toBe(true)
    expect(shouldPersistGlobalMute('site-ads-toggle')).toBe(true)
    expect(shouldPersistGlobalMute('site-ads-surface-activate')).toBe(true)
    expect(shouldPersistGlobalMute('ios-webkit-autoplay-fallback')).toBe(true)
    expect(shouldPersistGlobalMute('forum-ads-autoplay-fallback')).toBe(true)
    expect(shouldPersistGlobalMute('site-ads-autoplay-fallback')).toBe(true)
    expect(shouldPersistGlobalMute('youtube')).toBe(false)
    expect(shouldPersistGlobalMute('qcast')).toBe(false)
    expect(shouldPersistGlobalMute('external')).toBe(false)
  })

  test('keeps near/recent post videos resident', () => {
    expect(
      shouldKeepResidentPostVideo({
        isPostFeedVideo: true,
        hardUnloadRequested: false,
        recentTouchAgeMs: 3000,
        residentFlag: false,
        prewarmFlag: false,
      }),
    ).toBe(true)

    expect(
      shouldKeepResidentPostVideo({
        isPostFeedVideo: true,
        hardUnloadRequested: true,
        recentTouchAgeMs: 3000,
        residentFlag: true,
        prewarmFlag: true,
      }),
    ).toBe(false)
  })

  test('strict native src budget keeps playback plus one warm neighbor', () => {
    const rows = [
      { id: 'old-visible', visiblePx: 180, gapPx: 0, centerDist: 420, ready: true },
      { id: 'active', active: true, playing: true, visiblePx: 260, gapPx: 0, centerDist: 40, ready: true },
      { id: 'prewarm', nativePrewarm: true, visiblePx: 0, gapPx: 120, centerDist: 620, ready: false },
      { id: 'far-ready', visiblePx: 0, gapPx: 260, centerDist: 780, ready: true },
    ]

    expect(selectNativeSrcBudgetSurvivors(rows, 2).map((row) => row.id)).toEqual([
      'active',
      'prewarm',
    ])
  })

  test('strict native src budget honors the explicit keep target and never exceeds the cap', () => {
    const rows = [
      { id: 'visible-a', visiblePx: 220, gapPx: 0, centerDist: 90, ready: true },
      { id: 'keep-b', isKeep: true, visiblePx: 0, gapPx: 180, centerDist: 540, ready: false },
      { id: 'near-c', visiblePx: 120, gapPx: 0, centerDist: 260, ready: true },
    ]

    const survivors = selectNativeSrcBudgetSurvivors(rows, 2)
    expect(survivors).toHaveLength(2)
    expect(survivors.map((row) => row.id)).toContain('keep-b')
  })

  test('settling timestamp only moves forward', () => {
    const now = 1000
    const a = computeSettlingUntil(0, 500, now)
    const b = computeSettlingUntil(a, 200, now + 50)
    expect(a).toBe(1500)
    expect(b).toBe(1500)
  })
})