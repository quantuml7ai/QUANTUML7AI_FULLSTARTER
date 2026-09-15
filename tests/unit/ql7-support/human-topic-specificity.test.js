import { describe, expect, it } from 'vitest'
import { classifyQl7SupportHumanTopic } from '../../../lib/ql7-support/knowledge/humanTopicOntology.js'

describe('canonical human-topic specificity hierarchy', () => {
  it('lets distinctive MMA/UFC evidence outrank the broader boxing sibling without breaking boxing-only traffic', () => {
    for (const text of ['боксс и ufcc', 'бокс и ufc', 'boxing and ufc', 'мма и бокс']) {
      const result = classifyQl7SupportHumanTopic(text, { locale: /[а-я]/iu.test(text) ? 'ru' : 'en' })
      expect(result?.category).toBe('mma_ufc')
      expect(result?.hierarchyApplied).toBe(true)
      expect(result?.hierarchyReasons.some((row) => row.startsWith('dominates:boxing'))).toBe(true)
    }
    expect(classifyQl7SupportHumanTopic('боксс', { locale: 'ru' })?.category).toBe('boxing')
    expect(classifyQl7SupportHumanTopic('boxing', { locale: 'en' })?.category).toBe('boxing')
    expect(classifyQl7SupportHumanTopic('ufcc', { locale: 'ru' })?.category).toBe('mma_ufc')
  })

  it('rolls multiple science subdomain signals up to science while preserving single-subdomain precision', () => {
    const noisy = classifyQl7SupportHumanTopic('астраномия и космас', { locale: 'ru' })
    expect(noisy?.category).toBe('science')
    expect(noisy?.hierarchyApplied).toBe(true)
    expect(noisy?.rollupChildren).toEqual(expect.arrayContaining(['astronomy', 'spaceflight']))

    const cross = classifyQl7SupportHumanTopic('physics and chemistry', { locale: 'en' })
    expect(cross?.category).toBe('science')
    expect(cross?.rollupChildren).toEqual(expect.arrayContaining(['physics', 'chemistry']))

    expect(classifyQl7SupportHumanTopic('астрономия', { locale: 'ru' })?.category).toBe('astronomy')
    expect(classifyQl7SupportHumanTopic('космос', { locale: 'ru' })?.category).toBe('spaceflight')
    expect(classifyQl7SupportHumanTopic('physics', { locale: 'en' })?.category).toBe('physics')
    expect(classifyQl7SupportHumanTopic('science', { locale: 'en' })?.category).toBe('science')
  })

  it('keeps the complete historical noisy-routing row green and preserves unrelated categories', () => {
    expect(classifyQl7SupportHumanTopic('мотациклы для города', { locale: 'ru' })?.category).toBe('motorcycles')
    expect(classifyQl7SupportHumanTopic('диснейлэнд калифорния', { locale: 'ru' })?.category).toBe('theme_parks')
    expect(classifyQl7SupportHumanTopic('футблл кто лутший', { locale: 'ru' })?.category).toBe('football')
    expect(classifyQl7SupportHumanTopic('боксс и ufcc', { locale: 'ru' })?.category).toBe('mma_ufc')
    expect(classifyQl7SupportHumanTopic('астраномия и космас', { locale: 'ru' })?.category).toBe('science')
    expect(classifyQl7SupportHumanTopic('город в италии', { locale: 'ru' })?.category).toBe('geography')
  })
})
