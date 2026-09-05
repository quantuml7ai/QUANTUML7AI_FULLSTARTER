import {
  convertQl7HevcPacketToAnnexB,
  copyQl7Bytes,
  fingerprintQl7HevcDecoderConfig,
  fingerprintQl7VideoColorSpace,
  isQl7HevcCodec,
  joinQl7AnnexBNalus,
  normalizeQl7VideoColorSpace,
  parseQl7HevcDecoderConfigurationRecord,
} from './ql7HevcFallbackPrimitives'
import {
  getQl7HevcMaxNumReorderPics,
  Ql7HevcPresentationScheduler,
} from './ql7HevcPresentationReorder'

const FALLBACK_ASSET_BASE = '/vendor/ql7-hevc'
const activeConfigContexts = new Map()
let registeredMediabunny = null

export const QL7_HEVC_FALLBACK_ID = 'ql7-hevc-wasm-fallback-v7-prod'
export const QL7_HEVC_FALLBACK_CORE = Object.freeze({
  packageName: '@hevcjs/core',
  packageVersion: '1.3.2',
  wasmUrl: `${FALLBACK_ASSET_BASE}/hevc-decode.mjs`,
  wasmBinaryUrl: `${FALLBACK_ASSET_BASE}/hevc-decode.wasm`,
})

function hasQl7FallbackRuntime() {
  return typeof globalThis.Worker === 'function' && typeof globalThis.WebAssembly === 'object'
}

export async function probeQl7NativeVideoDecoder(config) {
  if (!config || typeof globalThis.VideoDecoder?.isConfigSupported !== 'function') return false
  try {
    const result = await globalThis.VideoDecoder.isConfigSupported(config)
    return !!result?.supported
  } catch {
    return false
  }
}

export function isQl7HevcFallbackEligible({ codec, codecParameterString, decoderConfig } = {}) {
  if (!hasQl7FallbackRuntime()) return false
  if (!isQl7HevcCodec(codec, codecParameterString || decoderConfig?.codec)) return false
  if (!decoderConfig || !/^(?:hvc1|hev1)(?:\.|$)/i.test(String(decoderConfig.codec || ''))) return false
  const width = Number(decoderConfig.codedWidth || 0)
  const height = Number(decoderConfig.codedHeight || 0)
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return false
  try {
    parseQl7HevcDecoderConfigurationRecord(decoderConfig.description)
    return true
  } catch {
    return false
  }
}

function workerRequest(worker, pending, type, payload = {}, transfer = []) {
  return new Promise((resolve, reject) => {
    const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    pending.set(requestId, { resolve, reject })
    try {
      worker.postMessage({ type, requestId, ...payload }, transfer)
    } catch (error) {
      pending.delete(requestId)
      reject(error)
    }
  })
}

export function registerQl7HevcFallbackDecoder(mediabunny) {
  if (!mediabunny?.CustomVideoDecoder || !mediabunny?.VideoSample || typeof mediabunny?.registerDecoder !== 'function') {
    throw new Error('QL7_HEVC_MEDIABUNNY_CUSTOM_DECODER_API_MISSING')
  }
  if (registeredMediabunny === mediabunny) return

  class Ql7HevcCustomVideoDecoder extends mediabunny.CustomVideoDecoder {
    static supports(codec, config) {
      if (codec !== 'hevc') return false
      return activeConfigContexts.has(fingerprintQl7HevcDecoderConfig(config))
    }

    constructor(...args) {
      super(...args)
      this.worker = null
      this.pending = new Map()
      this.presentation = null
      this.context = null
      this.nalLengthSize = 4
      this.closed = false
    }

    async init() {
      const key = fingerprintQl7HevcDecoderConfig(this.config)
      this.context = activeConfigContexts.get(key) || null
      if (!this.context) throw new Error('QL7_HEVC_FALLBACK_CONTEXT_MISSING')

      const parsed = parseQl7HevcDecoderConfigurationRecord(this.config?.description)
      this.nalLengthSize = parsed.nalLengthSize
      this.presentation = new Ql7HevcPresentationScheduler(getQl7HevcMaxNumReorderPics(parsed.parameterSets))
      const parameterSetsAnnexB = joinQl7AnnexBNalus(parsed.parameterSets)
      if (!parameterSetsAnnexB.byteLength) throw new Error('QL7_HEVC_PARAMETER_SETS_EMPTY')

      this.worker = new Worker(new URL('./ql7HevcDecoderWorker.js', import.meta.url), {
        type: 'module',
        name: 'ql7-hevc-decoder-v7-prod',
      })
      this.worker.onmessage = (event) => {
        const message = event?.data || {}
        const entry = this.pending.get(message.requestId)
        if (!entry) return
        this.pending.delete(message.requestId)
        if (message.ok) entry.resolve(message)
        else entry.reject(new Error(String(message.error || 'QL7_HEVC_WORKER_FAILED')))
      }
      this.worker.onerror = (event) => {
        const error = new Error(String(event?.message || 'QL7_HEVC_WORKER_ERROR'))
        for (const entry of this.pending.values()) entry.reject(error)
        this.pending.clear()
        try { this.onError?.(error) } catch {}
      }

      const initBytes = parameterSetsAnnexB.slice()
      await workerRequest(this.worker, this.pending, 'init', {
        wasmUrl: QL7_HEVC_FALLBACK_CORE.wasmUrl,
        wasmBinaryUrl: QL7_HEVC_FALLBACK_CORE.wasmBinaryUrl,
        parameterSets: initBytes.buffer,
      }, [initBytes.buffer])
    }

    emitScheduledFrames(scheduled) {
      for (const entry of Array.isArray(scheduled) ? scheduled : []) {
        const frame = entry?.frame
        const timing = entry?.timing
        const width = Number(frame?.width || 0)
        const height = Number(frame?.height || 0)
        const format = String(frame?.format || '')
        if (!['I420', 'I420P10'].includes(format)) throw new Error('QL7_HEVC_UNSUPPORTED_PIXEL_FORMAT')
        const sample = new mediabunny.VideoSample(frame.buffer, {
          format,
          codedWidth: width,
          codedHeight: height,
          timestamp: timing.timestamp,
          duration: timing.duration,
          colorSpace: this.context.colorSpace || undefined,
          rotation: 0,
        })
        this.onSample(sample)
      }
    }

    emitFrames(frames) {
      if (!this.presentation) throw new Error('QL7_HEVC_PRESENTATION_SCHEDULER_MISSING')
      this.emitScheduledFrames(this.presentation.pushFrames(frames))
    }

    async decode(packet) {
      if (this.closed || !this.worker) throw new Error('QL7_HEVC_DECODER_CLOSED')
      if (!packet || packet.isMetadataOnly || !packet.data?.byteLength) return
      if (!this.presentation) throw new Error('QL7_HEVC_PRESENTATION_SCHEDULER_MISSING')
      this.presentation.pushPacket(packet)
      const annexB = convertQl7HevcPacketToAnnexB(packet.data, this.nalLengthSize)
      const transferable = annexB.slice()
      try {
        const response = await workerRequest(this.worker, this.pending, 'feed', {
          data: transferable.buffer,
        }, [transferable.buffer])
        this.emitFrames(response.frames)
      } catch (error) {
        this.presentation?.reset()
        throw error
      }
    }

    async flush() {
      if (this.closed || !this.worker) return
      const response = await workerRequest(this.worker, this.pending, 'flushAndReset')
      this.emitFrames(response.frames)
      this.emitScheduledFrames(this.presentation?.finish() || [])
      this.presentation?.reset()
    }

    async close() {
      if (this.closed) return
      this.closed = true
      const worker = this.worker
      if (worker) {
        try { await workerRequest(worker, this.pending, 'close') } catch {}
      }
      const error = new Error('QL7_HEVC_DECODER_CLOSED')
      for (const entry of this.pending.values()) entry.reject(error)
      this.pending.clear()
      try { worker?.terminate?.() } catch {}
      this.worker = null
      this.presentation?.reset()
    }
  }

  mediabunny.registerDecoder(Ql7HevcCustomVideoDecoder)
  registeredMediabunny = mediabunny
}

export function acquireQl7HevcFallbackConfig(mediabunny, decoderConfig, context = {}) {
  if (!isQl7HevcFallbackEligible({ codec: 'hevc', decoderConfig })) throw new Error('QL7_HEVC_FALLBACK_CONFIG_UNSUPPORTED')
  registerQl7HevcFallbackDecoder(mediabunny)

  const key = fingerprintQl7HevcDecoderConfig(decoderConfig)
  const colorSpace = normalizeQl7VideoColorSpace(context?.colorSpace)
  const colorSignature = fingerprintQl7VideoColorSpace(colorSpace)
  const current = activeConfigContexts.get(key)
  if (current && current.colorSignature !== colorSignature) throw new Error('QL7_HEVC_CONFIG_CONTEXT_COLLISION')

  const entry = current || {
    colorSpace,
    colorSignature,
    leases: 0,
  }
  entry.leases += 1
  activeConfigContexts.set(key, entry)

  let released = false
  return Object.freeze({
    key,
    release() {
      if (released) return
      released = true
      const active = activeConfigContexts.get(key)
      if (!active) return
      active.leases -= 1
      if (active.leases <= 0) activeConfigContexts.delete(key)
    },
  })
}

export { isQl7HevcCodec } from './ql7HevcFallbackPrimitives'
