'use client'

import React from 'react'
import { useI18n } from '../../../../../components/i18n'
import { cls } from '../../../shared/utils/classnames'
import { human } from '../../../shared/utils/formatters'
import { formatCount as formatCompactCount } from '../../../shared/utils/counts'
import HydrateText from '../../../shared/components/HydrateText'
import ConfirmDeleteOverlay from '../../ui/components/ConfirmDeleteOverlay'
import StarButton from '../../ui/components/StarButton'
import AvatarEmoji from '../../profile/components/AvatarEmoji'
import VipFlipBadge from '../../profile/components/VipFlipBadge'
import useVipFlag from '../../profile/hooks/useVipFlag'
import {
  resolveProfileAccountId,
  resolveNickForDisplay,
  resolveIconForDisplay,
} from '../../profile/utils/profileCache'
import { areTopicItemPropsEqual } from '../utils/cardMemo'

const TopicItem = React.memo(function TopicItem({
  t,
  agg,
  onOpen,
  onView,
  isAdmin,
  onDelete,
  authId,
  onOwnerDelete,
  isSelfAuthor = false,
  isStarredAuthor = false,
  onToggleStar,
  onUserInfoToggle,
  formatCount,
  dataProfileBranchStart,
}) {
  const { t: tt } = useI18n()
  const avatarRef = React.useRef(null)
  const { posts, likes, dislikes, views } = agg || {}
  const countFormatter = typeof formatCount === 'function' ? formatCount : formatCompactCount
  const entryId = t?.id != null ? `topic_${t.id}` : ''
  const authorId = String(resolveProfileAccountId(t?.userId || t?.accountId) || '').trim()
  const rawUserId = String(t?.userId || t?.accountId || '').trim()
  const isSelf = !!isSelfAuthor
  const isStarred = !!isStarredAuthor
  const isVipAuthor = useVipFlag(authorId, t?.vipActive ?? t?.isVip ?? t?.vip ?? t?.vipUntil ?? null)

  const [ownDelConfirm, setOwnDelConfirm] = React.useState(null)
  const requestOwnerDelete = (e) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()
    let r = null
    try {
      const b = e?.currentTarget?.getBoundingClientRect?.()
      if (b) r = { top: b.top, left: b.left, right: b.right, bottom: b.bottom, width: b.width, height: b.height }
    } catch {}
    setOwnDelConfirm(r || { top: 0, left: 0, right: 0, bottom: 0 })
  }
  const confirmOwnerDelete = () => {
    setOwnDelConfirm(null)
    onOwnerDelete?.(t)
  }

  const ref = React.useRef(null)
  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (!ref.current) return
    if (typeof onView !== 'function') return

    const el = ref.current
    let fired = false
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries && entries[0]
        if (!e) return
        if (fired) return
        if (e.isIntersecting && e.intersectionRatio >= 0.6) {
          fired = true
          onView(t?.id)
          io.disconnect()
        }
      },
      { threshold: [0.6] },
    )

    io.observe(el)
    return () => {
      try {
        io.disconnect()
      } catch {}
    }
  }, [onView, t?.id])

  return (
    <div
      ref={ref}
      id={entryId || undefined}
      className="item qshine cursor-pointer"
      data-feed-card="1"
      data-feed-kind="topic"
      data-profile-branch-start={dataProfileBranchStart}
      onClick={() => onOpen?.(t, entryId)}
      style={{ position: 'relative' }}
    >
      <div className="postBodyFrame">
        <div className="flex flex-col gap-3">
          {(t.nickname || t.icon) && (
            <div className="topicUserRow">
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
                <AvatarEmoji userId={authorId} pIcon={resolveIconForDisplay(authorId, t.icon)} />
              </div>
              <button
                type="button"
                className={cls('nick-badge nick-animate', isVipAuthor && 'vipNick')}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onUserInfoToggle?.(rawUserId, avatarRef.current)
                }}
                title={authorId || ''}
                style={{ flex: '0 1 auto', minWidth: 0 }}
                translate="no"
              >
                <span className="nick-text">{resolveNickForDisplay(authorId, t.nickname)}</span>
              </button>

              {!!authorId && !isSelf && (
                <StarButton
                  on={isStarred}
                  onClick={() => onToggleStar?.(authorId)}
                  title={isStarred ? tt('forum_subscribed') : tt('forum_subscribe_author')}
                />
              )}

              {isVipAuthor && <VipFlipBadge />}
            </div>
          )}

          <div className="min-w-0">
            <div
              className="
    topicTitle text-[#eaf4ff]
    !whitespace-normal break-words
    [overflow-wrap:anywhere]
    max-w-full"
            >
              {t.title}
            </div>

            {t.description && (
              <div
                className="
      topicDesc text-[#eaf4ff]/75 text-sm
      !whitespace-normal break-words
      [overflow-wrap:anywhere]
      max-w-full mt-1"
              >
                {t.description}
              </div>
            )}
          </div>
          <div className="btn btnGhost btnXs" suppressHydrationWarning>
            <HydrateText value={human(t.ts)} />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <span className="tag">👓 <HydrateText value={countFormatter(views)} /></span>
          <span className="tag">📣 <HydrateText value={countFormatter(posts)} /></span>
          <span className="tag">💕 <HydrateText value={countFormatter(likes)} /></span>
          <span className="tag">🤮 <HydrateText value={countFormatter(dislikes)} /></span>
          {isAdmin && (
            <button
              className="tag"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onDelete?.(t)
              }}
              title="Удалить тему"
            >
              🗑
            </button>
          )}
        </div>

        {authId && authId === (t.userId || t.accountId) && (
          <div
            className="ownerKebab"
            data-no-thread-open="1"
            onClick={(e) => {
              e.stopPropagation()
            }}
            onPointerDownCapture={(e) => {
              e.stopPropagation()
            }}
            onMouseDownCapture={(e) => {
              e.stopPropagation()
            }}
            onTouchStartCapture={(e) => {
              e.stopPropagation()
            }}
          >
            <button
              className="kebabBtn"
              type="button"
              aria-label="Меню темы"
              data-no-thread-open="1"
              onClick={(e) => {
                e.stopPropagation()
              }}
              onPointerDownCapture={(e) => {
                e.stopPropagation()
              }}
              onMouseDownCapture={(e) => {
                e.stopPropagation()
              }}
              onTouchStartCapture={(e) => {
                e.stopPropagation()
              }}
            >
              ⋮
            </button>
            <div className="ownerMenu">
              <button type="button" className="danger" onClick={requestOwnerDelete}>
                🗑
              </button>
            </div>
          </div>
        )}

        <ConfirmDeleteOverlay
          open={!!ownDelConfirm}
          rect={ownDelConfirm}
          text={tt?.('forum_delete_confirm')}
          onCancel={() => setOwnDelConfirm(null)}
          onConfirm={confirmOwnerDelete}
        />
      </div>
    </div>
  )
}, areTopicItemPropsEqual)

TopicItem.displayName = 'TopicItem'

export default TopicItem
