import { describe, expect, test } from 'vitest'
import {
  FORUM_TRANSIENT_PROJECTION_ONLY_FIELD,
  FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD,
} from '../../../app/forum/features/feed/utils/postMerge.js'
import {
  mergeForumCanonicalProjection,
  mergeForumTransientProjection,
  releaseForumTransientProjection,
} from '../../../app/forum/features/feed/utils/transientProjectionRetention.js'

describe('forum transient projection retention', () => {
  test('releases projection-only entities when their final owner closes', () => {
    const owner = 'forum:thread:t1:p1'
    const merged = mergeForumTransientProjection([], [
      { id: 'p1', topicId: 't1', text: 'reply' },
      { id: 'p2', topicId: 't1', text: 'reply 2' },
    ], { owner, reset: true })

    expect(merged).toHaveLength(2)
    expect(merged[0][FORUM_TRANSIENT_PROJECTION_ONLY_FIELD]).toBe(true)
    expect(merged[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual([owner])
    expect(releaseForumTransientProjection(merged, owner)).toEqual([])
  })

  test('never releases a canonical entity merely because a transient surface also hydrated it', () => {
    const canonical = [{ id: 'p1', topicId: 't1', text: 'home', __ql7ServerFeedSurface: 'home' }]
    const withThread = mergeForumTransientProjection(canonical, [
      { id: 'p1', topicId: 't1', text: 'thread details', parentId: 'root' },
    ], { owner: 'forum:thread:t1:p1' })

    expect(withThread).toHaveLength(1)
    expect(withThread[0].text).toBe('thread details')
    expect(withThread[0][FORUM_TRANSIENT_PROJECTION_ONLY_FIELD]).toBeUndefined()
    expect(withThread[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual(['forum:thread:t1:p1'])
    const released = releaseForumTransientProjection(withThread, 'forum:thread:t1:p1')
    expect(released).toHaveLength(1)
    expect(released[0].id).toBe('p1')
    expect(released[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toBeUndefined()
  })

  test('keeps a shared transient entity until every owner releases it', () => {
    const ownerA = 'forum:search:qcoin'
    const ownerB = 'forum:thread:t1:p1'
    let items = mergeForumTransientProjection([], [
      { id: 'p1', topicId: 't1', text: 'shared' },
    ], { owner: ownerA })
    items = mergeForumTransientProjection(items, [
      { id: 'p1', topicId: 't1', text: 'shared hydrated' },
    ], { owner: ownerB })

    const afterA = releaseForumTransientProjection(items, ownerA)
    expect(afterA).toHaveLength(1)
    expect(afterA[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual([ownerB])
    expect(releaseForumTransientProjection(afterA, ownerB)).toEqual([])
  })

  test('promotes a transient entity when the canonical feed later contains the same id', () => {
    const owner = 'forum:media-feed'
    const transient = mergeForumTransientProjection([], [
      { id: 'p1', topicId: 't1', text: 'media result' },
    ], { owner })

    const canonical = mergeForumCanonicalProjection(transient, [
      { id: 'p1', topicId: 't1', text: 'home result', __ql7ServerFeedSurface: 'home' },
    ])

    expect(canonical).toHaveLength(1)
    expect(canonical[0].text).toBe('home result')
    expect(canonical[0][FORUM_TRANSIENT_PROJECTION_ONLY_FIELD]).toBeUndefined()
    expect(canonical[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual([owner])
    const released = releaseForumTransientProjection(canonical, owner)
    expect(released).toHaveLength(1)
    expect(released[0].text).toBe('home result')
    expect(released[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toBeUndefined()
  })

  test('keeps canonical rows owner-scoped while a transient surface is active, then cleans only metadata', () => {
    const canonical = [{ id: 'p1', topicId: 't1', text: 'home', __ql7ServerFeedSurface: 'home' }]
    let items = mergeForumTransientProjection(canonical, [
      { id: 'p1', topicId: 't1', text: 'thread copy' },
    ], { owner: 'forum:thread:t1:p1' })
    items = mergeForumTransientProjection(items, [
      { id: 'p1', topicId: 't1', text: 'search copy' },
    ], { owner: 'forum:search:x' })

    expect(items[0][FORUM_TRANSIENT_PROJECTION_ONLY_FIELD]).toBeUndefined()
    expect(items[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual([
      'forum:thread:t1:p1',
      'forum:search:x',
    ])

    const afterThread = releaseForumTransientProjection(items, 'forum:thread:t1:p1')
    expect(afterThread).toHaveLength(1)
    expect(afterThread[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual(['forum:search:x'])

    const afterSearch = releaseForumTransientProjection(afterThread, 'forum:search:x')
    expect(afterSearch).toHaveLength(1)
    expect(afterSearch[0][FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toBeUndefined()
  })

  test('keeps repeated projection churn bounded instead of growing the canonical store', () => {
    let items = Array.from({ length: 10 }, (_, index) => ({
      id: `canonical-${index}`,
      text: 'home',
      __ql7ServerFeedSurface: 'home',
    }))

    for (let cycle = 0; cycle < 200; cycle += 1) {
      const owner = `forum:thread:topic-${cycle}:root-${cycle}`
      const rows = Array.from({ length: 40 }, (_, index) => ({
        id: `transient-${cycle}-${index}`,
        topicId: `topic-${cycle}`,
        text: `row ${index}`,
      }))
      items = mergeForumTransientProjection(items, rows, { owner, reset: true })
      expect(items.length).toBeLessThanOrEqual(50)
      items = releaseForumTransientProjection(items, owner)
    }

    expect(items).toHaveLength(10)
    expect(items.some((item) => item[FORUM_TRANSIENT_PROJECTION_ONLY_FIELD] === true)).toBe(false)
    expect(items.some((item) => Array.isArray(item[FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]))).toBe(false)
  })

  test('an empty reset page releases stale rows for that projection owner', () => {
    const owner = 'forum:media-feed'
    const loaded = mergeForumTransientProjection([], [
      { id: 'video-1', topicId: 't1', text: 'video' },
    ], { owner, reset: true })

    const resetEmpty = mergeForumTransientProjection(loaded, [], { owner, reset: true })
    expect(resetEmpty).toEqual([])
  })

  test('reset replaces only the requesting projection and does not evict another owner', () => {
    const ownerA = 'forum:topic-roots:t1'
    const ownerB = 'forum:thread:t1:p1'
    let items = mergeForumTransientProjection([], [
      { id: 'p1', topicId: 't1', text: 'shared' },
      { id: 'p2', topicId: 't1', text: 'topic only' },
    ], { owner: ownerA })
    items = mergeForumTransientProjection(items, [
      { id: 'p1', topicId: 't1', text: 'thread shared' },
    ], { owner: ownerB })

    const reset = mergeForumTransientProjection(items, [
      { id: 'p3', topicId: 't1', text: 'new topic page' },
    ], { owner: ownerA, reset: true })

    expect(reset.map((item) => item.id).sort()).toEqual(['p1', 'p3'])
    expect(reset.find((item) => item.id === 'p1')[FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual([ownerB])
    expect(reset.find((item) => item.id === 'p3')[FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD]).toEqual([ownerA])
  })
})
