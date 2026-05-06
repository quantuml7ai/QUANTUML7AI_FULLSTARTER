import Image from 'next/image'
import { formatCount as formatCompactCount } from '../../../shared/utils/counts'

import ForumActionNavIcon from './ForumActionNavIcon'
import VideoFeedNavIcon from './VideoFeedNavIcon'

export default function ForumActionRow({
  t,
  inboxButtonId,
  onInboxClick,
  inboxOpen,
  mounted,
  unreadCount,
  dmUnreadCount,
  formatCount,
  inviteBtnSize,
  inviteGifSize,
  inviteBtnOffsetX,
  inviteBtnOffsetY,
  onCreateClick,
  videoFeedButtonId,
  onVideoFeedClick,
  videoFeedOpen,
  onHomeClick,
  canGlobalBack,
  onBackClick,
}) {
  const countFormatter = typeof formatCount === 'function' ? formatCount : formatCompactCount

  return (
    <div className="forumRowBar forumGlobalRow">
      <div className="slot-left">
        <button
          type="button"
          className="iconBtn inboxBtn"
          title={t('forum_inbox')}
          id={inboxButtonId}
          onClick={onInboxClick}
          aria-pressed={inboxOpen}
        >
          <ForumActionNavIcon kind="inbox" active={!!inboxOpen} size={24} />
          {mounted && unreadCount > 0 && (
            <span className="inboxBadgeReplies" suppressHydrationWarning>{countFormatter(unreadCount)}</span>
          )}
          {mounted && dmUnreadCount > 0 && (
            <span className="inboxBadgeDM" suppressHydrationWarning>{countFormatter(dmUnreadCount)}</span>
          )}
        </button>

        <button
          type="button"
          className="iconBtn inviteGifBtn"
          style={{
            width: inviteBtnSize,
            height: inviteBtnSize,
            padding: 0,
            marginRight: 8,
            transform: `translate(${inviteBtnOffsetX}px, ${inviteBtnOffsetY}px)`,
          }}
          onClick={() => {
            try {
              window.dispatchEvent(new CustomEvent('invite:open'))
            } catch {}
          }}
          onMouseDown={(e) => e.preventDefault()}
          aria-label={t('forum_invite_friends')}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: inviteGifSize,
              height: inviteGifSize,
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <Image
              src="/friends/invitation.gif"
              alt=""
              width={inviteGifSize}
              height={inviteGifSize}
              unoptimized
              sizes={`${inviteGifSize}px`}
              style={{
                width: inviteGifSize,
                height: inviteGifSize,
                objectFit: 'cover',
                display: 'block',
              }}
              draggable={false}
            />
          </span>
        </button>
      </div>

      <div className="slot-center">
        <button
          type="button"
          className="iconBtn bigPlus"
          title={t('forum_create')}
          aria-label={t('forum_create')}
          onClick={onCreateClick}
        >
          <ForumActionNavIcon kind="plus" size={24} />
        </button>

        <button
          type="button"
          className="iconBtn bigPlus"
          title={t('forum_video_feed')}
          aria-label={t('forum_video_feed')}
          id={videoFeedButtonId}
          onClick={onVideoFeedClick}
        >
          <VideoFeedNavIcon active={videoFeedOpen} />
        </button>
      </div>

      <div className="slot-right">
        <button
          type="button"
          className="iconBtn bigPlus"
          aria-label={t?.('forum_home')}
          onClick={onHomeClick}
          title={t?.('forum_home')}
        >
          <ForumActionNavIcon kind="home" size={22} />
        </button>
        <button
          type="button"
          className="iconBtn bigPlus"
          aria-label={t?.('forum_back')}
          disabled={!canGlobalBack}
          onClick={onBackClick}
          title={t?.('forum_back')}
        >
          <ForumActionNavIcon kind="back" size={22} />
        </button>
      </div>
    </div>
  )
}
