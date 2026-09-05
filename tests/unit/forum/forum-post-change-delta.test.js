import { describe, expect, it } from 'vitest'
import { applyForumEvents, applyForumFullSnapshot } from '../../../app/forum/features/feed/utils/snapshotTransforms'

describe('forum authoritative post mutation delta', () => {
  it('applies post_edit without reordering the snapshot', () => {
    const prev = {
      topics: [],
      posts: [
        { id: '10', text: 'old-10' },
        { id: '20', text: 'old-20' },
      ],
    }
    const next = applyForumEvents(prev, [
      { kind: 'post_edit', id: '20', rev: 11, data: { text: 'new-20' } },
    ], { topics: {}, posts: {} }, { reactions: {}, views: { topics: {}, posts: {} } })

    expect(next.posts.map((post) => post.id)).toEqual(['10', '20'])
    expect(next.posts.find((post) => post.id === '20')).toMatchObject({ text: 'new-20', textSnippet: 'new-20' })
  })

  it('removes the complete authoritative deleted branch without deleting unrelated posts', () => {
    const prev = {
      topics: [],
      posts: [
        { id: 'root', text: 'root' },
        { id: 'reply', parentId: 'root', text: 'reply' },
        { id: 'keep', text: 'keep' },
      ],
    }
    const next = applyForumEvents(prev, [
      { kind: 'post_deleted', id: 'root', rev: 12, deletedPostIds: ['root', 'reply'] },
    ], { topics: {}, posts: {} }, { reactions: {}, views: { topics: {}, posts: {} } })

    expect(next.posts.map((post) => post.id)).toEqual(['keep'])
  })

  it('full authoritative snapshot heal removes a stale deleted branch from a contaminated pre-patch client', () => {
    const prev = {
      topics: [{ id: 't1', title: 'Topic' }],
      posts: [
        { id: 'deleted-root', topicId: 't1', text: 'stale root', __threadBranchRoot: true },
        { id: 'live', topicId: 't1', text: 'live post' },
      ],
      rev: Date.now(),
    }
    const healed = applyForumFullSnapshot(prev, {
      topics: [{ id: 't1', title: 'Topic' }],
      posts: [{ id: 'live', topicId: 't1', text: 'live post' }],
      rev: 44,
    }, { topics: {}, posts: {} })
    expect(healed.rev).toBe(44)
    expect(healed.posts.map((post) => post.id)).toEqual(['live'])
  })

})
