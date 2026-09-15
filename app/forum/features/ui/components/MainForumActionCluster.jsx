'use client'

import React from 'react'
import ForumActionRow from './ForumActionRow'
import CreateTopicCard from '../../feed/components/CreateTopicCard'
import {
  INVITE_BTN_SIZE,
  INVITE_GIF_SIZE,
  INVITE_BTN_OFFSET_X,
  INVITE_BTN_OFFSET_Y,
} from '../constants/inviteButton'

export default function MainForumActionCluster({
  t,
  openInboxGlobal,
  inboxOpen,
  mounted,
  unreadCount,
  dmUnreadCount,
  formatCount,
  videoFeedOpen,
  closeVideoFeed,
  setInboxOpen,
  setReplyTo,
  setThreadRoot,
  refreshVideoFeedWithoutReload,
  openVideoFeed,
  goHome,
  canGlobalBack,
  handleGlobalBack,
  createTopic,
}) {
  return (
    <>
      <ForumActionRow
        t={t}
        inboxButtonId="inbox_btn_main"
        onInboxClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          openInboxGlobal('inbox_btn_main')
        }}
        inboxOpen={inboxOpen}
        mounted={mounted}
        unreadCount={unreadCount}
        dmUnreadCount={dmUnreadCount}
        formatCount={formatCount}
        inviteBtnSize={INVITE_BTN_SIZE}
        inviteGifSize={INVITE_GIF_SIZE}
        inviteBtnOffsetX={INVITE_BTN_OFFSET_X}
        inviteBtnOffsetY={INVITE_BTN_OFFSET_Y}
        onCreateClick={() => {
          try { if (videoFeedOpen) closeVideoFeed?.() } catch {}
          try { setInboxOpen?.(false) } catch {}
          try { setReplyTo?.(null) } catch {}
          try { setThreadRoot?.(null) } catch {}
          setTimeout(() => { try { window.__forumToggleCreateTopic?.() } catch {} }, 0)
        }}
        videoFeedButtonId="video_feed_btn_main"
        onVideoFeedClick={() => {
          if (videoFeedOpen) {
            try { refreshVideoFeedWithoutReload() } catch {}
            return
          }
          try { openVideoFeed?.('video_feed_btn_main') } catch {}
        }}
        videoFeedOpen={videoFeedOpen}
        onHomeClick={goHome}
        canGlobalBack={canGlobalBack}
        onBackClick={handleGlobalBack}
      />
      <CreateTopicCard t={t} onCreate={createTopic} onOpenVideoFeed={openVideoFeed} />
    </>
  )
}
