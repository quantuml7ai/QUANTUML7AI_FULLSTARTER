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
    expect(pkg.dependencies?.['@hevcjs/core']).toBe('1.3.2')
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

    expect(paperclip).toContain('prepareVideoPreviewFn(vf')
    expect(paperclip).toContain('prepared?.needsPreparedPreview ? prepared?.file : vf')
    expect(paperclip).toContain('URL.createObjectURL(previewFile)')
    expect(paperclip).toContain("source: preparedOnSelect ? 'paperclip_hevc_prepared_preview' : 'paperclip_preview'")
    expect(paperclip).toContain('preparedFile: preparedOnSelect ? previewFile : null')
    expect(paperclip).not.toContain('uploadR2MediaFile')
    expect(composerSend).toContain('localMeta?.preparedFile instanceof Blob ? localMeta.preparedFile : null')
    expect(composerSend).toContain('await uploadR2MediaFile({')
    expect(composerSend).toContain("mode: 'video-required'")
    expect(composerSend).toContain("source: srcMeta || 'composer_blob'")
    expect(ads).toContain('prepareForumVideoPreviewIfNeeded(file')
    expect(ads).toContain('videoPreparedOnSelect: needsPreparedPreview')
    expect(ads).toContain('videoFile: previewFile')
    expect(ads).toContain('await uploadR2MediaFile({')
    expect(ads).toContain("mode: 'video-required'")
    expect(ads).toContain("kind: 'ads_video'")
    expect(ads).toContain("source: 'ads_creative'")
    expect(composerSend).not.toContain('optimizeForumVideoFastStart')
    expect(ads).not.toContain('optimizeForumVideoFastStart')
  })

  test('keeps desktop byte-path intact while mobile writes the heavy stage to OPFS in bounded chunks', () => {
    const optimizer = read('lib/forumClientVideoOptimizer.js')
    const runtime = read('lib/forumClientVideoRuntime.js')
    const opfs = read('lib/forumClientVideoOpfs.js')
    const bridge = read('lib/forumClientVideoWorkerBridge.js')
    const worker = read('lib/forumClientVideoOptimizerWorker.js')

    expect(optimizer).toContain("executor === 'mobile-worker-opfs'")
    expect(optimizer).toContain('executeForumVideoMobileWorker({')
    expect(optimizer).toContain('const target = new mediabunny.BufferTarget()')
    expect(optimizer).toContain("new mediabunny.Mp4OutputFormat({ fastStart: 'in-memory' })")
    expect(runtime).toContain("QL7_MOBILE_VIDEO_EXECUTOR_ID = 'ql7-mobile-video-worker-opfs-r22-iphone-avc-one-shot'")
    expect(runtime).toContain("QL7_MOBILE_VIDEO_ROUTING_MARKER = 'QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL'")
    expect(runtime).toContain('pressure?.appleAvcPressureCandidate === true')
    expect(runtime).toContain('const needsResilientWorker = pressure?.hevc === true || appleAvcPressure')
    expect(runtime).toContain("if (!needsResilientWorker) return 'mobile-legacy-fallback'")
    expect(runtime).toContain("return 'desktop-buffer'")
    expect(runtime).toContain("return 'mobile-safe-unavailable'")
    expect(opfs).toContain("QL7_MOBILE_VIDEO_OPFS_ID = 'ql7-mobile-opfs-positional-v15-safari-probed'")
    expect(opfs).toContain('accessHandle.write(part, { at: position + offset })')
    expect(opfs).toContain('chunkSize: QL7_MOBILE_VIDEO_CHUNK_BYTES')
    expect(bridge).toContain("name: 'ql7-forum-video-optimizer-mobile-r22'")
    expect(worker).toContain("QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL")
    expect(worker).toContain("internalStage: 'apple-avc-transient-retry'")
    expect(worker).toContain('new mediabunny.StreamTarget(writable, ql7MobileStreamTargetOptions())')
    expect(worker).toContain('new mediabunny.Mp4OutputFormat({ fastStart: false })')
    expect(worker).toContain('async function runOneShotConversion(job, conversion)')
    expect(worker).toContain('await conversion.execute()')
    expect(worker).not.toContain('conversion.execute({ until })')
    expect(worker).not.toContain('runSteppedConversion')
    expect(worker.split('await conversion.execute()').length - 1).toBe(1)
    expect(worker.split('await runOneShotConversion(job, conversion)').length - 1).toBe(2)
    expect(worker).toContain("new mediabunny.Mp4OutputFormat({ fastStart: 'in-memory' })")
    expect(worker).toContain("video: { codec: 'avc', forceTranscode: false }")
    expect(worker).toContain("audio: job.spec.hasAudio ? { codec: 'aac', forceTranscode: false }")
    expect(worker).toContain('useStreamReader: !stableAppleRead')
    expect(worker).toContain('probeNativeHevcRuntime')
    expect(worker).toContain('new mediabunny.EncodedPacketSink(videoTrack)')
    expect(worker).toContain("internalStage: 'native-hevc-runtime-failed'")
    expect(worker).toContain("'force-wasm'")
    expect(opfs).toContain('probeQl7MobileOpfsRuntime')
    expect(opfs).toContain("QL7_MOBILE_VIDEO_OPFS_PROBE_MARKER = 'QL7_MOBILE_VIDEO_OPFS_RUNTIME_PROBE_V15'")
    expect(optimizer).toContain('QL7_MOBILE_VIDEO_APPLE_INPUT_CACHE_BYTES')
    expect(optimizer).toContain('QL7_MOBILE_VIDEO_APPLE_STEP_SECONDS')

    for (const forbidden of ['720p30', '720p24', '540p24', '480p24', '27 * MIB', '30 * MIB']) {
      expect(runtime).not.toContain(forbidden)
      expect(opfs).not.toContain(forbidden)
      expect(bridge).not.toContain(forbidden)
      expect(worker).not.toContain(forbidden)
    }
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
