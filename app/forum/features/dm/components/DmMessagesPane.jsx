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

function ForumPaneSkeleton({ rows = 3, label = 'Loading' }) {
  return (
    <div className="forumSkeletonPane" role="status" aria-label={label}>
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
  const showInitialDmThreadSkeleton = !!dmWithUserId && dmThreadItemCount === 0 && (!!dmThreadLoading || !!dmThreadHasMore)
  const { win: dmThreadWin, measureRef: dmThreadMeasureRef } = useForumWindowing({
    active: !!dmWithUserId,
    items: dmThreadItems || [],
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
        <div className="dmThread" ref={dmThreadRef}>
          <DmThreadLoadMore
            dmThreadHasMore={dmThreadHasMore}
            dmThreadLoading={dmThreadLoading}
            dmThreadCursor={dmThreadCursor}
            dmWithUserId={dmWithUserId}
            loadDmThread={loadDmThread}
            t={t}
            LoadMoreSentinel={LoadMoreSentinel}
          />
          {showInitialDmThreadSkeleton && (
            <ForumPaneSkeleton rows={3} label={t?.('loading') || 'Loading'} />
          )}
          {!showInitialDmThreadSkeleton && dmThreadWin.top > 0 && (
            <div
              aria-hidden="true"
              data-dm-thread-window-spacer="top"
              style={{ height: dmThreadWin.top }}
            />
          )}
          {!showInitialDmThreadSkeleton && (dmThreadItems || []).slice(dmThreadWin.start, dmThreadWin.end).map((m, indexInWindow) => (
            <div
              key={m?.id || `${m?.ts || 0}:${dmThreadWin.start + indexInWindow}`}
              ref={dmThreadMeasureRef(String(m?.id || `${m?.ts || 0}:${dmThreadWin.start + indexInWindow}`))}
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
          ))}
          {!showInitialDmThreadSkeleton && dmThreadWin.bottom > 0 && (
            <div
              aria-hidden="true"
              data-dm-thread-window-spacer="bottom"
              style={{ height: dmThreadWin.bottom }}
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
