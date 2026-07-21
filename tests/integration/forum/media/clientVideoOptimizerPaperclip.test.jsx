import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../app/forum/features/media/services/uploadR2MediaFile.js', () => ({
  default: vi.fn(),
}))

import useForumComposerAttachments from '../../../../app/forum/features/media/hooks/useForumComposerAttachments.js'
import resolveComposerMediaPayload from '../../../../app/forum/features/media/services/resolveComposerMediaPayload.js'
import uploadR2MediaFile from '../../../../app/forum/features/media/services/uploadR2MediaFile.js'

function createStateSetter(initial = 0) {
  let value = initial
  const setter = vi.fn((next) => {
    value = typeof next === 'function' ? next(value) : next
    return value
  })
  return { setter, read: () => value }
}

function createProps(overrides = {}) {
  return {
    mediaLocked: false,
    composerMediaKind: '',
    pendingImgs: [],
    pendingVideo: null,
    saveComposerScroll: vi.fn(),
    restoreComposerScroll: vi.fn(),
    beginMediaPipeline: vi.fn(() => new AbortController()),
    endMediaPipeline: vi.fn(),
    toast: { info: vi.fn(), error: vi.fn(), err: vi.fn(), warn: vi.fn(), success: vi.fn() },
    t: (key) => key,
    moderateImageFiles: vi.fn(),
    toastI18n: vi.fn(),
    reasonKey: vi.fn(),
    stopMediaProg: vi.fn(),
    setMediaPhase: vi.fn(),
    setMediaPct: vi.fn(),
    startSoftProgress: vi.fn(),
    setPendingImgs: vi.fn(),
    setOverlayMediaKind: vi.fn(),
    setOverlayMediaUrl: vi.fn(),
    setVideoState: vi.fn(),
    setVideoOpen: vi.fn(),
    viewerId: 'viewer-1',
    showVideoLimitOverlay: vi.fn(),
    readVideoDurationSecFn: vi.fn(async () => 119.8),
    forumVideoMaxSeconds: 300,
    setPendingVideo: vi.fn(),
    pendingVideoInfoRef: { current: { source: '', durationSec: Number.NaN } },
    pendingVideoBlobMetaRef: { current: new Map() },
    mediaCancelRef: { current: false },
    setVideoProgress: vi.fn(),
    ...overrides,
  }
}

function installObjectUrlStubs() {
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:paperclip-preview') })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  return () => {
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: originalCreate })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: originalRevoke })
  }
}

describe('paperclip deferred video gateway integration', () => {
  beforeEach(() => {
    vi.mocked(uploadR2MediaFile).mockReset()
  })

  test('selection creates a local fullscreen/composer preview without optimization, presign or upload', async () => {
    const restoreUrl = installObjectUrlStubs()
    const source = new File([new Uint8Array(835)], 'IMG_0315.MOV', { type: 'video/quicktime' })
    const props = createProps()

    try {
      const { result } = renderHook(() => useForumComposerAttachments(props))
      const target = { files: [source], value: 'selected' }

      await act(async () => {
        await result.current.onFilesChosen({ target })
      })

      await waitFor(() => expect(props.readVideoDurationSecFn).toHaveBeenCalledWith(source))
      expect(uploadR2MediaFile).not.toHaveBeenCalled()
      expect(props.beginMediaPipeline).not.toHaveBeenCalled()
      expect(props.setPendingVideo).toHaveBeenCalledWith('blob:paperclip-preview')
      expect(props.setOverlayMediaKind).toHaveBeenCalledWith('video')
      expect(props.setOverlayMediaUrl).toHaveBeenCalledWith('blob:paperclip-preview')
      expect(props.setVideoState).toHaveBeenCalledWith('preview')
      expect(props.setVideoOpen).toHaveBeenCalledWith(true)
      expect(props.pendingVideoBlobMetaRef.current.get('blob:paperclip-preview')).toEqual(expect.objectContaining({
        source: 'paperclip_preview',
        filename: 'IMG_0315.MOV',
        contentType: 'video/quicktime',
        sizeBytes: source.size,
        durationSec: 119.8,
      }))
      expect(target.value).toBe('')
    } finally {
      restoreUrl()
    }
  })

  test('send converts the selected local preview through the shared gateway and reports real progress', async () => {
    const source = new File([new Uint8Array(835)], 'IMG_0315.MOV', { type: 'video/quicktime' })
    const pct = createStateSetter(0)
    const phase = vi.fn()
    const meta = {
      source: 'paperclip_preview',
      filename: 'IMG_0315.MOV',
      contentType: 'video/quicktime',
      durationSec: 119.8,
    }

    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (url === 'blob:paperclip-preview') return { blob: async () => source }
      throw new Error(`unexpected fetch: ${url}`)
    }))

    vi.mocked(uploadR2MediaFile).mockImplementation(async (options) => {
      options.onPrepareProgress?.({ stage: 'encoding', attempt: 1, maxAttempts: 3, progress: 0.5 })
      options.onPrepareProgress?.({ stage: 'verifying', progress: 0.5 })
      options.onUploadProgress?.(50)
      return {
        url: 'https://cdn.test/optimized.mp4',
        preparation: {
          policyId: 'ql7-client-video-streaming-v4',
          optimized: true,
          durationSec: 119.8,
          width: 720,
          height: 1280,
          outputSizeBytes: 27 * 1024 * 1024,
          profileId: '720p30',
        },
      }
    })

    const result = await resolveComposerMediaPayload({
      pendingVideo: 'blob:paperclip-preview',
      pendingAudio: null,
      beginMediaPipeline: vi.fn(() => new AbortController()),
      mediaCancelRef: { current: false },
      pendingVideoRef: { current: 'blob:paperclip-preview' },
      pendingVideoInfoRef: { current: meta },
      pendingVideoBlobMetaRef: { current: new Map([['blob:paperclip-preview', meta]]) },
      emitDiag: vi.fn(),
      forumVideoMaxSeconds: 300,
      forumVideoCameraRecordEpsilonSec: 2,
      showVideoLimitOverlay: vi.fn(),
      endMediaPipeline: vi.fn(),
      viewerId: 'viewer-1',
      stopMediaProg: vi.fn(),
      setMediaPhase: phase,
      setVideoProgress: vi.fn(),
      setMediaPct: pct.setter,
      readAudioDurationSecFn: vi.fn(),
      forumAudioMaxSeconds: 300,
      toast: { err: vi.fn() },
      t: (key) => key,
      onFail: vi.fn(),
    })

    expect(uploadR2MediaFile).toHaveBeenCalledTimes(1)
    expect(uploadR2MediaFile).toHaveBeenCalledWith(expect.objectContaining({
      file: source,
      kind: 'forum_video',
      filename: 'IMG_0315.MOV',
      contentType: 'video/quicktime',
      signal: expect.any(AbortSignal),
      videoPolicy: expect.objectContaining({
        mode: 'video-required',
        source: 'paperclip_preview',
        maxDurationSeconds: 302,
      }),
      onPrepareProgress: expect.any(Function),
      onUploadProgress: expect.any(Function),
    }))
    expect(phase).toHaveBeenCalledWith('Processing')
    expect(phase).toHaveBeenCalledWith('Verifying')
    expect(phase).toHaveBeenCalledWith('Uploading')
    expect(pct.read()).toBe(96.5)
    expect(result).toEqual(expect.objectContaining({ failed: false, videoUrlToSend: 'https://cdn.test/optimized.mp4' }))
  })

  test('optimizer failure blocks send without uploading the original or deleting the local preview', async () => {
    const source = new File([new Uint8Array(835)], 'IMG_0315.MOV', { type: 'video/quicktime' })
    const toast = { err: vi.fn() }
    const onFail = vi.fn()
    vi.stubGlobal('fetch', vi.fn(async () => ({ blob: async () => source })))
    vi.mocked(uploadR2MediaFile).mockRejectedValue(new Error('optimizer failed'))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const localMeta = { source: 'paperclip_preview', filename: 'IMG_0315.MOV', contentType: 'video/quicktime' }
    const localMap = new Map([['blob:paperclip-preview', localMeta]])

    try {
      const result = await resolveComposerMediaPayload({
        pendingVideo: 'blob:paperclip-preview',
        pendingAudio: null,
        beginMediaPipeline: vi.fn(() => new AbortController()),
        mediaCancelRef: { current: false },
        pendingVideoRef: { current: 'blob:paperclip-preview' },
        pendingVideoInfoRef: { current: localMeta },
        pendingVideoBlobMetaRef: { current: localMap },
        emitDiag: vi.fn(),
        forumVideoMaxSeconds: 300,
        forumVideoCameraRecordEpsilonSec: 2,
        showVideoLimitOverlay: vi.fn(),
        endMediaPipeline: vi.fn(),
        viewerId: 'viewer-1',
        stopMediaProg: vi.fn(),
        setMediaPhase: vi.fn(),
        setVideoProgress: vi.fn(),
        setMediaPct: vi.fn(),
        readAudioDurationSecFn: vi.fn(),
        forumAudioMaxSeconds: 300,
        toast,
        t: (key) => key,
        onFail,
      })

      expect(result.failed).toBe(true)
      expect(uploadR2MediaFile).toHaveBeenCalledTimes(1)
      expect(toast.err).toHaveBeenCalledWith('forum_video_upload_failed')
      expect(onFail).toHaveBeenCalled()
      expect(localMap.has('blob:paperclip-preview')).toBe(true)
    } finally {
      errorSpy.mockRestore()
    }
  })
})
