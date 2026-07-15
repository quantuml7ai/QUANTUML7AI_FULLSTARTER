'use client'

import React from 'react'
import HydrateText from '../../../shared/components/HydrateText'
import { formatCount } from '../../../shared/utils/counts'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'

function resolveNicknameFontSize(nickname) {
  const length = String(nickname || '').trim().length
  if (length > 30) return 9
  if (length > 24) return 10
  if (length > 18) return 11
  if (length > 13) return 12
  return 13
}

const styles = `
  .recommendationCard {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
    width: 112px;
    min-width: 112px;
    height: 188px;
    padding: 10px;
    border-radius: 22px;
    border: 1px solid rgba(134, 173, 224, 0.18);
    background:
      radial-gradient(circle at 50% 0%, rgba(100, 159, 255, 0.12), rgba(100, 159, 255, 0) 42%),
      linear-gradient(180deg, rgba(16, 24, 36, 0.96) 0%, rgba(11, 17, 27, 0.95) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      inset 0 -1px 0 rgba(126, 169, 223, 0.08),
      0 18px 42px rgba(2, 6, 23, 0.26);
    overflow: hidden;
    text-align: center;
    transition:
      transform 180ms ease,
      border-color 180ms ease,
      box-shadow 180ms ease,
      background 180ms ease;
  }

  .recommendationCard:hover {
    transform: translateY(-2px);
    border-color: rgba(148, 205, 255, 0.34);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      inset 0 -1px 0 rgba(126, 169, 223, 0.12),
      0 22px 48px rgba(11, 22, 52, 0.28);
  }

  .recommendationCard:focus-visible {
    outline: 2px solid rgba(129, 216, 255, 0.82);
    outline-offset: 2px;
  }

  .recommendationCardGlow {
    position: absolute;
    inset: -10% auto auto 22%;
    width: 58%;
    height: 30%;
    border-radius: 999px;
    background: radial-gradient(circle, rgba(109, 178, 255, 0.18) 0%, rgba(109, 178, 255, 0) 72%);
    pointer-events: none;
  }

  .recommendationCardAvatarShell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 74px;
    min-width: 74px;
    height: 88px;
    margin-top: 2px;
  }

  .recommendationCardAvatar {
    position: relative;
    width: 74px;
    height: 88px;
    border-radius: 20px;
    overflow: hidden;
    border: 1px solid rgba(145, 196, 255, 0.24);
    background:
      radial-gradient(circle at 20% 18%, rgba(74, 151, 255, 0.18), transparent 55%),
      linear-gradient(180deg, rgba(18, 29, 47, 0.96), rgba(11, 17, 27, 0.98));
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.03),
      0 10px 24px rgba(2, 6, 23, 0.18);
  }

  :global(.recommendationCardAvatarInner) {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    overflow: hidden;
  }

  .recommendationCardVipDock {
    position: absolute;
    top: -5px;
    right: -7px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: rgba(10, 18, 32, 0.72);
    box-shadow:
      0 8px 18px rgba(3, 9, 24, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(8px);
    pointer-events: none;
    opacity: 0;
  }

  .recommendationCardVipDock[data-visible='1'] {
    opacity: 1;
  }

  .recommendationCardVip {
    width: 22px;
    height: 22px;
  }

  .recommendationCardMeta {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
  }

  .recommendationCardNickWrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-width: 0;
  }

  .recommendationCardNickBadge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: auto;
    max-width: 100%;
    min-width: 0;
    min-height: 30px;
    padding: 5px 7px;
    border: 1px solid transparent;
    border-radius: 12px;
    background:
      linear-gradient(#0b1220, #0b1220) padding-box,
      linear-gradient(135deg, #5b9dff, #9b5bff, #ff5bb2) border-box;
    box-shadow:
      0 0 0.45rem rgba(91, 157, 255, 0.2),
      inset 0 0 0.25rem rgba(155, 91, 255, 0.12);
    color: #eaf4ff;
    font-weight: 800;
    letter-spacing: -0.01em;
    line-height: 1;
  }

  .recommendationCardNickText {
    display: inline-block;
    width: auto;
    max-width: none;
    overflow: visible;
    white-space: nowrap;
    text-overflow: clip;
  }

  .recommendationCardStars {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-width: 0;
    padding: 5px 10px 5px 8px;
    border-radius: 999px;
    border: 1px solid rgba(120, 157, 205, 0.2);
    background: rgba(18, 28, 43, 0.9);
    color: rgba(225, 238, 255, 0.96);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .recommendationCardStarsBadge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex: 0 0 auto;
    border-radius: 999px;
    background:
      radial-gradient(circle at 50% 44%, rgba(255, 220, 112, 0.28), rgba(255, 220, 112, 0) 64%),
      conic-gradient(
        from 180deg,
        rgba(90, 255, 255, 0.96) 0deg,
        rgba(0, 178, 248, 0.58) 48deg,
        rgba(217, 90, 255, 0.22) 104deg,
        rgba(90, 255, 233, 0.94) 162deg,
        rgba(90, 230, 255, 0.58) 236deg,
        rgba(190, 67, 238, 0.24) 306deg,
        rgba(0, 247, 255, 0.9) 360deg
      );
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.08),
      0 6px 14px rgba(5, 16, 32, 0.2);
    overflow: hidden;
  }

  .recommendationCardStarsRing {
    position: absolute;
    inset: -4px;
    border-radius: 999px;
    border: 1px dashed rgba(245, 219, 138, 0.72);
    opacity: 0.96;
    animation: recommendationStarsSpin 3.1s linear infinite;
  }

  .recommendationCardStarsGlyph {
    position: relative;
    z-index: 1;
    color: rgba(255, 211, 51, 0.98);
    font-size: 15px;
    line-height: 1;
    text-shadow:
      0 0 10px rgba(255, 205, 79, 0.38),
      0 0 18px rgba(255, 222, 117, 0.22);
  }

  .recommendationCardStarsValue {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .recommendationCardSrOnly {
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

  @keyframes recommendationStarsSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1023px) {
    .recommendationCard {
      width: 102px;
      min-width: 102px;
      height: 176px;
      padding: 9px;
      gap: 9px;
    }

    .recommendationCardAvatarShell {
      width: 70px;
      min-width: 70px;
      height: 84px;
    }

    .recommendationCardAvatar {
      width: 70px;
      height: 84px;
    }

    .recommendationCardNickBadge {
      min-height: 28px;
    }

    .recommendationCardStarsValue {
      font-size: 11px;
    }
  }

  @media (max-width: 639px) {
    .recommendationCard {
      width: 94px;
      min-width: 94px;
      height: 162px;
      padding: 8px;
      border-radius: 20px;
      gap: 8px;
    }

    .recommendationCardAvatarShell {
      width: 62px;
      min-width: 62px;
      height: 74px;
    }

    .recommendationCardAvatar {
      width: 62px;
      height: 74px;
      border-radius: 18px;
    }

    .recommendationCardVipDock {
      width: 24px;
      height: 24px;
      top: -4px;
      right: -6px;
    }

    .recommendationCardVip {
      width: 18px;
      height: 18px;
    }

    .recommendationCardNickBadge {
      min-height: 26px;
      padding: 4px 6px;
    }

    .recommendationCardStars {
      gap: 6px;
      padding: 4px 8px 4px 7px;
    }

    .recommendationCardStarsBadge {
      width: 20px;
      height: 20px;
    }

    .recommendationCardStarsGlyph {
      font-size: 13px;
    }

    .recommendationCardStarsValue {
      font-size: 10px;
    }
  }
`

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
      type: 'button',
      className: 'recommendationCard',
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
      { className: 'recommendationCardAvatarShell' },
      React.createElement(
        'span',
        { className: 'recommendationCardAvatar' },
        React.createElement(AvatarEmoji, {
          userId: canonicalAccountId,
          pIcon: avatar,
          className: 'recommendationCardAvatarInner',
        }),
      ),
      React.createElement(
        'span',
        {
          className: 'recommendationCardVipDock',
          'data-visible': isVip ? '1' : '0',
        },
        isVip ? React.createElement(VipFlipBadge, { className: 'recommendationCardVip' }) : null,
      ),
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
            className: 'recommendationCardNickBadge',
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
    React.createElement('style', {
      dangerouslySetInnerHTML: { __html: styles },
    }),
  )
}
