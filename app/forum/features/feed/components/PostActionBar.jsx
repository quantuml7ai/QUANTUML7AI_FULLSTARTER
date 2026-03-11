'use client'

import React from 'react'
import HydrateText from '../../../shared/components/HydrateText'

export default function PostActionBar({
  t,
  p,
  views,
  replies,
  likes,
  dislikes,
  runPostButtonFx,
  onOpenThread,
  onReact,
  onShare,
  onReport,
  isAdmin,
  onDeletePost,
  isBanned,
  onUnbanUser,
  onBanUser,
}) {
  const myReaction = p?.myReaction === 'like' || p?.myReaction === 'dislike'
    ? p.myReaction
    : null
  const likeActive = myReaction === 'like'
  const dislikeActive = myReaction === 'dislike'

  return (
    <div
      className="mt-3 flex items-center gap-2 text-[13px] opacity-80 actionBar"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(4px, 1.5vw, 8px)',
        flexWrap: 'nowrap',
        overflowX: 'clip',
        overflowY: 'hidden',
        WebkitOverflowScrolling: 'touch',
        fontSize: 'clamp(9px, 1.1vw, 13px)',
      }}
    >
      <button
        type="button"
        className="btn btnGhost btnXs"
        title={t?.('forum_views')}
        data-emoji="🔎"
        data-fxkind="good"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          runPostButtonFx?.(e, 'good')
        }}
        suppressHydrationWarning
      >
        🔎 <HydrateText value={views} />
      </button>

      <button
        type="button"
        className="btn btnGhost btnXs"
        title={t?.('forum_replies')}
        data-emoji="💬"
        data-fxkind="good"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          runPostButtonFx?.(e, 'good')
          onOpenThread?.(p)
        }}
        suppressHydrationWarning
      >
        💬 <HydrateText value={replies} />
      </button>

      <button
        type="button"
        className={`btn btnGhost btnXs reactionBtnLike ${likeActive ? 'reactionBtnActive' : ''} ${dislikeActive ? 'reactionBtnOpposite' : ''}`}
        title={t?.('forum_like')}
        data-emoji="💘"
        data-fxkind="good"
        disabled={likeActive}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (likeActive) return
          runPostButtonFx?.(e, 'good')
          onReact?.(p, 'like')
        }}
      >
        💘 <HydrateText value={likes} />
      </button>

      <button
        type="button"
        className={`btn btnGhost btnXs reactionBtnDislike ${dislikeActive ? 'reactionBtnActive' : ''} ${likeActive ? 'reactionBtnOpposite' : ''}`}
        title={t?.('forum_dislike')}
        data-emoji="👎"
        data-fxkind="bad"
        disabled={dislikeActive}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (dislikeActive) return
          runPostButtonFx?.(e, 'bad')
          onReact?.(p, 'dislike')
        }}
      >
        👎 <HydrateText value={dislikes} />
      </button>

      <button
        type="button"
        className="btn btnGhost btnXs shareBtn"
        title={t?.('forum_share') || 'Share'}
        data-emoji="♻️"
        data-fxkind="good"
        style={{ marginLeft: 'auto' }}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          runPostButtonFx?.(e, 'good')
          onShare?.(p)
        }}
      >
        ♻️
      </button>

      <button
        type="button"
        className="tag"
        title={t?.('forum_report')}
        data-emoji="⚠️"
        data-fxkind="bad"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          runPostButtonFx?.(e, 'bad')
          const rect = e.currentTarget?.getBoundingClientRect?.()
          onReport?.(p, rect, e.currentTarget)
        }}
      >
        ⚠️
      </button>

      {isAdmin && (
        <>
          <button
            type="button"
            className="btn btnGhost btnXs"
            title={t?.('forum_delete')}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onDeletePost?.(p)
            }}
          >
            🗑
          </button>

          {isBanned ? (
            <button
              type="button"
              className="btn btnGhost btnXs"
              title={t?.('forum_unban')}
              data-emoji="✅"
              data-fxkind="good"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                runPostButtonFx?.(e, 'good')
                onUnbanUser?.(p)
              }}
            >
              ✅
            </button>
          ) : (
            <button
              type="button"
              className="btn btnGhost btnXs"
              title={t?.('forum_ban')}
              data-emoji="⛔"
              data-fxkind="bad"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                runPostButtonFx?.(e, 'bad')
                onBanUser?.(p)
              }}
            >
              ⛔
            </button>
          )}
        </>
      )}
    </div>
  )
}
