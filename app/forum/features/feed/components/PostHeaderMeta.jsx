'use client'

import React from 'react'
import { cls } from '../../../shared/utils/classnames'
import { human } from '../../../shared/utils/formatters'
import HydrateText from '../../../shared/components/HydrateText'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import { resolveNickForDisplay, resolveIconForDisplay } from '../../profile/utils/profileCache'

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
          <AvatarEmoji userId={authorId} pIcon={resolveIconForDisplay(authorId, p?.icon)} />
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
          <span className="nick-text truncate">{resolveNickForDisplay(authorId, p?.nickname)}</span>
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
