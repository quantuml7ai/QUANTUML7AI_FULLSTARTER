'use client'

import React from 'react'
import { formatCount as formatCompactCount } from '../../../shared/utils/counts'

export default function InboxTabsHeader({
  t,
  inboxTab,
  setInboxTab,
  setDmWithUserId,
  onRestartTab,
  mounted,
  unreadCount,
  dmUnreadCount,
  myPublishedCount,
  formatCount,
}) {
  const countFormatter = typeof formatCount === 'function' ? formatCount : formatCompactCount
  const restartTab = (tab) => {
    if (typeof onRestartTab === 'function') {
      onRestartTab(tab)
      return
    }
    setInboxTab(tab)
    if (tab !== 'messages') setDmWithUserId('')
  }

  return (
    <div className="inboxHeader">
      <div className="inboxTitleLine">Quantum Messenger</div>
      <div className="inboxTabs" role="tablist" aria-label={t('forum_inbox_tabs')}>
        <button
          type="button"
          className="inboxTabBtn"
          data-active={inboxTab === 'replies' ? '1' : '0'}
          onClick={() => restartTab('replies')}
        >
          <span className="inboxTabLabel">{t('inbox_tab_replies_to_me')}</span>
          {mounted && unreadCount > 0 && (
            <span className="inboxTabBadge" data-kind="replies">{countFormatter(unreadCount)}</span>
          )}
        </button>
        <button
          type="button"
          className="inboxTabBtn"
          data-active={inboxTab === 'messages' ? '1' : '0'}
          onClick={() => restartTab('messages')}
        >
          <span className="inboxTabLabel">{t('inbox_tab_messages')}</span>
          {mounted && dmUnreadCount > 0 && (
            <span className="inboxTabBadge" data-kind="messages">{countFormatter(dmUnreadCount)}</span>
          )}
        </button>
        <button
          type="button"
          className="inboxTabBtn"
          data-active={inboxTab === 'published' ? '1' : '0'}
          onClick={() => restartTab('published')}
        >
          <span className="inboxTabLabel">{t('inbox_tab_published')}</span>
          {mounted && myPublishedCount > 0 && (
            <span className="inboxTabBadge" data-kind="published">{countFormatter(myPublishedCount)}</span>
          )}
        </button>
      </div>
      <div className="inboxTabsRail" aria-hidden="true" />
    </div>
  )
}

