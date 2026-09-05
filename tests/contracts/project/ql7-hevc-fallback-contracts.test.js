import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

function expectBefore(source, first, second) {
  const a = source.indexOf(first)
  const b = source.indexOf(second)
  expect(a, `missing ${first}`).toBeGreaterThanOrEqual(0)
  expect(b, `missing ${second}`).toBeGreaterThan(a)
}

describe('QL7 HEVC fallback V7 production contracts', () => {
  test('routes by real HEVC codec/config and never globally shadows native decode', () => {
    const fallback = read('lib/ql7HevcFallbackDecoder.js')
    const optimizer = read('lib/forumClientVideoOptimizer.js')
    expect(fallback).toContain("QL7_HEVC_FALLBACK_ID = 'ql7-hevc-wasm-fallback-v7-prod'")
    expect(fallback).toContain("packageVersion: '1.3.2'")
    expect(fallback).toContain("VideoDecoder?.isConfigSupported")
    expect(fallback).toContain("activeConfigContexts.has(fingerprintQl7HevcDecoderConfig(config))")
    expect(fallback).toContain("if (codec !== 'hevc') return false")
    expect(optimizer).toContain('isQl7HevcCodec(videoCodec, videoCodecString)')
    expect(optimizer).toContain('isQl7HevcCodec(videoCodec, videoCodecString || videoDecoderConfig?.codec)')
    expect(optimizer).toContain('probeQl7NativeVideoDecoder')
    expect(optimizer).toContain('acquireQl7HevcFallbackConfig')
  })

  test('fallback owns decode only and canonical V4 remains sole quality policy', () => {
    const fallbackFiles = [
      read('lib/ql7HevcFallbackDecoder.js'),
      read('lib/ql7HevcDecoderWorker.js'),
      read('lib/ql7HevcFallbackPrimitives.js'),
      read('lib/ql7HevcPresentationReorder.js'),
    ].join('\n')
    const optimizer = read('lib/forumClientVideoOptimizer.js')
    for (const forbidden of [
      '720p30', '720p24', '540p24', '480p24',
      'TARGET_BYTES', 'OUTPUT_MAX_BYTES', 'videoBitrate', 'audioBitrate',
      "fastStart: 'in-memory'", 'keyFrameIntervalSeconds',
    ]) expect(fallbackFiles).not.toContain(forbidden)
    expect(optimizer).toContain("QL7_CLIENT_VIDEO_POLICY_ID = 'ql7-client-video-streaming-v4'")
    expect(optimizer).toContain('FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES = 27 * MIB')
    expect(optimizer).toContain('FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES = 30 * MIB')
    expect(optimizer).toContain("fastStart: 'in-memory'")
  })

  test('parses hvcC and SPS reorder depth, holds B-frames by POC, and emits strictly increasing presentation timestamps', () => {
    const primitives = read('lib/ql7HevcFallbackPrimitives.js')
    const reorder = read('lib/ql7HevcPresentationReorder.js')
    const worker = read('lib/ql7HevcDecoderWorker.js')
    const fallback = read('lib/ql7HevcFallbackDecoder.js')
    expect(primitives).toContain('parseQl7HevcDecoderConfigurationRecord')
    expect(primitives).toContain('convertQl7HevcPacketToAnnexB')
    expect(primitives).toContain('packQl7Planar420Frame')
    expect(reorder).toContain("QL7_HEVC_PRESENTATION_REORDER_ID = 'ql7-hevc-poc-pts-reorder-v13'")
    expect(reorder).toContain('parseQl7HevcSpsMaxNumReorderPics')
    expect(reorder).toContain('this.frames.length > this.maxReorderPics')
    expect(reorder).toContain('frameItem.poc <= this.lastOutputPoc')
    expect(reorder).toContain('timing.timestamp > this.lastOutputTimestamp')
    expect(worker).toContain('poc: Number(frame?.poc || 0)')
    expect(worker).toContain('const result = serializeFrames(decoder.flush())')
    expectBefore(worker, 'const result = serializeFrames(decoder.flush())', 'await resetDecoder()')
    expect(fallback).toContain('new Ql7HevcPresentationScheduler(getQl7HevcMaxNumReorderPics(parsed.parameterSets))')
    expect(fallback).toContain('this.presentation.pushPacket(packet)')
    expect(fallback).toContain('this.presentation.pushFrames(frames)')
    expect(fallback).toContain('this.presentation?.finish()')
  })

  test('HEVC waits for verified prepared preview in both Forum and Ads, then reuses exact File', () => {
    const forum = read('app/forum/features/media/hooks/useForumComposerAttachments.js')
    const resolver = read('app/forum/features/media/services/resolveComposerMediaPayload.js')
    const ads = read('app/ads/home.js')
    expectBefore(forum, 'await prepareVideoPreviewFn(vf', 'URL.createObjectURL(previewFile)')
    expect(forum).toContain('preparedFile: preparedOnSelect ? previewFile : null')
    expect(resolver).toContain('localMeta?.preparedFile instanceof Blob ? localMeta.preparedFile : null')
    expectBefore(ads, 'await prepareForumVideoPreviewIfNeeded(file', 'URL.createObjectURL(previewFile)')
    expect(ads).toContain('videoFile: previewFile')
    expect(ads).toContain('videoPreparedOnSelect: needsPreparedPreview')
  })

  test('non-HEVC keeps legacy selection behavior and uploads only on Send/Create', () => {
    const optimizer = read('lib/forumClientVideoOptimizer.js')
    const forum = read('app/forum/features/media/hooks/useForumComposerAttachments.js')
    const ads = read('app/ads/home.js')
    expect(optimizer).toContain('classifyPreviewVideoCodec')
    expect(optimizer).toContain('needsPreparedPreview: false')
    expect(forum).not.toContain('uploadR2MediaFile')
    expect(ads).toContain('const checked = await checkVideoDuration(file)')
    expect(ads).toContain('previewFile = file')
  })

  test('worker imports the deterministic ESM bridge before HEVCDecoder.create', () => {
    const worker = read('lib/ql7HevcDecoderWorker.js')
    const fallback = read('lib/ql7HevcFallbackDecoder.js')
    expect(worker).toContain("QL7_HEVC_RUNTIME_ESM_BRIDGE_MARKER = 'QL7_HEVC_RUNTIME_ESM_BRIDGE_V12'")
    expect(worker).toContain('import(/* webpackIgnore: true */ runtimeUrl)')
    expect(worker).toContain('const factory = runtimeModule?.default')
    expect(worker).toContain('globalThis.HEVCDecoderModule = factory')
    expect(fallback).toContain("wasmUrl: `${FALLBACK_ASSET_BASE}/hevc-decode.mjs`")
    expectBefore(worker, 'await ensureQl7HevcRuntimeFactory()', 'decoder = await HEVCDecoder.create({')
    expect(worker).toContain('wasmBinaryUrl: decoderOptions.wasmBinaryUrl')
  })

  test('build vendors, validates and bundle-checks the pinned local WASM runtime', () => {
    const pkg = JSON.parse(read('package.json'))
    const install = read('tools/ql7-install-hevc-wasm-v7.mjs')
    const check = read('tools/ql7-hevc-assets-check-v7.mjs')
    const bundleCheck = read('tools/ql7-hevc-browser-bundle-check-v9.mjs')
    expect(pkg.dependencies?.['@hevcjs/core']).toBe('1.3.2')
    expect(pkg.scripts?.build).toContain('ql7:hevc:vendor')
    expect(pkg.scripts?.build).toContain('ql7:hevc:assets:check')
    expect(pkg.scripts?.build).toContain('ql7:hevc:bundle:check')
    expect(pkg.scripts?.['ql7:hevc:bundle:check']).toBe('node tools/ql7-hevc-browser-bundle-check-v9.mjs')
    expect(install).toContain("EXPECTED_VERSION = '1.3.2'")
    expect(check).toContain("EXPECTED_VERSION = '1.3.2'")
    expect(install).toContain('WebAssembly.validate')
    expect(check).toContain('WebAssembly.validate')
    expect(install).toContain("'hevc-decode.mjs'")
    expect(install).toContain('append-export-default-HEVCDecoderModule-v12')
    expect(check).toContain('QL7_HEVC_ESM_FACTORY_MISSING')
    expect(bundleCheck).toContain("marker = 'QL7_HEVC_RUNTIME_ESM_BRIDGE_V12'")
    expect(bundleCheck).toContain('QL7_HEVC_BROWSER_BUNDLE_CHECK_ESM_FACTORY_MISSING')
    expect(bundleCheck).toContain('/\\bimport\\s*\\(/')
    expect(bundleCheck).toContain('QL7_HEVC_BROWSER_BUNDLE_CHECK_OK')
  })
})
