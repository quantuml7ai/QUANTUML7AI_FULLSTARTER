const START_CODE = new Uint8Array([0, 0, 0, 1])

export function copyQl7Bytes(value) {
  if (!value) return new Uint8Array(0)
  if (value instanceof Uint8Array) return new Uint8Array(value)
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength))
  }
  if (value instanceof ArrayBuffer) return new Uint8Array(value.slice(0))
  return new Uint8Array(0)
}

function bytesToHex(bytes) {
  let out = ''
  for (let index = 0; index < bytes.length; index += 1) out += bytes[index].toString(16).padStart(2, '0')
  return out
}

export function isQl7HevcCodec(codec, codecParameterString = '') {
  const mediaCodec = String(codec || '').trim().toLowerCase()
  const parameter = String(codecParameterString || '').trim().toLowerCase()
  return mediaCodec === 'hevc' || /^(?:hvc1|hev1)(?:\.|$)/.test(parameter) || /^(?:hvc1|hev1)(?:\.|$)/.test(mediaCodec)
}

export function fingerprintQl7HevcDecoderConfig(config = {}) {
  const description = copyQl7Bytes(config?.description)
  return [
    String(config?.codec || '').trim().toLowerCase(),
    Number(config?.codedWidth || 0),
    Number(config?.codedHeight || 0),
    description.length,
    bytesToHex(description),
  ].join('|')
}

export function normalizeQl7VideoColorSpace(value = null) {
  if (!value || typeof value !== 'object') return null
  const normalized = {
    fullRange: typeof value.fullRange === 'boolean' ? value.fullRange : undefined,
    matrix: value.matrix || undefined,
    primaries: value.primaries || undefined,
    transfer: value.transfer || undefined,
  }
  if (Object.values(normalized).every((entry) => entry === undefined)) return null
  return normalized
}

export function fingerprintQl7VideoColorSpace(value = null) {
  const normalized = normalizeQl7VideoColorSpace(value)
  if (!normalized) return 'unknown'
  return JSON.stringify(normalized)
}

export function parseQl7HevcDecoderConfigurationRecord(description) {
  const bytes = copyQl7Bytes(description)
  if (bytes.length < 23 || bytes[0] !== 1) throw new Error('QL7_HEVC_BAD_HVCC')

  const nalLengthSize = (bytes[21] & 0x03) + 1
  const arrayCount = bytes[22]
  const parameterSets = []
  let offset = 23

  for (let arrayIndex = 0; arrayIndex < arrayCount; arrayIndex += 1) {
    if (offset + 3 > bytes.length) throw new Error('QL7_HEVC_TRUNCATED_HVCC_ARRAY')
    const nalType = bytes[offset] & 0x3f
    offset += 1
    const count = (bytes[offset] << 8) | bytes[offset + 1]
    offset += 2

    for (let nalIndex = 0; nalIndex < count; nalIndex += 1) {
      if (offset + 2 > bytes.length) throw new Error('QL7_HEVC_TRUNCATED_HVCC_NAL_LENGTH')
      const length = (bytes[offset] << 8) | bytes[offset + 1]
      offset += 2
      if (length <= 0 || offset + length > bytes.length) throw new Error('QL7_HEVC_TRUNCATED_HVCC_NAL')
      const nal = bytes.slice(offset, offset + length)
      offset += length
      if (nalType === 32 || nalType === 33 || nalType === 34) parameterSets.push(nal)
    }
  }

  if (![1, 2, 3, 4].includes(nalLengthSize)) throw new Error('QL7_HEVC_BAD_NAL_LENGTH_SIZE')
  if (!parameterSets.length) throw new Error('QL7_HEVC_MISSING_PARAMETER_SETS')
  return { nalLengthSize, parameterSets }
}

export function joinQl7AnnexBNalus(nalus = []) {
  const valid = nalus.filter((nal) => nal instanceof Uint8Array && nal.length > 0)
  const total = valid.reduce((sum, nal) => sum + START_CODE.length + nal.length, 0)
  const output = new Uint8Array(total)
  let offset = 0
  for (const nal of valid) {
    output.set(START_CODE, offset)
    offset += START_CODE.length
    output.set(nal, offset)
    offset += nal.length
  }
  return output
}

function looksLikeAnnexB(bytes) {
  return bytes.length >= 4 && bytes[0] === 0 && bytes[1] === 0 && (
    bytes[2] === 1 || (bytes[2] === 0 && bytes[3] === 1)
  )
}

export function convertQl7HevcPacketToAnnexB(data, nalLengthSize = 4) {
  const bytes = copyQl7Bytes(data)
  if (!bytes.length || looksLikeAnnexB(bytes)) return bytes
  if (![1, 2, 3, 4].includes(nalLengthSize)) throw new Error('QL7_HEVC_BAD_NAL_LENGTH_SIZE')

  const nalus = []
  let offset = 0
  while (offset < bytes.length) {
    if (offset + nalLengthSize > bytes.length) throw new Error('QL7_HEVC_TRUNCATED_PACKET_LENGTH')
    let length = 0
    for (let index = 0; index < nalLengthSize; index += 1) length = (length * 256) + bytes[offset + index]
    offset += nalLengthSize
    if (length <= 0 || offset + length > bytes.length) throw new Error('QL7_HEVC_TRUNCATED_PACKET_NAL')
    nalus.push(bytes.slice(offset, offset + length))
    offset += length
  }
  return joinQl7AnnexBNalus(nalus)
}

export function packQl7Planar420Frame({ y, cb, cr, width, height, bitDepth = 8 } = {}) {
  const w = Number(width || 0)
  const h = Number(height || 0)
  if (!Number.isInteger(w) || !Number.isInteger(h) || w <= 0 || h <= 0) throw new Error('QL7_HEVC_BAD_FRAME_DIMENSIONS')
  if (![8, 10].includes(Number(bitDepth))) throw new Error('QL7_HEVC_UNSUPPORTED_BIT_DEPTH')

  const chromaWidth = Math.ceil(w / 2)
  const chromaHeight = Math.ceil(h / 2)
  const yCount = w * h
  const cCount = chromaWidth * chromaHeight
  if (!y || !cb || !cr || y.length < yCount || cb.length < cCount || cr.length < cCount) {
    throw new Error('QL7_HEVC_BAD_FRAME_PLANES')
  }

  if (Number(bitDepth) === 8) {
    const out = new Uint8Array(yCount + cCount * 2)
    let offset = 0
    for (let index = 0; index < yCount; index += 1) out[offset++] = Number(y[index]) & 0xff
    for (let index = 0; index < cCount; index += 1) out[offset++] = Number(cb[index]) & 0xff
    for (let index = 0; index < cCount; index += 1) out[offset++] = Number(cr[index]) & 0xff
    return { buffer: out.buffer, format: 'I420' }
  }

  const out = new ArrayBuffer((yCount + cCount * 2) * 2)
  const view = new DataView(out)
  let byteOffset = 0
  for (const [plane, count] of [[y, yCount], [cb, cCount], [cr, cCount]]) {
    for (let index = 0; index < count; index += 1) {
      const value = Number(plane[index])
      if (!Number.isFinite(value) || value < 0 || value > 1023) throw new Error('QL7_HEVC_BAD_10BIT_SAMPLE')
      view.setUint16(byteOffset, value, true)
      byteOffset += 2
    }
  }
  return { buffer: out, format: 'I420P10' }
}
