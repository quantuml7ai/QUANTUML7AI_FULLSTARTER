import { describe, expect, it } from 'vitest'
import { formatCount } from '../../../../../app/forum/shared/utils/counts.js'

describe('formatCount', () => {
  it('formats thousands and millions in compact forum style', () => {
    expect(formatCount(999)).toBe('999')
    expect(formatCount(1200)).toBe('1.2K')
    expect(formatCount(14800)).toBe('15K')
    expect(formatCount(2300000)).toBe('2.3M')
  })

  it('returns 0 for invalid values', () => {
    expect(formatCount('bad-value')).toBe('0')
  })
})
