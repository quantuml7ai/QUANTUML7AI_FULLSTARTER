import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import UserRecommendationCard from '../../../../../../app/forum/features/feed/components/UserRecommendationCard.jsx'
import {
  createRecommendationUser,
  recommendationT,
} from '../../../../../fixtures/forum/recommendations.js'

describe('UserRecommendationCard', () => {
  it('renders avatar, neon nickname, stars count and vip marker', () => {
    const user = createRecommendationUser(7, {
      canonicalAccountId: 'wallet-7',
      nickname: 'Alexiniani',
      followersCount: 1234,
      isVip: true,
    })

    render(
      React.createElement(UserRecommendationCard, {
        user,
        t: recommendationT,
        onOpenUserPosts: vi.fn(),
      }),
    )

    expect(screen.getByText('Alexiniani')).toBeInTheDocument()
    expect(screen.getByText('1.2K')).toBeInTheDocument()
    expect(screen.getByText('Stars')).toBeInTheDocument()
    expect(screen.queryByText('Followers')).not.toBeInTheDocument()
    expect(screen.getByTestId('mock-avatar')).toBeInTheDocument()
    expect(screen.getByTestId('mock-vip-badge')).toBeInTheDocument()
  })

  it('opens the existing user posts callback with canonical identity', () => {
    const onOpenUserPosts = vi.fn()
    const user = createRecommendationUser(3, {
      canonicalAccountId: '0xfeed-3',
      nickname: 'Creator 3',
    })

    render(
      React.createElement(UserRecommendationCard, {
        user,
        t: recommendationT,
        onOpenUserPosts,
      }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Open user posts' }))

    expect(onOpenUserPosts).toHaveBeenCalledTimes(1)
    expect(onOpenUserPosts).toHaveBeenCalledWith({
      userId: '0xfeed-3',
      nickname: 'Creator 3',
    })
  })

  it('does not render cards for users without nickname, avatar or stars', () => {
    const { container, rerender } = render(
      React.createElement(UserRecommendationCard, {
        user: createRecommendationUser(1, {
          nickname: '',
          avatar: '/avatars/1.png',
          followersCount: 2,
        }),
        t: recommendationT,
        onOpenUserPosts: vi.fn(),
      }),
    )

    expect(container).toBeEmptyDOMElement()

    rerender(
      React.createElement(UserRecommendationCard, {
        user: createRecommendationUser(1, {
          nickname: 'Renderable',
          avatar: '',
          followersCount: 2,
        }),
        t: recommendationT,
        onOpenUserPosts: vi.fn(),
      }),
    )

    expect(container).toBeEmptyDOMElement()

    rerender(
      React.createElement(UserRecommendationCard, {
        user: createRecommendationUser(1, {
          nickname: 'Renderable',
          avatar: '/avatars/1.png',
          followersCount: 0,
        }),
        t: recommendationT,
        onOpenUserPosts: vi.fn(),
      }),
    )

    expect(container).toBeEmptyDOMElement()
  })
})
