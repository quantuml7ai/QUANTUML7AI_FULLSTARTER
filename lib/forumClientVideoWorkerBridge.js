import {
  makeQl7VideoWorkerMessage,
  QL7_VIDEO_WORKER_TYPES,
  isQl7VideoWorkerMessage,
} from './forumClientVideoWorkerProtocol'
import {
  QL7_MOBILE_VIDEO_EXECUTOR_ID,
  QL7_MOBILE_VIDEO_WATCHDOG_MS,
} from './forumClientVideoRuntime'

let generationCounter = 0

function abortError() {
  try { return new DOMException('Video optimization aborted', 'AbortError') } catch {
    const error = new Error('Video optimization aborted')
    error.name = 'AbortError'
    return error
  }
}

function workerError(payload = {}) {
  const error = new Error(String(payload.message || 'Mobile video worker failed.'))
  error.name = String(payload.name || 'ForumClientVideoMobileWorkerError')
  error.code = String(payload.code || 'VIDEO_OPTIMIZER_MOBILE_WORKER_FAILED')
  error.details = payload.details || null
  return error
}

export function executeForumVideoMobileWorker({ file, spec, signal = null, onProgress = null } = {}) {
  if (!(file instanceof Blob)) return Promise.reject(workerError({ code: 'VIDEO_OPTIMIZER_BAD_FILE', message: 'A File or Blob is required.' }))
  if (typeof Worker !== 'function') return Promise.reject(workerError({ code: 'VIDEO_OPTIMIZER_MOBILE_WORKER_UNAVAILABLE', message: 'Dedicated Worker is unavailable.' }))

  const generation = ++generationCounter
  const jobId = `ql7-video-${Date.now()}-${generation}-${Math.random().toString(16).slice(2)}`
  const worker = new Worker(new URL('./forumClientVideoOptimizerWorker.js', import.meta.url), {
    type: 'module',
    name: 'ql7-forum-video-optimizer-mobile-r22',
  })

  return new Promise((resolve, reject) => {
    let settled = false
    let watchdog = 0
    let abortListener = null
    let lastActivity = Date.now()

    const cleanup = () => {
      if (watchdog) clearInterval(watchdog)
      if (signal && abortListener) {
        try { signal.removeEventListener('abort', abortListener) } catch {}
      }
      try { worker.terminate() } catch {}
    }
    const finishResolve = (value) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(value)
    }
    const finishReject = (error) => {
      if (settled) return
      settled = true
      try {
        console.error('[QL7 MOBILE VIDEO WORKER] FAIL', {
          code: String(error?.code || ''),
          name: String(error?.name || ''),
          message: String(error?.message || error || ''),
          details: error?.details || null,
        })
      } catch {}
      cleanup()
      reject(error)
    }
    const emit = (payload) => {
      lastActivity = Date.now()
      if (typeof onProgress !== 'function') return
      try { onProgress(payload) } catch {}
    }

    worker.onmessage = (event) => {
      const message = event?.data || {}
      if (!isQl7VideoWorkerMessage(message)) return
      if (message.jobId !== jobId || Number(message.generation) !== generation) return
      lastActivity = Date.now()

      if (message.type === QL7_VIDEO_WORKER_TYPES.PROGRESS) {
        const stage = message.publicStage === 'finalizing' ? 'finalizing' : 'encoding'
        emit({
          stage,
          executor: QL7_MOBILE_VIDEO_EXECUTOR_ID,
          internalStage: message.internalStage,
          progress: Number(message.progress || 0),
          processedTime: Number(message.processedTime || 0),
          attempt: Number(message.attempt || 0) || undefined,
          maxAttempts: Number(message.maxAttempts || 0) || undefined,
          videoBitrate: Number(message.videoBitrate || 0) || undefined,
          decoderPath: String(message.decoderPath || ''),
        })
        return
      }
      if (message.type === QL7_VIDEO_WORKER_TYPES.HEARTBEAT) return
      if (message.type === QL7_VIDEO_WORKER_TYPES.ERROR) {
        try {
          console.error('[QL7 MOBILE VIDEO WORKER] FAIL', {
            code: String(message.code || 'VIDEO_OPTIMIZER_MOBILE_WORKER_FAILED'),
            name: String(message.name || 'Error'),
            message: String(message.message || ''),
            details: message.details || null,
          })
        } catch {}
        finishReject(workerError(message))
        return
      }
      if (message.type === QL7_VIDEO_WORKER_TYPES.RESULT) {
        if (!(message.finalBuffer instanceof ArrayBuffer) || message.finalBuffer.byteLength <= 0) {
          finishReject(workerError({ code: 'VIDEO_OPTIMIZER_MOBILE_WORKER_EMPTY', message: 'Mobile video worker returned no MP4 bytes.' }))
          return
        }
        finishResolve({
          buffer: message.finalBuffer,
          attempts: Array.isArray(message.attempts) ? message.attempts : [],
          decoderPath: String(message.decoderPath || 'native-mediabunny'),
          executor: String(message.executor || QL7_MOBILE_VIDEO_EXECUTOR_ID),
          stageSizeBytes: Number(message.stageSizeBytes || 0),
        })
      }
    }

    worker.onerror = (event) => {
      finishReject(workerError({
        code: 'VIDEO_OPTIMIZER_MOBILE_WORKER_CRASHED',
        message: String(event?.message || 'Mobile video worker crashed.'),
      }))
    }
    worker.onmessageerror = () => {
      finishReject(workerError({
        code: 'VIDEO_OPTIMIZER_MOBILE_WORKER_MESSAGE_ERROR',
        message: 'Mobile video worker message could not be deserialized.',
      }))
    }

    if (signal) {
      abortListener = () => {
        try { worker.postMessage(makeQl7VideoWorkerMessage(QL7_VIDEO_WORKER_TYPES.ABORT, jobId, generation)) } catch {}
        finishReject(abortError())
      }
      if (signal.aborted) {
        abortListener()
        return
      }
      signal.addEventListener('abort', abortListener, { once: true })
    }

    watchdog = setInterval(() => {
      if (Date.now() - lastActivity <= QL7_MOBILE_VIDEO_WATCHDOG_MS) return
      finishReject(workerError({
        code: 'VIDEO_OPTIMIZER_MOBILE_WORKER_STALLED',
        message: 'Mobile video processing stopped responding.',
      }))
    }, Math.max(1000, Math.floor(QL7_MOBILE_VIDEO_WATCHDOG_MS / 3)))

    try {
      worker.postMessage(makeQl7VideoWorkerMessage(QL7_VIDEO_WORKER_TYPES.START, jobId, generation, {
        file,
        spec,
      }))
    } catch (error) {
      finishReject(error)
    }
  })
}
