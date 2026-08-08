import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function expectBefore(source, first, second) {
  const firstIndex = source.indexOf(first)
  const secondIndex = source.indexOf(second)
  expect(firstIndex, `missing: ${first}`).toBeGreaterThanOrEqual(0)
  expect(secondIndex, `missing: ${second}`).toBeGreaterThan(firstIndex)
}

describe('forum client video gateway V4 contracts', () => {
  test('pins the browser media engine without dependency drift', () => {
    const pkg = JSON.parse(read('package.json'))
    expect(pkg.dependencies?.mediabunny).toBe('1.50.8')
    expect(pkg.dependencies?.['@mediabunny/aac-encoder']).toBe('1.50.8')
  })

  test('declares one calibrated H.264/AAC flat FastStart policy', () => {
    const src = read('lib/forumClientVideoOptimizer.js')

    expect(src).toContain("QL7_CLIENT_VIDEO_POLICY_ID = 'ql7-client-video-streaming-v4'")
    expect(src).toContain('FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES = 30 * MIB')
    expect(src).toContain('FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES = 27 * MIB')
    expect(src).toContain("Object.freeze({ id: '720p30'")
    expect(src).toContain("Object.freeze({ id: '720p24'")
    expect(src).toContain("Object.freeze({ id: '540p24'")
    expect(src).toContain("codec: 'avc'")
    expect(src).toContain("codec: 'aac'")
    expect(src).toContain("fastStart: 'in-memory'")
    expect(src).toContain('allowRotationMetadata: false')
    expect(src).toContain('forceTranscode: true')
    expect(src).toContain("atom.type === 'moof'")
    expect(src).toContain('moov.offset < mdat.offset')
    expect(src).toContain('sourceUploadedBeforeOptimization: false')
    expect(src).toContain('sourceUploadedForTranscoding: false')
  })

  test('places fail-closed preparation before every presigned URL request', () => {
    const src = read('app/forum/features/media/services/uploadR2MediaFile.js')

    expect(src).toContain("import { prepareForumVideoForUpload }")
    expectBefore(src, 'await prepareForumVideoForUpload({', "fetch('/api/forum/blobUploadUrl'")
    expectBefore(src, "if (preparation?.isVideo && resolvedContentType !== 'video/mp4')", "fetch('/api/forum/blobUploadUrl'")
    expect(src).not.toContain('optimizer failed')
    expect(src).not.toMatch(/catch\s*\([^)]*\)\s*\{[^}]*file:\s*file/s)
    expect(src).toContain('file: uploadFile')
  })

  test('connects deferred paperclip, camera/trim Blob and ads creative to the shared gateway', () => {
    const paperclip = read('app/forum/features/media/hooks/useForumComposerAttachments.js')
    const composerSend = read('app/forum/features/media/services/resolveComposerMediaPayload.js')
    const ads = read('app/ads/home.js')

    expect(paperclip).toContain('URL.createObjectURL(vf)')
    expect(paperclip).toContain("source: 'paperclip_preview'")
    expect(paperclip).not.toContain('uploadR2MediaFile')
    expect(composerSend).toContain('await uploadR2MediaFile({')
    expect(composerSend).toContain("mode: 'video-required'")
    expect(composerSend).toContain("source: srcMeta || 'composer_blob'")
    expect(ads).toContain('await uploadR2MediaFile({')
    expect(ads).toContain("mode: 'video-required'")
    expect(ads).toContain("kind: 'ads_video'")
    expect(ads).toContain("source: 'ads_creative'")
    expect(composerSend).not.toContain('optimizeForumVideoFastStart')
    expect(ads).not.toContain('optimizeForumVideoFastStart')
  })

  test('keeps non-video paths and business/server transcoding out of scope', () => {
    const gateway = read('app/forum/features/media/services/uploadR2MediaFile.js')
    const optimizer = read('lib/forumClientVideoOptimizer.js')
    const ads = read('app/ads/home.js')

    expect(optimizer).toContain("explicitMode === 'non-video'")
    expect(optimizer).toContain("return { isVideo: false")
    expect(ads).toContain("fetch('/api/ads?action=upload'")
    expect(gateway).not.toContain('ffmpeg')
    expect(optimizer).not.toContain('/api/')
    expect(optimizer).not.toContain('Mongo')
    expect(optimizer).not.toContain('Redis')
  })
})
