'use client'

import React from 'react'
import { FORUM_STYLES } from './styles/ForumStyles'
import { FORUM_FX_STYLES } from './styles/ForumFxStyles'
import TopicsSection from './features/feed/components/TopicsSection'
import ThreadSection from './features/feed/components/ThreadSection'
import ComposeDock from './features/ui/components/ComposeDock'
import ForumOverlayStack from './features/ui/components/ForumOverlayStack'
 
function useHeadStyle(styleId, cssText) {
  React.useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const existing = document.getElementById(styleId)
    if (existing && existing.tagName === 'STYLE') {
      if (existing.textContent !== cssText) existing.textContent = cssText
      return undefined
    }
    const tag = document.createElement('style')
    tag.id = styleId
    tag.setAttribute('data-forum-style', styleId)
    tag.textContent = cssText
    document.head.appendChild(tag)
    return () => {
      try { tag.remove() } catch {}
    }
  }, [styleId, cssText])
}

export default function ForumLayout({
  sel,
  t,
  toastView,
  deeplinkUI,
  overlayStackProps,
  forumHeaderPanelProps,
  mainActionClusterProps,
  threadActionClusterProps,
  topicsSwitchProps,
  bodyRef,
  threadRoot,
  threadRepliesPaneProps,
  composerDockProps,
}) {

  useHeadStyle('forum-fx-styles', FORUM_FX_STYLES)
  useHeadStyle('forum-main-styles', FORUM_STYLES)
  return (
    <div
      className="forum_root space-y-4"
      data-view={sel ? 'thread' : 'topics'}
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}
    >
      {toastView}
      {deeplinkUI.active && (
        <div className="deeplinkBanner">
          {deeplinkUI.status === 'not_found'
            ? (t?.('forum_post_not_found') || 'Post not found')
            : (t?.('forum_search_post') || 'Finding post…')}
        </div>
      )}
      <ForumOverlayStack {...overlayStackProps} />
      <div
        className="grid2"
        style={{ display: 'flex', flexDirection: 'column', gridTemplateColumns: '1fr', flex: '1 1 auto', minHeight: 0 }}
      >
        {!sel ? (
          <TopicsSection
            forumHeaderPanelProps={forumHeaderPanelProps}
            actionClusterProps={mainActionClusterProps}
            topicsSwitchProps={topicsSwitchProps}
            bodyRef={bodyRef}
          />
        ) : (
          <ThreadSection
            forumHeaderPanelProps={forumHeaderPanelProps}
            actionClusterProps={threadActionClusterProps}
            threadRoot={threadRoot}
            selectedTopic={sel}
            t={t}
            bodyRef={bodyRef}
            threadRepliesPaneProps={threadRepliesPaneProps}
          />
        )}
        <ComposeDock {...composerDockProps} />
      </div>
    </div>
  )
}
