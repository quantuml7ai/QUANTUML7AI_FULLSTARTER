import { describe, expect, it, vi } from 'vitest'
import {
  arePostCardBridgePropsEqual,
  areTopicItemPropsEqual,
  readAggSig,
  readPostRenderSig,
  readTopicSig,
} from '../../../../../../app/forum/features/feed/utils/cardMemo.js'

const noop = () => {}
const translate = (key) => key

function createPostCardProps(overrides = {}) {
  return {
    p: {
      id: 'post-1',
      topicId: 'topic-1',
      userId: 'author-1',
      nickname: 'Author 1',
      text: 'Memo text',
      likes: 4,
      views: 9,
      ts: 1700000000,
    },
    parentAuthor: 'Parent',
    parentText: 'Parent text',
    parentPost: { id: 'parent-1', topicId: 'topic-1', ts: 1699999999 },
    onReport: noop,
    onShare: noop,
    onOpenThread: noop,
    threadOpenOptions: null,
    onReact: noop,
    isAdmin: false,
    onDeletePost: noop,
    onOwnerDelete: noop,
    onBanUser: noop,
    onUnbanUser: noop,
    isBanned: false,
    authId: 'viewer-1',
    markView: noop,
    t: translate,
    isVideoFeed: false,
    isSelfAuthor: false,
    isStarredAuthor: false,
    onToggleStar: noop,
    onUserInfoToggle: noop,
    richRenderer: noop,
    enableVideoControlsOnTap: noop,
    rearmPooledFxNode: noop,
    VideoMediaComponent: noop,
    QCastPlayerComponent: noop,
    ...overrides,
  }
}

function createTopicItemProps(overrides = {}) {
  return {
    t: {
      id: 'topic-1',
      userId: 'author-1',
      nickname: 'Author 1',
      icon: '/avatar.png',
      title: 'Topic title',
      description: 'Topic description',
      ts: 1700000000,
    },
    agg: {
      posts: 3,
      likes: 10,
      dislikes: 1,
      views: 25,
    },
    onOpen: noop,
    onView: noop,
    isAdmin: false,
    onDelete: noop,
    authId: 'viewer-1',
    onOwnerDelete: noop,
    isSelfAuthor: false,
    isStarredAuthor: true,
    onToggleStar: noop,
    onUserInfoToggle: noop,
    formatCount: String,
    dataProfileBranchStart: undefined,
    ...overrides,
  }
}

describe('card memo comparators', () => {
  it('keeps PostCard bridge asleep when effective render props stay the same', () => {
    const prevProps = createPostCardProps()
    const nextProps = createPostCardProps()

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(true)
  })

  it('wakes PostCard bridge on meaningful post changes', () => {
    const prevProps = createPostCardProps()
    const nextProps = createPostCardProps({
      p: {
        ...prevProps.p,
        likes: 5,
      },
    })

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('keeps TopicItem asleep when only parent noise changes', () => {
    const prevProps = createTopicItemProps()
    const nextProps = createTopicItemProps()

    expect(areTopicItemPropsEqual(prevProps, nextProps)).toBe(true)
  })

  it('wakes TopicItem when aggregate counters change', () => {
    const prevProps = createTopicItemProps()
    const nextProps = createTopicItemProps({
      agg: {
        ...prevProps.agg,
        likes: 11,
      },
    })

    expect(areTopicItemPropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('wakes TopicItem when star-state changes for the same topic', () => {
    const prevProps = createTopicItemProps()
    const nextProps = createTopicItemProps({
      isStarredAuthor: false,
    })

    expect(areTopicItemPropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('wakes PostCard bridge when thread open options change', () => {
    const prevProps = createPostCardProps({
      threadOpenOptions: null,
    })
    const nextProps = createPostCardProps({
      threadOpenOptions: { closeInbox: true },
    })

    expect(arePostCardBridgePropsEqual(prevProps, nextProps)).toBe(false)
  })

  it('keeps post render signatures stable for equivalent payloads and reacts to real content changes', () => {
    const base = {
      id: 'post-1',
      userId: 'author-1',
      nickname: 'Author',
      text: 'Hello',
      likes: 3,
      attachments: [{ url: '/a.png', type: 'image' }],
    }

    expect(readPostRenderSig(base)).toBe(readPostRenderSig({ ...base }))
    expect(readPostRenderSig(base)).not.toBe(readPostRenderSig({ ...base, likes: 4 }))
    expect(readPostRenderSig(base)).not.toBe(
      readPostRenderSig({ ...base, attachments: [{ url: '/b.png', type: 'image' }] }),
    )
  })

  it('keeps topic signatures stable for equivalent payloads and reacts to visible topic changes', () => {
    const baseTopic = {
      id: 'topic-1',
      userId: 'author-1',
      nickname: 'Author',
      title: 'Alpha',
      description: 'Desc',
      ts: 1710000000000,
    }

    expect(readTopicSig(baseTopic)).toBe(readTopicSig({ ...baseTopic }))
    expect(readTopicSig(baseTopic)).not.toBe(readTopicSig({ ...baseTopic, title: 'Beta' }))
    expect(readAggSig({ posts: 1, likes: 2, dislikes: 0, views: 3 }))
      .not.toBe(readAggSig({ posts: 1, likes: 2, dislikes: 0, views: 9 }))
  })
})
