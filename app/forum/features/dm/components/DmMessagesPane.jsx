'use client'

import React from 'react'
import DmThreadHeader from './DmThreadHeader'
import DmThreadAlerts from './DmThreadAlerts'
import DmThreadLoadMore from './DmThreadLoadMore'
import DmThreadMessageRow from './DmThreadMessageRow'
import DmDialogsPane from './DmDialogsPane'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

const DM_THREAD_SPACER_SKELETON_MIN_PX = 96
const DM_THREAD_SPACER_SKELETON_MAX_ROWS = 4

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function ForumPaneSkeleton({ rows = 3, label = 'Loading', compact = false }) {
  return (
    <div className={`forumSkeletonPane${compact ? ' forumSkeletonPane--compact' : ''}`} role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div className="forumSkeletonCard" key={`dm-thread-skeleton-${idx}`}>
          <div className="forumSkeletonHeader">
            <span className="forumSkeletonAvatar" />
            <span className="forumSkeletonTitle" />
          </div>
          <div className="forumSkeletonBody">
            <span className="forumSkeletonLine forumSkeletonLine--wide" />
            <span className="forumSkeletonLine forumSkeletonLine--mid" />
            <span className="forumSkeletonLine forumSkeletonLine--short" />
          </div>
          <div className="forumSkeletonMetrics">
            <span className="forumSkeletonMetric" />
            <span className="forumSkeletonMetric" />
            <span className="forumSkeletonMetric" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DmThreadWindowSpacer({ height = 0, edge = 'top', label = 'Loading' }) {
  const ref = React.useRef(null)
  const [view, setView] = React.useState({ visible: false, offset: 0, rows: 1 })

  React.useEffect(() => {
    const h = Math.max(0, Number(height || 0) || 0)
    if (h < DM_THREAD_SPACER_SKELETON_MIN_PX || typeof window === 'undefined') {
      setView((prev) => (prev.visible ? { visible: false, offset: 0, rows: 1 } : prev))
      return undefined
    }

    let rafId = 0
    const update = () => {
      rafId = 0
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const vh = Number(window.innerHeight || 0) || 0
      const visiblePx = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
      if (visiblePx <= DM_THREAD_SPACER_SKELETON_MIN_PX) {
        setView((prev) => (prev.visible ? { visible: false, offset: 0, rows: 1 } : prev))
        return
      }

      const estimate = clampNumber(Number(readForumCardEstimate('dm_message') || 260), 180, 320)
      const rows = clampNumber(Math.ceil((visiblePx + estimate * 0.55) / estimate), 1, DM_THREAD_SPACER_SKELETON_MAX_ROWS)
      const skeletonPx = Math.min(h, rows * estimate)
      const viewportOffset = Math.max(0, -rect.top) + 8
      const offset = clampNumber(viewportOffset, 0, Math.max(0, h - skeletonPx))
      setView((prev) => (
        prev.visible === true && prev.offset === offset && prev.rows === rows
          ? prev
          : { visible: true, offset, rows }
      ))
    }
    const queue = () => {
      if (rafId) return
      rafId = window.requestAnimationFrame(update)
    }

    queue()
    const timers = [80, 260, 620].map((ms) => window.setTimeout(queue, ms))
    window.addEventListener('scroll', queue, { passive: true, capture: true })
    window.addEventListener('resize', queue, { passive: true })
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId)
      timers.forEach((timerId) => window.clearTimeout(timerId))
      window.removeEventListener('scroll', queue, { capture: true })
      window.removeEventListener('resize', queue)
    }
  }, [height])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`dmThreadWindowSpacer dmThreadWindowSpacer--${edge}`}
      data-dm-thread-window-spacer={edge}
      style={{ height: Math.max(0, Number(height || 0) || 0) }}
    >
      {view.visible && (
        <div
          className="dmThreadWindowSkeleton"
          data-dm-thread-window-skeleton={edge}
          style={{ transform: `translateY(${view.offset}px)` }}
        >
          <ForumPaneSkeleton rows={view.rows} label={label} compact />
        </div>
      )}
    </div>
  )
}

export default function DmMessagesPane({
  dmWithUserId,
  dmBlockedMap,
  dmBlockedByReceiverMap,
  meId,
  t,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  dmThreadRef,
  dmThreadHasMore,
  dmThreadLoading,
  dmThreadCursor,
  loadDmThread,
  dmThreadItems,
  dmDeletedMsgMap,
  dmThreadSeenTs,
  dmTranslateMap,
  setDmTranslateMap,
  resolveProfileAccountId,
  resolveNickForDisplay,
  resolveIconForDisplay,
  openDmDeletePopover,
  toggleDmBlock,
  locale,
  dmDialogs,
  dmDeletedMap,
  dmSeenMap,
  pushNavState,
  setInboxTab,
  setDmWithUserId,
  stripMediaUrlsFromText,
  dmDialogsHasMore,
  dmDialogsLoading,
  dmDialogsCursor,
  loadDmDialogs,
  dmDialogsLoaded,
  LoadMoreSentinel,
}) {
  const dmThreadItemCount = (dmThreadItems || []).length
  const dmThreadRenderItems = React.useMemo(
    () => (Array.isArray(dmThreadItems) ? dmThreadItems.slice().reverse() : []),
    [dmThreadItems],
  )
  const showInitialDmThreadSkeleton = !!dmWithUserId && dmThreadItemCount === 0 && (!!dmThreadLoading || !!dmThreadHasMore)
  const { win: dmThreadWin, measureRef: dmThreadMeasureRef } = useForumWindowing({
    active: !!dmWithUserId,
    items: dmThreadRenderItems,
    getItemKey: (message, index) => String(message?.id || `${message?.ts || 0}:${index}`),
    getItemDomId: (message) => (message?.id ? `dm_msg_${message.id}` : ''),
    estimateItemHeight: () => readForumCardEstimate('dm_message'),
    maxRender: () => readForumWindowingMaxRender('dm_message'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('dm_message', velocity),
    listId: 'forum:dm-thread',
  })

  if (dmWithUserId) {
    return (
      <>
        <DmThreadAlerts
          dmWithUserId={dmWithUserId}
          dmBlockedMap={dmBlockedMap}
          dmBlockedByReceiverMap={dmBlockedByReceiverMap}
          t={t}
        />
        <DmThreadHeader
          uid={dmWithUserId}
          meId={meId}
          t={t}
          starredAuthors={starredAuthors}
          onToggleStar={toggleAuthorStar}
          onUserInfoToggle={handleUserInfoToggle}
        />
        <div className="dmThreadHeaderRail" aria-hidden="true" />
        <div className="dmThread" data-dm-thread-order="newest-first" ref={dmThreadRef}>
          {showInitialDmThreadSkeleton && (
            <ForumPaneSkeleton rows={3} label={t?.('loading') || 'Loading'} />
          )}
          {!showInitialDmThreadSkeleton && dmThreadWin.top > 0 && (
            <DmThreadWindowSpacer
              edge="top"
              height={dmThreadWin.top}
              label={t?.('loading') || 'Loading'}
            />
          )}
          {!showInitialDmThreadSkeleton && dmThreadRenderItems.slice(dmThreadWin.start, dmThreadWin.end).map((m, indexInWindow) => {
            const messageKey = String(m?.id || `${m?.ts || 0}:${dmThreadWin.start + indexInWindow}`)
            const messageDomId = m?.id ? `dm_msg_${m.id}` : ''
            return (
              <div
                key={messageKey}
                id={messageDomId || undefined}
                data-dm-message-shell="1"
                data-dm-message-id={m?.id ? String(m.id) : undefined}
                ref={dmThreadMeasureRef(messageKey)}
              >
                <DmThreadMessageRow
                  m={m}
                  dmDeletedMsgMap={dmDeletedMsgMap}
                  dmWithUserId={dmWithUserId}
                  meId={meId}
                  dmThreadSeenTs={dmThreadSeenTs}
                  dmBlockedMap={dmBlockedMap}
                  dmTranslateMap={dmTranslateMap}
                  setDmTranslateMap={setDmTranslateMap}
                  resolveProfileAccountId={resolveProfileAccountId}
                  resolveNickForDisplay={resolveNickForDisplay}
                  resolveIconForDisplay={resolveIconForDisplay}
                  handleUserInfoToggle={handleUserInfoToggle}
                  openDmDeletePopover={openDmDeletePopover}
                  toggleDmBlock={toggleDmBlock}
                  locale={locale}
                  t={t}
                />
              </div>
            )
          })}
          {!showInitialDmThreadSkeleton && dmThreadWin.bottom > 0 && (
            <DmThreadWindowSpacer
              edge="bottom"
              height={dmThreadWin.bottom}
              label={t?.('loading') || 'Loading'}
            />
          )}
          {!showInitialDmThreadSkeleton && (
            <DmThreadLoadMore
              dmThreadHasMore={dmThreadHasMore}
              dmThreadLoading={dmThreadLoading}
              dmThreadCursor={dmThreadCursor}
              dmWithUserId={dmWithUserId}
              loadDmThread={loadDmThread}
              t={t}
              LoadMoreSentinel={LoadMoreSentinel}
            />
          )}
          <div aria-hidden="true" data-dm-thread-bottom-anchor="1" />
          {!showInitialDmThreadSkeleton && dmThreadItemCount === 0 && !dmThreadLoading && !dmThreadHasMore && (
            <div className="meta">{t('empty_messages')}</div>
          )}
        </div>
      </>
    )
  }

  return (
    <DmDialogsPane
      dmDialogs={dmDialogs}
      meId={meId}
      dmDeletedMap={dmDeletedMap}
      dmSeenMap={dmSeenMap}
      t={t}
      pushNavState={pushNavState}
      setInboxTab={setInboxTab}
      setDmWithUserId={setDmWithUserId}
      openDmDeletePopover={openDmDeletePopover}
      starredAuthors={starredAuthors}
      toggleAuthorStar={toggleAuthorStar}
      handleUserInfoToggle={handleUserInfoToggle}
      stripMediaUrlsFromText={stripMediaUrlsFromText}
      dmDialogsHasMore={dmDialogsHasMore}
      dmDialogsLoading={dmDialogsLoading}
      dmDialogsCursor={dmDialogsCursor}
      loadDmDialogs={loadDmDialogs}
      dmDialogsLoaded={dmDialogsLoaded}
      LoadMoreSentinel={LoadMoreSentinel}
    />
  )
}
