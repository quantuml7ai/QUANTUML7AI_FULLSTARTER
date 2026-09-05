import { Buffer } from 'node:buffer'
import { describe, expect, test } from 'vitest'
import {
  parseQl7HevcSpsMaxNumReorderPics,
  Ql7HevcPresentationScheduler,
  QL7_HEVC_PRESENTATION_REORDER_ID,
} from '../../lib/ql7HevcPresentationReorder'

const SHIFT_SPS = Uint8Array.from(Buffer.from('QgEBAUAAAAMAAAMAAAMAAAMAeKACIIAeBy+WZ0pCEZG/UMBagICAggAAAwACAAADADzAC7yiAAHyCwAAFuNgIA==', 'base64'))
const IPHONE_MOV_SPS = Uint8Array.from(Buffer.from('QgECIWAAAAMAsAAAAwAAAwCZAACgAeAgAhxYgV7kWVTUBAQEAg==', 'base64'))

function replay({ timestamps, frameBatches, duration }) {
  const scheduler = new Ql7HevcPresentationScheduler(2)
  const output = []
  for (let index = 0; index < timestamps.length; index += 1) {
    scheduler.pushPacket({ timestamp: timestamps[index], duration })
    output.push(...scheduler.pushFrames((frameBatches[index] || []).map((poc) => ({ poc, buffer: new ArrayBuffer(0) }))))
  }
  output.push(...scheduler.finish())
  return output
}

describe('QL7 HEVC presentation reorder V13', () => {
  test('parses the exact max B-frame reorder depth from both production control SPS values', () => {
    expect(QL7_HEVC_PRESENTATION_REORDER_ID).toBe('ql7-hevc-poc-pts-reorder-v13')
    expect(parseQl7HevcSpsMaxNumReorderPics(SHIFT_SPS)).toBe(2)
    expect(parseQl7HevcSpsMaxNumReorderPics(IPHONE_MOV_SPS)).toBe(2)
  })

  test('reorders the observed 30fps HEVC drain trace by POC and pairs it with sorted presentation timestamps', () => {
    const timestamps = [0, 0.133333, 0.066667, 0.033333, 0.1, 0.266667, 0.2, 0.166667, 0.233333, 0.4, 0.333333, 0.3, 0.366667]
    const frameBatches = [[], [], [0], [1], [2], [3, 4, 8], [], [], [5, 6, 7], [12], [], [], [9, 10, 11]]
    const output = replay({ timestamps, frameBatches, duration: 1 / 30 })
    expect(output.map((entry) => entry.frame.poc)).toEqual(Array.from({ length: 13 }, (_, index) => index))
    expect(output.map((entry) => entry.timing.timestamp)).toEqual([...timestamps].sort((left, right) => left - right))
  })

  test('reorders the observed ~60fps iPhone MOV drain trace without letting an early future POC escape', () => {
    const timestamps = [0, 0.066667, 0.033333, 0.016667, 0.05, 0.133333, 0.1, 0.083333, 0.116667, 0.2, 0.166667, 0.15, 0.183333]
    const frameBatches = [[], [], [0], [1], [2, 3, 4], [8], [], [], [5, 6, 7], [12], [], [], [9, 10, 11]]
    const output = replay({ timestamps, frameBatches, duration: 1 / 60 })
    expect(output.map((entry) => entry.frame.poc)).toEqual(Array.from({ length: 13 }, (_, index) => index))
    const presentationTimestamps = output.map((entry) => entry.timing.timestamp)
    expect(presentationTimestamps).toEqual([...timestamps].sort((left, right) => left - right))
    expect(presentationTimestamps.every((value, index) => index === 0 || value > presentationTimestamps[index - 1])).toBe(true)
  })
})
