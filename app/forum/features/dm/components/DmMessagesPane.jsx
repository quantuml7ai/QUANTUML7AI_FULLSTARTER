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
  readForumWindowingItemGap,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

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
  const { win: dmThreadWin, measureRef: dmThreadMeasureRef } = useForumWindowing({
    active: !!dmWithUserId,
    items: dmThreadItems || [],
    getItemKey: (message, index) => String(message?.id || `${message?.ts || 0}:${index}`),
    getItemDomId: (message) => (message?.id ? `dm_msg_${message.id}` : ''),
    estimateItemHeight: () => readForumCardEstimate('dm_message'),
    maxRender: () => readForumWindowingMaxRender('dm_message'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('dm_message', velocity),
    itemGapPx: () => readForumWindowingItemGap('dm_message'),
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
          {dmThreadWin.top > 0 && <div aria-hidden="true" style={{ height: dmThreadWin.top }} />}
          {(dmThreadItems || []).slice(dmThreadWin.start, dmThreadWin.end).map((m, indexInWindow) => (
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
          {dmThreadWin.bottom > 0 && <div aria-hidden="true" style={{ height: dmThreadWin.bottom }} />}
          {(dmThreadItems || []).length === 0 && !dmThreadLoading && (
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
