import { describe, expect, test } from 'vitest'
import { applyForumEvents, applyForumFullSnapshot } from '../../../app/forum/features/feed/utils/snapshotTransforms.js'

const emptyTombstones = { topics: {}, posts: {} }

describe('forum snapshot transforms', () => {
  test('does not create ghost topics from partial realtime counter events', () => {
    const result = applyForumEvents(
      { topics: [], posts: [] },
      [{ kind: 'topic', id: 'ghost-topic', data: { views: 1, ts: Date.now() } }],
      emptyTombstones,
      {},
    )

    expect(result.topics).toEqual([])
  })

  test('does not create ghost posts from partial realtime reaction events', () => {
    const result = applyForumEvents(
      { topics: [], posts: [] },
      [{ kind: 'post', id: 'ghost-post', data: { likes: 1, dislikes: 0, ts: Date.now() } }],
      emptyTombstones,
      {},
    )

    expect(result.posts).toEqual([])
  })

  test('keeps full topic/post events and later patches counters', () => {
    const full = applyForumEvents(
      { topics: [], posts: [] },
      [
        {
          kind: 'topic',
          id: 'topic-1',
          data: { title: 'QCoin', description: 'Forum topic', userId: 'alice', name: 'Alice', avatar: '/a.png', ts: 1 },
        },
        {
          kind: 'post',
          id: 'post-1',
          data: { topicId: 'topic-1', text: 'hello', userId: 'alice', name: 'Alice', avatar: '/a.png', ts: 2 },
        },
      ],
      emptyTombstones,
      {},
    )

    const patched = applyForumEvents(
      full,
      [
        { kind: 'topic', id: 'topic-1', data: { views: 10 } },
        { kind: 'post', id: 'post-1', data: { likes: 3, dislikes: 1 } },
      ],
      emptyTombstones,
      {},
    )

    expect(patched.topics).toMatchObject([{ id: 'topic-1', title: 'QCoin', views: 10 }])
    expect(patched.posts).toMatchObject([{ id: 'post-1', text: 'hello', likes: 3, dislikes: 1 }])
  })

  test('does not let topic view events lower canonical topic counters', () => {
    const patched = applyForumEvents(
      { topics: [{ id: 'topic-1', title: 'QCoin', views: 12000, counters: { views: 12000 }, sort: { views: 12000 } }], posts: [] },
      [{ kind: 'views', topics: { 'topic-1': 1900 } }],
      emptyTombstones,
      {},
    )

    expect(patched.topics[0]).toMatchObject({
      views: 12000,
      counters: { views: 12000 },
      sort: { views: 12000 },
    })
  })

  test('filters malformed persisted snapshot rows before they reach the feed', () => {
    const result = applyForumFullSnapshot(
      { topics: [], posts: [] },
      {
        topics: [
          { id: 'topic-ok', title: 'Valid topic', userId: 'alice', name: 'Alice' },
          { id: 'topic-empty', views: 1, ts: Date.now() },
        ],
        posts: [
          { id: 'post-ok', topicId: 'topic-ok', text: 'Valid post', userId: 'alice', name: 'Alice' },
          { id: 'post-empty', likes: 1, ts: Date.now() },
        ],
      },
      emptyTombstones,
    )

    expect(result.topics.map((item) => item.id)).toEqual(['topic-ok'])
    expect(result.posts.map((item) => item.id)).toEqual(['post-ok'])
  })
})
