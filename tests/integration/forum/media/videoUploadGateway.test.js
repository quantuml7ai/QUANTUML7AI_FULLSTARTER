import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../../lib/forumClientVideoOptimizer.js', () => ({
  prepareForumVideoForUpload: vi.fn(),
  getForumVerifiedVideoUploadProof: vi.fn(),
}))

vi.mock('../../../../app/forum/features/media/services/moderatePreparedVideoForUpload.js', () => ({
  default: vi.fn(),
  getPreparedVideoArtifacts: vi.fn(),
  preparePreparedVideoArtifacts: vi.fn(),
}))

import uploadR2MediaFile from '../../../../app/forum/features/media/services/uploadR2MediaFile.js'
import { getForumVerifiedVideoUploadProof, prepareForumVideoForUpload } from '../../../../lib/forumClientVideoOptimizer.js'
import {
  getPreparedVideoArtifacts,
  preparePreparedVideoArtifacts,
} from '../../../../app/forum/features/media/services/moderatePreparedVideoForUpload.js'

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

function makeArtifacts(file, { surface = 'forum', userId = 'actor-1', mirrorX = false } = {}) {
  const blob = new Blob([new Uint8Array(12)], { type: 'image/webp' })
  return {
    file,
    status: 'approved',
    moderationReceipt: 'moderated-token',
    mediaSha256: 'a'.repeat(64),
    mediaSize: file.size,
    frameCount: 8,
    surface,
    userId,
    mirrorX,
    poster: {
      blob,
      file: new File([blob], 'video-poster.webp', { type: 'image/webp' }),
      filename: 'video-poster.webp',
      mime: 'image/webp',
      width: 540,
      height: 960,
      timeSec: 2,
      sizeBytes: blob.size,
      policyId: 'ql7-native-video-poster-v1',
    },
  }
}

let artifactStore

describe('shared video upload gateway one-pass precommit ordering', () => {
  beforeEach(() => {
    artifactStore = new WeakMap()
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
    vi.mocked(getForumVerifiedVideoUploadProof).mockReset()
    vi.mocked(getPreparedVideoArtifacts).mockReset()
    vi.mocked(preparePreparedVideoArtifacts).mockReset()
    vi.mocked(getForumVerifiedVideoUploadProof).mockReturnValue(null)
    vi.mocked(getPreparedVideoArtifacts).mockImplementation((file) => artifactStore.get(file) || null)
    vi.mocked(preparePreparedVideoArtifacts).mockImplementation(async ({ file, surface, userId, mirrorX }) => {
      const record = makeArtifacts(file, { surface, userId, mirrorX })
      artifactStore.set(file, record)
      return record
    })
  })

  test('normal video Send prepares once, builds exact-file artifacts once, then signs poster/video and seals', async () => {
    const source = new File([new Uint8Array(100)], 'camera.webm', { type: 'video/webm' })
    const prepared = new File([new Uint8Array(20)], 'camera_FFMP.mp4', { type: 'video/mp4' })
    const order = []

    vi.mocked(prepareForumVideoForUpload).mockImplementation(async () => {
      order.push('prepare')
      return { file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: true, policyId: 'ql7-client-video-streaming-v4', durationSec: 10, width: 720, height: 1280 }
    })
    vi.mocked(preparePreparedVideoArtifacts).mockImplementation(async ({ file, surface, userId, mirrorX }) => {
      order.push('sample+poster+moderate')
      expect(file).toBe(prepared)
      expect(surface).toBe('dm')
      const record = makeArtifacts(file, { surface, userId, mirrorX })
      artifactStore.set(file, record)
      return record
    })
    vi.mocked(fetch).mockImplementation(async (_url, options = {}) => {
      let body = {}
      try { body = JSON.parse(options?.body || '{}') || {} } catch {}
      if (String(body?.action || '').toLowerCase() === 'confirmvideoupload') {
        order.push('confirm-upload')
        return confirmResponse()
      }
      const kind = String(body?.kind || '')
      order.push(kind === 'forum_video_poster' ? 'poster-sign' : 'video-sign')
      return signResponse({ poster: kind === 'forum_video_poster' })
    })

    const result = await uploadR2MediaFile({
      file: source,
      kind: 'forum_video',
      userId: 'actor-1',
      moderationSurface: 'dm',
      filename: source.name,
      contentType: source.type,
      videoPolicy: { mode: 'video-required', source: 'camera' },
    })

    expect(order).toEqual(['prepare', 'sample+poster+moderate', 'poster-sign', 'video-sign', 'confirm-upload'])
    expect(preparePreparedVideoArtifacts).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toEqual(expect.objectContaining({
      filename: 'camera_FFMP.mp4',
      contentType: 'video/mp4',
      size: prepared.size,
      kind: 'forum_video',
      surface: 'dm',
      moderationReceipt: 'moderated-token',
      mediaSha256: 'a'.repeat(64),
    }))
    expect(FakeXhr.instances).toHaveLength(2)
    expect(FakeXhr.instances[1].sentFile).toBe(prepared)
    expect(result.videoApprovalToken).toBe('approved-url-token')
    expect(result.posterUrl).toBe('https://cdn.test/video-poster.webp')
  })

  test('prepared HEVC Send consumes exact-file artifacts without a second artifact/decode/moderation contour', async () => {
    const prepared = new File([new Uint8Array(20)], 'iphone-hevc_FFMP.mp4', { type: 'video/mp4' })
    artifactStore.set(prepared, makeArtifacts(prepared, { surface: 'forum', userId: 'actor-1' }))
    vi.mocked(getForumVerifiedVideoUploadProof).mockReturnValue({ source: 'optimizer-output', sizeBytes: prepared.size })
    await uploadR2MediaFile({
      file: prepared,
      kind: 'forum_video',
      userId: 'actor-1',
      moderationSurface: 'forum',
      filename: prepared.name,
      contentType: prepared.type,
      videoPolicy: { mode: 'video-required' },
    })

    expect(prepareForumVideoForUpload).not.toHaveBeenCalled()
    expect(preparePreparedVideoArtifacts).not.toHaveBeenCalled()
    expect(FakeXhr.instances.at(-1)?.sentFile).toBe(prepared)
  })

  test('prepared HEVC with no exact-file/context artifacts fails closed before conversion/signing', async () => {
    const prepared = new File([new Uint8Array(20)], 'iphone-hevc_FFMP.mp4', { type: 'video/mp4' })
    vi.mocked(getForumVerifiedVideoUploadProof).mockReturnValue({ source: 'optimizer-output', sizeBytes: prepared.size })

    await expect(uploadR2MediaFile({
      file: prepared,
      kind: 'forum_video',
      userId: 'actor-1',
      moderationSurface: 'forum',
      filename: prepared.name,
      contentType: prepared.type,
    })).rejects.toThrow('exact-file pre-upload artifacts')

    expect(prepareForumVideoForUpload).not.toHaveBeenCalled()
    expect(preparePreparedVideoArtifacts).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  test.each(['forum_video', 'ads_video'])('blocks %s before artifacts/signing when preparation fails', async (kind) => {
    const source = new File([new Uint8Array(100)], 'source.mov', { type: 'video/quicktime' })
    vi.mocked(prepareForumVideoForUpload).mockRejectedValue(new Error('optimizer failed'))
    await expect(uploadR2MediaFile({ file: source, kind, userId: 'actor-1', filename: source.name, contentType: source.type, videoPolicy: { mode: 'video-required' } })).rejects.toThrow('optimizer failed')
    expect(preparePreparedVideoArtifacts).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
    expect(FakeXhr.instances).toHaveLength(0)
  })

  test.each(['forum_video', 'ads_video'])('fails %s closed before sign/upload when one-pass artifact moderation rejects', async (kind) => {
    const source = new File([new Uint8Array(20)], 'ready.mp4', { type: 'video/mp4' })
    const prepared = new File([new Uint8Array(18)], 'ready_FFMP.mp4', { type: 'video/mp4' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: true })
    vi.mocked(preparePreparedVideoArtifacts).mockRejectedValue(Object.assign(new Error('video_moderation_rejected:porn'), { code: 'VIDEO_MODERATION_REJECTED' }))

    await expect(uploadR2MediaFile({ file: source, kind, userId: 'actor-1', filename: source.name, contentType: source.type })).rejects.toThrow('video_moderation_rejected:porn')
    expect(fetch).not.toHaveBeenCalled()
    expect(FakeXhr.instances).toHaveLength(0)
  })

  test('keeps QuickTime/front-camera source on one heavy contour and binds mirrored poster artifacts to final MP4', async () => {
    const source = new File([new Uint8Array(120)], 'front-camera.mov', { type: 'video/quicktime' })
    const prepared = new File([new Uint8Array(24)], 'front-camera_FFMP.mp4', { type: 'video/mp4' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: prepared, filename: prepared.name, contentType: 'video/mp4', isVideo: true, optimized: true })

    const result = await uploadR2MediaFile({
      file: source,
      kind: 'forum_video',
      userId: 'actor-1',
      moderationSurface: 'forum',
      filename: source.name,
      contentType: source.type,
      videoPolicy: { mode: 'video-required', source: 'camera', mirrorX: true },
    })

    expect(preparePreparedVideoArtifacts).toHaveBeenCalledWith(expect.objectContaining({
      file: prepared,
      surface: 'forum',
      userId: 'actor-1',
      mirrorX: true,
    }))
    expect(FakeXhr.instances.at(-1)?.sentFile).toBe(prepared)
    expect(result.publicUrl).toBe('https://cdn.test/forum/videos/video-sealed.mp4')
  })

  test('passes non-video media unchanged without invoking video artifacts', async () => {
    const image = new File([new Uint8Array(10)], 'photo.jpg', { type: 'image/jpeg' })
    vi.mocked(prepareForumVideoForUpload).mockResolvedValue({ file: image, filename: image.name, contentType: image.type, isVideo: false, optimized: false, policyId: null })
    const result = await uploadR2MediaFile({ file: image, kind: 'forum_image' })
    expect(preparePreparedVideoArtifacts).not.toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body)
    expect(requestBody).toEqual(expect.objectContaining({ kind: 'forum_image', contentType: 'image/jpeg', size: image.size }))
    expect(requestBody).not.toHaveProperty('moderationReceipt')
    expect(FakeXhr.instances).toHaveLength(1)
    expect(FakeXhr.instances[0].sentFile).toBe(image)
    expect(result.publicUrl).toBe('https://cdn.test/forum/images/photo.jpg')
  })
})
