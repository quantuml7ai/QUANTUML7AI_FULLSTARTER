'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { cls } from '../../../shared/utils/classnames'
import UserRecommendationCard from './UserRecommendationCard'

const SKELETON_COUNT = 8

const styles = `
  .recommendationsRail {
    --forum-user-rail-height: 328px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: var(--forum-user-rail-height);
    padding: 16px;
    border-radius: 30px;
    border: 1px solid rgba(150, 180, 220, 0.14);
    background:
      radial-gradient(circle at 18% 0%, rgba(94, 163, 255, 0.08), transparent 34%),
      radial-gradient(circle at 82% 0%, rgba(255, 181, 94, 0.06), transparent 38%),
      linear-gradient(180deg, rgba(17, 25, 37, 0.96) 0%, rgba(12, 18, 28, 0.95) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.05),
      inset 0 -1px 0 rgba(118, 147, 187, 0.08),
      0 24px 50px rgba(2, 8, 23, 0.24);
    overflow: hidden;
  }

  .recommendationsRailHeader {
    display: flex;
    direction: ltr;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    min-height: 34px;
  }

  .recommendationsRailHeading {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .recommendationsRailBadge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 42px;
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(144, 177, 220, 0.2);
    background: rgba(43, 58, 86, 0.55);
    color: rgba(197, 224, 255, 0.96);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .recommendationsRailTitle {
    overflow: hidden;
    color: rgba(240, 247, 255, 0.98);
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: start;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .recommendationsRailControls {
    display: flex;
    direction: ltr;
    align-items: center;
    gap: 8px;
    flex: 0 0 auto;
  }

  .recommendationsRailArrow {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid rgba(138, 169, 207, 0.2);
    background: rgba(19, 29, 46, 0.92);
    color: rgba(221, 235, 255, 0.94);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 16px rgba(3, 9, 24, 0.14);
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease,
      opacity 160ms ease;
  }

  .recommendationsRailArrow:hover:not(.isDisabled) {
    transform: translateY(-1px);
    border-color: rgba(160, 203, 255, 0.34);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 12px 22px rgba(19, 34, 61, 0.24);
  }

  .recommendationsRailArrow:disabled,
  .recommendationsRailArrow.isDisabled {
    opacity: 0.42;
    cursor: default;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .recommendationsRailArrow:focus-visible {
    outline: 2px solid rgba(129, 216, 255, 0.72);
    outline-offset: 2px;
  }

  .recommendationsRailArrow svg {
    width: 18px;
    height: 18px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .recommendationsRailBody {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-height: 0;
  }

  .recommendationsRailDivider {
    flex: 0 0 auto;
    margin: 0 4px;
  }

  .recommendationsRailFade {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 2;
    width: 32px;
    pointer-events: none;
  }

  .recommendationsRailFade--left {
    left: 0;
    background: linear-gradient(90deg, rgba(14, 21, 33, 0.98), rgba(14, 21, 33, 0));
  }

  .recommendationsRailFade--right {
    right: 0;
    background: linear-gradient(270deg, rgba(14, 21, 33, 0.98), rgba(14, 21, 33, 0));
  }

  .recommendationsRailScroller {
    display: flex;
    gap: 12px;
    width: 100%;
    padding: 2px 4px 6px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    overscroll-behavior-x: contain;
    scroll-snap-type: x proximity;
  }

  .recommendationsRailScroller:focus-visible {
    outline: none;
  }

  .recommendationsRailScroller--hideScrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .recommendationsRailScroller--hideScrollbar::-webkit-scrollbar {
    display: none;
  }

  .recommendationsRailSrOnly {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .recommendationsSkeletonCard {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: 10px;
    width: 112px;
    min-width: 112px;
    height: 188px;
    padding: 10px;
    border-radius: 22px;
    border: 1px solid rgba(150, 180, 220, 0.14);
    background:
      radial-gradient(circle at 50% 0%, rgba(100, 159, 255, 0.08), rgba(100, 159, 255, 0) 42%),
      linear-gradient(180deg, rgba(16, 24, 36, 0.96), rgba(11, 17, 27, 0.95));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .recommendationsSkeletonAvatar,
  .recommendationsSkeletonLine {
    display: block;
    border-radius: 999px;
    background: linear-gradient(90deg, rgba(38, 52, 79, 0.95), rgba(64, 88, 128, 0.95), rgba(38, 52, 79, 0.95));
    background-size: 220% 100%;
    animation: recommendationsShimmer 1.6s linear infinite;
  }

  .recommendationsSkeletonAvatar {
    width: 74px;
    height: 88px;
    margin: 2px auto 0;
    border-radius: 20px;
  }

  .recommendationsSkeletonLine {
    width: 68%;
    height: 12px;
  }

  .recommendationsSkeletonLine--wide {
    width: 84%;
    margin-top: auto;
  }

  .recommendationsRailEmpty {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 168px;
    color: rgba(161, 181, 209, 0.9);
    font-size: 13px;
    letter-spacing: 0.03em;
  }

  @keyframes recommendationsShimmer {
    from { background-position: 200% 0; }
    to { background-position: -20% 0; }
  }

  @media (max-width: 1023px) {
    .recommendationsRail {
      --forum-user-rail-height: 304px;
      padding: 14px;
      border-radius: 26px;
    }

    .recommendationsRailTitle {
      font-size: 17px;
    }

    .recommendationsSkeletonCard {
      width: 102px;
      min-width: 102px;
      height: 176px;
      padding: 9px;
    }

    .recommendationsSkeletonAvatar {
      width: 70px;
      height: 84px;
    }
  }

  @media (max-width: 639px) {
    .recommendationsRail {
      --forum-user-rail-height: 278px;
      gap: 14px;
      padding: 12px;
      border-radius: 22px;
    }

    .recommendationsRailHeader {
      min-height: 28px;
    }

    .recommendationsRailControls {
      gap: 6px;
    }

    .recommendationsRailBadge {
      min-width: 38px;
      height: 22px;
      padding: 0 9px;
      font-size: 10px;
    }

    .recommendationsRailTitle {
      font-size: 15px;
    }

    .recommendationsRailArrow {
      width: 32px;
      height: 32px;
    }

    .recommendationsRailScroller {
      gap: 10px;
      padding-bottom: 4px;
    }

    .recommendationsRailFade {
      width: 22px;
    }

    .recommendationsSkeletonCard {
      width: 94px;
      min-width: 94px;
      height: 162px;
      padding: 8px;
      border-radius: 20px;
    }

    .recommendationsSkeletonAvatar {
      width: 62px;
      height: 74px;
      border-radius: 18px;
    }
  }
`

function createArrowButton({ className, ariaLabel, onClick, path, disabled }) {
  return React.createElement(
    'button',
    {
      type: 'button',
      className,
      disabled,
      'aria-label': ariaLabel,
      onClick,
    },
    React.createElement(
      'svg',
      { viewBox: '0 0 24 24', 'aria-hidden': 'true' },
      React.createElement('path', { d: path }),
    ),
  )
}

export default function UserRecommendationsRail({
  t,
  railState,
  onOpenUserPosts,
  hideScrollbar = true,
  desktopArrows = true,
}) {
  const scrollerRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [uiDir, setUiDir] = useState('ltr')

  const users = Array.isArray(railState?.users) ? railState.users : []
  const isLoading = !!railState?.loading
  const isEmpty = !!railState?.empty && !users.length

  const updateScrollState = React.useCallback(() => {
    const node = scrollerRef.current
    if (!node) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      return
    }
    const nextCanScrollLeft = Number(node.scrollLeft || 0) > 6
    const nextCanScrollRight =
      Number(node.scrollWidth || 0) > (Number(node.clientWidth || 0) + Number(node.scrollLeft || 0) + 6)
    setCanScrollLeft(nextCanScrollLeft)
    setCanScrollRight(nextCanScrollRight)
  }, [])

  useEffect(() => {
    updateScrollState()
  }, [updateScrollState, users.length, isLoading, isEmpty])

  useEffect(() => {
    const node = scrollerRef.current
    if (!node) return undefined

    const onScroll = () => updateScrollState()
    node.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      node.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [updateScrollState])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    const readDir = () => {
      try {
        const nextDir = document.documentElement?.dir === 'rtl' ||
          getComputedStyle(document.documentElement).direction === 'rtl'
          ? 'rtl'
          : 'ltr'
        setUiDir((prev) => (prev === nextDir ? prev : nextDir))
      } catch {
        setUiDir('ltr')
      }
    }

    readDir()

    let observer = null
    try {
      observer = new MutationObserver(readDir)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['dir'],
      })
    } catch {}

    return () => {
      try { observer?.disconnect?.() } catch {}
    }
  }, [])

  const skeletonKeys = useMemo(
    () => Array.from({ length: SKELETON_COUNT }, (_, idx) => `recommendation_skeleton_${idx}`),
    [],
  )

  const scrollRailBy = (direction) => {
    const node = scrollerRef.current
    if (!node) return
    const step = Math.max(180, Math.round(Number(node.clientWidth || 0) * 0.72))
    node.scrollBy({
      left: step * direction,
      behavior: 'smooth',
    })
  }

  const scrollerChildren = []

  if (isLoading) {
    skeletonKeys.forEach((key) => {
      scrollerChildren.push(
        React.createElement(
          'div',
          { key, className: 'recommendationsSkeletonCard', 'aria-hidden': 'true' },
          React.createElement('span', { className: 'recommendationsSkeletonAvatar' }),
          React.createElement('span', { className: 'recommendationsSkeletonLine recommendationsSkeletonLine--wide' }),
          React.createElement('span', { className: 'recommendationsSkeletonLine' }),
        ),
      )
    })

    scrollerChildren.push(
      React.createElement(
        'span',
        { key: 'loading-label', className: 'recommendationsRailSrOnly' },
        t?.('forum_user_recommendations_loading'),
      ),
    )
  }

  if (!isLoading && !isEmpty) {
    users.forEach((user) => {
      scrollerChildren.push(
        React.createElement(UserRecommendationCard, {
          key: String(user?.canonicalAccountId || user?.userId || ''),
          user,
          t,
          onOpenUserPosts,
        }),
      )
    })
  }

  if (!isLoading && isEmpty) {
    scrollerChildren.push(
      React.createElement(
        'div',
        { key: 'empty', className: 'recommendationsRailEmpty' },
        t?.('forum_user_recommendations_empty'),
      ),
    )
  }

  return React.createElement(
    'section',
    {
      className: 'recommendationsRail',
      'aria-label': t?.('forum_user_recommendations_aria'),
      'aria-busy': isLoading ? 'true' : 'false',
      'data-hide-scrollbar': hideScrollbar ? '1' : '0',
    },
    React.createElement(
      'div',
      { className: 'recommendationsRailHeader' },
      React.createElement(
        'div',
        { className: 'recommendationsRailHeading', dir: uiDir },
        React.createElement('span', { className: 'recommendationsRailBadge' }, 'QL7'),
        React.createElement(
          'span',
          { className: 'recommendationsRailTitle' },
          t?.('forum_user_recommendations_title'),
        ),
      ),
      desktopArrows ? React.createElement(
        'div',
        { className: 'recommendationsRailControls' },
        createArrowButton({
          className: cls('recommendationsRailArrow', !canScrollLeft && 'isDisabled'),
          ariaLabel: t?.('forum_user_recommendations_scroll_left_aria'),
          onClick: () => scrollRailBy(-1),
          path: 'M14.5 5.5L8 12l6.5 6.5',
          disabled: !canScrollLeft,
        }),
        createArrowButton({
          className: cls('recommendationsRailArrow', !canScrollRight && 'isDisabled'),
          ariaLabel: t?.('forum_user_recommendations_scroll_right_aria'),
          onClick: () => scrollRailBy(1),
          path: 'M9.5 5.5L16 12l-6.5 6.5',
          disabled: !canScrollRight,
        }),
      ) : null,
    ),
    React.createElement('div', {
      className: 'forumDividerRail forumDividerRail--gold recommendationsRailDivider',
      'aria-hidden': 'true',
    }),
    React.createElement(
      'div',
      { className: 'recommendationsRailBody' },
      React.createElement('div', { className: 'recommendationsRailFade recommendationsRailFade--left', 'aria-hidden': 'true' }),
      React.createElement('div', { className: 'recommendationsRailFade recommendationsRailFade--right', 'aria-hidden': 'true' }),
      React.createElement(
        'div',
        {
          ref: scrollerRef,
          className: cls(
            'recommendationsRailScroller',
            hideScrollbar && 'recommendationsRailScroller--hideScrollbar',
          ),
          dir: 'ltr',
          tabIndex: 0,
        },
        ...scrollerChildren,
      ),
    ),
    React.createElement('div', {
      className: 'forumDividerRail forumDividerRail--gold recommendationsRailDivider',
      'aria-hidden': 'true',
    }),
    React.createElement('style', { jsx: true }, styles),
  )
}
