import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../lib/forumClientVideoOptimizer.js', () => ({
  prepareForumVideoForUpload: vi.fn(),
}))

import uploadR2MediaFile from '../../../../app/forum/features/media/services/uploadR2MediaFile.js'
import { prepareForumVideoForUpload } from '../../../../lib/forumClientVideoOptimizer.js'

class FakeXhr {
  static instances = []

  constructor() {
    this.upload = {}
    this.headers = {}
    this.status = 200
    FakeXhr.instances.push(this)
  }

  open(method, url) {
    this.method = method
    this.url = url
  }

  setRequestHeader(name, value) {
    this.headers[name] = value
  }

  send(file) {
    this.sentFile = file
    this.upload.onprogress?.({ lengthComputable: true, loaded: file.size, total: file.size })
    queueMicrotask(() => this.onload?.())
  }

  abort() {
    this.onabort?.()
  }
}

function signResponse({ poster = false } = {}) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      ok: true,
      uploadUrl: poster ? 'https://r2.test/upload-poster' : 'https://r2.test/upload-video',
      publicUrl: poster ? 'https://cdn.test/video-poster.webp' : 'https://cdn.test/video.mp4',
      key: poster ? 'forum/video-posters/video-poster.webp' : 'forum/videos/video.mp4',
      headers: { 'content-type': poster ? 'image/webp' : 'video/mp4' },
    }),
  }
}

function fakePosterFactory(order = null) {
  return vi.fn(async () => {
    order?.push?.('poster')
    const blob = new Blob([new Uint8Array(12)], { type: 'image/webp' })
    return {
      blob,
      file: new File([blob], 'video-poster.webp', { type: 'image/webp' }),
      filename: 'video-poster.webp',
      mime: 'image/webp',
      width: 540,
      height: 960,
      timeSec: 2,
      sizeBytes: blob.size,
      policyId: 'ql7-native-video-poster-v1',
    }
  })
}

describe('shared video upload gateway ordering', () => {
  beforeEach(() => {
    FakeXhr.instances = []
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    vi.stubGlobal('fetch', vi.fn(async (_url, options = {}) => {
      let kind = ''
      try { kind = JSON.parse(options?.body || '{}')?.kind || '' } catch {}
      return signResponse({ poster: /poster/.test(kind) })
    }))
    vi.mocked(prepareForumVideoForUpload).mockReset()
  })

  test('prepares and verifies video before requesting a presigned URL or sending bytes', async () => {
    const source = new File([new Uint8Array(100)], 'camera.webm', { type: 'video/webm' })
    const prepared = new File([new Uint8Array(20)], 'camera_FFMP.mp4', { type: 'video/mp4' })
    const order = []

    vi.mocked(prepareForumVideoForUpload).mockImplementation(async () => {
      order.push('prepare')
      return {
        file: prepared,
        filename: prepared.name,
        contentType: 'video/mp4',
        isVideo: true,
        optimized: true,
        policyId: 'ql7-client-video-streaming-v4',
        durationSec: 10,
        width: 720,
        height: 1280,
      }
    })
    vi.mocked(fetch).mockImplementation(async (_url, options = {}) => {
      let kind = ''
      try { kind = JSON.parse(options?.body || '{}')?.kind || '' } catch {}
      order.push(kind === 'forum_video_poster' ? 'poster-sign' : 'video-sign')
      return signResponse({ poster: kind === 'forum_video_poster' })
    })

    const result = await uploadR2MediaFile({
      file: source,
      kind: 'forum_video',
      filename: source.name,
      contentType: source.type,
      videoPolicy: { mode: 'video-required', source: 'camera' },
      posterFactory: fakePosterFactory(order),
    })

    expect(order).toEqual(['prepare', 'poster', 'poster-sign', 'video-sign'])
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(expect.objectContaining({ kind: 'forum_video_poster', contentType: 'image/webp' }))
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(expect.objectContaining({
      filename: 'camera_FFMP.mp4',
      contentType: 'video/mp4',
      size: prepared.size,
      kind: 'forum_video',
    }))
    expect(FakeXhr.instances).toHaveLength(2)
    expect(FakeXhr.instances[1].sentFile).toBe(prepared)
    expect(result.posterUrl).toBe('https://cdn.test/video-poster.webp')
    expect(result.preparation).toEqual(expect.objectContaining({
      isVideo: true,
      optimized: true,
      policyId: 'ql7-client-video-streaming-v4',
    }))
  })

  test.each(['forum_video', 'ads_video'])(
    'blocks %s presign and network upload when preparation fails',
    async (kind) => {
      const source = new File([new Uint8Array(100)], 'source.mov', { type: 'video/quicktime' })
      vi.mocked(prepareForumVideoForUpload).mockRejectedValue(new Error('optimizer failed'))

      await expect(uploadR2MediaFile({
        file: source,
        kind,
        filename: source.name,
        contentType: source.type,
        videoPolicy: { mode: 'video-required' },
      })).rejects.toThrow('optimizer failed')

      expect(fetch).not.toHaveBeenCalled()
      expect(FakeXhr.instances).toHaveLength(0)
    },
  )

  test.each([
    ['forum_video', 'forum_video_poster'],
    ['ads_video', 'ads_video_poster'],
  ])('stores a required bounded poster beside %s before video bytes', async (kind, posterKind) => {
    const prepared = new File([new Uint8Array(20)], 'ready.mp4', { type: 'video/mp4' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({
      file: prepared,
      filename: prepared.name,
      contentType: 'video/mp4',
      isVideo: true,
      optimized: false,
      policyId: 'verified',
    })

    const result = await uploadR2MediaFile({
      file: prepared,
      kind,
      filename: prepared.name,
      contentType: prepared.type,
      posterFactory: fakePosterFactory(),
    })

    const bodies = vi.mocked(fetch).mock.calls.map((call) => JSON.parse(call[1].body))
    expect(bodies[0].kind).toBe(posterKind)
    expect(bodies[1].kind).toBe(kind)
    expect(result.posterUrl).toContain('video-poster.webp')
    expect(result.poster).toEqual(expect.objectContaining({ policyId: 'ql7-native-video-poster-v1' }))
  })

  test('passes non-video media unchanged through the same service', async () => {
    const image = new File([new Uint8Array(10)], 'photo.jpg', { type: 'image/jpeg' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({
      file: image,
      filename: image.name,
      contentType: image.type,
      isVideo: false,
      optimized: false,
      policyId: null,
    })

    await uploadR2MediaFile({ file: image, kind: 'forum_image' })

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(FakeXhr.instances[0].sentFile).toBe(image)
  })
})
