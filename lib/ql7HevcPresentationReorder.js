export const QL7_HEVC_PRESENTATION_REORDER_ID = 'ql7-hevc-poc-pts-reorder-v13'

const MAX_SAFE_REORDER_PICS = 32

class Ql7BitReader {
  constructor(bytes) {
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(0)
    this.bitOffset = 0
  }

  readBit() {
    if (this.bitOffset >= this.bytes.length * 8) throw new Error('QL7_HEVC_SPS_TRUNCATED')
    const byte = this.bytes[this.bitOffset >> 3]
    const shift = 7 - (this.bitOffset & 7)
    this.bitOffset += 1
    return (byte >> shift) & 1
  }

  readBits(count) {
    const n = Number(count)
    if (!Number.isInteger(n) || n < 0 || n > 32) throw new Error('QL7_HEVC_SPS_BAD_BIT_COUNT')
    let value = 0
    for (let index = 0; index < n; index += 1) value = (value * 2) + this.readBit()
    return value
  }

  skipBits(count) {
    const n = Number(count)
    if (!Number.isInteger(n) || n < 0 || this.bitOffset + n > this.bytes.length * 8) {
      throw new Error('QL7_HEVC_SPS_TRUNCATED')
    }
    this.bitOffset += n
  }

  readUE() {
    let leadingZeroBits = 0
    while (this.readBit() === 0) {
      leadingZeroBits += 1
      if (leadingZeroBits > 31) throw new Error('QL7_HEVC_SPS_UE_TOO_LARGE')
    }
    if (!leadingZeroBits) return 0
    const suffix = this.readBits(leadingZeroBits)
    return (2 ** leadingZeroBits) - 1 + suffix
  }
}

function nalToRbsp(nal) {
  if (!(nal instanceof Uint8Array) || nal.length < 3) throw new Error('QL7_HEVC_SPS_MISSING')
  const nalType = (nal[0] >> 1) & 0x3f
  if (nalType !== 33) throw new Error('QL7_HEVC_SPS_NAL_TYPE_INVALID')
  const out = []
  let zeros = 0
  for (let index = 2; index < nal.length; index += 1) {
    const value = nal[index]
    if (zeros >= 2 && value === 0x03) {
      zeros = 0
      continue
    }
    out.push(value)
    zeros = value === 0 ? zeros + 1 : 0
  }
  return Uint8Array.from(out)
}

function skipProfileTierLevel(reader, maxSubLayersMinus1) {
  reader.skipBits(96)
  const profilePresent = []
  const levelPresent = []
  for (let index = 0; index < maxSubLayersMinus1; index += 1) {
    profilePresent[index] = reader.readBit()
    levelPresent[index] = reader.readBit()
  }
  if (maxSubLayersMinus1 > 0) {
    for (let index = maxSubLayersMinus1; index < 8; index += 1) reader.skipBits(2)
  }
  for (let index = 0; index < maxSubLayersMinus1; index += 1) {
    if (profilePresent[index]) reader.skipBits(88)
    if (levelPresent[index]) reader.skipBits(8)
  }
}

export function parseQl7HevcSpsMaxNumReorderPics(spsNal) {
  const reader = new Ql7BitReader(nalToRbsp(spsNal))
  reader.skipBits(4)
  const maxSubLayersMinus1 = reader.readBits(3)
  if (maxSubLayersMinus1 > 6) throw new Error('QL7_HEVC_SPS_BAD_SUBLAYER_COUNT')
  reader.skipBits(1)
  skipProfileTierLevel(reader, maxSubLayersMinus1)

  reader.readUE() // sps_seq_parameter_set_id
  const chromaFormatIdc = reader.readUE()
  if (chromaFormatIdc > 3) throw new Error('QL7_HEVC_SPS_BAD_CHROMA_FORMAT')
  if (chromaFormatIdc === 3) reader.skipBits(1)
  reader.readUE() // pic_width_in_luma_samples
  reader.readUE() // pic_height_in_luma_samples
  if (reader.readBit()) {
    reader.readUE()
    reader.readUE()
    reader.readUE()
    reader.readUE()
  }
  reader.readUE() // bit_depth_luma_minus8
  reader.readUE() // bit_depth_chroma_minus8
  reader.readUE() // log2_max_pic_order_cnt_lsb_minus4

  const orderingInfoPresent = reader.readBit()
  const startLayer = orderingInfoPresent ? 0 : maxSubLayersMinus1
  let maxReorderPics = 0
  for (let layer = startLayer; layer <= maxSubLayersMinus1; layer += 1) {
    const maxDecPicBufferingMinus1 = reader.readUE()
    const maxNumReorderPics = reader.readUE()
    reader.readUE() // sps_max_latency_increase_plus1
    if (maxNumReorderPics > maxDecPicBufferingMinus1) throw new Error('QL7_HEVC_SPS_REORDER_EXCEEDS_DPB')
    maxReorderPics = Math.max(maxReorderPics, maxNumReorderPics)
  }

  if (!Number.isInteger(maxReorderPics) || maxReorderPics < 0 || maxReorderPics > MAX_SAFE_REORDER_PICS) {
    throw new Error('QL7_HEVC_SPS_REORDER_DEPTH_UNSAFE')
  }
  return maxReorderPics
}

export function getQl7HevcMaxNumReorderPics(parameterSets = []) {
  const sps = parameterSets.find((nal) => nal instanceof Uint8Array && nal.length >= 2 && (((nal[0] >> 1) & 0x3f) === 33))
  if (!sps) throw new Error('QL7_HEVC_SPS_MISSING')
  return parseQl7HevcSpsMaxNumReorderPics(sps)
}

export class Ql7HevcPresentationScheduler {
  constructor(maxReorderPics) {
    const depth = Number(maxReorderPics)
    if (!Number.isInteger(depth) || depth < 0 || depth > MAX_SAFE_REORDER_PICS) {
      throw new Error('QL7_HEVC_REORDER_DEPTH_INVALID')
    }
    this.maxReorderPics = depth
    this.reset()
  }

  reset() {
    this.timings = []
    this.frames = []
    this.timingSequence = 0
    this.frameSequence = 0
    this.lastOutputTimestamp = -Infinity
    this.lastOutputPoc = null
  }

  pushPacket(packet) {
    const timestamp = Number(packet?.timestamp)
    if (!Number.isFinite(timestamp)) throw new Error('QL7_HEVC_PACKET_TIMESTAMP_MISSING')
    const rawDuration = Number(packet?.duration)
    this.timings.push({
      timestamp,
      duration: Number.isFinite(rawDuration) && rawDuration >= 0 ? rawDuration : 0,
      sequence: this.timingSequence++,
    })
    this.timings.sort((left, right) => left.timestamp - right.timestamp || left.sequence - right.sequence)
  }

  pushFrames(frames) {
    const ready = []
    for (const frame of Array.isArray(frames) ? frames : []) {
      const poc = Number(frame?.poc)
      if (!Number.isInteger(poc)) throw new Error('QL7_HEVC_FRAME_POC_MISSING')

      if (poc === 0 && (this.lastOutputPoc !== null || this.frames.length)) {
        ready.push(...this.drainReady(true))
        this.lastOutputPoc = null
      }
      if (this.lastOutputPoc !== null && poc <= this.lastOutputPoc) {
        throw new Error('QL7_HEVC_NON_MONOTONIC_POC')
      }
      if (this.frames.some((item) => item.poc === poc)) throw new Error('QL7_HEVC_DUPLICATE_POC')

      this.frames.push({ frame, poc, sequence: this.frameSequence++ })
      this.frames.sort((left, right) => left.poc - right.poc || left.sequence - right.sequence)
      ready.push(...this.drainReady(false))
    }
    return ready
  }

  drainReady(force = false) {
    const ready = []
    while (this.frames.length && (force || this.frames.length > this.maxReorderPics)) {
      if (!this.timings.length) {
        if (force) throw new Error('QL7_HEVC_FRAME_WITHOUT_TIMESTAMP')
        break
      }
      const frameItem = this.frames.shift()
      const timing = this.timings.shift()
      if (this.lastOutputPoc !== null && frameItem.poc <= this.lastOutputPoc) {
        throw new Error('QL7_HEVC_NON_MONOTONIC_POC')
      }
      if (!(timing.timestamp > this.lastOutputTimestamp)) {
        throw new Error('QL7_HEVC_NON_MONOTONIC_PRESENTATION_TIMESTAMP')
      }
      this.lastOutputPoc = frameItem.poc
      this.lastOutputTimestamp = timing.timestamp
      ready.push({ frame: frameItem.frame, timing })
    }
    return ready
  }

  finish() {
    const ready = this.drainReady(true)
    if (this.frames.length) throw new Error('QL7_HEVC_UNCONSUMED_DECODED_FRAMES')
    if (this.timings.length) throw new Error('QL7_HEVC_UNCONSUMED_PACKET_TIMESTAMPS')
    return ready
  }
}
