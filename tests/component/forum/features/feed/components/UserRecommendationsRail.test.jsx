import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import UserRecommendationsRail from '../../../../../../app/forum/features/feed/components/UserRecommendationsRail.jsx'
import {
  createRecommendationRailState,
  createRecommendationUsers,
  recommendationT,
} from '../../../../../fixtures/forum/recommendations.js'

describe('UserRecommendationsRail', () => {
  it('renders recommendation cards, desktop arrows and hidden-scrollbar classes', () => {
    const { container } = render(
      React.createElement(UserRecommendationsRail, {
        t: recommendationT,
        railState: createRecommendationRailState(createRecommendationUsers(2)),
        onOpenUserPosts: vi.fn(),
        hideScrollbar: true,
        desktopArrows: true,
      }),
    )

    expect(screen.getByText('Recommended creators')).toBeInTheDocument()
    expect(screen.getByLabelText('Scroll recommendations left')).toBeInTheDocument()
    expect(screen.getByLabelText('Scroll recommendations right')).toBeInTheDocument()
    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(container.querySelectorAll('.forumDividerRail.forumDividerRail--gold')).toHaveLength(2)
    expect(
      container.querySelector('.recommendationsRailScroller--hideScrollbar'),
    ).toBeInTheDocument()
  })

  it('renders loading and empty states predictably', () => {
    const { rerender } = render(
      React.createElement(UserRecommendationsRail, {
        t: recommendationT,
        railState: { users: [], loading: true, empty: false },
        onOpenUserPosts: vi.fn(),
      }),
    )

    expect(screen.getByText('Loading recommendations')).toBeInTheDocument()

    rerender(
      React.createElement(UserRecommendationsRail, {
        t: recommendationT,
        railState: { users: [], loading: false, empty: true },
        onOpenUserPosts: vi.fn(),
      }),
    )

    expect(screen.getByText('Recommendations will appear soon')).toBeInTheDocument()
  })

  it('keeps horizontal arrows functional when the document switches to rtl', async () => {
    const previousDir = document.documentElement.dir
    document.documentElement.dir = 'rtl'

    const { container } = render(
      React.createElement(UserRecommendationsRail, {
        t: recommendationT,
        railState: createRecommendationRailState(createRecommendationUsers(3)),
        onOpenUserPosts: vi.fn(),
        hideScrollbar: true,
        desktopArrows: true,
      }),
    )

    const scroller = container.querySelector('.recommendationsRailScroller')
    expect(scroller).toBeInTheDocument()

    let scrollLeftState = 0
    Object.defineProperty(scroller, 'clientWidth', {
      configurable: true,
      value: 240,
    })
    Object.defineProperty(scroller, 'scrollWidth', {
      configurable: true,
      value: 720,
    })
    Object.defineProperty(scroller, 'scrollLeft', {
      configurable: true,
      get() {
        return scrollLeftState
      },
      set(value) {
        scrollLeftState = Number(value || 0)
      },
    })

    const scrollBy = vi.fn(({ left }) => {
      scrollLeftState += Number(left || 0)
      fireEvent.scroll(scroller)
    })
    scroller.scrollBy = scrollBy

    fireEvent(window, new Event('resize'))

    const rightArrow = screen.getByLabelText('Scroll recommendations right')
    await waitFor(() => {
      expect(rightArrow).not.toBeDisabled()
    })

    fireEvent.click(rightArrow)

    expect(scrollBy).toHaveBeenCalledWith(
      expect.objectContaining({
        behavior: 'smooth',
      }),
    )
    expect(scrollBy.mock.calls[0][0].left).toBeGreaterThan(0)

    document.documentElement.dir = previousDir
  })
})
