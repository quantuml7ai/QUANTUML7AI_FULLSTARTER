import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import useThreadPostsModel from '../../../../../../app/forum/features/feed/hooks/useThreadPostsModel.js'

function makePost(id, parentId = null, extra = {}) {
  return { id, postId: id, topicId: 'topic-1', parentId, ts: 1, likes: 0, views: 0, ...extra }
}

describe('useThreadPostsModel canonical branch target-head contract', () => {
  it('shows the clicked root and only its direct replies', () => {
    const posts = [
      makePost('root', null, { ts: 10 }),
      makePost('a', 'root', { ts: 20 }),
      makePost('b', 'root', { ts: 15 }),
      makePost('a1', 'a', { ts: 30 }),
      makePost('a2', 'a', { ts: 25 }),
      makePost('a1x', 'a1', { ts: 40 }),
    ]
    const { result } = renderHook(() => useThreadPostsModel({
      selectedTopicId: 'topic-1', posts,
      threadRoot: { ...posts[0], __threadCanonicalRootId: 'root', __threadTargetPostId: 'root' },
      postSort: 'new', visibleThreadPostsCount: 20,
    }))
    expect(result.current.flat.map((post) => [post.id, post._lvl])).toEqual([
      ['root', 0], ['a', 1], ['b', 1],
    ])
  })

  it('promotes a nested clicked reply to visual head and exposes only its direct replies', () => {
    const posts = [
      makePost('root', null, { ts: 10 }),
      makePost('a', 'root', { ts: 20, likes: 1 }),
      makePost('a1', 'a', { ts: 30, likes: 2 }),
      makePost('a2', 'a', { ts: 25, likes: 9 }),
      makePost('a1x', 'a1', { ts: 40, likes: 5 }),
    ]
    const target = { ...posts[1], rootPostId: 'root', __threadCanonicalRootId: 'root', __threadTargetPostId: 'a' }
    const { result } = renderHook(() => useThreadPostsModel({
      selectedTopicId: 'topic-1', posts, threadRoot: target, postSort: 'likes', visibleThreadPostsCount: 20,
    }))
    expect(result.current.flat.map((post) => [post.id, post._lvl])).toEqual([
      ['a', 0], ['a2', 1], ['a1', 1],
    ])
  })

  it('promotes an arbitrarily deep target without leaking ancestors, siblings, or grandchildren', () => {
    const posts = [
      makePost('root'),
      makePost('a', 'root'),
      makePost('a1', 'a'),
      makePost('a1x', 'a1'),
      makePost('a1x1', 'a1x'),
      makePost('a1x2', 'a1x'),
      makePost('a1x1z', 'a1x1'),
      makePost('other', 'root'),
    ]
    const target = { ...posts[3], rootPostId: 'root', __threadCanonicalRootId: 'root', __threadTargetPostId: 'a1x' }
    const { result } = renderHook(() => useThreadPostsModel({
      selectedTopicId: 'topic-1', posts, threadRoot: target, postSort: 'new', visibleThreadPostsCount: 20,
    }))
    expect(result.current.flat.map((post) => [post.id, post._lvl])).toEqual([
      ['a1x', 0], ['a1x1', 1], ['a1x2', 1],
    ])
  })

  it('preserves replies sorting and server-ranked random ordering for the direct sibling set', () => {
    const base = makePost('root', null, { ts: 10 })
    const byReplies = [
      base,
      makePost('r1', 'root', { ts: 20, replyCount: 1, __ql7PostCountersCoreHydrated: true }),
      makePost('r2', 'root', { ts: 15, replyCount: 8, __ql7PostCountersCoreHydrated: true }),
      makePost('grandchild', 'r2', { ts: 999, replyCount: 99 }),
    ]
    const repliesResult = renderHook(() => useThreadPostsModel({
      selectedTopicId: 'topic-1', posts: byReplies, threadRoot: base,
      postSort: 'replies', visibleThreadPostsCount: 20,
    })).result
    expect(repliesResult.current.flat.map((post) => post.id)).toEqual(['root', 'r2', 'r1'])

    const byRank = [
      base,
      makePost('rank-late', 'root', { ts: 999, __ql7ServerFeedRank: 7 }),
      makePost('rank-first', 'root', { ts: 1, __ql7ServerFeedRank: 1 }),
      makePost('rank-grandchild', 'rank-first', { ts: 1000, __ql7ServerFeedRank: 0 }),
    ]
    const randomResult = renderHook(() => useThreadPostsModel({
      selectedTopicId: 'topic-1', posts: byRank, threadRoot: base,
      postSort: 'random', visibleThreadPostsCount: 20,
    })).result
    expect(randomResult.current.flat.map((post) => post.id)).toEqual(['root', 'rank-first', 'rank-late'])
  })
})
