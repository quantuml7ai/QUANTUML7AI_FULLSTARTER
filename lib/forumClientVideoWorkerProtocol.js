export const QL7_VIDEO_WORKER_PROTOCOL_VERSION = 14
export const QL7_VIDEO_WORKER_TYPES = Object.freeze({
  START: 'START',
  ABORT: 'ABORT',
  PROGRESS: 'PROGRESS',
  HEARTBEAT: 'HEARTBEAT',
  RESULT: 'RESULT',
  ERROR: 'ERROR',
  DISPOSED: 'DISPOSED',
})

export function isQl7VideoWorkerMessage(message) {
  return !!message && Number(message.protocolVersion) === QL7_VIDEO_WORKER_PROTOCOL_VERSION && typeof message.type === 'string'
}

export function makeQl7VideoWorkerMessage(type, jobId, generation, payload = {}) {
  return {
    protocolVersion: QL7_VIDEO_WORKER_PROTOCOL_VERSION,
    type,
    jobId: String(jobId || ''),
    generation: Number(generation || 0),
    ...payload,
  }
}
