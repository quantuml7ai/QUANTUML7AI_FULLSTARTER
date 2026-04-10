import { describe, expect, it } from 'vitest'
import interleaveRecommendationRails from '../../../../../../app/forum/features/feed/utils/interleaveRecommendationRails.js'

function itemSlot(id) {
  return {
    type: 'item',
    key: `item:${id}`,
    item: { id },
  }
}

function adSlot(id) {
  return {
    type: 'ad',
    key: `ad:${id}`,
  }
}

describe('interleaveRecommendationRails', () => {
  it('inserts recommendation rails after every configured number of content items', () => {
    const slots = [itemSlot('1'), itemSlot('2'), itemSlot('3'), itemSlot('4')]

    const result = interleaveRecommendationRails(slots, 2)

    expect(result.map((slot) => slot.type)).toEqual([
      'item',
      'item',
      'recommendation_rail',
      'item',
      'item',
      'recommendation_rail',
    ])
    expect(result[2]).toMatchObject({
      type: 'recommendation_rail',
      afterItemCount: 2,
      railIndex: 0,
    })
  })

  it('never inserts a rail at the top or immediately next to an ad slot', () => {
    const slots = [
      itemSlot('1'),
      itemSlot('2'),
      adSlot('video-1'),
      itemSlot('3'),
      itemSlot('4'),
    ]

    const result = interleaveRecommendationRails(slots, 2)
    const recommendationIndex = result.findIndex((slot) => slot.type === 'recommendation_rail')

    expect(recommendationIndex).toBeGreaterThan(0)
    expect(result[0].type).not.toBe('recommendation_rail')
    expect(result[recommendationIndex - 1].type).not.toBe('ad')
    expect(result[recommendationIndex + 1].type).not.toBe('ad')
  })

  it('does not create consecutive recommendation rails when insertion is deferred', () => {
    const slots = [
      itemSlot('1'),
      itemSlot('2'),
      adSlot('video-1'),
      itemSlot('3'),
      itemSlot('4'),
      itemSlot('5'),
      itemSlot('6'),
    ]

    const result = interleaveRecommendationRails(slots, 2)
    const types = result.map((slot) => slot.type)

    expect(types.join('|')).not.toContain('recommendation_rail|recommendation_rail')
  })
})
