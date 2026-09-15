'use client'

import React from 'react'
import { formatCount as formatCompactCount } from '../../../shared/utils/counts.js'

const useInboxLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect

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
  const headerRef = React.useRef(null)
  const countFormatter = typeof formatCount === 'function' ? formatCount : formatCompactCount

  useInboxLayoutEffect(() => {
    const header = headerRef.current
    if (!header || typeof document === 'undefined') return undefined

    const styleOwner = header.closest('.forum_root') || document.documentElement
    let resizeObserver = null
    let resizeFallback = null

    const publishStickyStackHeight = () => {
      const height = Math.max(0, Math.ceil(header.getBoundingClientRect().height || 0))
      if (height > 0) {
        styleOwner.style.setProperty('--ql7-quantum-messenger-sticky-height', `${height}px`)
        header.setAttribute('data-ql7-quantum-messenger-sticky-height', String(height))
      }
    }

    publishStickyStackHeight()

    if (typeof ResizeObserver === 'function') {
      resizeObserver = new ResizeObserver(publishStickyStackHeight)
      resizeObserver.observe(header)
    } else if (typeof window !== 'undefined') {
      resizeFallback = publishStickyStackHeight
      window.addEventListener('resize', resizeFallback, { passive: true })
    }

    return () => {
      resizeObserver?.disconnect()
      if (resizeFallback && typeof window !== 'undefined') {
        window.removeEventListener('resize', resizeFallback)
      }
      styleOwner.style.removeProperty('--ql7-quantum-messenger-sticky-height')
    }
  }, [])
  const restartTab = (tab) => {
    if (typeof onRestartTab === 'function') {
      onRestartTab(tab)
      return
    }
    setInboxTab(tab)
    if (tab !== 'messages') setDmWithUserId('')
  }

  return (
    <div
      ref={headerRef}
      className="inboxHeader"
      data-ql7-quantum-messenger-sticky-owner="title-tabs"
      data-ql7-quantum-messenger-sticky-measure="resize-observer-height"
    >
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
