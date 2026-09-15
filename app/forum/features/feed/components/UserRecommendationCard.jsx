'use client'

import React from 'react'
import useRenderManagedScope from '../../../../../components/visual-runtime/useRenderManagedScope'
import HydrateText from '../../../shared/components/HydrateText'
import { formatCount } from '../../../shared/utils/counts'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import { AvatarBadgeOverlay } from '../../profile/components/VipFlipBadge'

function resolveNicknameFontSize(nickname) {
  const length = String(nickname || '').trim().length
  if (length > 30) return 9
  if (length > 24) return 10
  if (length > 18) return 11
  if (length > 13) return 12
  return 13
}


export default function UserRecommendationCard({
  user,
  t,
  onOpenUserPosts,
}) {
  const canonicalAccountId = String(user?.canonicalAccountId || user?.userId || '').trim()
  const nickname = String(user?.nickname || '').trim()
  const avatar = String(user?.avatar || '').trim()
  const followersCount = Number(user?.followersCount || 0)
  const isVip = !!user?.isVip
  const starsLabel = t?.('forum_user_popover_stars') || t?.('ui_stars') || 'Stars'
  const nicknameFontSize = resolveNicknameFontSize(nickname)
  const renderManagedRef = React.useRef(null)
  useRenderManagedScope(renderManagedRef, { kind: 'card', marginProfile: 'near50', initialNear: true })
  const nickWrapRef = React.useRef(null)
  const nickTextRef = React.useRef(null)
  const [adaptiveNickSize, setAdaptiveNickSize] = React.useState(nicknameFontSize)

  React.useEffect(() => {
    setAdaptiveNickSize(nicknameFontSize)
  }, [nickname, nicknameFontSize])

  React.useEffect(() => {
    let timeoutId = 0
    let resizeObserver = null

    const measure = () => {
      const wrap = nickWrapRef.current
      const text = nickTextRef.current
      if (!wrap || !text) {
        setAdaptiveNickSize(nicknameFontSize)
        return
      }

      const availableWidth = Math.max(36, Number(wrap.clientWidth || 0) - 2)
      if (!availableWidth) return

      const previousFontSize = text.style.fontSize
      text.style.fontSize = `${nicknameFontSize}px`
      const measuredTextWidth = Number(text.scrollWidth || text.offsetWidth || 0)
      text.style.fontSize = previousFontSize

      if (!measuredTextWidth) {
        setAdaptiveNickSize(nicknameFontSize)
        return
      }

      const badgePaddingAllowance = 16
      const requiredWidth = measuredTextWidth + badgePaddingAllowance
      const ratio = availableWidth / requiredWidth
      const nextFontSize = ratio >= 1
        ? nicknameFontSize
        : Math.max(6.5, Number((nicknameFontSize * ratio).toFixed(2)))

      setAdaptiveNickSize((prev) => (Math.abs(prev - nextFontSize) < 0.1 ? prev : nextFontSize))
    }

    const scheduleMeasure = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(measure, 0)
    }

    scheduleMeasure()

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleMeasure)
      if (nickWrapRef.current) resizeObserver.observe(nickWrapRef.current)
    }

    window.addEventListener('resize', scheduleMeasure, { passive: true })

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', scheduleMeasure)
      try { resizeObserver?.disconnect?.() } catch {}
    }
  }, [nicknameFontSize])

  if (!canonicalAccountId || !nickname || !avatar || followersCount < 1) return null

  return React.createElement(
    'button',
    {
      ref: renderManagedRef,
      type: 'button',
      className: 'recommendationCard',
      'data-ql7-visual-scope': 'card',
      'data-ql7-render-managed': '1',
      'aria-label': t?.('forum_user_recommendations_user_action_aria'),
      dir: 'auto',
      onClick: () => {
        onOpenUserPosts?.({
          userId: canonicalAccountId,
          nickname,
        })
      },
    },
    React.createElement('span', { className: 'recommendationCardGlow', 'aria-hidden': 'true' }),
    React.createElement(
      'span',
      { className: 'recommendationCardAvatarShell ql7AvatarBadgeHost' },
      React.createElement(
        'span',
        { className: 'recommendationCardAvatar' },
        React.createElement(AvatarEmoji, {
          userId: canonicalAccountId,
          pIcon: avatar,
          className: 'recommendationCardAvatarInner',
        }),
      ),
      React.createElement(AvatarBadgeOverlay, { vipActive: isVip, showInfo: true }),
    ),
    React.createElement(
      'span',
      { className: 'recommendationCardMeta' },
      React.createElement(
        'span',
        { className: 'recommendationCardNickWrap', translate: 'no', ref: nickWrapRef, dir: 'auto' },
        React.createElement(
          'span',
          {
            className: 'recommendationCardNickBadge nick-animate',
            style: { fontSize: `${adaptiveNickSize}px` },
          },
          React.createElement(
            'span',
            { className: 'recommendationCardNickText', ref: nickTextRef },
            nickname,
          ),
        ),
      ),
      React.createElement(
        'span',
        {
          className: 'recommendationCardStars',
          'aria-label': `${starsLabel}: ${followersCount}`,
        },
        React.createElement(
          'span',
          { className: 'recommendationCardStarsBadge', 'aria-hidden': 'true' },
          React.createElement('span', { className: 'recommendationCardStarsRing', 'aria-hidden': 'true' }),
          React.createElement(
            'span',
            { className: 'recommendationCardStarsGlyph', 'aria-hidden': 'true' },
            '\u2605',
          ),
        ),
        React.createElement(
          'span',
          { className: 'recommendationCardStarsValue' },
          React.createElement(HydrateText, { value: formatCount(followersCount) }),
        ),
        React.createElement(
          'span',
          { className: 'recommendationCardSrOnly' },
          starsLabel,
        ),
      ),
    ),
  )
}
