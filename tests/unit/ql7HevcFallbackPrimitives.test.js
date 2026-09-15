import { describe, expect, test } from 'vitest'
import {
  convertQl7HevcPacketToAnnexB,
  fingerprintQl7HevcDecoderConfig,
  isQl7HevcCodec,
  joinQl7AnnexBNalus,
  packQl7Planar420Frame,
  parseQl7HevcDecoderConfigurationRecord,
} from '../../lib/ql7HevcFallbackPrimitives'

function makeHvcc({ nalLengthSize = 4 } = {}) {
  const vps = Uint8Array.from([0x40, 0x01, 0x0c])
  const sps = Uint8Array.from([0x42, 0x01, 0x01, 0x60])
  const pps = Uint8Array.from([0x44, 0x01, 0xc0])
  const out = []
  out.push(1, ...new Array(20).fill(0), (nalLengthSize - 1) & 3, 3)
  for (const [type, bytes] of [[32, vps], [33, sps], [34, pps]]) {
    out.push(0x80 | type, 0, 1, (bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes)
  }
  return { bytes: Uint8Array.from(out), vps, sps, pps }
}

describe('QL7 HEVC fallback primitives', () => {
  test('routes by actual HEVC codec and not by container extension', () => {
    expect(isQl7HevcCodec('hevc', '')).toBe(true)
    expect(isQl7HevcCodec('hevc', 'hvc1.1.6.L93.B0')).toBe(true)
    expect(isQl7HevcCodec('avc', 'avc1.640028')).toBe(false)
    expect(isQl7HevcCodec('vp9', 'vp09.00.41.08')).toBe(false)
  })

  test('parses hvcC parameter sets and preserves the configured NAL length size', () => {
    const { bytes } = makeHvcc({ nalLengthSize: 4 })
    const parsed = parseQl7HevcDecoderConfigurationRecord(bytes)
    expect(parsed.nalLengthSize).toBe(4)
    expect(parsed.parameterSets).toHaveLength(3)
    expect(joinQl7AnnexBNalus(parsed.parameterSets).slice(0, 4)).toEqual(Uint8Array.from([0, 0, 0, 1]))
  })

  test('converts ISO length-prefixed HEVC access units to Annex B', () => {
    const nalA = Uint8Array.from([0x26, 0x01, 0xaa])
    const nalB = Uint8Array.from([0x02, 0x01, 0xbb, 0xcc])
    const packet = Uint8Array.from([
      0, 0, 0, nalA.length, ...nalA,
      0, 0, 0, nalB.length, ...nalB,
    ])
    expect(convertQl7HevcPacketToAnnexB(packet, 4)).toEqual(joinQl7AnnexBNalus([nalA, nalB]))
  })

  test('fingerprints decoder config including hvcC bytes', () => {
    const { bytes } = makeHvcc()
    const first = fingerprintQl7HevcDecoderConfig({ codec: 'hvc1.1.6.L93.B0', codedWidth: 3840, codedHeight: 2160, description: bytes })
    const second = fingerprintQl7HevcDecoderConfig({ codec: 'hvc1.1.6.L93.B0', codedWidth: 3840, codedHeight: 2160, description: bytes.slice() })
    const changed = bytes.slice(); changed[changed.length - 1] ^= 1
    expect(first).toBe(second)
    expect(fingerprintQl7HevcDecoderConfig({ codec: 'hvc1.1.6.L93.B0', codedWidth: 3840, codedHeight: 2160, description: changed })).not.toBe(first)
  })

  test('packs neutral 4:2:0 frames as I420/I420P10 without image processing', () => {
    const eight = packQl7Planar420Frame({
      y: Uint16Array.from([1, 2, 3, 4]), cb: Uint16Array.from([5]), cr: Uint16Array.from([6]), width: 2, height: 2, bitDepth: 8,
    })
    expect(eight.format).toBe('I420')
    expect(Array.from(new Uint8Array(eight.buffer))).toEqual([1, 2, 3, 4, 5, 6])

    const ten = packQl7Planar420Frame({
      y: Uint16Array.from([1, 512, 1023, 7]), cb: Uint16Array.from([9]), cr: Uint16Array.from([11]), width: 2, height: 2, bitDepth: 10,
    })
    expect(ten.format).toBe('I420P10')
    expect(new Uint16Array(ten.buffer)).toEqual(Uint16Array.from([1, 512, 1023, 7, 9, 11]))
  })
})
