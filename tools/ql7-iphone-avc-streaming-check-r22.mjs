import fs from 'node:fs'
import {
  classifyForumVideoProcessingPressure,
  selectForumVideoExecutor,
} from '../lib/forumClientVideoRuntime.js'

const read = (path) => fs.readFileSync(path, 'utf8')
const runtime = read('lib/forumClientVideoRuntime.js')
const optimizer = read('lib/forumClientVideoOptimizer.js')
const worker = read('lib/forumClientVideoOptimizerWorker.js')
const bridge = read('lib/forumClientVideoWorkerBridge.js')
const forum = read('app/forum/features/media/hooks/useForumComposerAttachments.js')
const ads = read('app/ads/home.js')

const requireText = (source, text, code) => {
  if (!source.includes(text)) throw new Error(code)
}
const forbidText = (source, text, code) => {
  if (source.includes(text)) throw new Error(code)
}
const before = (source, left, right, code) => {
  const a = source.indexOf(left)
  const b = source.indexOf(right)
  if (a < 0 || b < 0 || a >= b) throw new Error(code)
}

requireText(runtime, "QL7_MOBILE_VIDEO_ROUTING_MARKER = 'QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL'", 'R22_ROUTING_MARKER_MISSING')
requireText(runtime, "QL7_MOBILE_VIDEO_EXECUTOR_ID = 'ql7-mobile-video-worker-opfs-r22-iphone-avc-one-shot'", 'R22_EXECUTOR_ID_MISSING')
requireText(runtime, 'levelIdc >= 0x32', 'R22_AVC_HIGH_LEVEL_BOUNDARY_MISSING')
requireText(runtime, 'appleAvcPressureCandidate', 'R22_APPLE_AVC_PRESSURE_MISSING')
requireText(runtime, 'pressure?.hevc === true || appleAvcPressure', 'R22_RESILIENT_ROUTE_MISSING')
requireText(runtime, "if (!needsResilientWorker) return 'mobile-legacy-fallback'", 'R22_ORDINARY_H264_BOUNDARY_MISSING')

requireText(optimizer, 'if (runtime.appleMobile)', 'R22_SELECTION_APPLE_INSPECTION_MISSING')
requireText(optimizer, 'classification = await inspectSource(mediabunny, file, opts)', 'R22_SELECTION_SOURCE_INSPECT_MISSING')
requireText(optimizer, 'if (!classification.hevcSource && !appleAvcPressure)', 'R22_SELECTION_RAW_BOUNDARY_MISSING')
before(optimizer, 'if (!classification.hevcSource && !appleAvcPressure)', 'const optimized = await optimizeForumVideoOnDevice(file, opts)', 'R22_SELECTION_PREPARE_ORDER_BAD')

requireText(worker, 'QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL', 'R22_WORKER_MARKER_MISSING')
requireText(worker, 'new mediabunny.StreamTarget(writable, ql7MobileStreamTargetOptions())', 'R22_OPFS_STREAM_MISSING')
requireText(worker, 'async function runOneShotConversion(job, conversion)', 'R22_ONE_SHOT_HELPER_MISSING')
requireText(worker, 'await conversion.execute()', 'R22_ONE_SHOT_EXECUTE_MISSING')
forbidText(worker, 'conversion.execute({ until })', 'R22_DOUBLE_EXECUTE_UNTIL_PRESENT')
forbidText(worker, 'runSteppedConversion', 'R22_STEPPED_CONVERSION_PRESENT')

const executeCalls = worker.match(/await conversion\.execute\(\)/g) || []
const helperCalls = worker.match(/await runOneShotConversion\(job, conversion\)/g) || []
if (executeCalls.length !== 1) throw new Error(`R22_EXECUTE_CALL_COUNT:${executeCalls.length}`)
if (helperCalls.length !== 2) throw new Error(`R22_HELPER_CALL_COUNT:${helperCalls.length}`)
requireText(bridge, "name: 'ql7-forum-video-optimizer-mobile-r22'", 'R22_BRIDGE_NAME_MISSING')

before(forum, 'const prepared = await prepareVideoPreviewFn(vf', 'URL.createObjectURL(previewFile)', 'R22_FORUM_PREVIEW_ORDER_BAD')
before(ads, 'const prepared = await prepareForumVideoPreviewIfNeeded(file', 'createdUrl = URL.createObjectURL(previewFile)', 'R22_ADS_PREVIEW_ORDER_BAD')

const appleRuntime = {
  mobile: true,
  appleMobile: true,
  androidMobile: false,
  workerSupported: true,
  opfsSupported: true,
  webCodecsSupported: true,
}

const observed4k = classifyForumVideoProcessingPressure({
  codedWidth: 3840,
  codedHeight: 2160,
  sourceFrameRate: 30,
  videoCodec: 'avc',
  videoCodecString: 'avc1.640033',
  hevcSource: false,
}, Math.round(49.1 * 1024 * 1024))

if (observed4k.pixelsPerSecond !== 248_832_000 || observed4k.appleAvcPressureCandidate !== true) {
  throw new Error('R22_OBSERVED_4K30_PRESSURE_REGRESSION')
}
if (selectForumVideoExecutor({ runtime: appleRuntime, pressure: observed4k }) !== 'mobile-worker-opfs') {
  throw new Error('R22_OBSERVED_4K30_EXECUTOR_REGRESSION')
}

const observed1080 = classifyForumVideoProcessingPressure({
  codedWidth: 1080,
  codedHeight: 1920,
  sourceFrameRate: 30,
  videoCodec: 'avc',
  videoCodecString: 'avc1.640033',
  hevcSource: false,
}, 27_418_215)
if (observed1080.appleAvcPressureCandidate !== true || selectForumVideoExecutor({ runtime: appleRuntime, pressure: observed1080 }) !== 'mobile-worker-opfs') {
  throw new Error('R22_OBSERVED_1080_HIGH51_EXECUTOR_REGRESSION')
}

const ordinary = classifyForumVideoProcessingPressure({
  codedWidth: 1920,
  codedHeight: 1080,
  sourceFrameRate: 30,
  videoCodec: 'avc',
  videoCodecString: 'avc1.640028',
  hevcSource: false,
}, 20 * 1024 * 1024)
if (ordinary.appleAvcPressureCandidate !== false || selectForumVideoExecutor({ runtime: appleRuntime, pressure: ordinary }) !== 'mobile-legacy-fallback') {
  throw new Error('R22_ORDINARY_H264_REGRESSION')
}

for (const [name, source] of [
  ['runtime', runtime], ['optimizer', optimizer], ['worker', worker],
  ['bridge', bridge], ['forum', forum], ['ads', ads],
]) {
  if (
    source.includes('QL7_IPHONE_VIDEO_TOAST_DIAG_R20D') ||
    source.includes('QL7_IPHONE_AVC_WORKER_FAILURE_LENS_R21D1') ||
    source.includes('showR21D1FailureLens')
  ) {
    throw new Error(`R22_DIAGNOSTIC_LEAK:${name}`)
  }
}

process.stdout.write(`QL7_IPHONE_AVC_STREAMING_R22_CHECK_OK ${JSON.stringify({
  routingMarker: 'QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL',
  workerMarker: 'QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL',
  observedCodec: 'avc1.640033',
  executor: 'mobile-worker-opfs',
  conversionExecution: 'one-execute-per-conversion-instance',
  opfsStreamTarget: true,
  diagnosticRuntime: false,
})}\n`)
