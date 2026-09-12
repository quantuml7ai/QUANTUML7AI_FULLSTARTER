import { describe, expect, test, vi } from 'vitest'

import {
  VIDEO_PIPELINE_PROGRESS_POLICY_ID,
  VIDEO_PIPELINE_PROGRESS_RANGES,
  enterVideoHeavyActivity,
  isVideoHeavyActivityActive,
  mapVideoFinalizingProgress,
  mapVideoPrepareProgress,
  mapVideoReadyProgress,
  mapVideoUploadProgress,
  normalizeVideoProgressFraction,
  subscribeVideoHeavyActivity,
} from '../../../lib/videoPipelineProgress.js'

describe('truthful video pipeline progress policy', () => {
  test('maps conversion, one-pass sampling and moderation into non-overlapping monotonic ranges', () => {
    expect(VIDEO_PIPELINE_PROGRESS_POLICY_ID).toBe('ql7-video-pipeline-progress-v2-single-pass')
    expect(VIDEO_PIPELINE_PROGRESS_RANGES.processing).toEqual([10, 84])
    expect(VIDEO_PIPELINE_PROGRESS_RANGES.sampling).toEqual([84, 88])
    expect(VIDEO_PIPELINE_PROGRESS_RANGES.moderating).toEqual([88, 94])

    expect(mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, progress: 0 }).percent).toBe(10)
    expect(mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, progress: 1 }).percent).toBe(78)
    expect(mapVideoPrepareProgress({ stage: 'verifying', progress: 1 }, 78).percent).toBe(84)
    expect(mapVideoPrepareProgress({ stage: 'sampling', progress: 0.5 }, 84)).toEqual(expect.objectContaining({ phase: 'processing', percent: 86 }))
    expect(mapVideoPrepareProgress({ stage: 'moderating', progress: 0.5 }, 86)).toEqual(expect.objectContaining({ phase: 'verifying', percent: 91 }))
    expect(mapVideoPrepareProgress({ stage: 'moderated', progress: 1 }, 91).percent).toBe(94)
  })

  test('keeps upload and finalization monotonic without jumping to 100 early', () => {
    const moderated = mapVideoPrepareProgress({ stage: 'moderated', progress: 1 }, 90)
    const upload = mapVideoUploadProgress(50, moderated.percent)
    const finalizing = mapVideoFinalizingProgress(upload.percent)
    const ready = mapVideoReadyProgress()

    expect(upload).toEqual(expect.objectContaining({ phase: 'uploading', percent: 96.5, rawProgress: 0.5 }))
    expect(finalizing).toEqual(expect.objectContaining({ phase: 'finalizing', percent: 99 }))
    expect(ready).toEqual(expect.objectContaining({ phase: 'ready', percent: 100 }))
  })

  test('heavy video activity is reference-counted, symmetric and observable', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeVideoHeavyActivity(listener)
    const leaveA = enterVideoHeavyActivity()
    const leaveB = enterVideoHeavyActivity()
    expect(isVideoHeavyActivityActive()).toBe(true)
    leaveA()
    expect(isVideoHeavyActivityActive()).toBe(true)
    leaveA()
    expect(isVideoHeavyActivityActive()).toBe(true)
    leaveB()
    expect(isVideoHeavyActivityActive()).toBe(false)
    unsubscribe()
    expect(listener).toHaveBeenCalledWith(true, 1)
    expect(listener).toHaveBeenCalledWith(true, 2)
    expect(listener).toHaveBeenLastCalledWith(false, 0)
  })

  test('normalizes fraction and percent input and never moves backwards', () => {
    expect(normalizeVideoProgressFraction(0.4)).toBe(0.4)
    expect(normalizeVideoProgressFraction(40)).toBe(0.4)
    expect(normalizeVideoProgressFraction(500)).toBe(1)

    const mapped = mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, progress: 0.1 }, 70)
    expect(mapped.percent).toBe(70)
  })
})
