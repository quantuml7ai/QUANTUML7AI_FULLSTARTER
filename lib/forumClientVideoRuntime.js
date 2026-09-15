const MIB = 1024 * 1024

export const QL7_MOBILE_VIDEO_EXECUTOR_ID = 'ql7-mobile-video-worker-opfs-r22-iphone-avc-one-shot'
export const QL7_MOBILE_VIDEO_ROUTING_MARKER = 'QL7_MOBILE_VIDEO_IPHONE_AVC_PRESSURE_R22_FINAL'
export const QL7_MOBILE_VIDEO_CHUNK_BYTES = 1 * MIB
export const QL7_MOBILE_VIDEO_STEP_SECONDS = 2
export const QL7_MOBILE_VIDEO_APPLE_STEP_SECONDS = 0.5
export const QL7_MOBILE_VIDEO_APPLE_INPUT_CACHE_BYTES = 2 * MIB
export const QL7_MOBILE_VIDEO_HEARTBEAT_MS = 5000
export const QL7_MOBILE_VIDEO_WATCHDOG_MS = 120000

function readNavigator() {
  try { return globalThis.navigator || null } catch { return null }
}

function parseAvcProfileLevel(codecString = '') {
  const match = /^avc1\.([0-9a-f]{6})$/i.exec(String(codecString || '').trim())
  if (!match) return Object.freeze({ profileIdc: null, levelIdc: null, highProfile: false, highLevel: false })

  const profileIdc = Number.parseInt(match[1].slice(0, 2), 16)
  const levelIdc = Number.parseInt(match[1].slice(4, 6), 16)
  const highProfile = profileIdc === 0x64
  // iPhone Photo/Telegram handoff reproduced on-device as avc1.640033 (High@5.1).
  // Level 5.0+ is treated as a resilient-path signal even when the exported
  // dimensions are only 1080p, because the legacy in-memory conversion can
  // still fail before any prepared preview exists.
  const highLevel = Number.isFinite(levelIdc) && levelIdc >= 0x32
  return Object.freeze({ profileIdc, levelIdc, highProfile, highLevel })
}

export function detectForumVideoRuntime() {
  const nav = readNavigator()
  const ua = String(nav?.userAgent || '')
  const platform = String(nav?.platform || '')
  const maxTouchPoints = Number(nav?.maxTouchPoints || 0)
  const uaDataMobile = nav?.userAgentData?.mobile === true
  const appleMobile = /iPhone|iPad|iPod/i.test(ua) || (platform === 'MacIntel' && maxTouchPoints > 1)
  const androidMobile = /Android/i.test(ua)
  const telegramWebView = /Telegram/i.test(ua) || !!globalThis.Telegram?.WebApp
  const mobile = uaDataMobile || appleMobile || androidMobile
  const workerSupported = typeof globalThis.Worker === 'function'
  const opfsSupported = typeof nav?.storage?.getDirectory === 'function'
  const webCodecsSupported = (
    typeof globalThis.VideoEncoder === 'function' &&
    typeof globalThis.VideoDecoder === 'function'
  )

  return Object.freeze({
    mobile,
    appleMobile,
    androidMobile,
    telegramWebView,
    workerSupported,
    opfsSupported,
    webCodecsSupported,
  })
}

export function classifyForumVideoProcessingPressure(metadata = {}, sourceBytes = 0) {
  const codedWidth = Number(metadata?.codedWidth || metadata?.displayWidth || 0)
  const codedHeight = Number(metadata?.codedHeight || metadata?.displayHeight || 0)
  const sourceFrameRate = Number(metadata?.sourceFrameRate || 0)
  const pixelsPerSecond = codedWidth > 0 && codedHeight > 0 && sourceFrameRate > 0
    ? codedWidth * codedHeight * sourceFrameRate
    : 0
  const bytes = Number(sourceBytes || 0)
  const codec = String(metadata?.videoCodec || '').trim().toLowerCase()
  const codecString = String(metadata?.videoCodecString || metadata?.videoDecoderConfig?.codec || '').trim().toLowerCase()
  const hevc = !!metadata?.hevcSource
  const avc = codec === 'avc' || /^avc1\./i.test(codecString)
  const avcProfile = parseAvcProfileLevel(codecString)
  const uhd = codedWidth >= 3840 || codedHeight >= 2160
  const fullHdOrAbove = codedWidth >= 1920 || codedHeight >= 1080
  const highFps = sourceFrameRate > 30.5
  const highPixelRate = pixelsPerSecond >= 150_000_000
  const catastrophicPixelRate = pixelsPerSecond >= 300_000_000
  const largeSource = bytes >= 40 * MIB
  const rotationBake = Number(metadata?.rotation || 0) !== 0
  const longDuration = Number(metadata?.durationSeconds || 0) >= 120
  const catastrophic = catastrophicPixelRate || (hevc && uhd && highFps) || (hevc && largeSource && uhd)

  // R22: on a real iPhone/Telegram run, an HEVC item from Photos arrived at the
  // web input already exported as AVC High@5.1 (avc1.640033). The old HEVC-only
  // router therefore committed the raw MOV preview and later failed in the
  // legacy in-memory decoder. This flag identifies the SOURCE profile only;
  // Apple runtime is applied by selectForumVideoExecutor so Android/desktop
  // behavior remains unchanged.
  const appleAvcPressureCandidate = avc && (
    uhd ||
    highPixelRate ||
    (avcProfile.highProfile && avcProfile.highLevel) ||
    (largeSource && fullHdOrAbove)
  )

  return Object.freeze({
    pixelsPerSecond,
    hevc,
    avc,
    codecString,
    avcProfileIdc: avcProfile.profileIdc,
    avcLevelIdc: avcProfile.levelIdc,
    avcHighProfile: avcProfile.highProfile,
    avcHighLevel: avcProfile.highLevel,
    appleAvcPressureCandidate,
    uhd,
    fullHdOrAbove,
    highFps,
    highPixelRate,
    catastrophicPixelRate,
    largeSource,
    rotationBake,
    longDuration,
    catastrophic,
  })
}

export function selectForumVideoExecutor({ runtime = detectForumVideoRuntime(), pressure = null } = {}) {
  if (!runtime?.mobile) return 'desktop-buffer'

  const appleAvcPressure = runtime?.appleMobile === true && pressure?.appleAvcPressureCandidate === true
  const needsResilientWorker = pressure?.hevc === true || appleAvcPressure
  if (!needsResilientWorker) return 'mobile-legacy-fallback'

  if (runtime.workerSupported && runtime.opfsSupported && runtime.webCodecsSupported) return 'mobile-worker-opfs'

  // Never knowingly return the proven-failing legacy contour for the exact
  // Apple AVC pressure class. HEVC preserves the previous fallback behavior
  // when it is not catastrophic and the Worker/OPFS contour is unavailable.
  if (appleAvcPressure || pressure?.catastrophic) return 'mobile-safe-unavailable'
  return 'mobile-legacy-fallback'
}
