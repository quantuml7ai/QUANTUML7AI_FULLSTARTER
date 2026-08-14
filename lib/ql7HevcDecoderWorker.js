import { HEVCDecoder } from '@hevcjs/core'
import { packQl7Planar420Frame } from './ql7HevcFallbackPrimitives'

let decoder = null
let decoderOptions = null
let retainedParameterSets = null

const QL7_HEVC_RUNTIME_ESM_BRIDGE_MARKER = 'QL7_HEVC_RUNTIME_ESM_BRIDGE_V12'

async function ensureQl7HevcRuntimeFactory() {
  if (typeof globalThis.HEVCDecoderModule === 'function') return globalThis.HEVCDecoderModule
  const runtimeUrl = String(decoderOptions?.wasmUrl || '')
  if (!runtimeUrl) throw new Error('QL7_HEVC_RUNTIME_URL_MISSING')

  let runtimeModule
  try {
    runtimeModule = await import(/* webpackIgnore: true */ runtimeUrl)
  } catch (error) {
    throw new Error(`${QL7_HEVC_RUNTIME_ESM_BRIDGE_MARKER}:FAILED:${String(error?.message || error || 'unknown')}`)
  }

  const factory = runtimeModule?.default
  if (typeof factory !== 'function') {
    throw new Error(`${QL7_HEVC_RUNTIME_ESM_BRIDGE_MARKER}:FACTORY_MISSING`)
  }
  globalThis.HEVCDecoderModule = factory
  return factory
}

async function createDecoder() {
  if (!decoderOptions) throw new Error('QL7_HEVC_WORKER_OPTIONS_MISSING')
  await ensureQl7HevcRuntimeFactory()
  decoder = await HEVCDecoder.create({
    wasmBinaryUrl: decoderOptions.wasmBinaryUrl,
  })
  if (retainedParameterSets?.byteLength) {
    decoder.feed(retainedParameterSets)
    const unexpected = decoder.drain()
    if (unexpected.length) throw new Error('QL7_HEVC_PARAMETER_SETS_EMITTED_FRAMES')
  }
}

function serializeFrames(frames) {
  const serialized = []
  const transfer = []
  for (const frame of Array.isArray(frames) ? frames : []) {
    const info = decoder?.info || null
    const bitDepth = Number(frame?.bitDepth || info?.bitDepth || 8)
    const chromaFormat = Number(info?.chromaFormat ?? 1)
    if (chromaFormat !== 1) throw new Error('QL7_HEVC_ONLY_420_SUPPORTED')
    const packed = packQl7Planar420Frame({
      y: frame?.y,
      cb: frame?.cb,
      cr: frame?.cr,
      width: frame?.width,
      height: frame?.height,
      bitDepth,
    })
    serialized.push({
      buffer: packed.buffer,
      format: packed.format,
      width: Number(frame?.width || 0),
      height: Number(frame?.height || 0),
      bitDepth,
      poc: Number(frame?.poc || 0),
    })
    transfer.push(packed.buffer)
  }
  return { frames: serialized, transfer }
}

async function resetDecoder() {
  decoder?.destroy?.()
  decoder = null
  await createDecoder()
}

self.onmessage = async (event) => {
  const message = event?.data || {}
  const requestId = message.requestId
  try {
    if (message.type === 'init') {
      decoder?.destroy?.()
      decoder = null
      decoderOptions = {
        wasmUrl: String(message.wasmUrl || ''),
        wasmBinaryUrl: String(message.wasmBinaryUrl || ''),
      }
      retainedParameterSets = message.parameterSets instanceof ArrayBuffer
        ? new Uint8Array(message.parameterSets).slice()
        : new Uint8Array(0)
      if (!retainedParameterSets.byteLength) throw new Error('QL7_HEVC_PARAMETER_SETS_EMPTY')
      await createDecoder()
      self.postMessage({ requestId, ok: true, frames: [] })
      return
    }

    if (message.type === 'feed') {
      if (!decoder) throw new Error('QL7_HEVC_WORKER_NOT_INITIALIZED')
      if (!(message.data instanceof ArrayBuffer) || !message.data.byteLength) throw new Error('QL7_HEVC_EMPTY_PACKET')
      decoder.feed(new Uint8Array(message.data))
      const result = serializeFrames(decoder.drain())
      self.postMessage({ requestId, ok: true, frames: result.frames }, result.transfer)
      return
    }

    if (message.type === 'flushAndReset') {
      if (!decoder) throw new Error('QL7_HEVC_WORKER_NOT_INITIALIZED')
      const result = serializeFrames(decoder.flush())
      await resetDecoder()
      self.postMessage({ requestId, ok: true, frames: result.frames }, result.transfer)
      return
    }

    if (message.type === 'close') {
      decoder?.destroy?.()
      decoder = null
      retainedParameterSets = null
      decoderOptions = null
      self.postMessage({ requestId, ok: true, frames: [] })
      self.close()
      return
    }

    throw new Error('QL7_HEVC_UNKNOWN_WORKER_MESSAGE')
  } catch (error) {
    self.postMessage({ requestId, ok: false, error: String(error?.message || error || 'QL7_HEVC_WORKER_FAILED') })
  }
}
