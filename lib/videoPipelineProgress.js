export const VIDEO_PIPELINE_PROGRESS_POLICY_ID = 'ql7-video-pipeline-progress-v2-single-pass'

export const VIDEO_PIPELINE_PROGRESS_RANGES = Object.freeze({
  preparing: Object.freeze([2, 9]),
  processing: Object.freeze([10, 84]),
  sampling: Object.freeze([84, 88]),
  moderating: Object.freeze([88, 94]),
  uploading: Object.freeze([94, 99]),
  finalizing: Object.freeze([99, 99.4]),
  ready: Object.freeze([100, 100]),
})

export const VIDEO_PIPELINE_STAGE_ORDER = Object.freeze([
  'preparing',
  'processing',
  'verifying',
  'uploading',
  'finalizing',
  'ready',
])

let videoHeavyActivityCount = 0
const videoHeavyActivityListeners = new Set()

function publishVideoHeavyActivity() {
  const active = videoHeavyActivityCount > 0
  for (const listener of Array.from(videoHeavyActivityListeners)) {
    try { listener(active, videoHeavyActivityCount) } catch {}
  }
}

export function isVideoHeavyActivityActive() {
  return videoHeavyActivityCount > 0
}

export function subscribeVideoHeavyActivity(listener) {
  if (typeof listener !== 'function') return () => {}
  videoHeavyActivityListeners.add(listener)
  try { listener(videoHeavyActivityCount > 0, videoHeavyActivityCount) } catch {}
  return () => videoHeavyActivityListeners.delete(listener)
}

export function enterVideoHeavyActivity() {
  videoHeavyActivityCount += 1
  publishVideoHeavyActivity()
  let released = false
  return () => {
    if (released) return
    released = true
    videoHeavyActivityCount = Math.max(0, videoHeavyActivityCount - 1)
    publishVideoHeavyActivity()
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value || 0)))
}

export function normalizeVideoProgressFraction(value) {
  let n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n > 1 && n <= 100) n /= 100
  return clamp(n, 0, 1)
}

function monotonicPercent(target, previousPercent = 0, allowComplete = false) {
  const ceiling = allowComplete ? 100 : 99.4
  const previous = clamp(previousPercent, 0, ceiling)
  return clamp(Math.max(previous, target), 0, ceiling)
}

export function mapVideoPrepareProgress(event, previousPercent = 0) {
  const stage = String(event?.stage || '').trim().toLowerCase()
  const progress = normalizeVideoProgressFraction(event?.progress)
  const attempt = Math.max(1, Number(event?.attempt || 1))

  let phase = 'preparing'
  let percent = 2

  if (stage === 'preparing') {
    percent = 2 + progress * 2
  } else if (stage === 'analyzing') {
    percent = 4 + progress * 2
  } else if (stage === 'capability') {
    percent = 7 + progress
  } else if (stage === 'planned') {
    percent = 9
  } else if (stage === 'encoding') {
    phase = 'processing'
    if (attempt <= 1) {
      percent = 10 + progress * 68
    } else {
      percent = 78 + progress * 4
    }
  } else if (stage === 'retrying') {
    phase = 'processing'
    percent = 78 + Math.min(4, attempt)
  } else if (stage === 'verifying') {
    phase = 'processing'
    percent = 82 + progress * 2
  } else if (stage === 'done') {
    phase = 'processing'
    percent = 84
  } else if (stage === 'sampling') {
    phase = 'processing'
    percent = 84 + progress * 4
  } else if (stage === 'moderating') {
    phase = 'verifying'
    percent = 88 + progress * 6
  } else if (stage === 'moderated') {
    phase = 'verifying'
    percent = 94
  } else if (stage === 'failed') {
    phase = 'processing'
    percent = previousPercent
  }

  return {
    policyId: VIDEO_PIPELINE_PROGRESS_POLICY_ID,
    sourceStage: stage || 'preparing',
    phase,
    percent: monotonicPercent(percent, previousPercent),
    rawProgress: progress,
    attempt,
    maxAttempts: Math.max(1, Number(event?.maxAttempts || 1)),
  }
}

export function mapVideoUploadProgress(value, previousPercent = 0) {
  const progress = normalizeVideoProgressFraction(value)
  return {
    policyId: VIDEO_PIPELINE_PROGRESS_POLICY_ID,
    phase: 'uploading',
    percent: monotonicPercent(94 + progress * 5, previousPercent),
    rawProgress: progress,
  }
}

export function mapVideoFinalizingProgress(previousPercent = 0) {
  return {
    policyId: VIDEO_PIPELINE_PROGRESS_POLICY_ID,
    phase: 'finalizing',
    percent: monotonicPercent(99, previousPercent),
  }
}

export function mapVideoReadyProgress() {
  return {
    policyId: VIDEO_PIPELINE_PROGRESS_POLICY_ID,
    phase: 'ready',
    percent: 100,
  }
}
