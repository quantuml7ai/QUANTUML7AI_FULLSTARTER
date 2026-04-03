'use client'

import React from 'react'
import { cls } from '../../../shared/utils/classnames'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import useVipFlag from '../../profile/hooks/useVipFlag'
import {
  safeReadProfile,
  resolveNickForDisplay,
  resolveIconForDisplay,
} from '../../profile/utils/profileCache'
import { shortId } from '../../../shared/utils/formatters'

export default function DmThreadHeader({
  uid,
  meId,
  t,
  starredAuthors,
  onToggleStar,
  onUserInfoToggle,
}) {
  const threadUid = String(uid || '').trim()
  const prof = safeReadProfile(threadUid) || {}
  const isVipAuthor = useVipFlag(
    threadUid,
    prof.vipActive ?? prof.isVip ?? prof.vip ?? prof.vipUntil ?? null,
  )
  if (!threadUid) return null
  const nick = resolveNickForDisplay(threadUid, '')
  const isSelf = !!meId && String(meId) === String(threadUid)
  const isStarred = !!threadUid && !!starredAuthors?.has?.(threadUid)
  const openProfile = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    const anchor =
      e?.currentTarget?.closest?.('.dmThreadHeader')?.querySelector?.('.dmThreadAvatar') ||
      e?.currentTarget
    onUserInfoToggle?.(threadUid, anchor)
  }

  return (
    <div className="dmThreadHeader">
      <div className="dmThreadAvatar" onClick={openProfile}>
        <AvatarEmoji
          userId={threadUid}
          pIcon={resolveIconForDisplay(threadUid, '')}
          className="dmThreadAvatarImg"
        />
      </div>
      <div className="dmThreadMeta">
        <div className="dmThreadUser">
          <button
            type="button"
            className={cls('nick-badge nick-animate dmThreadNick', isVipAuthor && 'vipNick')}
            translate="no"
            onClick={openProfile}
          >
            <span className="nick-text">{nick || shortId(threadUid)}</span>
          </button>
          {!!threadUid && !isSelf && (
            <StarButton
              on={isStarred}
              onClick={() => onToggleStar?.(threadUid)}
              title={isStarred ? t?.('forum_subscribed') : t?.('forum_subscribe')}
            />
          )}
          {isVipAuthor && <VipFlipBadge />}
        </div>
      </div>
    </div>
  )
}
