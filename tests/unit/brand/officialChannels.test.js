import { describe, expect, test } from 'vitest'
import {
  OFFICIAL_QUANTUM_L7_CHANNELS,
  OFFICIAL_QUANTUM_L7_CHANNELS_BY_ID,
  OFFICIAL_QUANTUM_L7_SAME_AS,
  getOfficialQuantumL7Channel,
} from '../../../lib/brand/officialChannels.js'

const URLS = [
  'https://www.quantuml7ai.com/',
  'https://x.com/QL7Company',
  'https://www.instagram.com/quantuml7ai/',
  'https://www.tiktok.com/@ql7ai',
  'https://www.youtube.com/channel/UCXby6llW_TokAUGoOebFXhg',
  'https://t.me/l7universe',
  'https://t.me/l7ai_bot',
]

describe('official Quantum L7 AI channels', () => {
  test('is an exact immutable seven-channel registry', () => {
    expect(Object.isFrozen(OFFICIAL_QUANTUM_L7_CHANNELS)).toBe(true)
    expect(OFFICIAL_QUANTUM_L7_CHANNELS).toHaveLength(7)
    expect(OFFICIAL_QUANTUM_L7_CHANNELS.map((entry) => entry.url)).toEqual(URLS)
    OFFICIAL_QUANTUM_L7_CHANNELS.forEach((entry) => {
      expect(Object.isFrozen(entry)).toBe(true)
      const parsed = new URL(entry.url)
      expect(parsed.protocol).toBe('https:')
      expect(entry.url).toBe(entry.url.trim())
      expect(getOfficialQuantumL7Channel(entry.id)).toBe(entry)
      expect(OFFICIAL_QUANTUM_L7_CHANNELS_BY_ID[entry.id]).toBe(entry)
    })
  })

  test('uses website through Organization.url and excludes service bot from sameAs', () => {
    expect(OFFICIAL_QUANTUM_L7_SAME_AS).toEqual(URLS.slice(1, 6))
    expect(OFFICIAL_QUANTUM_L7_SAME_AS).not.toContain(URLS[0])
    expect(OFFICIAL_QUANTUM_L7_SAME_AS).not.toContain(URLS[6])
  })
})
