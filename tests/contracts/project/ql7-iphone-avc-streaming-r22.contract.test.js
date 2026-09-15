import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

function expectBefore(source, left, right) {
  const a = source.indexOf(left)
  const b = source.indexOf(right)
  expect(a, `missing: ${left}`).toBeGreaterThanOrEqual(0)
  expect(b, `missing: ${right}`).toBeGreaterThanOrEqual(0)
  expect(a).toBeLessThan(b)
}

describe('QL7 iPhone AVC streaming R22 clean-baseline contracts', () => {
  test('keeps the exact observed iPhone AVC High@5.1 route while ordinary H.264 stays legacy', () => {
    const runtime = read('lib/forumClientVideoRuntime.js')
    expect(runtime).toContain("QL7_MOBILE_VIDEO_ROUTING_MARKER = 'QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL'")
    expect(runtime).toContain("QL7_MOBILE_VIDEO_EXECUTOR_ID = 'ql7-mobile-video-worker-opfs-r22-iphone-avc-one-shot'")
    expect(runtime).toContain('levelIdc >= 0x32')
    expect(runtime).toContain('appleAvcPressureCandidate')
    expect(runtime).toContain('runtime?.appleMobile === true && pressure?.appleAvcPressureCandidate === true')
    expect(runtime).toContain('const needsResilientWorker = pressure?.hevc === true || appleAvcPressure')
    expect(runtime).toContain("if (!needsResilientWorker) return 'mobile-legacy-fallback'")
  })

  test('awaits Apple pressure preparation before Forum and Ads commit preview URLs', () => {
    const optimizer = read('lib/forumClientVideoOptimizer.js')
    const forum = read('app/forum/features/media/hooks/useForumComposerAttachments.js')
    const ads = read('app/ads/home.js')

    expect(optimizer).toContain('if (runtime.appleMobile)')
    expect(optimizer).toContain('classification = await inspectSource(mediabunny, file, opts)')
    expect(optimizer).toContain('const appleAvcPressure = runtime.appleMobile === true && pressure?.appleAvcPressureCandidate === true')
    expect(optimizer).toContain('if (!classification.hevcSource && !appleAvcPressure)')
    expectBefore(optimizer, 'if (!classification.hevcSource && !appleAvcPressure)', 'const optimized = await optimizeForumVideoOnDevice(file, opts)')
    expectBefore(forum, 'const prepared = await prepareVideoPreviewFn(vf', 'URL.createObjectURL(previewFile)')
    expectBefore(ads, 'const prepared = await prepareForumVideoPreviewIfNeeded(file', 'createdUrl = URL.createObjectURL(previewFile)')
  })

  test('uses OPFS StreamTarget but executes each Mediabunny Conversion instance exactly once', () => {
    const worker = read('lib/forumClientVideoOptimizerWorker.js')
    const bridge = read('lib/forumClientVideoWorkerBridge.js')

    expect(worker).toContain("QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL")
    expect(worker).toContain('new mediabunny.StreamTarget(writable, ql7MobileStreamTargetOptions())')
    expect(worker).toContain("new mediabunny.Mp4OutputFormat({ fastStart: false })")
    expect(worker).toContain('async function runOneShotConversion(job, conversion)')
    expect(worker).toContain('await conversion.execute()')
    expect(worker).not.toContain('conversion.execute({ until })')
    expect(worker).not.toContain('runSteppedConversion')
    expect(worker.match(/await conversion\.execute\(\)/g) || []).toHaveLength(1)
    expect(worker.match(/await runOneShotConversion\(job, conversion\)/g) || []).toHaveLength(2)
    expect(bridge).toContain("name: 'ql7-forum-video-optimizer-mobile-r22'")
  })

  test('preserves bounded codec retries without treating control-flow double execution as a codec failure', () => {
    const worker = read('lib/forumClientVideoOptimizerWorker.js')
    expect(worker).toContain('isTransientAppleAvcCodecFailure')
    expect(worker).toContain("const candidates = ['prefer-software', 'prefer-hardware']")
    expect(worker).toContain("internalStage: 'apple-avc-transient-retry'")
    expect(worker).not.toContain('Conversion cannot be executed twice')
  })

  test('ships no R20D or R21D1 on-screen diagnostics in the production postimage', () => {
    for (const relative of [
      'lib/forumClientVideoRuntime.js',
      'lib/forumClientVideoOptimizer.js',
      'lib/forumClientVideoOptimizerWorker.js',
      'lib/forumClientVideoWorkerBridge.js',
      'app/forum/features/media/hooks/useForumComposerAttachments.js',
      'app/ads/home.js',
    ]) {
      const source = read(relative)
      expect(source).not.toContain('QL7_IPHONE_VIDEO_TOAST_DIAG_R20D')
      expect(source).not.toContain('QL7_IPHONE_AVC_WORKER_FAILURE_LENS_R21D1')
      expect(source).not.toContain('showR21D1FailureLens')
    }
  })
})
