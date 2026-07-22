import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../app/forum/features/media/services/uploadR2MediaFile.js', () => ({
  default: vi.fn(),
}))

vi.mock('next/image', () => ({
  default: (props) => {
    const imageProps = { ...props }
    delete imageProps.fill
    delete imageProps.priority
    delete imageProps.unoptimized
    return React.createElement('img', imageProps)
  },
}))

import ComposerAttachmentPreview from '../../../../app/forum/features/media/components/ComposerAttachmentPreview.jsx'
import ComposerEmojiPreview from '../../../../app/forum/features/ui/components/ComposerEmojiPreview.jsx'
import ComposerFileInput from '../../../../app/forum/features/ui/components/ComposerFileInput.jsx'
import useForumComposerAttachments from '../../../../app/forum/features/media/hooks/useForumComposerAttachments.js'
import useMediaPipelineController from '../../../../app/forum/features/media/hooks/useMediaPipelineController.js'
import resolveComposerMediaPayload from '../../../../app/forum/features/media/services/resolveComposerMediaPayload.js'
import uploadR2MediaFile from '../../../../app/forum/features/media/services/uploadR2MediaFile.js'
import { readForumVideoDurationFromBrowser } from '../../../../lib/forumClientVideoOptimizer.js'

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

  test('accepts a browser-reported 11.7 second source without any 30-second minimum gate', async () => {
    const originalCreateElement = document.createElement.bind(document)
    const listeners = new Map()
    let currentTime = 0
    const fakeVideo = {
      duration: Number.NaN,
      readyState: 1,
      seekable: { length: 0, end: () => Number.NaN },
      preload: '',
      muted: false,
      playsInline: false,
      addEventListener: vi.fn((name, fn) => listeners.set(name, fn)),
      removeEventListener: vi.fn((name) => listeners.delete(name)),
      removeAttribute: vi.fn(),
      load: vi.fn(),
      set src(value) {
        void value
        queueMicrotask(() => {
          fakeVideo.duration = 11.712
          listeners.get('loadedmetadata')?.()
        })
      },
      get currentTime() { return currentTime },
      set currentTime(value) { currentTime = value },
    }

    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
      if (String(tagName).toLowerCase() === 'video') return fakeVideo
      return originalCreateElement(tagName, options)
    })
    const restoreUrl = installObjectUrlStubs()

    try {
      const source = new File([new Uint8Array(128)], 'short-11s.webm', { type: 'video/webm' })
      await expect(readForumVideoDurationFromBrowser(source, { timeoutMs: 1500 })).resolves.toBeCloseTo(11.712, 3)
      expect(currentTime).toBe(0)
    } finally {
      restoreUrl()
      createElementSpy.mockRestore()
    }
  })

  test('uses a native single-file picker while video is selectable and preserves image batch mode after image ownership', () => {
    const ref = React.createRef()
    const props = {
      fileInputRef: ref,
      onFilesChosen: vi.fn(),
      mediaLocked: false,
      accept: 'image/*,video/*',
      allowMultiple: false,
    }
    const { container, rerender } = render(React.createElement(ComposerFileInput, props))
    const input = container.querySelector('input[type="file"]')

    expect(input).toBeTruthy()
    expect(input.multiple).toBe(false)

    rerender(React.createElement(ComposerFileInput, {
      ...props,
      accept: 'image/*',
      allowMultiple: true,
    }))
    expect(container.querySelector('input[type="file"]').multiple).toBe(true)
  })

  test('rejects a multi-video paperclip selection before preview, optimization or upload', async () => {
    const restoreUrl = installObjectUrlStubs()
    const first = new File([new Uint8Array(128)], 'first.mp4', { type: 'video/mp4' })
    const second = new File([new Uint8Array(128)], 'second.webm', { type: 'video/webm' })
    const props = createProps()

    try {
      vi.mocked(URL.createObjectURL).mockClear()
      const { result } = renderHook(() => useForumComposerAttachments(props))
      const target = { files: [first, second], value: 'selected' }

      await act(async () => {
        await result.current.onFilesChosen({ target })
      })

      expect(props.toast.warn).toHaveBeenCalledWith('forum_attach_info')
      expect(URL.createObjectURL).not.toHaveBeenCalled()
      expect(props.readVideoDurationSecFn).not.toHaveBeenCalled()
      expect(props.setPendingVideo).not.toHaveBeenCalled()
      expect(props.setVideoOpen).not.toHaveBeenCalled()
      expect(uploadR2MediaFile).not.toHaveBeenCalled()
      expect(target.value).toBe('')
    } finally {
      restoreUrl()
    }
  })

  test('rejects replacing an already pending paperclip video until it is removed', async () => {
    const restoreUrl = installObjectUrlStubs()
    const source = new File([new Uint8Array(128)], 'replacement.mp4', { type: 'video/mp4' })
    const props = createProps({
      pendingVideo: 'blob:existing-video',
      pendingVideoBlobMetaRef: { current: new Map([['blob:existing-video', { source: 'paperclip_preview' }]]) },
    })

    try {
      vi.mocked(URL.createObjectURL).mockClear()
      const { result } = renderHook(() => useForumComposerAttachments(props))
      const target = { files: [source], value: 'selected' }

      await act(async () => {
        await result.current.onFilesChosen({ target })
      })

      expect(props.toast.warn).toHaveBeenCalledWith('forum_attach_info')
      expect(URL.createObjectURL).not.toHaveBeenCalled()
      expect(props.setPendingVideo).not.toHaveBeenCalled()
      expect(uploadR2MediaFile).not.toHaveBeenCalled()
      expect(target.value).toBe('')
    } finally {
      restoreUrl()
    }
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

function createImageResolverArgs(overrides = {}) {
  return {
    pendingVideo: null,
    pendingAudio: null,
    pendingImgs: [],
    pendingImageDraftsRef: { current: new Map() },
    moderateImageFiles: vi.fn(async () => ({ decision: 'allow', reason: 'unknown' })),
    toastI18n: vi.fn(),
    reasonKey: (reason) => `reason:${reason}`,
    setPendingImgs: vi.fn(),
    startSoftProgress: vi.fn(),
    beginMediaPipeline: vi.fn(() => new AbortController()),
    mediaCancelRef: { current: false },
    pendingVideoRef: { current: '' },
    pendingVideoInfoRef: { current: { source: '', durationSec: Number.NaN } },
    pendingVideoBlobMetaRef: { current: new Map() },
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
    forumAudioMaxSeconds: 600,
    toast: { err: vi.fn(), error: vi.fn(), warn: vi.fn() },
    t: (key) => key,
    onFail: vi.fn(),
    ...overrides,
  }
}

describe('composer image send-time pipeline', () => {
  test('moderates and uploads local image drafts only when the send resolver runs', async () => {
    const first = new File(['one'], 'first.png', { type: 'image/png' })
    const second = new File(['two'], 'second.jpg', { type: 'image/jpeg' })
    const pendingImageDraftsRef = {
      current: new Map([
        ['blob:first', { draftId: 'blob:first', file: first }],
        ['blob:second', { draftId: 'blob:second', file: second }],
      ]),
    }
    const moderateImageFiles = vi.fn(async () => ({ decision: 'allow', reason: 'unknown' }))
    const fetchMock = vi.fn(async (_url, options) => {
      const draftIds = options.body.getAll('draftIds')
      return {
        ok: true,
        status: 200,
        json: async () => ({
          urls: ['https://cdn.test/first.webp', 'https://cdn.test/second.webp'],
          errors: [],
          items: draftIds.map((draftId, index) => ({
            draftId,
            index,
            url: `https://cdn.test/${index === 0 ? 'first' : 'second'}.webp`,
            error: null,
          })),
        }),
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const beginMediaPipeline = vi.fn(() => new AbortController())
    const result = await resolveComposerMediaPayload(createImageResolverArgs({
      pendingImgs: ['/existing.webp', 'blob:first', 'blob:second'],
      pendingImageDraftsRef,
      moderateImageFiles,
      beginMediaPipeline,
    }))

    expect(beginMediaPipeline).toHaveBeenCalledWith('Moderating')
    expect(moderateImageFiles).toHaveBeenCalledWith([first, second], { signal: expect.any(AbortSignal) })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/forum/upload', expect.objectContaining({
      method: 'POST',
      signal: expect.any(AbortSignal),
      headers: { 'x-forum-user-id': 'viewer-1' },
    }))
    expect(moderateImageFiles.mock.invocationCallOrder[0]).toBeLessThan(fetchMock.mock.invocationCallOrder[0])
    expect(result).toEqual(expect.objectContaining({
      failed: false,
      imageUrlsToSend: [
        '/existing.webp',
        'https://cdn.test/first.webp',
        'https://cdn.test/second.webp',
      ],
    }))
  })

  test('blocks upload and removes selected local drafts when moderation blocks them', async () => {
    const blocked = new File(['blocked'], 'blocked.png', { type: 'image/png' })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const setPendingImgs = vi.fn()
    const toastI18n = vi.fn()

    const result = await resolveComposerMediaPayload(createImageResolverArgs({
      pendingImgs: ['blob:blocked'],
      pendingImageDraftsRef: { current: new Map([['blob:blocked', { file: blocked }]]) },
      moderateImageFiles: vi.fn(async () => ({ decision: 'block', reason: 'porn' })),
      setPendingImgs,
      toastI18n,
    }))

    expect(result.failed).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(toastI18n).toHaveBeenCalledWith('warn', 'forum_image_blocked')
    const removeUpdater = setPendingImgs.mock.calls[0][0]
    expect(removeUpdater(['/remote.webp', 'blob:blocked'])).toEqual(['/remote.webp'])
  })
})

describe('composer VIP sticker preview UI', () => {
  test('renders VIP emoji at full-width media-card semantics and removes it with the top-right trash control', () => {
    const setPendingSticker = vi.fn()
    const { container, rerender } = render(React.createElement(ComposerEmojiPreview, {
      pendingSticker: { src: '/vip/emoji/e1.gif', kind: 'vip' },
      setPendingSticker,
      t: (key) => key,
    }))

    const preview = container.querySelector('[data-composer-sticker-preview="true"]')
    expect(preview).toHaveClass('vipMediaBox', 'composerStickerPreviewRow')
    expect(preview).toHaveAttribute('data-kind', 'vip-emoji')
    expect(preview.querySelector('img')).toHaveClass('emojiPreviewBig')
    expect(container.querySelector('.composerStickerTrash')).toHaveAttribute('data-composer-sticker-control', 'true')

    fireEvent.pointerDown(screen.getByLabelText('forum_remove_attachment'))
    fireEvent.click(screen.getByLabelText('forum_remove_attachment'))
    expect(setPendingSticker).toHaveBeenCalledWith(null)

    rerender(React.createElement(ComposerEmojiPreview, {
      pendingSticker: { src: '/mozi/sticker.gif', kind: 'mozi' },
      setPendingSticker,
      t: (key) => key,
    }))
    expect(container.querySelector('[data-composer-sticker-preview="true"]')).toHaveAttribute('data-kind', 'sticker')
  })
})

describe('composer video preview controls UI', () => {
  test('ships the same premium control classes as image previews with fullscreen first and trash second', () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), 'app/forum/features/media/components/ComposerAttachmentPreview.jsx'),
      'utf8',
    )
    const expandOffset = source.indexOf('composerVideoControl--expand')
    const trashOffset = source.indexOf('composerVideoControl--trash')

    expect(expandOffset).toBeGreaterThanOrEqual(0)
    expect(trashOffset).toBeGreaterThan(expandOffset)
    expect(source).toContain('composerImageControl--expand composerVideoControl')
    expect(source).toContain('composerImageControl--trash composerVideoControl')
    expect(source).toContain('data-composer-video-control="true"')
    expect(source.slice(expandOffset, trashOffset)).toContain('<ExpandIcon />')
    expect(source.slice(trashOffset)).toContain('<TrashIcon />')
  })
})

describe('composer image preview UI', () => {
  test('keeps a local image draft preview free of the progress bar until the pipeline starts', async () => {
    const { result } = renderHook(() => useMediaPipelineController({
      t: (key) => key,
      pendingImgs: ['blob:local-image'],
      pendingAudio: null,
      pendingVideo: null,
    }))

    await waitFor(() => {
      expect(result.current.mediaBarOn).toBe(false)
      expect(result.current.mediaPhase).toBe('idle')
      expect(result.current.mediaPct).toBe(0)
    })

    act(() => {
      result.current.beginMediaPipeline('Moderating')
    })

    expect(result.current.mediaBarOn).toBe(true)
    expect(result.current.mediaPhase).toBe('Moderating')
    expect(result.current.mediaPipelineOn).toBe(true)
  })

  test('keeps fullscreen and trash controls isolated from carousel navigation and targets the focused image', () => {
    const onOpenImageFullscreen = vi.fn()
    const onRemoveImage = vi.fn()
    const { container } = render(
      React.createElement(ComposerAttachmentPreview, {
        pendingImgs: ['/one.webp', '/two.webp', '/three.webp'],
        pendingVideo: null,
        pendingAudio: null,
        t: (key) => key,
        onOpenImageFullscreen,
        onRemoveImage,
      }),
    )

    fireEvent.click(container.querySelector('.composerImageNav--next'))
    fireEvent.pointerDown(screen.getByLabelText('forum_open_fullscreen'))
    fireEvent.click(screen.getByLabelText('forum_open_fullscreen'))
    fireEvent.pointerDown(screen.getByLabelText('forum_remove_attachment'))
    fireEvent.click(screen.getByLabelText('forum_remove_attachment'))

    expect(onOpenImageFullscreen).toHaveBeenCalledWith(1)
    expect(onRemoveImage).toHaveBeenCalledWith(1)
    expect(container.querySelector('.composerImageControl--expand')).toHaveAttribute('data-composer-image-control', 'true')
    expect(container.querySelector('.composerImageControl--trash')).toHaveAttribute('data-composer-image-control', 'true')
  })
})
