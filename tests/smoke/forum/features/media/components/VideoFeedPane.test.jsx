import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LoadMoreSentinel from '../../../../../../app/forum/features/feed/components/LoadMoreSentinel.jsx'
import UserRecommendationsRail from '../../../../../../app/forum/features/feed/components/UserRecommendationsRail.jsx'
import {
  createRecommendationRailState,
  createRecommendationUser,
  recommendationT,
} from '../../../../../fixtures/forum/recommendations.js'

function FeedShell({
  slots,
  railState,
  onOpenUserPosts,
}) {
  return React.createElement(
    'div',
    { 'data-testid': 'feed-shell' },
    ...slots.map((slot) => {
      if (slot.type === 'item') {
        return React.createElement(
          'div',
          { key: slot.key, 'data-testid': `post-${slot.item.id}` },
          slot.item.text,
        )
      }

      if (slot.type === 'ad') {
        return React.createElement(
          'div',
          { key: slot.key, 'data-testid': `ad-${slot.key}` },
          'ad',
        )
      }

      if (slot.type === 'recommendation_rail') {
        return React.createElement(UserRecommendationsRail, {
          key: slot.key,
          t: recommendationT,
          railState,
          onOpenUserPosts,
          hideScrollbar: true,
          desktopArrows: true,
        })
      }

      return null
    }),
  )
}

describe('Video feed smoke shell', () => {
  it('renders post, recommendation and ad slots together and keeps recommendation action live', () => {
    const onOpenUserPosts = vi.fn()
    const railState = createRecommendationRailState([
      createRecommendationUser(1, {
        canonicalAccountId: 'creator-1',
        nickname: 'Creator 1',
        avatar: '/avatars/creator-1.png',
        followersCount: 11,
      }),
    ])

    render(
      React.createElement(FeedShell, {
        slots: [
          { type: 'item', key: 'item:1', item: { id: '1', text: 'Post 1' } },
          { type: 'recommendation_rail', key: 'rec:1', railIndex: 0 },
          { type: 'ad', key: 'ad:1', nearId: '1' },
        ],
        railState,
        onOpenUserPosts,
      }),
    )

    expect(screen.getByTestId('feed-shell')).toBeInTheDocument()
    expect(screen.getByTestId('post-1')).toBeInTheDocument()
    expect(screen.getByText('Recommended creators')).toBeInTheDocument()
    expect(screen.getByTestId('ad-ad:1')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open user posts' }))

    expect(onOpenUserPosts).toHaveBeenCalledWith({
      userId: 'creator-1',
      nickname: 'Creator 1',
    })
  })

  it('requests a cursor page once per sentinel load token and rearms only after progress', () => {
    const originalIntersectionObserver = window.IntersectionObserver
    const originalRaf = window.requestAnimationFrame
    const originalCancelRaf = window.cancelAnimationFrame
    const observers = []
    let rafId = 0
    const rafQueue = new Map()

    class MockIntersectionObserver {
      constructor(callback) {
        this.callback = callback
        observers.push(this)
      }

      observe = vi.fn()
      disconnect = vi.fn()
    }

    window.IntersectionObserver = MockIntersectionObserver
    window.requestAnimationFrame = (callback) => {
      const id = ++rafId
      rafQueue.set(id, callback)
      return id
    }
    window.cancelAnimationFrame = (id) => {
      rafQueue.delete(id)
    }

    const flushRaf = () => {
      const callbacks = [...rafQueue.values()]
      rafQueue.clear()
      callbacks.forEach((callback) => callback())
    }

    try {
      const onVisible = vi.fn()
      const { rerender, unmount } = render(
        React.createElement(LoadMoreSentinel, {
          onVisible,
          loadKey: 'video:0:20:1',
          pending: false,
          hasMore: true,
        }),
      )

      expect(observers).toHaveLength(1)

      observers[0].callback([{ isIntersecting: true }])
      flushRaf()
      expect(onVisible).toHaveBeenCalledTimes(1)

      observers[0].callback([{ isIntersecting: true }])
      flushRaf()
      expect(onVisible).toHaveBeenCalledTimes(1)

      rerender(
        React.createElement(LoadMoreSentinel, {
          onVisible,
          loadKey: 'video:20:40:1',
          pending: false,
          hasMore: true,
        }),
      )
      flushRaf()
      expect(onVisible).toHaveBeenCalledTimes(2)

      observers[0].callback([{ isIntersecting: false }])
      flushRaf()
      expect(onVisible).toHaveBeenCalledTimes(2)

      unmount()
    } finally {
      window.IntersectionObserver = originalIntersectionObserver
      window.requestAnimationFrame = originalRaf
      window.cancelAnimationFrame = originalCancelRaf
    }
  })
})
