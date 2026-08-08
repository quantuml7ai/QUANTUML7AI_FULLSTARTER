const MIB = 1024 * 1024
const DEV_EVENT_LIMIT = 80
const INPUT_CACHE_BYTES = 8 * MIB
const VIDEO_FRAME_RATE_EPSILON = 0.75

export const QL7_CLIENT_VIDEO_POLICY_ID = 'ql7-client-video-streaming-v4'
export const FORUM_CLIENT_VIDEO_OPTIMIZER_SOURCE_MAX_BYTES = 1536 * MIB
export const FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES = 30 * MIB
export const FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES = 27 * MIB
export const FORUM_CLIENT_VIDEO_OPTIMIZER_MIN_TARGET_BYTES = 3 * MIB
export const FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_TOTAL_BITRATE = 1_900_000
export const FORUM_CLIENT_VIDEO_OPTIMIZER_FRAME_RATE = 30

export const FORUM_CLIENT_VIDEO_QUALITY_PROFILES = Object.freeze([
  Object.freeze({ id: '720p30', landscapeWidth: 1280, landscapeHeight: 720, portraitWidth: 720, portraitHeight: 1280, frameRate: 30, minimumVideoBitrate: 1_250_000 }),
  Object.freeze({ id: '720p24', landscapeWidth: 1280, landscapeHeight: 720, portraitWidth: 720, portraitHeight: 1280, frameRate: 24, minimumVideoBitrate: 950_000 }),
  Object.freeze({ id: '540p24', landscapeWidth: 960, landscapeHeight: 540, portraitWidth: 540, portraitHeight: 960, frameRate: 24, minimumVideoBitrate: 620_000 }),
  Object.freeze({ id: '480p24', landscapeWidth: 854, landscapeHeight: 480, portraitWidth: 480, portraitHeight: 854, frameRate: 24, minimumVideoBitrate: 480_000 }),
])

export const FORUM_CLIENT_VIDEO_OPTIMIZER_DEFAULTS = Object.freeze({
  maxSourceBytes: FORUM_CLIENT_VIDEO_OPTIMIZER_SOURCE_MAX_BYTES,
  maxOutputBytes: FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES,
  targetOutputBytes: FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES,
  minTargetOutputBytes: FORUM_CLIENT_VIDEO_OPTIMIZER_MIN_TARGET_BYTES,
  targetTotalBitrate: FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_TOTAL_BITRATE,
  frameRate: FORUM_CLIENT_VIDEO_OPTIMIZER_FRAME_RATE,
  audioBitrate: 96_000,
  minimumVideoBitrate: 480_000,
  maximumVideoBitrate: 5_000_000,
  qualityProfiles: FORUM_CLIENT_VIDEO_QUALITY_PROFILES,
  maxAttempts: 3,
  keyFrameInterval: 2,
  hardwareAcceleration: 'no-preference',
  outputSuffix: '_FFMP',
  maxDurationSeconds: 300,
  inputCacheBytes: INPUT_CACHE_BYTES,
})

let mediabunnyPromise = null
let aacEncoderRegistrationPromise = null
const verifiedVideoUploadProofs = new WeakMap()

export class ForumClientVideoOptimizerError extends Error {
  constructor(code, message, details = null) {
    super(message)
    this.name = 'ForumClientVideoOptimizerError'
    this.code = String(code || 'VIDEO_OPTIMIZER_FAILED')
    this.details = details
  }
}

function fail(code, message, details = null) {
  throw new ForumClientVideoOptimizerError(code, message, details)
}

function ensureBrowserRuntime() {
  if (typeof window === 'undefined' || typeof Blob === 'undefined') {
    fail('VIDEO_OPTIMIZER_BROWSER_ONLY', 'Client video optimizer is available only in a browser runtime.')
  }

  const hostname = String(window.location?.hostname || '')
  const localhost = /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(hostname)
  if (!window.isSecureContext && !localhost) {
    fail('VIDEO_OPTIMIZER_SECURE_CONTEXT_REQUIRED', 'WebCodecs requires HTTPS or localhost.')
  }
}

function normalizeOptions(options = {}) {
  const merged = { ...FORUM_CLIENT_VIDEO_OPTIMIZER_DEFAULTS, ...(options || {}) }

  if (!Number.isFinite(merged.maxSourceBytes) || merged.maxSourceBytes < MIB) {
    fail('VIDEO_OPTIMIZER_BAD_SOURCE_LIMIT', 'Invalid maxSourceBytes value.')
  }
  if (!Number.isFinite(merged.maxOutputBytes) || merged.maxOutputBytes < 2 * MIB) {
    fail('VIDEO_OPTIMIZER_BAD_OUTPUT_LIMIT', 'Invalid maxOutputBytes value.')
  }
  if (!Number.isFinite(merged.targetOutputBytes) || merged.targetOutputBytes < MIB) {
    fail('VIDEO_OPTIMIZER_BAD_TARGET_SIZE', 'Invalid targetOutputBytes value.')
  }
  if (merged.targetOutputBytes > merged.maxOutputBytes) {
    fail('VIDEO_OPTIMIZER_TARGET_EXCEEDS_MAX', 'targetOutputBytes must not exceed maxOutputBytes.')
  }
  if (!Number.isFinite(merged.minTargetOutputBytes) || merged.minTargetOutputBytes < MIB) {
    fail('VIDEO_OPTIMIZER_BAD_MIN_TARGET_SIZE', 'Invalid minTargetOutputBytes value.')
  }
  if (merged.minTargetOutputBytes > merged.targetOutputBytes) {
    fail('VIDEO_OPTIMIZER_MIN_TARGET_EXCEEDS_TARGET', 'minTargetOutputBytes must not exceed targetOutputBytes.')
  }
  if (!Number.isFinite(merged.targetTotalBitrate) || merged.targetTotalBitrate < 500_000) {
    fail('VIDEO_OPTIMIZER_BAD_TARGET_BITRATE', 'Invalid targetTotalBitrate value.')
  }
  if (!Array.isArray(merged.qualityProfiles) || !merged.qualityProfiles.length) {
    fail('VIDEO_OPTIMIZER_BAD_QUALITY_PROFILES', 'At least one quality profile is required.')
  }
  if (!Number.isFinite(merged.frameRate) || merged.frameRate < 15 || merged.frameRate > 60) {
    fail('VIDEO_OPTIMIZER_BAD_FRAME_RATE', 'frameRate must be between 15 and 60.')
  }
  if (!Number.isInteger(merged.maxAttempts) || merged.maxAttempts < 1 || merged.maxAttempts > 4) {
    fail('VIDEO_OPTIMIZER_BAD_ATTEMPTS', 'maxAttempts must be between 1 and 4.')
  }
  if (!Number.isFinite(merged.maxDurationSeconds) || merged.maxDurationSeconds <= 0) {
    fail('VIDEO_OPTIMIZER_BAD_DURATION_LIMIT', 'Invalid maxDurationSeconds value.')
  }
  if (!Number.isFinite(merged.inputCacheBytes) || merged.inputCacheBytes < MIB) {
    fail('VIDEO_OPTIMIZER_BAD_INPUT_CACHE', 'Invalid inputCacheBytes value.')
  }
  if (!['no-preference', 'prefer-hardware', 'prefer-software'].includes(merged.hardwareAcceleration)) {
    fail('VIDEO_OPTIMIZER_BAD_ACCELERATION_MODE', 'Invalid hardwareAcceleration value.')
  }

  return merged
}

function abortError() {
  try {
    return new DOMException('Video optimization aborted', 'AbortError')
  } catch {
    const error = new Error('Video optimization aborted')
    error.name = 'AbortError'
    return error
  }
}

function throwIfAborted(signal) {
  if (signal?.aborted) throw abortError()
}

function isAbortLike(error, signal) {
  return !!(
    signal?.aborted ||
    error?.name === 'AbortError' ||
    error?.name === 'ConversionCanceledError' ||
    error?.name === 'InputDisposedError'
  )
}

function emitProgress(callback, payload) {
  const event = { at: Date.now(), ...(payload || {}) }
  pushDevEvent(event)
  if (typeof callback !== 'function') return
  try {
    callback(event)
  } catch {}
}

function pushDevEvent(event) {
  if (process.env.NODE_ENV === 'production') return
  if (typeof window === 'undefined') return

  try {
    const events = Array.isArray(window.__ql7ClientVideoOptimizerEvents)
      ? window.__ql7ClientVideoOptimizerEvents
      : []
    events.push(event)
    if (events.length > DEV_EVENT_LIMIT) events.splice(0, events.length - DEV_EVENT_LIMIT)
    window.__ql7ClientVideoOptimizerEvents = events
  } catch {}
}

export function buildForumOptimizedVideoName(fileOrName, suffix = '_FFMP') {
  const sourceName = typeof fileOrName === 'string'
    ? fileOrName
    : String(fileOrName?.name || 'video')
  const cleanName = String(sourceName || 'video').trim() || 'video'
  const dot = cleanName.lastIndexOf('.')
  const base = dot > 0 ? cleanName.slice(0, dot) : cleanName
  const normalizedSuffix = String(suffix || '_FFMP')
  const outputBase = base.toLowerCase().endsWith(normalizedSuffix.toLowerCase()) ? base : `${base}${normalizedSuffix}`
  return `${outputBase}.mp4`
}

function evenFloor(value) {
  return Math.max(2, Math.floor(Math.max(2, Number(value || 2)) / 2) * 2)
}

export function calculateForumVideoTargetDimensions(displayWidth, displayHeight, profile = FORUM_CLIENT_VIDEO_QUALITY_PROFILES[0]) {
  const width = Number(displayWidth)
  const height = Number(displayHeight)

  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    fail('VIDEO_OPTIMIZER_BAD_DIMENSIONS', `Invalid source dimensions: ${width}x${height}.`)
  }

  const portrait = height > width
  const boxWidth = portrait ? Number(profile?.portraitWidth || 720) : Number(profile?.landscapeWidth || 1280)
  const boxHeight = portrait ? Number(profile?.portraitHeight || 1280) : Number(profile?.landscapeHeight || 720)
  const scale = Math.min(1, boxWidth / width, boxHeight / height)

  return {
    portrait,
    boxWidth,
    boxHeight,
    width: evenFloor(width * scale),
    height: evenFloor(height * scale),
    scale,
    profileId: String(profile?.id || 'custom'),
  }
}

export function calculateForumVideoAdaptiveTargetBytes({
  durationSeconds,
  sourceBytes = 0,
  preferredTargetBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES,
  minTargetBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_MIN_TARGET_BYTES,
  maxOutputBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES,
  targetTotalBitrate = FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_TOTAL_BITRATE,
} = {}) {
  const duration = Number(durationSeconds)
  if (!Number.isFinite(duration) || duration <= 0) {
    fail('VIDEO_OPTIMIZER_BAD_DURATION', 'Unable to determine source video duration.')
  }

  const durationBudget = Math.floor((duration * Number(targetTotalBitrate)) / 8)
  let targetBytes = Math.min(Number(preferredTargetBytes), Number(maxOutputBytes), Math.max(Number(minTargetBytes), durationBudget))
  const sourceSize = Number(sourceBytes || 0)
  if (Number.isFinite(sourceSize) && sourceSize > 0 && sourceSize < targetBytes) {
    targetBytes = Math.max(MIB, Math.floor(sourceSize * 0.96))
  }

  return Math.max(MIB, Math.min(Math.floor(Number(maxOutputBytes)), Math.floor(targetBytes)))
}

export function calculateForumVideoBitratePlan({
  durationSeconds,
  targetOutputBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES,
  hasAudio = true,
  requestedAudioBitrate = 96_000,
  minimumVideoBitrate = 480_000,
  maximumVideoBitrate = 5_000_000,
} = {}) {
  const duration = Number(durationSeconds)
  if (!Number.isFinite(duration) || duration <= 0) {
    fail('VIDEO_OPTIMIZER_BAD_DURATION', 'Unable to determine source video duration.')
  }

  const totalBitrate = Math.floor((Number(targetOutputBytes) * 8) / duration)
  const audioBitrate = hasAudio
    ? Math.min(requestedAudioBitrate, Math.max(64_000, Math.floor(totalBitrate * 0.08)))
    : 0
  const muxReserve = Math.max(24_000, Math.floor(totalBitrate * 0.04))
  const rawVideoBitrate = totalBitrate - audioBitrate - muxReserve

  if (rawVideoBitrate < minimumVideoBitrate) {
    fail(
      'VIDEO_OPTIMIZER_SIZE_TARGET_TOO_SMALL',
      `The target size is too small for the selected streaming profile.`,
      { rawVideoBitrate, minimumVideoBitrate, durationSeconds: duration, targetOutputBytes },
    )
  }

  return {
    totalBitrate,
    audioBitrate,
    muxReserve,
    rawVideoBitrate,
    minimumVideoBitrate,
    videoBitrate: Math.min(maximumVideoBitrate, rawVideoBitrate),
  }
}

export function selectForumVideoEncodingProfile({
  durationSeconds,
  sourceBytes = 0,
  displayWidth,
  displayHeight,
  hasAudio = true,
  preferredTargetBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_BYTES,
  minTargetBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_MIN_TARGET_BYTES,
  maxOutputBytes = FORUM_CLIENT_VIDEO_OPTIMIZER_OUTPUT_MAX_BYTES,
  targetTotalBitrate = FORUM_CLIENT_VIDEO_OPTIMIZER_TARGET_TOTAL_BITRATE,
  requestedAudioBitrate = 96_000,
  maximumVideoBitrate = 5_000_000,
  qualityProfiles = FORUM_CLIENT_VIDEO_QUALITY_PROFILES,
} = {}) {
  const targetOutputBytes = calculateForumVideoAdaptiveTargetBytes({
    durationSeconds,
    sourceBytes,
    preferredTargetBytes,
    minTargetBytes,
    maxOutputBytes,
    targetTotalBitrate,
  })

  const failures = []
  for (const profile of qualityProfiles) {
    const dimensions = calculateForumVideoTargetDimensions(displayWidth, displayHeight, profile)
    try {
      const bitratePlan = calculateForumVideoBitratePlan({
        durationSeconds,
        targetOutputBytes,
        hasAudio,
        requestedAudioBitrate,
        minimumVideoBitrate: Number(profile.minimumVideoBitrate),
        maximumVideoBitrate,
      })
      return {
        profileId: String(profile.id),
        frameRate: Number(profile.frameRate),
        minimumVideoBitrate: Number(profile.minimumVideoBitrate),
        targetOutputBytes,
        dimensions,
        bitratePlan,
      }
    } catch (error) {
      if (error?.code !== 'VIDEO_OPTIMIZER_SIZE_TARGET_TOO_SMALL') throw error
      failures.push({ profileId: String(profile.id), details: error?.details || null })
    }
  }

  fail('VIDEO_OPTIMIZER_SIZE_TARGET_TOO_SMALL', 'The output limit cannot preserve acceptable streaming quality.', {
    targetOutputBytes,
    durationSeconds: Number(durationSeconds),
    failures,
  })
}

async function loadMediabunny() {
  if (!mediabunnyPromise) {
    mediabunnyPromise = import('mediabunny').catch((error) => {
      mediabunnyPromise = null
      fail(
        'VIDEO_OPTIMIZER_ENGINE_MISSING',
        'The mediabunny package is unavailable. Run pnpm install.',
        { cause: String(error?.message || error || '') },
      )
    })
  }
  return mediabunnyPromise
}

async function ensureAacEncoder(mediabunny, config) {
  if (await mediabunny.canEncodeAudio('aac', config)) return 'native'

  if (!aacEncoderRegistrationPromise) {
    aacEncoderRegistrationPromise = import('@mediabunny/aac-encoder')
      .then((extension) => {
        extension.registerAacEncoder()
        return true
      })
      .catch((error) => {
        aacEncoderRegistrationPromise = null
        throw error
      })
  }

  try {
    await aacEncoderRegistrationPromise
  } catch (error) {
    fail(
      'VIDEO_OPTIMIZER_AAC_ENCODER_MISSING',
      'AAC encoding is unavailable and the local fallback could not load.',
      { cause: String(error?.message || error || '') },
    )
  }

  if (!(await mediabunny.canEncodeAudio('aac', config))) {
    fail('VIDEO_OPTIMIZER_AAC_ENCODER_UNSUPPORTED', 'AAC encoding is unavailable on this device.')
  }

  return 'fallback'
}

function createInput(mediabunny, blob, inputCacheBytes) {
  return new mediabunny.Input({
    formats: mediabunny.ALL_FORMATS,
    source: new mediabunny.BlobSource(blob, {
      maxCacheSize: inputCacheBytes,
      useStreamReader: true,
    }),
  })
}

function readFiniteMediaDuration(media) {
  const direct = Number(media?.duration)
  if (Number.isFinite(direct) && direct > 0) return direct

  try {
    const seekable = media?.seekable
    if (seekable && seekable.length > 0) {
      const end = Number(seekable.end(seekable.length - 1))
      if (Number.isFinite(end) && end > 0) return end
    }
  } catch {}

  return Number.NaN
}

export async function readForumVideoDurationFromBrowser(file, { timeoutMs = 12000 } = {}) {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    return Number.NaN
  }
  if (!(file instanceof Blob) || Number(file.size || 0) <= 0) return Number.NaN

  const video = document.createElement('video')
  const objectUrl = URL.createObjectURL(file)
  const safeTimeoutMs = Math.max(1500, Math.min(30000, Number(timeoutMs) || 12000))

  try {
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    return await new Promise((resolve) => {
      let settled = false
      let timer = 0

      let seekProbeStarted = false

      const cleanup = () => {
        if (timer) clearTimeout(timer)
        video.removeEventListener('loadedmetadata', inspect)
        video.removeEventListener('durationchange', inspect)
        video.removeEventListener('loadeddata', inspect)
        video.removeEventListener('progress', inspect)
        video.removeEventListener('seeked', inspect)
        video.removeEventListener('timeupdate', inspect)
        video.removeEventListener('error', finishInvalid)
        try {
          video.removeAttribute('src')
          video.load()
        } catch {}
      }
      const finish = (value) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(Number.isFinite(value) && value > 0 ? Number(value) : Number.NaN)
      }
      const finishInvalid = () => finish(Number.NaN)
      const inspect = () => {
        const duration = readFiniteMediaDuration(video)
        if (Number.isFinite(duration) && duration > 0) {
          finish(duration)
          return
        }

        if (!seekProbeStarted && video.readyState >= 1) {
          seekProbeStarted = true
          try { video.currentTime = 1e10 } catch {}
        }
      }

      video.addEventListener('loadedmetadata', inspect)
      video.addEventListener('durationchange', inspect)
      video.addEventListener('loadeddata', inspect)
      video.addEventListener('progress', inspect)
      video.addEventListener('seeked', inspect)
      video.addEventListener('timeupdate', inspect)
      video.addEventListener('error', finishInvalid, { once: true })
      timer = setTimeout(() => finish(readFiniteMediaDuration(video)), safeTimeoutMs)
      video.src = objectUrl
      try { video.load() } catch {}
    })
  } finally {
    try { URL.revokeObjectURL(objectUrl) } catch {}
  }
}

async function readDuration(input, videoTrack, file) {
  let duration = Number.NaN
  try {
    duration = Number(await videoTrack.getDurationFromMetadata({ skipLiveWait: true }))
  } catch {}

  if (!Number.isFinite(duration) || duration <= 0) {
    try {
      duration = Number(await input.computeDuration())
    } catch {}
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    duration = await readForumVideoDurationFromBrowser(file)
  }

  return Number(duration)
}

async function inspectSource(mediabunny, file, options) {
  const input = createInput(mediabunny, file, options.inputCacheBytes)

  try {
    const readable = await input.canRead()
    if (!readable) fail('VIDEO_OPTIMIZER_UNREADABLE_INPUT', 'The selected media container cannot be read.')

    const videoTrack = await input.getPrimaryVideoTrack()
    if (!videoTrack) fail('VIDEO_OPTIMIZER_NO_VIDEO_TRACK', 'The selected file has no video track.')

    const audioTrack = await input.getPrimaryAudioTrack()
    const durationSeconds = await readDuration(input, videoTrack, file)
    const displayWidth = await videoTrack.getDisplayWidth()
    const displayHeight = await videoTrack.getDisplayHeight()
    const codedWidth = await videoTrack.getCodedWidth()
    const codedHeight = await videoTrack.getCodedHeight()
    const rotation = await videoTrack.getRotation()
    const videoCodec = await videoTrack.getCodec()
    const videoCodecString = await videoTrack.getCodecParameterString()
    const videoDecodable = await videoTrack.canDecode()
    const colorSpace = await videoTrack.getColorSpace().catch(() => null)
    const audioCodec = audioTrack ? await audioTrack.getCodec() : null
    const audioDecodable = audioTrack ? await audioTrack.canDecode() : true

    let sourceFrameRate = null
    try {
      const stats = await videoTrack.computePacketStats(180)
      const average = Number(stats?.averagePacketRate)
      if (Number.isFinite(average) && average > 0) sourceFrameRate = average
    } catch {}

    return {
      durationSeconds,
      displayWidth,
      displayHeight,
      codedWidth,
      codedHeight,
      rotation,
      videoCodec,
      videoCodecString,
      videoDecodable,
      colorSpace,
      sourceFrameRate,
      audioCodec,
      audioDecodable,
      hasAudio: !!audioTrack,
    }
  } finally {
    input.dispose()
  }
}

function readUint64(view, offset) {
  const high = view.getUint32(offset, false)
  const low = view.getUint32(offset + 4, false)
  return high * 2 ** 32 + low
}

export async function readForumMp4TopLevelAtoms(blob) {
  const atoms = []
  let offset = 0
  let guard = 0

  while (offset + 8 <= blob.size && guard < 10000) {
    guard += 1
    const buffer = await blob.slice(offset, Math.min(blob.size, offset + 16)).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (bytes.length < 8) break

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    let size = view.getUint32(0, false)
    const type = String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7])
    let headerSize = 8

    if (size === 1) {
      if (bytes.length < 16) fail('VIDEO_OPTIMIZER_INVALID_MP4', 'Invalid extended MP4 atom header.')
      size = readUint64(view, 8)
      headerSize = 16
    } else if (size === 0) {
      size = blob.size - offset
    }

    if (!Number.isSafeInteger(size) || size < headerSize || offset + size > blob.size) {
      fail('VIDEO_OPTIMIZER_INVALID_MP4', `Invalid MP4 atom ${type} at offset ${offset}.`)
    }

    atoms.push({ type, offset, size })
    offset += size
  }

  return atoms
}

export async function hasForumMp4FastStart(blob) {
  const atoms = await readForumMp4TopLevelAtoms(blob)
  const moov = atoms.find((atom) => atom.type === 'moov')
  const mdat = atoms.find((atom) => atom.type === 'mdat')
  return !!moov && !!mdat && moov.offset < mdat.offset && !atoms.some((atom) => atom.type === 'moof')
}

async function verifyOutput(mediabunny, blob, expected, options) {
  const input = createInput(mediabunny, blob, options.inputCacheBytes)

  try {
    const tracks = await input.getTracks()
    const videoTracks = tracks.filter((track) => track.type === 'video')
    const audioTracks = tracks.filter((track) => track.type === 'audio')
    const videoTrack = await input.getPrimaryVideoTrack()
    const audioTrack = await input.getPrimaryAudioTrack()

    if (!videoTrack) fail('VIDEO_OPTIMIZER_OUTPUT_VIDEO_MISSING', 'The optimized MP4 has no video track.')

    const durationSeconds = await readDuration(input, videoTrack, blob)
    const width = await videoTrack.getDisplayWidth()
    const height = await videoTrack.getDisplayHeight()
    const rotation = await videoTrack.getRotation()
    const videoCodec = await videoTrack.getCodec()
    const audioCodec = audioTrack ? await audioTrack.getCodec() : null
    let frameRate = null
    try {
      const stats = await videoTrack.computePacketStats(180)
      const average = Number(stats?.averagePacketRate)
      if (Number.isFinite(average) && average > 0) frameRate = average
    } catch {}
    const atoms = await readForumMp4TopLevelAtoms(blob)
    const moov = atoms.find((atom) => atom.type === 'moov')
    const mdat = atoms.find((atom) => atom.type === 'mdat')
    const durationTolerance = Math.max(1, expected.durationSeconds * 0.015)

    const checks = {
      sizeWithinLimit: blob.size > 0 && blob.size <= expected.maxOutputBytes,
      exactlyOneVideoTrack: videoTracks.length === 1,
      atMostOneAudioTrack: audioTracks.length <= 1,
      codecAvc: videoCodec === 'avc',
      dimensionsExact: width === expected.width && height === expected.height,
      dimensionsEven: width % 2 === 0 && height % 2 === 0,
      rotationBakedIntoFrames: Number(rotation || 0) === 0,
      durationPreserved: Math.abs(durationSeconds - expected.durationSeconds) <= durationTolerance,
      audioAacOrAbsent: expected.hasAudio ? audioCodec === 'aac' : audioCodec === null,
      frameRateWithinLimit: !Number.isFinite(frameRate) || frameRate <= (expected.frameRate + VIDEO_FRAME_RATE_EPSILON),
      flatFastStart: !!moov && !!mdat && moov.offset < mdat.offset && !atoms.some((atom) => atom.type === 'moof'),
    }

    const failedChecks = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([name]) => name)

    if (failedChecks.length) {
      fail('VIDEO_OPTIMIZER_OUTPUT_VERIFICATION_FAILED', `Optimized MP4 failed: ${failedChecks.join(', ')}.`, {
        checks,
        actual: {
          sizeBytes: blob.size,
          width,
          height,
          durationSeconds,
          rotation,
          videoCodec,
          audioCodec,
          videoTrackCount: videoTracks.length,
          audioTrackCount: audioTracks.length,
          frameRate,
          atoms,
        },
      })
    }

    return {
      checks,
      width,
      height,
      durationSeconds,
      rotation,
      videoCodec,
      audioCodec,
      videoTrackCount: videoTracks.length,
      audioTrackCount: audioTracks.length,
      frameRate,
      atoms,
    }
  } finally {
    input.dispose()
  }
}

async function executeAttempt({
  mediabunny,
  file,
  dimensions,
  options,
  videoBitrate,
  audioBitrate,
  hasAudio,
  frameRate,
  signal,
  onProgress,
  attempt,
}) {
  throwIfAborted(signal)
  const input = createInput(mediabunny, file, options.inputCacheBytes)
  const target = new mediabunny.BufferTarget()
  const output = new mediabunny.Output({
    format: new mediabunny.Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  })

  let conversion = null
  let abortListener = null

  try {
    conversion = await mediabunny.Conversion.init({
      input,
      output,
      tracks: 'primary',
      showWarnings: false,
      tags: {},
      video: {
        width: dimensions.width,
        height: dimensions.height,
        fit: 'contain',
        allowRotationMetadata: false,
        frameRate,
        codec: 'avc',
        bitrate: videoBitrate,
        hardwareAcceleration: options.hardwareAcceleration,
        keyFrameInterval: options.keyFrameInterval,
        forceTranscode: true,
      },
      audio: hasAudio
        ? {
            numberOfChannels: 2,
            sampleRate: 48_000,
            codec: 'aac',
            bitrate: audioBitrate,
            forceTranscode: true,
          }
        : { discard: true },
    })

    if (!conversion.isValid) {
      fail('VIDEO_OPTIMIZER_CONVERSION_INVALID', 'Mediabunny could not build a valid conversion plan.', {
        discardedTracks: conversion.discardedTracks.map((entry) => ({
          trackId: entry?.track?.id ?? null,
          trackType: entry?.track?.type ?? null,
          reason: String(entry?.reason || 'unknown'),
        })),
      })
    }

    if (signal) {
      abortListener = () => {
        conversion?.cancel?.().catch(() => {})
        input.dispose()
      }
      signal.addEventListener('abort', abortListener, { once: true })
    }

    conversion.onProgress = (progress, processedTime) => {
      emitProgress(onProgress, {
        stage: 'encoding',
        attempt,
        maxAttempts: options.maxAttempts,
        progress: Math.max(0, Math.min(1, Number(progress || 0))),
        processedTime: Number(processedTime || 0),
        videoBitrate,
        audioBitrate,
      })
    }

    await conversion.execute()
    throwIfAborted(signal)

    if (!(target.buffer instanceof ArrayBuffer) || target.buffer.byteLength <= 0) {
      fail('VIDEO_OPTIMIZER_EMPTY_OUTPUT', 'Video conversion completed without an MP4 buffer.')
    }

    return new Blob([target.buffer], { type: 'video/mp4' })
  } catch (error) {
    if (isAbortLike(error, signal)) throw abortError()
    throw error
  } finally {
    if (signal && abortListener) {
      try { signal.removeEventListener('abort', abortListener) } catch {}
    }
    input.dispose()
  }
}

function installDevelopmentDebugHandle(result) {
  if (process.env.NODE_ENV === 'production') return
  if (typeof window === 'undefined') return

  try {
    window.__ql7LastClientVideoOptimization?.dispose?.()
  } catch {}

  let objectUrl = ''
  let retainedResult = result

  const ensureUrl = () => {
    if (!objectUrl && retainedResult?.file) objectUrl = URL.createObjectURL(retainedResult.file)
    return objectUrl
  }

  const handle = {
    result,
    summary() {
      if (!retainedResult) return null
      return {
        outputName: retainedResult.outputName,
        sourceSizeBytes: retainedResult.sourceSizeBytes,
        outputSizeBytes: retainedResult.sizeBytes,
        width: retainedResult.width,
        height: retainedResult.height,
        durationSec: retainedResult.durationSec,
        attempts: retainedResult.attempts,
        verification: retainedResult.verification?.checks,
      }
    },
    download() {
      if (!retainedResult) return false
      const url = ensureUrl()
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = retainedResult.outputName
      anchor.rel = 'noopener'
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      return true
    },
    open() {
      if (!retainedResult) return false
      window.open(ensureUrl(), '_blank', 'noopener,noreferrer')
      return true
    },
    dispose() {
      if (objectUrl) {
        try { URL.revokeObjectURL(objectUrl) } catch {}
      }
      objectUrl = ''
      retainedResult = null
      this.result = null
    },
  }

  window.__ql7LastClientVideoOptimization = handle
}

export function isForumClientVideoOptimizerEnabled() {
  const explicit = String(process.env.NEXT_PUBLIC_FORUM_CLIENT_VIDEO_OPTIMIZER || '').trim().toLowerCase()
  if (['0', 'false', 'off', 'disabled'].includes(explicit) && process.env.NODE_ENV !== 'production') return false
  return true
}

function normalizedVideoMime(value) {
  return String(value || '').split(';')[0].trim().toLowerCase()
}

export function classifyForumVideoUploadRequest({ file, kind = '', filename = '', contentType = '', videoPolicy = null } = {}) {
  const cleanKind = String(kind || '').trim().toLowerCase()
  const cleanName = String(filename || file?.name || '').trim().toLowerCase()
  const mime = normalizedVideoMime(contentType || file?.type || '')
  const explicitMode = String(videoPolicy?.mode || '').trim().toLowerCase()
  if (explicitMode === 'non-video') return { isVideo: false, reason: 'explicit-non-video', mime, kind: cleanKind, filename: cleanName }

  const kindVideo = /(?:^|_)video$/.test(cleanKind) || cleanKind === 'video'
  const mimeVideo = /^video\//.test(mime)
  const extensionVideo = /\.(?:mp4|mov|m4v|webm|mkv|ts|mts|m2ts|ogg|ogv)$/i.test(cleanName)
  const explicitVideo = explicitMode === 'video-required'

  return {
    isVideo: explicitVideo || kindVideo || mimeVideo || extensionVideo,
    reason: explicitVideo ? 'explicit-video' : (kindVideo ? 'kind' : (mimeVideo ? 'mime' : (extensionVideo ? 'extension' : 'not-video'))),
    mime,
    kind: cleanKind,
    filename: cleanName,
  }
}

function registerVerifiedVideoUpload(file, details = {}) {
  if (!(file instanceof Blob)) return null
  const proof = Object.freeze({
    policyId: QL7_CLIENT_VIDEO_POLICY_ID,
    verifiedAt: Date.now(),
    sizeBytes: Number(file.size || 0),
    mime: normalizedVideoMime(file.type || 'video/mp4'),
    ...details,
  })
  verifiedVideoUploadProofs.set(file, proof)
  return proof
}

export function getForumVerifiedVideoUploadProof(file) {
  const proof = file instanceof Blob ? verifiedVideoUploadProofs.get(file) : null
  if (!proof || proof.policyId !== QL7_CLIENT_VIDEO_POLICY_ID) return null
  if (Number(proof.sizeBytes) !== Number(file.size || 0)) return null
  return proof
}

function resolvePreparedVideoName(file, filename, suffix = '_FFMP') {
  return buildForumOptimizedVideoName(String(filename || file?.name || 'video'), suffix)
}

function sourceFitsStreamingBounds(metadata) {
  const dimensions = calculateForumVideoTargetDimensions(metadata.displayWidth, metadata.displayHeight)
  return Number(metadata.displayWidth) <= dimensions.boxWidth && Number(metadata.displayHeight) <= dimensions.boxHeight
}

async function inspectCanonicalUploadCandidate(file, metadata, options) {
  const atoms = await readForumMp4TopLevelAtoms(file)
  const ftyp = atoms.find((atom) => atom.type === 'ftyp')
  const moov = atoms.find((atom) => atom.type === 'moov')
  const mdat = atoms.find((atom) => atom.type === 'mdat')
  const checks = {
    mp4Signature: !!ftyp && ftyp.offset === 0,
    nonEmpty: Number(file.size || 0) > 0,
    sizeWithinLimit: Number(file.size || 0) <= options.maxOutputBytes,
    codecAvc: metadata.videoCodec === 'avc',
    audioAacOrAbsent: !metadata.hasAudio || metadata.audioCodec === 'aac',
    dimensionsWithinBounds: sourceFitsStreamingBounds(metadata),
    dimensionsEven: Number(metadata.displayWidth) % 2 === 0 && Number(metadata.displayHeight) % 2 === 0,
    frameRateWithinLimit: !Number.isFinite(metadata.sourceFrameRate) || metadata.sourceFrameRate <= (options.frameRate + VIDEO_FRAME_RATE_EPSILON),
    rotationBakedIntoFrames: Number(metadata.rotation || 0) === 0,
    durationValid: Number.isFinite(metadata.durationSeconds) && metadata.durationSeconds > 0 && metadata.durationSeconds <= options.maxDurationSeconds,
    flatFastStart: !!moov && !!mdat && moov.offset < mdat.offset && !atoms.some((atom) => atom.type === 'moof'),
  }
  return { checks, atoms, ok: Object.values(checks).every(Boolean) }
}

export async function prepareForumVideoForUpload({
  file,
  kind = 'forum_video',
  filename = '',
  contentType = '',
  signal = null,
  onProgress = null,
  videoPolicy = null,
} = {}) {
  const classification = classifyForumVideoUploadRequest({ file, kind, filename, contentType, videoPolicy })
  if (!classification.isVideo) {
    return {
      file,
      filename: String(filename || file?.name || 'media'),
      contentType: String(contentType || file?.type || 'application/octet-stream'),
      isVideo: false,
      optimized: false,
      policyId: null,
      classification,
    }
  }

  if (!(file instanceof Blob) || Number(file.size || 0) <= 0) {
    fail('VIDEO_OPTIMIZER_BAD_FILE', 'A non-empty video File or Blob is required.')
  }
  if (!isForumClientVideoOptimizerEnabled()) {
    fail('VIDEO_OPTIMIZER_DISABLED', 'Client video optimization is disabled; upload is blocked.')
  }

  const existingProof = getForumVerifiedVideoUploadProof(file)
  if (existingProof) {
    return {
      file,
      filename: resolvePreparedVideoName(file, filename),
      contentType: 'video/mp4',
      isVideo: true,
      optimized: existingProof.source === 'optimizer-output',
      bypassReason: 'verified-proof',
      policyId: QL7_CLIENT_VIDEO_POLICY_ID,
      proof: existingProof,
      durationSec: existingProof.durationSec,
      width: existingProof.width,
      height: existingProof.height,
      frameRate: existingProof.frameRate,
      classification,
    }
  }

  const options = normalizeOptions({ ...(videoPolicy || {}), signal, onProgress })
  if (Number(file.size || 0) > options.maxSourceBytes) {
    fail('VIDEO_OPTIMIZER_SOURCE_TOO_LARGE', `Source video exceeds ${(options.maxSourceBytes / MIB).toFixed(0)} MB.`)
  }

  throwIfAborted(signal)
  emitProgress(onProgress, { stage: 'preparing', progress: 0 })
  const metadata = await inspectForumVideoOnDevice(file, options)
  if (metadata.durationSeconds > options.maxDurationSeconds) {
    fail('VIDEO_TOO_LONG', `Video is longer than ${options.maxDurationSeconds} seconds.`, metadata)
  }

  const requestedMime = normalizedVideoMime(contentType || file?.type || '')
  const requestedName = String(filename || file?.name || '')
  const mp4Candidate = requestedMime === 'video/mp4' || /\.mp4$/i.test(requestedName)
  if (mp4Candidate) {
    const canonical = await inspectCanonicalUploadCandidate(file, metadata, options)
    if (canonical.ok) {
      const proof = registerVerifiedVideoUpload(file, {
        source: 'canonical-source',
        durationSec: metadata.durationSeconds,
        width: metadata.displayWidth,
        height: metadata.displayHeight,
        frameRate: metadata.sourceFrameRate,
        checks: canonical.checks,
        atoms: canonical.atoms,
        profileId: 'source-compatible',
      })
      emitProgress(onProgress, { stage: 'done', progress: 1, bypassReason: 'canonical-source' })
      return {
        file,
        filename: String(filename || file?.name || 'video.mp4').replace(/\.[^.]+$/, '.mp4'),
        contentType: 'video/mp4',
        isVideo: true,
        optimized: false,
        bypassReason: 'canonical-source',
        policyId: QL7_CLIENT_VIDEO_POLICY_ID,
        proof,
        durationSec: metadata.durationSeconds,
        width: metadata.displayWidth,
        height: metadata.displayHeight,
        frameRate: metadata.sourceFrameRate,
        classification,
      }
    }
  }

  const sourceName = String(filename || file?.name || 'video')
  const sourceFile = typeof File === 'function' && !(file instanceof File)
    ? new File([file], sourceName, { type: normalizedVideoMime(contentType || file.type || 'video/webm') || 'video/webm', lastModified: Date.now() })
    : file
  const optimized = await optimizeForumVideoOnDevice(sourceFile, options)
  return {
    file: optimized.file || optimized.blob,
    filename: optimized.outputName || resolvePreparedVideoName(sourceFile, sourceName),
    contentType: 'video/mp4',
    isVideo: true,
    optimized: true,
    bypassReason: '',
    policyId: QL7_CLIENT_VIDEO_POLICY_ID,
    proof: optimized.uploadProof || getForumVerifiedVideoUploadProof(optimized.file || optimized.blob),
    durationSec: optimized.durationSec,
    width: optimized.width,
    height: optimized.height,
    frameRate: optimized.verification?.frameRate || optimized.plan?.output?.frameRate || null,
    profileId: optimized.profileId,
    targetOutputBytes: optimized.targetOutputBytes,
    sourceSizeBytes: Number(file.size || 0),
    outputSizeBytes: Number((optimized.file || optimized.blob)?.size || 0),
    classification,
  }
}

export async function inspectForumVideoOnDevice(file, options = {}) {
  ensureBrowserRuntime()
  const opts = normalizeOptions(options)

  if (!(file instanceof Blob)) fail('VIDEO_OPTIMIZER_BAD_FILE', 'A File or Blob is required.')
  if (!Number(file.size || 0)) fail('VIDEO_OPTIMIZER_EMPTY_FILE', 'The selected video is empty.')
  if (Number(file.size || 0) > opts.maxSourceBytes) {
    fail('VIDEO_OPTIMIZER_SOURCE_TOO_LARGE', `Source video exceeds ${(opts.maxSourceBytes / MIB).toFixed(0)} MB.`)
  }

  const mediabunny = await loadMediabunny()
  return inspectSource(mediabunny, file, opts)
}

export async function optimizeForumVideoOnDevice(file, options = {}) {
  ensureBrowserRuntime()
  const opts = normalizeOptions(options)
  const signal = opts.signal || null
  const onProgress = opts.onProgress

  if (!(file instanceof Blob)) fail('VIDEO_OPTIMIZER_BAD_FILE', 'A File or Blob is required.')
  if (!Number(file.size || 0)) fail('VIDEO_OPTIMIZER_EMPTY_FILE', 'The selected video is empty.')
  if (Number(file.size || 0) > opts.maxSourceBytes) {
    fail('VIDEO_OPTIMIZER_SOURCE_TOO_LARGE', `Source video exceeds ${(opts.maxSourceBytes / MIB).toFixed(0)} MB.`)
  }

  throwIfAborted(signal)
  emitProgress(onProgress, { stage: 'analyzing', progress: 0 })

  try {
    const mediabunny = await loadMediabunny()
    const metadata = await inspectSource(mediabunny, file, opts)

    if (!Number.isFinite(metadata.durationSeconds) || metadata.durationSeconds <= 0) {
      fail('VIDEO_OPTIMIZER_BAD_DURATION', 'Unable to read source video duration.')
    }
    if (metadata.durationSeconds > opts.maxDurationSeconds) {
      fail('VIDEO_TOO_LONG', `Video is longer than ${opts.maxDurationSeconds} seconds.`, metadata)
    }
    if (!metadata.videoDecodable) {
      fail(
        'VIDEO_OPTIMIZER_SOURCE_VIDEO_UNSUPPORTED',
        `This browser cannot decode ${metadata.videoCodecString || metadata.videoCodec || 'the source video codec'}.`,
        metadata,
      )
    }
    if (!metadata.audioDecodable) {
      fail(
        'VIDEO_OPTIMIZER_SOURCE_AUDIO_UNSUPPORTED',
        `This browser cannot decode ${metadata.audioCodec || 'the source audio codec'}.`,
        metadata,
      )
    }

    const encodingPlan = selectForumVideoEncodingProfile({
      durationSeconds: metadata.durationSeconds,
      sourceBytes: Number(file.size || 0),
      displayWidth: metadata.displayWidth,
      displayHeight: metadata.displayHeight,
      hasAudio: metadata.hasAudio,
      preferredTargetBytes: opts.targetOutputBytes,
      minTargetBytes: opts.minTargetOutputBytes,
      maxOutputBytes: opts.maxOutputBytes,
      targetTotalBitrate: opts.targetTotalBitrate,
      requestedAudioBitrate: opts.audioBitrate,
      maximumVideoBitrate: opts.maximumVideoBitrate,
      qualityProfiles: opts.qualityProfiles,
    })
    const dimensions = encodingPlan.dimensions
    const bitratePlan = encodingPlan.bitratePlan

    emitProgress(onProgress, { stage: 'capability', progress: 0, encodingPlan })

    const videoEncoderConfig = {
      width: dimensions.width,
      height: dimensions.height,
      bitrate: bitratePlan.videoBitrate,
      framerate: encodingPlan.frameRate,
      hardwareAcceleration: opts.hardwareAcceleration,
    }
    const videoEncodable = await mediabunny.canEncodeVideo('avc', videoEncoderConfig)
    if (!videoEncodable) {
      fail(
        'VIDEO_OPTIMIZER_AVC_ENCODER_UNAVAILABLE',
        `H.264/AVC encoding ${dimensions.width}x${dimensions.height} is unavailable on this browser or device.`,
        videoEncoderConfig,
      )
    }

    const aacEncoder = metadata.hasAudio
      ? await ensureAacEncoder(mediabunny, {
          numberOfChannels: 2,
          sampleRate: 48_000,
          bitrate: bitratePlan.audioBitrate,
        })
      : 'none'

    const plan = {
      localOnly: true,
      sourceUploadedBeforeOptimization: false,
      input: {
        name: String(file?.name || 'video'),
        type: String(file?.type || ''),
        sizeBytes: Number(file.size || 0),
        ...metadata,
      },
      output: {
        name: buildForumOptimizedVideoName(file, opts.outputSuffix),
        mime: 'video/mp4',
        maxBytes: opts.maxOutputBytes,
        targetBytes: encodingPlan.targetOutputBytes,
        width: dimensions.width,
        height: dimensions.height,
        frameRate: encodingPlan.frameRate,
        profileId: encodingPlan.profileId,
        codec: 'avc',
        audioCodec: metadata.hasAudio ? 'aac' : null,
        fastStart: true,
      },
      bitratePlan,
      encodingPlan,
      hardwareAcceleration: opts.hardwareAcceleration,
      aacEncoder,
    }

    emitProgress(onProgress, { stage: 'planned', progress: 0, plan })

    let videoBitrate = bitratePlan.videoBitrate
    let resultBlob = null
    const attempts = []

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt += 1) {
      throwIfAborted(signal)
      const blob = await executeAttempt({
        mediabunny,
        file,
        dimensions,
        options: opts,
        videoBitrate,
        audioBitrate: bitratePlan.audioBitrate,
        hasAudio: metadata.hasAudio,
        frameRate: encodingPlan.frameRate,
        signal,
        onProgress,
        attempt,
      })

      attempts.push({ attempt, videoBitrate, outputBytes: blob.size })
      if (blob.size <= opts.maxOutputBytes) {
        resultBlob = blob
        break
      }

      if (attempt >= opts.maxAttempts) break
      const corrected = Math.floor(videoBitrate * ((opts.maxOutputBytes * 0.94) / blob.size))
      if (corrected < encodingPlan.minimumVideoBitrate) {
        fail('VIDEO_OPTIMIZER_RETRY_BITRATE_TOO_LOW', 'The strict output limit would require an unsafe video bitrate.', {
          corrected,
          minimumVideoBitrate: encodingPlan.minimumVideoBitrate,
          profileId: encodingPlan.profileId,
        })
      }
      videoBitrate = Math.min(videoBitrate - 16_000, corrected)
      emitProgress(onProgress, {
        stage: 'retrying',
        progress: 0,
        attempt,
        maxAttempts: opts.maxAttempts,
        previousSizeBytes: blob.size,
        nextVideoBitrate: videoBitrate,
      })
    }

    if (!resultBlob) {
      fail('VIDEO_OPTIMIZER_MAX_SIZE_NOT_REACHED', `Unable to produce an MP4 below ${(opts.maxOutputBytes / MIB).toFixed(0)} MB.`, {
        attempts,
      })
    }

    throwIfAborted(signal)
    emitProgress(onProgress, { stage: 'verifying', progress: 0, sizeBytes: resultBlob.size })
    const verification = await verifyOutput(mediabunny, resultBlob, {
      maxOutputBytes: opts.maxOutputBytes,
      width: dimensions.width,
      height: dimensions.height,
      durationSeconds: metadata.durationSeconds,
      hasAudio: metadata.hasAudio,
      frameRate: encodingPlan.frameRate,
    }, opts)

    const outputName = buildForumOptimizedVideoName(file, opts.outputSuffix)
    const outputFile = typeof File === 'function'
      ? new File([resultBlob], outputName, { type: 'video/mp4', lastModified: Date.now() })
      : resultBlob

    const result = {
      file: outputFile,
      blob: resultBlob,
      outputName,
      mime: 'video/mp4',
      durationSec: verification.durationSeconds,
      width: verification.width,
      height: verification.height,
      sizeBytes: resultBlob.size,
      sourceSizeBytes: Number(file.size || 0),
      compressionRatio: Number(file.size || 0) > 0 ? resultBlob.size / Number(file.size || 0) : null,
      plan,
      attempts,
      verification,
      profileId: encodingPlan.profileId,
      targetOutputBytes: encodingPlan.targetOutputBytes,
      localOnly: true,
      sourceUploadedForTranscoding: false,
    }
    const uploadProof = registerVerifiedVideoUpload(outputFile, {
      source: 'optimizer-output',
      durationSec: verification.durationSeconds,
      width: verification.width,
      height: verification.height,
      frameRate: verification.frameRate,
      sizeBytes: resultBlob.size,
      checks: verification.checks,
      profileId: encodingPlan.profileId,
    })
    result.uploadProof = uploadProof

    installDevelopmentDebugHandle(result)

    try {
      console.info('[QL7 CLIENT VIDEO OPTIMIZER] PASS', {
        inputName: file?.name || '',
        sourceBytes: Number(file.size || 0),
        outputName,
        outputBytes: resultBlob.size,
        width: verification.width,
        height: verification.height,
        durationSec: verification.durationSeconds,
        attempts,
        downloadHint: 'window.__ql7LastClientVideoOptimization.download()',
        openHint: 'window.__ql7LastClientVideoOptimization.open()',
      })
    } catch {}

    emitProgress(onProgress, { stage: 'done', progress: 1, result })
    return result
  } catch (error) {
    if (isAbortLike(error, signal)) throw abortError()
    pushDevEvent({
      at: Date.now(),
      stage: 'failed',
      code: String(error?.code || error?.name || 'VIDEO_OPTIMIZER_FAILED'),
      message: String(error?.message || error || ''),
    })
    throw error
  }
}
