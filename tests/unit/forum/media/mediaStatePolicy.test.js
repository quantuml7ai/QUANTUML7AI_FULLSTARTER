import { describe, expect, test } from 'vitest'
import {
  shouldPersistGlobalMute,
  shouldKeepResidentPostVideo,
  computeSettlingUntil,
} from '@/app/forum/features/media/utils/mediaStatePolicy'

describe('mediaStatePolicy', () => {
  test('persists global mute only for approved sources', () => {
    expect(shouldPersistGlobalMute('forum-coordinator')).toBe(true)
    expect(shouldPersistGlobalMute('video')).toBe(true)
    expect(shouldPersistGlobalMute('forum-ads-toggle')).toBe(true)
    expect(shouldPersistGlobalMute('youtube')).toBe(false)
    expect(shouldPersistGlobalMute('qcast')).toBe(false)
    expect(shouldPersistGlobalMute('forum-ads-autoplay-fallback')).toBe(false)
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

  test('settling timestamp only moves forward', () => {
    const now = 1000
    const a = computeSettlingUntil(0, 500, now)
    const b = computeSettlingUntil(a, 200, now + 50)
    expect(a).toBe(1500)
    expect(b).toBe(1500)
  })
})