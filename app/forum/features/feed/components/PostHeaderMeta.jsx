'use client'

import React from 'react'
import { cls } from '../../../shared/utils/classnames'
import { human } from '../../../shared/utils/formatters'
import HydrateText from '../../../shared/components/HydrateText'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import { resolveNickForDisplay, resolveIconForDisplay, safeReadProfile } from '../../profile/utils/profileCache'

const ANONYMOUS_AVATAR_URL = '/anonymous/anonymous.png'
const DEFAULT_ICON_FALLBACKS = new Set(['', '/upload.jpg', 's:', '👤', 'рџ‘¤'])

function hasProfileAvatar(icon) {
  const value = String(icon || '').trim()
  return !!value && !DEFAULT_ICON_FALLBACKS.has(value)
}

function fallbackShortId(id) {
  const raw = String(id || '')
  return raw ? `${raw.slice(0, 6)}...${raw.slice(-4)}` : ''
}

function fallbackShortIdAlt(id) {
  const raw = String(id || '')
  return raw ? `${raw.slice(0, 6)}…${raw.slice(-4)}` : ''
}

function stripTmaPrefix(id) {
  return String(id || '').trim().replace(/^(?:tguid:|tg:|telegramid:|telegram:id:)/i, '')
}

function isGeneratedFallbackNick(nick, ...ids) {
  const value = String(nick || '').trim()
  if (!value) return true
  const lower = value.toLowerCase()
  if (/^0x[a-f0-9]{4}(?:\.{3}|…)[a-f0-9]{4}$/i.test(value)) return true
  if (/^(?:tg:|tguid:|telegramid:|telegram:id:)?\d{5,}$/i.test(value)) return true
  if (/^(?:tg:|tguid:|telegramid:|telegram:id:)?\d{3,}(?:\.{3}|…)\d{3,}$/i.test(value)) return true
  return ids.some((id) => {
    const raw = String(id || '').trim()
    const cleaned = stripTmaPrefix(raw)
    return [raw, cleaned].some((candidate) => {
      const item = String(candidate || '').trim()
      return item && (
        fallbackShortId(item).toLowerCase() === lower ||
        fallbackShortIdAlt(item).toLowerCase() === lower
      )
    })
  })
}

function anonymousLabel(t) {
  const value = t?.('forum_subscriptions_unknown_user')
  return value && value !== 'forum_subscriptions_unknown_user' ? value : 'Anonymous'
}

export default function PostHeaderMeta({
  p,
  authorId,
  rawUserId,
  isSelf,
  isStarred,
  isVipAuthor,
  onToggleStar,
  onUserInfoToggle,
  parentAuthor,
  parentSnippet,
  onJumpToParent,
  t,
}) {
  const avatarRef = React.useRef(null)
  const cachedProfile = safeReadProfile(authorId)
  const rawNickname = String(cachedProfile?.nickname || p?.nickname || '').trim()
  const rawIcon = cachedProfile?.vipIcon || cachedProfile?.vipEmoji || cachedProfile?.icon || p?.icon || ''
  const useAnonymousProfile = isGeneratedFallbackNick(rawNickname, authorId, rawUserId) && !hasProfileAvatar(rawIcon)
  const displayNickname = useAnonymousProfile
    ? anonymousLabel(t)
    : resolveNickForDisplay(authorId, p?.nickname)

  return (
    <>
      <div className="postUserRow mb-2">
        <div
          ref={avatarRef}
          className="avaMini"
          data-no-thread-open="1"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onUserInfoToggle?.(rawUserId, avatarRef.current)
          }}
        >
          {useAnonymousProfile ? (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${ANONYMOUS_AVATAR_URL}")`,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                borderRadius: 'inherit',
              }}
            />
          ) : (
            <AvatarEmoji userId={authorId} pIcon={resolveIconForDisplay(authorId, p?.icon)} />
          )}
        </div>

        <button
          type="button"
          className={cls('nick-badge nick-animate', isVipAuthor && 'vipNick')}
          translate="no"
          data-no-thread-open="1"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onUserInfoToggle?.(rawUserId, avatarRef.current)
          }}
        >
          <span className="nick-text truncate">{displayNickname}</span>
        </button>

        {!!authorId && !isSelf && (
          <StarButton
            on={isStarred}
            onClick={() => onToggleStar?.(authorId)}
            title={isStarred ? t('forum_subscribed') : t('forum_subscribe_author')}
          />
        )}

        {isVipAuthor && <VipFlipBadge />}
      </div>

      <div className="forumDividerRail forumDividerRail--gold" aria-hidden="true" />

      <div className="forumRowBar">
        <div className="slot-left">
          <div className="btn btnGhost btnXs" suppressHydrationWarning>
            <HydrateText value={human(p?.ts)} />
          </div>
        </div>

        {p?.parentId && (
          <button
            type="button"
            className="tag ml-1 replyTag replyTagBtn"
            aria-label={t?.('forum_reply_to')}
            title={t?.('forum_reply_to')}
            data-no-thread-open="1"
            onClick={onJumpToParent}
          >
            <span className="replyTagMain">
              {`${t?.('forum_reply_to')} `}
              {parentAuthor ? `@${parentAuthor}` : '...'}
            </span>
            {parentSnippet && <span className="replyTagSnippet">&quot;{parentSnippet}&quot;</span>}
          </button>
        )}
      </div>
    </>
  )
}
