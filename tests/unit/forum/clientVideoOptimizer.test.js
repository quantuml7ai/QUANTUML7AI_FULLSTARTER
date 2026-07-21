import { describe, expect, test } from 'vitest'
import {
  FORUM_CLIENT_VIDEO_OPTIMIZER_MIN_TARGET_BYTES,
  FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES,
  FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES,
  QL7_CLIENT_VIDEO_POLICY_ID,
  buildForumOptimizedVideoName,
  calculateForumVideoAdaptiveTargetBytes,
  calculateForumVideoBitratePlan,
  calculateForumVideoTargetDimensions,
  classifyForumVideoUploadRequest,
  hasForumMp4FastStart,
  readForumMp4TopLevelAtoms,
  selectForumVideoEncodingProfile,
} from '../../../lib/forumClientVideoOptimizer.js'

const MIB = 1024 * 1024

function atom(type, payloadBytes = 0) {
  const bytes = new Uint8Array(8 + payloadBytes)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, bytes.length, false)
  for (let index = 0; index < 4; index += 1) bytes[4 + index] = type.charCodeAt(index)
  return bytes
}

describe('forumClientVideoOptimizer V4 policy', () => {
  test('declares the calibrated 27 MiB preferred target and 30 MiB hard ceiling', () => {
    expect(QL7_CLIENT_VIDEO_POLICY_ID).toBe('ql7-client-video-streaming-v4')
    expect(FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES).toBe(27 * MIB)
    expect(FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES).toBe(30 * MIB)
    expect(FORUM_CLIENT_VIDEO_OPTIMIZER_MIN_TARGET_BYTES).toBe(3 * MIB)
  })

  test('maps landscape, portrait and square media into even streaming boxes without upscaling', () => {
    expect(calculateForumVideoTargetDimensions(3840, 2160)).toEqual(expect.objectContaining({
      portrait: false,
      width: 1280,
      height: 720,
    }))
    expect(calculateForumVideoTargetDimensions(2160, 3840)).toEqual(expect.objectContaining({
      portrait: true,
      width: 720,
      height: 1280,
    }))
    expect(calculateForumVideoTargetDimensions(641, 641)).toEqual(expect.objectContaining({
      width: 640,
      height: 640,
      scale: 1,
    }))
  })

  test('uses duration-sensitive budgets instead of inflating short compatible sources', () => {
    const shortTarget = calculateForumVideoAdaptiveTargetBytes({ durationSeconds: 15, sourceBytes: 50 * MIB })
    const twoMinuteTarget = calculateForumVideoAdaptiveTargetBytes({ durationSeconds: 120, sourceBytes: 900 * MIB })
    const compactSourceTarget = calculateForumVideoAdaptiveTargetBytes({ durationSeconds: 120, sourceBytes: 8 * MIB })

    expect(shortTarget).toBeGreaterThanOrEqual(3 * MIB)
    expect(shortTarget).toBeLessThan(10 * MIB)
    expect(twoMinuteTarget).toBe(27 * MIB)
    expect(compactSourceTarget).toBeLessThan(8 * MIB)
    expect(compactSourceTarget).toBeGreaterThan(7 * MIB)
  })

  test('preserves a quality floor by stepping down profile before starving 720p', () => {
    const medium = selectForumVideoEncodingProfile({
      durationSeconds: 180,
      sourceBytes: 900 * MIB,
      displayWidth: 3840,
      displayHeight: 2160,
      hasAudio: true,
    })
    const long = selectForumVideoEncodingProfile({
      durationSeconds: 240,
      sourceBytes: 900 * MIB,
      displayWidth: 3840,
      displayHeight: 2160,
      hasAudio: true,
    })

    expect(medium.profileId).toBe('720p24')
    expect(medium.bitratePlan.videoBitrate).toBeGreaterThanOrEqual(950_000)
    expect(long.profileId).toBe('540p24')
    expect(long.dimensions).toEqual(expect.objectContaining({ width: 960, height: 540 }))
    expect(long.bitratePlan.videoBitrate).toBeGreaterThanOrEqual(620_000)
  })

  test('calculates a clean 120-second bitrate plan under the calibrated target', () => {
    const plan = calculateForumVideoBitratePlan({
      durationSeconds: 120,
      targetOutputBytes: FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES,
      hasAudio: true,
      minimumVideoBitrate: 1_250_000,
    })

    expect(plan.videoBitrate).toBeGreaterThanOrEqual(1_250_000)
    expect(plan.audioBitrate).toBeGreaterThanOrEqual(64_000)
    expect(plan.videoBitrate + plan.audioBitrate + plan.muxReserve).toBeLessThanOrEqual(plan.totalBitrate)
  })

  test('classifies paperclip, camera and ads video while leaving images untouched', () => {
    expect(classifyForumVideoUploadRequest({ kind: 'forum_video', filename: 'iphone.mov' }).isVideo).toBe(true)
    expect(classifyForumVideoUploadRequest({ kind: 'ads_video', filename: 'creative.bin' }).isVideo).toBe(true)
    expect(classifyForumVideoUploadRequest({ kind: 'blob', contentType: 'video/webm' }).isVideo).toBe(true)
    expect(classifyForumVideoUploadRequest({ kind: 'forum_image', filename: 'photo.jpg', contentType: 'image/jpeg' }).isVideo).toBe(false)
    expect(classifyForumVideoUploadRequest({ kind: 'forum_video', videoPolicy: { mode: 'non-video' } }).isVideo).toBe(false)
  })

  test('creates deterministic non-duplicating FFMP MP4 names', () => {
    expect(buildForumOptimizedVideoName('IMG_0315.MOV')).toBe('IMG_0315_FFMP.mp4')
    expect(buildForumOptimizedVideoName('IMG_0315_FFMP.mp4')).toBe('IMG_0315_FFMP.mp4')
    expect(buildForumOptimizedVideoName('video')).toBe('video_FFMP.mp4')
  })

  test('parses flat MP4 atoms and proves true FastStart only when moov precedes mdat', async () => {
    const fast = new Blob([atom('ftyp'), atom('moov', 4), atom('mdat', 8)], { type: 'video/mp4' })
    const slow = new Blob([atom('ftyp'), atom('mdat', 8), atom('moov', 4)], { type: 'video/mp4' })
    const fragmented = new Blob([atom('ftyp'), atom('moov', 4), atom('moof'), atom('mdat', 8)], { type: 'video/mp4' })

    await expect(hasForumMp4FastStart(fast)).resolves.toBe(true)
    await expect(hasForumMp4FastStart(slow)).resolves.toBe(false)
    await expect(hasForumMp4FastStart(fragmented)).resolves.toBe(false)
    await expect(readForumMp4TopLevelAtoms(fast)).resolves.toEqual([
      expect.objectContaining({ type: 'ftyp', offset: 0 }),
      expect.objectContaining({ type: 'moov', offset: 8 }),
      expect.objectContaining({ type: 'mdat', offset: 20 }),
    ])
  })
})
