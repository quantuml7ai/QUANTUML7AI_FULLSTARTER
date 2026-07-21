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

function signResponse() {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      ok: true,
      uploadUrl: 'https://r2.test/upload',
      publicUrl: 'https://cdn.test/video.mp4',
      key: 'forum/video.mp4',
      headers: { 'content-type': 'video/mp4' },
    }),
  }
}

describe('shared video upload gateway ordering', () => {
  beforeEach(() => {
    FakeXhr.instances = []
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    vi.stubGlobal('fetch', vi.fn(async () => signResponse()))
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
    vi.mocked(fetch).mockImplementation(async () => {
      order.push('sign')
      return signResponse()
    })

    const result = await uploadR2MediaFile({
      file: source,
      kind: 'forum_video',
      filename: source.name,
      contentType: source.type,
      videoPolicy: { mode: 'video-required', source: 'camera' },
    })

    expect(order).toEqual(['prepare', 'sign'])
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(expect.objectContaining({
      filename: 'camera_FFMP.mp4',
      contentType: 'video/mp4',
      size: prepared.size,
    }))
    expect(FakeXhr.instances).toHaveLength(1)
    expect(FakeXhr.instances[0].sentFile).toBe(prepared)
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
