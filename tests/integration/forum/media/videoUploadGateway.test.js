import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../lib/forumClientVideoOptimizer.js', () => ({
  prepareForumVideoForUpload: vi.fn(),
}))

vi.mock('../../../../app/forum/features/media/services/moderatePreparedVideoForUpload.js', () => ({
  default: vi.fn(),
}))

import uploadR2MediaFile from '../../../../app/forum/features/media/services/uploadR2MediaFile.js'
import { prepareForumVideoForUpload } from '../../../../lib/forumClientVideoOptimizer.js'
import moderatePreparedVideoForUpload from '../../../../app/forum/features/media/services/moderatePreparedVideoForUpload.js'

class FakeXhr {
  static instances = []
  constructor() { this.upload = {}; this.headers = {}; this.status = 200; FakeXhr.instances.push(this) }
  open(method, url) { this.method = method; this.url = url }
  setRequestHeader(name, value) { this.headers[name] = value }
  send(file) {
    this.sentFile = file
    this.upload.onprogress?.({ lengthComputable: true, loaded: file.size, total: file.size })
    queueMicrotask(() => this.onload?.())
  }
  abort() { this.onabort?.() }
}

function signResponse({ poster = false, video = true, contentType = '' } = {}) {
  const resolvedContentType = String(contentType || (poster ? 'image/webp' : (video ? 'video/mp4' : 'application/octet-stream')))
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      ok: true,
      uploadUrl: poster
        ? 'https://r2.test/upload-poster'
        : (video ? 'https://r2.test/upload-video' : 'https://r2.test/upload-media'),
      ...(poster ? {
        publicUrl: 'https://cdn.test/video-poster.webp',
        key: 'forum/video-posters/video-poster.webp',
      } : (video ? {
        key: 'forum/videos/_ql7-precommit-staging/video-stage.mp4',
        stagingKey: 'forum/videos/_ql7-precommit-staging/video-stage.mp4',
        videoUploadToken: 'signed-upload-token',
      } : {
        publicUrl: 'https://cdn.test/forum/images/photo.jpg',
        key: 'forum/images/photo.jpg',
      })),
      headers: { 'content-type': resolvedContentType },
    }),
  }
}

function confirmResponse() {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      ok: true,
      videoApprovalToken: 'approved-url-token',
      publicUrl: 'https://cdn.test/forum/videos/video-sealed.mp4',
      key: 'forum/videos/video-sealed.mp4',
      pathname: 'forum/videos/video-sealed.mp4',
      verifiedSha256: 'a'.repeat(64),
      verifiedSize: 20,
      sealed: true,
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
      filename: 'video-poster.webp', mime: 'image/webp', width: 540, height: 960,
      timeSec: 2, sizeBytes: blob.size, policyId: 'ql7-native-video-poster-v1',
    }
  })
}

describe('shared video upload gateway precommit ordering', () => {
  beforeEach(() => {
    FakeXhr.instances = []
    vi.stubGlobal('XMLHttpRequest', FakeXhr)
    vi.stubGlobal('fetch', vi.fn(async (_url, options = {}) => {
      let body = {}
      try { body = JSON.parse(options?.body || '{}') || {} } catch {}
      if (String(body?.action || '').toLowerCase() === 'confirmvideoupload') return confirmResponse()
      const kind = String(body?.kind || '')
      return signResponse({
        poster: /poster/.test(kind),
        video: kind === 'forum_video' || kind === 'ads_video',
        contentType: String(body?.contentType || body?.mime || ''),
      })
    }))
    vi.mocked(prepareForumVideoForUpload).mockReset()
    vi.mocked(moderatePreparedVideoForUpload).mockReset()
    vi.mocked(moderatePreparedVideoForUpload).mockResolvedValue({
      status: 'approved',
      moderationReceipt: 'moderated-token',
      mediaSha256: 'a'.repeat(64),
      mediaSize: 20,
    })
  })

  test('prepares exact MP4, moderates it, then creates poster and requests presigned URLs', async () => {
    const source = new File([new Uint8Array(100)], 'camera.webm', { type: 'video/webm' })
    const prepared = new File([new Uint8Array(20)], 'camera_FFMP.mp4', { type: 'video/mp4' })
    const order = []

    vi.mocked(prepareForumVideoForUpload).mockImplementation(async () => {
      order.push('prepare')
      return { file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: true, policyId: 'ql7-client-video-streaming-v4', durationSec: 10, width: 720, height: 1280 }
    })
    vi.mocked(moderatePreparedVideoForUpload).mockImplementation(async ({ file, surface }) => {
      order.push('moderate')
      expect(file).toBe(prepared)
      expect(surface).toBe('dm')
      return { status: 'approved', moderationReceipt: 'moderated-token', mediaSha256: 'a'.repeat(64), mediaSize: prepared.size }
    })
    vi.mocked(fetch).mockImplementation(async (_url, options = {}) => {
      let body = {}
      try { body = JSON.parse(options?.body || '{}') || {} } catch {}
      if (String(body?.action || '').toLowerCase() === 'confirmvideoupload') {
        order.push('confirm-upload')
        expect(body.videoUploadToken).toBe('signed-upload-token')
        return confirmResponse()
      }
      const kind = String(body?.kind || '')
      order.push(kind === 'forum_video_poster' ? 'poster-sign' : 'video-sign')
      return signResponse({ poster: kind === 'forum_video_poster' })
    })

    const result = await uploadR2MediaFile({
      file: source, kind: 'forum_video', userId: 'actor-1', moderationSurface: 'dm',
      filename: source.name, contentType: source.type,
      videoPolicy: { mode: 'video-required', source: 'camera' },
      posterFactory: fakePosterFactory(order),
    })

    expect(order).toEqual(['prepare', 'moderate', 'poster', 'poster-sign', 'video-sign', 'confirm-upload'])
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(expect.objectContaining({
      filename: 'camera_FFMP.mp4', contentType: 'video/mp4', size: prepared.size,
      kind: 'forum_video', surface: 'dm', moderationReceipt: 'moderated-token', mediaSha256: 'a'.repeat(64),
    }))
    expect(FakeXhr.instances).toHaveLength(2)
    expect(FakeXhr.instances[1].sentFile).toBe(prepared)
    expect(result.videoApprovalToken).toBe('approved-url-token')
    expect(result.publicUrl).toBe('https://cdn.test/forum/videos/video-sealed.mp4')
    expect(result.key).toBe('forum/videos/video-sealed.mp4')
    expect(result.publicUrl).not.toContain('_ql7-precommit-staging')
    expect(result.posterUrl).toBe('https://cdn.test/video-poster.webp')
  })

  test.each(['forum_video', 'ads_video'])('blocks %s before moderation/signing when preparation fails', async (kind) => {
    const source = new File([new Uint8Array(100)], 'source.mov', { type: 'video/quicktime' })
    vi.mocked(prepareForumVideoForUpload).mockRejectedValue(new Error('optimizer failed'))
    await expect(uploadR2MediaFile({ file: source, kind, userId: 'actor-1', filename: source.name, contentType: source.type, videoPolicy: { mode: 'video-required' } })).rejects.toThrow('optimizer failed')
    expect(moderatePreparedVideoForUpload).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(FakeXhr.instances).toHaveLength(0)
  })

  test.each(['forum_video', 'ads_video'])('rejects %s before poster/sign/upload when moderation rejects', async (kind) => {
    const prepared = new File([new Uint8Array(20)], 'ready.mp4', { type: 'video/mp4' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: true })
    vi.mocked(moderatePreparedVideoForUpload).mockRejectedValue(Object.assign(new Error('video_moderation_rejected:porn'), { code: 'VIDEO_MODERATION_REJECTED' }))
    const posterFactory = fakePosterFactory()

    await expect(uploadR2MediaFile({ file: prepared, kind, userId: 'actor-1', filename: prepared.name, contentType: prepared.type, posterFactory })).rejects.toThrow('video_moderation_rejected:porn')
    expect(posterFactory).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(FakeXhr.instances).toHaveLength(0)
  })

  test.each([['forum_video', 'forum_video_poster'], ['ads_video', 'ads_video_poster']])('stores a required bounded poster beside approved %s before video bytes', async (kind, posterKind) => {
    const prepared = new File([new Uint8Array(20)], 'ready.mp4', { type: 'video/mp4' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: false, policyId: 'verified' })
    const result = await uploadR2MediaFile({ file: prepared, kind, userId: 'actor-1', filename: prepared.name, contentType: prepared.type, posterFactory: fakePosterFactory() })
    const bodies = vi.mocked(fetch).mock.calls.map((call) => JSON.parse(call[1].body))
    expect(bodies[0].kind).toBe(posterKind)
    expect(bodies[1].kind).toBe(kind)
    expect(result.posterUrl).toContain('video-poster.webp')
  })

  test('fails closed after PUT when server sealing confirmation fails', async () => {
    const prepared = new File([new Uint8Array(20)], 'ready.mp4', { type: 'video/mp4' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: true })
    vi.mocked(fetch).mockImplementation(async (_url, options = {}) => {
      let body = {}
      try { body = JSON.parse(options?.body || '{}') || {} } catch {}
      if (String(body?.action || '').toLowerCase() === 'confirmvideoupload') {
        return { ok: false, status: 409, text: async () => JSON.stringify({ ok: false, error: { code: 'video_upload_seal_conflict' } }) }
      }
      return signResponse({ poster: /poster/.test(String(body?.kind || '')) })
    })

    await expect(uploadR2MediaFile({ file: prepared, kind: 'ads_video', userId: 'actor-1', filename: prepared.name, contentType: prepared.type, posterFactory: fakePosterFactory() }))
      .rejects.toThrow(/video_upload_seal_conflict|confirmation failed/i)
    expect(FakeXhr.instances).toHaveLength(2)
  })

  test('keeps QuickTime/front-camera source on the optimizer path and uploads only the prepared MP4', async () => {
    const source = new File([new Uint8Array(120)], 'front-camera.mov', { type: 'video/quicktime' })
    const prepared = new File([new Uint8Array(24)], 'front-camera_FFMP.mp4', { type: 'video/mp4' })

    vi.mocked(prepareForumVideoForUpload).mockImplementation(async ({ file }) => {
      expect(file).toBe(source)
      return {
        file: prepared,
        filename: prepared.name,
        contentType: 'video/mp4',
        isVideo: true,
        optimized: true,
        policyId: 'ql7-client-video-streaming-v4',
      }
    })
    vi.mocked(moderatePreparedVideoForUpload).mockImplementation(async ({ file, surface }) => {
      expect(file).toBe(prepared)
      expect(file.type).toBe('video/mp4')
      expect(surface).toBe('forum')
      return {
        status: 'approved',
        moderationReceipt: 'moderated-token',
        mediaSha256: 'a'.repeat(64),
        mediaSize: prepared.size,
      }
    })

    const result = await uploadR2MediaFile({
      file: source,
      kind: 'forum_video',
      userId: 'actor-quicktime',
      moderationSurface: 'forum',
      filename: source.name,
      contentType: source.type,
      videoPolicy: { mode: 'video-required', source: 'camera', mirrorX: true },
      posterFactory: fakePosterFactory(),
    })

    const bodies = vi.mocked(fetch).mock.calls.map((call) => JSON.parse(call[1].body || '{}'))
    const videoSign = bodies.find((body) => body.kind === 'forum_video')
    expect(videoSign).toEqual(expect.objectContaining({
      filename: prepared.name,
      contentType: 'video/mp4',
      size: prepared.size,
      surface: 'forum',
      moderationReceipt: 'moderated-token',
      mediaSha256: 'a'.repeat(64),
    }))
    expect(FakeXhr.instances.at(-1)?.sentFile).toBe(prepared)
    expect(result.publicUrl).toBe('https://cdn.test/forum/videos/video-sealed.mp4')
    expect(result.videoApprovalToken).toBe('approved-url-token')
  })

  test('passes non-video media unchanged without invoking video moderation', async () => {
    const image = new File([new Uint8Array(10)], 'photo.jpg', { type: 'image/jpeg' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: image, filename: image.name, contentType: image.type, isVideo: false, optimized: false, policyId: null })
    const result = await uploadR2MediaFile({ file: image, kind: 'forum_image' })
    expect(moderatePreparedVideoForUpload).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body)
    expect(requestBody).toEqual(expect.objectContaining({
      kind: 'forum_image',
      contentType: 'image/jpeg',
      size: image.size,
    }))
    expect(requestBody).not.toHaveProperty('surface')
    expect(requestBody).not.toHaveProperty('moderationReceipt')
    expect(requestBody).not.toHaveProperty('mediaSha256')
    expect(FakeXhr.instances).toHaveLength(1)
    expect(FakeXhr.instances[0].sentFile).toBe(image)
    expect(result.publicUrl).toBe('https://cdn.test/forum/images/photo.jpg')
    expect(result.key).toBe('forum/images/photo.jpg')
    expect(result).not.toHaveProperty('videoApprovalToken')
  })
})
