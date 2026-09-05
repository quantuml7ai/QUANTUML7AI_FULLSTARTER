import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  classifyForumVideoProcessingPressure,
  detectForumVideoRuntime,
  QL7_MOBILE_VIDEO_APPLE_INPUT_CACHE_BYTES,
  QL7_MOBILE_VIDEO_APPLE_STEP_SECONDS,
  QL7_MOBILE_VIDEO_CHUNK_BYTES,
  QL7_MOBILE_VIDEO_EXECUTOR_ID,
  QL7_MOBILE_VIDEO_ROUTING_MARKER,
  QL7_MOBILE_VIDEO_WATCHDOG_MS,
  selectForumVideoExecutor,
} from '../../../lib/forumClientVideoRuntime'

const originalNavigator = globalThis.navigator
const originalWorker = globalThis.Worker
const originalVideoEncoder = globalThis.VideoEncoder
const originalVideoDecoder = globalThis.VideoDecoder

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalNavigator !== undefined) vi.stubGlobal('navigator', originalNavigator)
  if (originalWorker !== undefined) vi.stubGlobal('Worker', originalWorker)
  if (originalVideoEncoder !== undefined) vi.stubGlobal('VideoEncoder', originalVideoEncoder)
  if (originalVideoDecoder !== undefined) vi.stubGlobal('VideoDecoder', originalVideoDecoder)
})

describe('mobile video Worker/OPFS runtime R22 iPhone AVC one-shot streaming', () => {
  test('routes capable iPhone/iPad HEVC and proven Apple AVC pressure to Worker/OPFS', () => {
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      platform: 'iPhone',
      maxTouchPoints: 5,
      storage: { getDirectory: vi.fn() },
    })
    vi.stubGlobal('Worker', function Worker() {})
    vi.stubGlobal('VideoEncoder', function VideoEncoder() {})
    vi.stubGlobal('VideoDecoder', function VideoDecoder() {})

    const runtime = detectForumVideoRuntime()
    expect(runtime.appleMobile).toBe(true)
    expect(runtime.mobile).toBe(true)
    expect(runtime.workerSupported).toBe(true)
    expect(runtime.opfsSupported).toBe(true)
    expect(runtime.webCodecsSupported).toBe(true)
    expect(selectForumVideoExecutor({ runtime, pressure: { catastrophic: true, hevc: true } })).toBe('mobile-worker-opfs')
    expect(selectForumVideoExecutor({ runtime, pressure: { hevc: false, appleAvcPressureCandidate: true } })).toBe('mobile-worker-opfs')
    expect(QL7_MOBILE_VIDEO_EXECUTOR_ID).toBe('ql7-mobile-video-worker-opfs-r22-iphone-avc-one-shot')
    expect(QL7_MOBILE_VIDEO_ROUTING_MARKER).toBe('QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL')
    expect(QL7_MOBILE_VIDEO_CHUNK_BYTES).toBe(1024 * 1024)
    expect(QL7_MOBILE_VIDEO_APPLE_INPUT_CACHE_BYTES).toBe(2 * 1024 * 1024)
    expect(QL7_MOBILE_VIDEO_APPLE_STEP_SECONDS).toBe(0.5)
    expect(QL7_MOBILE_VIDEO_WATCHDOG_MS).toBe(120000)
  })

  test('classifies the exact observed iPhone AVC High@5.1 4K30 handoff as Apple pressure', () => {
    const pressure = classifyForumVideoProcessingPressure({
      codedWidth: 3840,
      codedHeight: 2160,
      sourceFrameRate: 30,
      videoCodec: 'avc',
      videoCodecString: 'avc1.640033',
      hevcSource: false,
      rotation: 0,
      durationSeconds: 25,
    }, Math.round(49.1 * 1024 * 1024))
    expect(pressure.hevc).toBe(false)
    expect(pressure.avc).toBe(true)
    expect(pressure.uhd).toBe(true)
    expect(pressure.avcHighProfile).toBe(true)
    expect(pressure.avcHighLevel).toBe(true)
    expect(pressure.avcLevelIdc).toBe(0x33)
    expect(pressure.appleAvcPressureCandidate).toBe(true)
    expect(pressure.pixelsPerSecond).toBe(248_832_000)
  })

  test('also catches a 1080p Apple export when it carries the observed High@5.1 codec level', () => {
    const pressure = classifyForumVideoProcessingPressure({
      codedWidth: 1080,
      codedHeight: 1920,
      sourceFrameRate: 30,
      videoCodec: 'avc',
      videoCodecString: 'avc1.640033',
      hevcSource: false,
      durationSeconds: 30,
    }, 27_418_215)
    expect(pressure.uhd).toBe(false)
    expect(pressure.largeSource).toBe(false)
    expect(pressure.avcHighLevel).toBe(true)
    expect(pressure.appleAvcPressureCandidate).toBe(true)
  })

  test('keeps ordinary mobile H.264 on the legacy client executor and does not broaden Android', () => {
    const ordinary = classifyForumVideoProcessingPressure({
      codedWidth: 1920,
      codedHeight: 1080,
      sourceFrameRate: 30,
      videoCodec: 'avc',
      videoCodecString: 'avc1.640028',
      hevcSource: false,
    }, 20 * 1024 * 1024)
    expect(ordinary.appleAvcPressureCandidate).toBe(false)

    const apple = {
      mobile: true, appleMobile: true, androidMobile: false,
      workerSupported: true, opfsSupported: true, webCodecsSupported: true,
    }
    const android = { ...apple, appleMobile: false, androidMobile: true }
    expect(selectForumVideoExecutor({ runtime: apple, pressure: ordinary })).toBe('mobile-legacy-fallback')
    expect(selectForumVideoExecutor({ runtime: android, pressure: { ...ordinary, appleAvcPressureCandidate: true } })).toBe('mobile-legacy-fallback')
  })

  test('fails closed instead of returning the proven legacy path when Apple AVC pressure lacks safe capabilities', () => {
    const runtime = {
      mobile: true,
      appleMobile: true,
      androidMobile: false,
      workerSupported: true,
      opfsSupported: false,
      webCodecsSupported: true,
    }
    expect(selectForumVideoExecutor({ runtime, pressure: { hevc: false, appleAvcPressureCandidate: true } })).toBe('mobile-safe-unavailable')
    expect(selectForumVideoExecutor({ runtime: { mobile: false }, pressure: { hevc: false, appleAvcPressureCandidate: true } })).toBe('desktop-buffer')
  })
})
