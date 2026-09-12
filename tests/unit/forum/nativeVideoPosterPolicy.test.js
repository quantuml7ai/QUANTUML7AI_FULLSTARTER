import { describe, expect, test } from 'vitest'
import {
  QL7_NATIVE_VIDEO_POSTER_HARD_BYTES,
  QL7_NATIVE_VIDEO_POSTER_MAX_EDGE,
  QL7_NATIVE_VIDEO_POSTER_TARGET_SECONDS,
  resolveNativeVideoPosterCacheKey,
  resolveNativeVideoPosterDimensions,
  resolveNativeVideoPosterTime,
} from '../../../lib/nativeVideoPoster.js'

describe('native video poster policy', () => {
  test('targets about two seconds for normal videos and stays inside short videos', () => {
    expect(resolveNativeVideoPosterTime(30)).toBe(QL7_NATIVE_VIDEO_POSTER_TARGET_SECONDS)
    expect(resolveNativeVideoPosterTime(2.5)).toBe(2)
    expect(resolveNativeVideoPosterTime(1)).toBeGreaterThan(0.3)
    expect(resolveNativeVideoPosterTime(1)).toBeLessThan(1)
    expect(resolveNativeVideoPosterTime(0.1)).toBe(0)
  })


  test('separates mirrored and unmirrored cache variants for the same camera blob', () => {
    const source = 'blob:https://quantuml7ai.test/front-camera'
    const mirrored = resolveNativeVideoPosterCacheKey(source, { mirrorX: true, maxEdge: 960 })
    const plain = resolveNativeVideoPosterCacheKey(source, { mirrorX: false, maxEdge: 960 })
    const smaller = resolveNativeVideoPosterCacheKey(source, { mirrorX: true, maxEdge: 720 })

    expect(mirrored).not.toBe(plain)
    expect(mirrored).not.toBe(smaller)
    expect(mirrored).toContain('mirror=1')
    expect(plain).toContain('mirror=0')
  })

  test('never upscales and bounds the long edge', () => {
    expect(resolveNativeVideoPosterDimensions(3840, 2160)).toEqual({ width: 960, height: 540, scale: 0.25 })
    expect(resolveNativeVideoPosterDimensions(1080, 1920)).toEqual({ width: 540, height: 960, scale: 0.5 })
    expect(resolveNativeVideoPosterDimensions(640, 360)).toEqual({ width: 640, height: 360, scale: 1 })
    expect(QL7_NATIVE_VIDEO_POSTER_MAX_EDGE).toBe(960)
    expect(QL7_NATIVE_VIDEO_POSTER_HARD_BYTES).toBe(768 * 1024)
  })
})
