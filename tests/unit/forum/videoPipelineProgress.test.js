import { describe, expect, test } from 'vitest'

import {
  VIDEO_PIPELINE_PROGRESS_POLICY_ID,
  VIDEO_PIPELINE_PROGRESS_RANGES,
  mapVideoFinalizingProgress,
  mapVideoPrepareProgress,
  mapVideoReadyProgress,
  mapVideoUploadProgress,
  normalizeVideoProgressFraction,
} from '../../../lib/videoPipelineProgress.js'

describe('truthful video pipeline progress policy', () => {
  test('maps the first real encoding attempt across the visible 10-88 percent range', () => {
    expect(VIDEO_PIPELINE_PROGRESS_POLICY_ID).toBe('ql7-video-pipeline-progress-v1')
    expect(VIDEO_PIPELINE_PROGRESS_RANGES.processing).toEqual([10, 88])

    expect(mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, maxAttempts: 3, progress: 0 }).percent).toBe(10)
    expect(mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, maxAttempts: 3, progress: 0.5 }).percent).toBe(49)
    expect(mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, maxAttempts: 3, progress: 1 }).percent).toBe(88)
  })

  test('keeps retry, verification, upload and finalization monotonic without jumping to 100 early', () => {
    const retry = mapVideoPrepareProgress({ stage: 'retrying', attempt: 1, maxAttempts: 3, progress: 0 }, 88)
    const verify = mapVideoPrepareProgress({ stage: 'verifying', progress: 0.5 }, retry.percent)
    const upload = mapVideoUploadProgress(50, verify.percent)
    const finalizing = mapVideoFinalizingProgress(upload.percent)
    const ready = mapVideoReadyProgress()

    expect(retry.percent).toBeGreaterThanOrEqual(88)
    expect(verify.percent).toBeGreaterThanOrEqual(retry.percent)
    expect(upload).toEqual(expect.objectContaining({ phase: 'uploading', percent: 96.5, rawProgress: 0.5 }))
    expect(finalizing).toEqual(expect.objectContaining({ phase: 'finalizing', percent: 99 }))
    expect(ready).toEqual(expect.objectContaining({ phase: 'ready', percent: 100 }))
  })

  test('normalizes fraction and percent input and never moves backwards', () => {
    expect(normalizeVideoProgressFraction(0.4)).toBe(0.4)
    expect(normalizeVideoProgressFraction(40)).toBe(0.4)
    expect(normalizeVideoProgressFraction(500)).toBe(1)

    const mapped = mapVideoPrepareProgress({ stage: 'encoding', attempt: 1, progress: 0.1 }, 70)
    expect(mapped.percent).toBe(70)
  })
})
