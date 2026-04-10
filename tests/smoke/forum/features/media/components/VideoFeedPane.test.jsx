import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
})
