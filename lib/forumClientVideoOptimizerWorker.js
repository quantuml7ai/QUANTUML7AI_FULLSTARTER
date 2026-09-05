import {
  acquireQl7HevcFallbackConfig,
  isQl7HevcFallbackEligible,
  isQl7HevcCodec,
  probeQl7NativeVideoDecoder,
  QL7_HEVC_FALLBACK_ID,
} from './ql7HevcFallbackDecoder'
import {
  createQl7MobileOpfsWorkspace,
  createQl7OpfsWritable,
  probeQl7MobileOpfsRuntime,
  ql7MobileStreamTargetOptions,
} from './forumClientVideoOpfs'
import {
  makeQl7VideoWorkerMessage,
  QL7_VIDEO_WORKER_PROTOCOL_VERSION,
  QL7_VIDEO_WORKER_TYPES,
} from './forumClientVideoWorkerProtocol'
import {
  QL7_MOBILE_VIDEO_EXECUTOR_ID,
  QL7_MOBILE_VIDEO_HEARTBEAT_MS,
  QL7_MOBILE_VIDEO_ROUTING_MARKER,
  QL7_MOBILE_VIDEO_STEP_SECONDS,
} from './forumClientVideoRuntime'

const QL7_MOBILE_VIDEO_WORKER_BUNDLE_MARKER = 'QL7_MOBILE_VIDEO_WORKER_R22_ONE_SHOT_FINAL'
const jobs = new Map()
let mediabunnyPromise = null
let aacPromise = null

function post(type, job, payload = {}, transfer = []) {
  self.postMessage(makeQl7VideoWorkerMessage(type, job.jobId, job.generation, payload), transfer)
}

function fail(code, message, details = null) {
  const error = new Error(message || code)
  error.name = 'ForumClientVideoMobileWorkerError'
  error.code = String(code || 'VIDEO_OPTIMIZER_MOBILE_WORKER_FAILED')
  error.details = details
  throw error
}

function throwIfAborted(job) {
  if (job.aborted) {
    const error = new Error('Video optimization aborted')
    error.name = 'AbortError'
    throw error
  }
}

async function loadMediabunny() {
  if (!mediabunnyPromise) mediabunnyPromise = import('mediabunny')
  return mediabunnyPromise
}

async function ensureAacEncoder(mediabunny, config) {
  if (await mediabunny.canEncodeAudio('aac', config)) return 'native'
  if (!aacPromise) {
    aacPromise = import('@mediabunny/aac-encoder').then((extension) => {
      extension.registerAacEncoder()
      return true
    }).catch((error) => {
      aacPromise = null
      throw error
    })
  }
  await aacPromise
  if (!(await mediabunny.canEncodeAudio('aac', config))) fail('VIDEO_OPTIMIZER_AAC_ENCODER_UNSUPPORTED', 'AAC encoding is unavailable in the mobile worker.')
  return 'fallback'
}

function createInput(mediabunny, blob, spec) {
  const stableAppleRead = spec?.appleMobile === true
  return new mediabunny.Input({
    formats: mediabunny.ALL_FORMATS,
    source: new mediabunny.BlobSource(blob, {
      maxCacheSize: Number(spec?.inputCacheBytes || 0),
      useStreamReader: !stableAppleRead,
    }),
  })
}

async function probeNativeHevcRuntime(mediabunny, videoTrack, decoderConfig) {
  if (!decoderConfig || !(await probeQl7NativeVideoDecoder(decoderConfig))) {
    return Object.freeze({ supported: false, reason: 'config-probe' })
  }
  if (typeof globalThis.VideoDecoder !== 'function') {
    return Object.freeze({ supported: false, reason: 'video-decoder-missing' })
  }

  let decoder = null
  let callbackError = null
  let decodedFrames = 0
  try {
    const sink = new mediabunny.EncodedPacketSink(videoTrack)
    let packet = await sink.getFirstKeyPacket({ verifyKeyPackets: true })
    if (!packet) packet = await sink.getFirstPacket()
    if (!packet) return Object.freeze({ supported: false, reason: 'no-packets' })

    decoder = new globalThis.VideoDecoder({
      output(frame) {
        decodedFrames += 1
        try { frame.close() } catch {}
      },
      error(error) {
        callbackError = error || new Error('Native HEVC decoder callback failed.')
      },
    })
    decoder.configure(decoderConfig)

    for (let i = 0; packet && i < 12; i += 1) {
      decoder.decode(packet.toEncodedVideoChunk())
      packet = await sink.getNextPacket(packet)
    }
    await decoder.flush()
    if (callbackError || decodedFrames <= 0) {
      return Object.freeze({
        supported: false,
        reason: callbackError ? 'decoder-callback' : 'no-output',
        errorName: String(callbackError?.name || ''),
        errorMessage: String(callbackError?.message || ''),
      })
    }
    return Object.freeze({ supported: true, reason: 'runtime-decoded', decodedFrames })
  } catch (error) {
    return Object.freeze({
      supported: false,
      reason: 'runtime-error',
      errorName: String(error?.name || ''),
      errorMessage: String(error?.message || error || ''),
    })
  } finally {
    try { decoder?.close?.() } catch {}
  }
}

async function prepareDecoder(mediabunny, input, decoderMode = 'auto') {
  const videoTrack = await input.getPrimaryVideoTrack()
  if (!videoTrack) fail('VIDEO_OPTIMIZER_NO_VIDEO_TRACK', 'The selected file has no video track.')
  const codec = await videoTrack.getCodec()
  const codecString = await videoTrack.getCodecParameterString()
  const decoderConfig = await videoTrack.getDecoderConfig().catch(() => null)
  const hevc = isQl7HevcCodec(codec, codecString || decoderConfig?.codec)
  if (!hevc) {
    const decodable = await videoTrack.canDecode()
    if (!decodable) fail('VIDEO_OPTIMIZER_SOURCE_VIDEO_UNSUPPORTED', `The mobile worker cannot decode ${codecString || codec || 'the source video codec'}.`)
    return { lease: null, decoderPath: 'native-mediabunny', hevc: false, nativeHevc: false }
  }

  if (decoderMode !== 'force-wasm') {
    const native = await probeNativeHevcRuntime(mediabunny, videoTrack, decoderConfig)
    if (native.supported) {
      return { lease: null, decoderPath: 'native-mediabunny', hevc: true, nativeHevc: true, nativeProbe: native }
    }
  }

  if (!decoderConfig || !isQl7HevcFallbackEligible({ codec, codecParameterString: codecString, decoderConfig })) {
    fail('VIDEO_OPTIMIZER_SOURCE_VIDEO_UNSUPPORTED', `The mobile worker cannot decode ${codecString || codec || 'HEVC'}.`)
  }
  const colorSpace = await videoTrack.getColorSpace().catch(() => null)
  const lease = acquireQl7HevcFallbackConfig(mediabunny, decoderConfig, { colorSpace })
  return { lease, decoderPath: QL7_HEVC_FALLBACK_ID, hevc: true, nativeHevc: false }
}

function shouldRetryNativeHevcWithWasm(error) {
  if (error?.ql7NativeHevcFailure !== true) return false
  const name = String(error?.name || '')
  const message = String(error?.message || '')
  return name === 'EncodingError' || /decoder|decode|videodecoder|codec/i.test(message)
}

async function runOneShotConversion(job, conversion) {
  throwIfAborted(job)
  await conversion.execute()
  throwIfAborted(job)
}

async function executeStageAttemptOnce(job, mediabunny, workspace, attempt, videoBitrate, decoderMode = 'auto', hardwareAcceleration = null) {
  const spec = job.spec
  const stage = await workspace.createFile(`attempt-${attempt}`)
  let input = null
  let conversion = null
  let fallbackLease = null
  let accessClosed = false
  let succeeded = false
  let decoderState = null

  try {
    input = createInput(mediabunny, job.file, spec)
    const decoder = await prepareDecoder(mediabunny, input, decoderMode)
    decoderState = decoder
    fallbackLease = decoder.lease
    job.decoderPath = decoder.decoderPath

    const writable = createQl7OpfsWritable(stage.accessHandle)
    const target = new mediabunny.StreamTarget(writable, ql7MobileStreamTargetOptions())
    const output = new mediabunny.Output({
      format: new mediabunny.Mp4OutputFormat({ fastStart: false }),
      target,
    })

    conversion = await mediabunny.Conversion.init({
      input,
      output,
      tracks: 'primary',
      showWarnings: false,
      tags: {},
      video: {
        width: spec.width,
        height: spec.height,
        fit: 'contain',
        allowRotationMetadata: false,
        frameRate: spec.frameRate,
        codec: 'avc',
        bitrate: videoBitrate,
        hardwareAcceleration: hardwareAcceleration || spec.hardwareAcceleration,
        keyFrameInterval: spec.keyFrameInterval,
        forceTranscode: true,
      },
      audio: spec.hasAudio
        ? {
            numberOfChannels: 2,
            sampleRate: 48_000,
            codec: 'aac',
            bitrate: spec.audioBitrate,
            forceTranscode: true,
          }
        : { discard: true },
    })

    if (!conversion.isValid) {
      fail('VIDEO_OPTIMIZER_CONVERSION_INVALID', 'Mediabunny could not build a valid mobile conversion plan.', {
        discardedTracks: conversion.discardedTracks.map((entry) => ({
          trackId: entry?.track?.id ?? null,
          trackType: entry?.track?.type ?? null,
          reason: String(entry?.reason || 'unknown'),
        })),
      })
    }

    job.conversion = conversion
    conversion.onProgress = (progress, processedTime) => {
      post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
        publicStage: 'processing',
        internalStage: 'stage-transcode',
        progress: Math.max(0, Math.min(1, Number(progress || 0))),
        processedTime: Number(processedTime || 0),
        attempt,
        maxAttempts: spec.maxAttempts,
        videoBitrate,
        decoderPath: job.decoderPath,
      })
    }

    await runOneShotConversion(job, conversion)
    throwIfAborted(job)
    try { stage.accessHandle.flush() } catch {}
    stage.accessHandle.close()
    accessClosed = true
    const stageFile = await stage.fileHandle.getFile()
    if (!Number(stageFile.size || 0)) fail('VIDEO_OPTIMIZER_EMPTY_OUTPUT', 'Mobile stage conversion completed without an MP4 file.')
    succeeded = true
    return { stage, stageFile, decoderPath: job.decoderPath }
  } catch (error) {
    if (job.aborted || error?.name === 'ConversionCanceledError') {
      const aborted = new Error('Video optimization aborted')
      aborted.name = 'AbortError'
      throw aborted
    }
    if (decoderState?.nativeHevc) {
      try { error.ql7NativeHevcFailure = true } catch {}
    }
    throw error
  } finally {
    job.conversion = null
    try { input?.dispose?.() } catch {}
    try { fallbackLease?.release?.() } catch {}
    if (!accessClosed) {
      try { stage.accessHandle.flush() } catch {}
      try { stage.accessHandle.close() } catch {}
    }
    if (!succeeded) {
      try { await workspace.remove(stage.name) } catch {}
    }
  }
}

function isTransientAppleAvcCodecFailure(error, spec) {
  if (spec?.appleAvcPressure !== true) return false
  const name = String(error?.name || '')
  const code = String(error?.code || '')
  const message = String(error?.message || error || '')
  return (
    name === 'EncodingError' ||
    name === 'OperationError' ||
    name === 'NotSupportedError' ||
    name === 'InvalidStateError' ||
    /decoder failure|encoding task did not complete|decode|decoder|videodecoder|codec/i.test(message) ||
    /DECODER|ENCODING|CODEC/i.test(code)
  )
}

async function canUseAvcAcceleration(mediabunny, spec, videoBitrate, hardwareAcceleration) {
  try {
    return await mediabunny.canEncodeVideo('avc', {
      width: spec.width,
      height: spec.height,
      bitrate: videoBitrate,
      framerate: spec.frameRate,
      hardwareAcceleration,
    })
  } catch {
    return false
  }
}

async function executeStageAttempt(job, mediabunny, workspace, attempt, videoBitrate) {
  try {
    return await executeStageAttemptOnce(job, mediabunny, workspace, attempt, videoBitrate, 'auto', job.spec.hardwareAcceleration)
  } catch (error) {
    if (shouldRetryNativeHevcWithWasm(error)) {
      post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
        publicStage: 'processing',
        internalStage: 'native-hevc-runtime-failed',
        progress: 0,
        attempt,
        maxAttempts: job.spec.maxAttempts,
        decoderPath: 'native-mediabunny',
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
      return executeStageAttemptOnce(job, mediabunny, workspace, attempt, videoBitrate, 'force-wasm', job.spec.hardwareAcceleration)
    }

    if (!isTransientAppleAvcCodecFailure(error, job.spec)) throw error

    let lastError = error
    const retryLimit = Math.max(0, Math.min(2, Number(job.spec?.transientCodecRetries || 0)))
    const candidates = ['prefer-software', 'prefer-hardware']
    for (let retry = 0; retry < retryLimit; retry += 1) {
      const hardwareAcceleration = candidates[retry] || 'no-preference'
      const encodable = await canUseAvcAcceleration(mediabunny, job.spec, videoBitrate, hardwareAcceleration)
      if (!encodable) continue

      post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
        publicStage: 'processing',
        internalStage: 'apple-avc-transient-retry',
        progress: 0,
        attempt,
        maxAttempts: job.spec.maxAttempts,
        codecRetry: retry + 1,
        codecRetryLimit: retryLimit,
        hardwareAcceleration,
        decoderPath: 'native-mediabunny',
      })
      await new Promise((resolve) => setTimeout(resolve, 0))
      try {
        return await executeStageAttemptOnce(
          job,
          mediabunny,
          workspace,
          attempt,
          videoBitrate,
          'auto',
          hardwareAcceleration,
        )
      } catch (retryError) {
        lastError = retryError
        if (!isTransientAppleAvcCodecFailure(retryError, job.spec)) throw retryError
      }
    }
    throw lastError
  }
}

async function remuxFastStart(job, mediabunny, stageFile) {
  throwIfAborted(job)
  post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
    publicStage: 'finalizing',
    internalStage: 'faststart-remux',
    progress: 0,
  })

  const input = createInput(mediabunny, stageFile, job.spec)
  const target = new mediabunny.BufferTarget()
  const output = new mediabunny.Output({
    format: new mediabunny.Mp4OutputFormat({ fastStart: 'in-memory' }),
    target,
  })

  try {
    const conversion = await mediabunny.Conversion.init({
      input,
      output,
      tracks: 'primary',
      showWarnings: false,
      tags: {},
      video: { codec: 'avc', forceTranscode: false },
      audio: job.spec.hasAudio ? { codec: 'aac', forceTranscode: false } : { discard: true },
    })
    if (!conversion.isValid) fail('VIDEO_OPTIMIZER_FASTSTART_REMUX_INVALID', 'The mobile Fast Start remux could not be created.')
    job.conversion = conversion
    conversion.onProgress = (progress, processedTime) => {
      post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
        publicStage: 'finalizing',
        internalStage: 'faststart-remux',
        progress: Math.max(0, Math.min(1, Number(progress || 0))),
        processedTime: Number(processedTime || 0),
      })
    }
    await runOneShotConversion(job, conversion)
    throwIfAborted(job)
    if (!(target.buffer instanceof ArrayBuffer) || target.buffer.byteLength <= 0) {
      fail('VIDEO_OPTIMIZER_FASTSTART_REMUX_EMPTY', 'The mobile Fast Start remux produced no bytes.')
    }
    return target.buffer
  } finally {
    job.conversion = null
    try { input.dispose() } catch {}
  }
}

async function runJob(job) {
  const mediabunny = await loadMediabunny()
  const spec = job.spec
  const opfsProbe = await probeQl7MobileOpfsRuntime()
  post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
    publicStage: 'preparing',
    internalStage: 'opfs-probe',
    progress: 0,
    opfsMarker: opfsProbe.marker,
  })
  const workspace = await createQl7MobileOpfsWorkspace(job.jobId)
  let keepStage = null
  let videoBitrate = Number(spec.videoBitrate)
  const attempts = []

  try {
    const videoEncodable = await mediabunny.canEncodeVideo('avc', {
      width: spec.width,
      height: spec.height,
      bitrate: videoBitrate,
      framerate: spec.frameRate,
      hardwareAcceleration: spec.hardwareAcceleration,
    })
    if (!videoEncodable) fail('VIDEO_OPTIMIZER_AVC_ENCODER_UNAVAILABLE', `H.264/AVC encoding ${spec.width}x${spec.height} is unavailable in the mobile worker.`)
    if (spec.hasAudio) {
      await ensureAacEncoder(mediabunny, {
        numberOfChannels: 2,
        sampleRate: 48_000,
        bitrate: spec.audioBitrate,
      })
    }

    for (let attempt = 1; attempt <= spec.maxAttempts; attempt += 1) {
      throwIfAborted(job)
      const result = await executeStageAttempt(job, mediabunny, workspace, attempt, videoBitrate)
      const outputBytes = Number(result.stageFile.size || 0)
      attempts.push({ attempt, videoBitrate, outputBytes })
      if (outputBytes <= spec.maxOutputBytes) {
        keepStage = result
        break
      }

      await workspace.remove(result.stage.name)
      if (attempt >= spec.maxAttempts) break
      const corrected = Math.floor(videoBitrate * ((spec.maxOutputBytes * 0.94) / outputBytes))
      if (corrected < spec.minimumVideoBitrate) {
        fail('VIDEO_OPTIMIZER_RETRY_BITRATE_TOO_LOW', 'The strict output limit would require an unsafe video bitrate.', {
          corrected,
          minimumVideoBitrate: spec.minimumVideoBitrate,
          profileId: spec.profileId,
        })
      }
      videoBitrate = Math.min(videoBitrate - 16_000, corrected)
      post(QL7_VIDEO_WORKER_TYPES.PROGRESS, job, {
        publicStage: 'processing',
        internalStage: 'retry-cleanup',
        progress: 0,
        attempt,
        maxAttempts: spec.maxAttempts,
        previousSizeBytes: outputBytes,
        nextVideoBitrate: videoBitrate,
      })
    }

    if (!keepStage) {
      fail('VIDEO_OPTIMIZER_MAX_SIZE_NOT_REACHED', `Unable to produce an MP4 below ${Math.round(spec.maxOutputBytes / (1024 * 1024))} MB.`, { attempts })
    }

    const finalBuffer = await remuxFastStart(job, mediabunny, keepStage.stageFile)
    if (finalBuffer.byteLength > spec.maxOutputBytes) {
      fail('VIDEO_OPTIMIZER_FASTSTART_REMUX_SIZE_EXCEEDED', 'Fast Start remux exceeded the strict output size limit.', {
        sizeBytes: finalBuffer.byteLength,
        maxOutputBytes: spec.maxOutputBytes,
      })
    }

    post(QL7_VIDEO_WORKER_TYPES.RESULT, job, {
      executor: QL7_MOBILE_VIDEO_EXECUTOR_ID,
      bundleMarker: QL7_MOBILE_VIDEO_WORKER_BUNDLE_MARKER,
      routingMarker: QL7_MOBILE_VIDEO_ROUTING_MARKER,
      decoderPath: job.decoderPath || 'native-mediabunny',
      attempts,
      stageSizeBytes: Number(keepStage.stageFile.size || 0),
      finalBuffer,
    }, [finalBuffer])
  } finally {
    try { await workspace.cleanup() } catch {}
  }
}

function normalizeError(error) {
  return {
    name: String(error?.name || 'Error'),
    code: String(error?.code || 'VIDEO_OPTIMIZER_MOBILE_WORKER_FAILED'),
    message: String(error?.message || error || 'Mobile video worker failed.'),
    details: error?.details || null,
  }
}

self.onmessage = (event) => {
  const message = event?.data || {}
  if (Number(message.protocolVersion) !== QL7_VIDEO_WORKER_PROTOCOL_VERSION) return
  if (message.type === QL7_VIDEO_WORKER_TYPES.ABORT) {
    const job = jobs.get(String(message.jobId || ''))
    if (!job) return
    job.aborted = true
    try { job.conversion?.cancel?.().catch(() => {}) } catch {}
    return
  }
  if (message.type !== QL7_VIDEO_WORKER_TYPES.START) return

  const jobId = String(message.jobId || '')
  if (!jobId || jobs.has(jobId)) return
  const job = {
    jobId,
    generation: Number(message.generation || 0),
    file: message.file,
    spec: message.spec || {},
    aborted: false,
    conversion: null,
    decoderPath: '',
  }
  jobs.set(jobId, job)
  const heartbeat = setInterval(() => {
    try {
      post(QL7_VIDEO_WORKER_TYPES.HEARTBEAT, job, {
        at: Date.now(),
        executor: QL7_MOBILE_VIDEO_EXECUTOR_ID,
      })
    } catch {}
  }, QL7_MOBILE_VIDEO_HEARTBEAT_MS)

  Promise.resolve()
    .then(() => runJob(job))
    .catch((error) => {
      post(QL7_VIDEO_WORKER_TYPES.ERROR, job, normalizeError(error))
    })
    .finally(() => {
      clearInterval(heartbeat)
      jobs.delete(jobId)
      try { post(QL7_VIDEO_WORKER_TYPES.DISPOSED, job) } catch {}
    })
}
