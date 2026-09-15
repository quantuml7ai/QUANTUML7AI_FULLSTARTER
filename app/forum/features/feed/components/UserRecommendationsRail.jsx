'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import useRenderManagedScope from '../../../../../components/visual-runtime/useRenderManagedScope'
import { cls } from '../../../shared/utils/classnames'
import UserRecommendationCard from './UserRecommendationCard'

const SKELETON_COUNT = 8


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
  const renderManagedRef = useRef(null)
  useRenderManagedScope(renderManagedRef, { kind: 'row', marginProfile: 'near100', initialNear: true })
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
      ref: renderManagedRef,
      className: 'recommendationsRail',
      'data-ql7-visual-scope': 'row',
      'data-ql7-render-managed': '1',
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
  )
}
