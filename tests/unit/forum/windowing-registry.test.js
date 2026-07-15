import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  __resetForumWindowingRegistryForTests,
  registerForumWindowingTarget,
  revealForumWindowedDomId,
  revealForumWindowedKey,
} from '../../../app/forum/shared/utils/forumWindowingRegistry'

afterEach(() => {
  __resetForumWindowingRegistryForTests()
})

describe('forum windowing registry', () => {
  test('reveals dom ids and keys through registered handlers', () => {
    const revealDomId = vi.fn((domId) => domId === 'post_42')
    const revealKey = vi.fn((key) => key === '42')

    registerForumWindowingTarget('list:a', {
      revealDomId,
      revealKey,
    })

    expect(revealForumWindowedDomId('post_42', { holdMs: 1200 })).toBe(true)
    expect(revealDomId).toHaveBeenCalledWith('post_42', { holdMs: 1200 })

    expect(revealForumWindowedKey('42', { windowSize: 9 })).toBe(true)
    expect(revealKey).toHaveBeenCalledWith('42', { windowSize: 9 })
  })

  test('uses newest registrations first and supports unregister', () => {
    const hits = []
    const unregisterOld = registerForumWindowingTarget('list:old', {
      revealDomId: (domId) => {
        hits.push(`old:${domId}`)
        return false
      },
    })
    registerForumWindowingTarget('list:new', {
      revealDomId: (domId) => {
        hits.push(`new:${domId}`)
        return true
      },
    })

    expect(revealForumWindowedDomId('topic_7')).toBe(true)
    expect(hits).toEqual(['new:topic_7', 'old:topic_7'])

    unregisterOld()
    hits.length = 0

    expect(revealForumWindowedDomId('topic_7')).toBe(true)
    expect(hits).toEqual(['new:topic_7'])
  })
})
