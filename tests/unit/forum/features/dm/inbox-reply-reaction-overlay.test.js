import { describe, expect, it } from 'vitest'
import { patchInboxReplyReactionOverlay } from '../../../../../app/forum/features/dm/utils/inboxReplyReactionOverlay.js'

describe('Inbox replies optimistic reaction overlay', () => {
  it('updates active reaction and authoritative-looking counters immediately', () => {
    const start = [{
      id: 'reply-1',
      myReaction: null,
      likes: 4,
      dislikes: 1,
      reactions: 5,
      reactionCount: 5,
      counters: { likes: 4, dislikes: 1, reactions: 5 },
      __ql7InboxCountersReadFallback: true,
    }]

    const liked = patchInboxReplyReactionOverlay(start, {
      postId: 'reply-1',
      state: 'like',
      likes: 5,
      dislikes: 1,
    })

    expect(liked).not.toBe(start)
    expect(liked[0]).toMatchObject({
      myReaction: 'like',
      likes: 5,
      dislikes: 1,
      reactions: 6,
      reactionCount: 6,
      counters: { likes: 5, dislikes: 1, reactions: 6 },
    })

    const disliked = patchInboxReplyReactionOverlay(liked, {
      postId: 'reply-1',
      state: 'dislike',
      likes: 4,
      dislikes: 2,
    })

    expect(disliked[0]).toMatchObject({
      myReaction: 'dislike',
      likes: 4,
      dislikes: 2,
      reactions: 6,
      reactionCount: 6,
      counters: { likes: 4, dislikes: 2, reactions: 6 },
    })
  })

  it('keeps unrelated server rows referentially stable', () => {
    const start = [{ id: 'reply-2', likes: 2, dislikes: 0 }]
    const next = patchInboxReplyReactionOverlay(start, {
      postId: 'reply-1',
      state: 'like',
      likes: 1,
      dislikes: 0,
    })
    expect(next).toBe(start)
  })
})
