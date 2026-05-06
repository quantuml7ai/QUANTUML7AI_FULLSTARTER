'use client'

import React from 'react'
import DmDialogRow from './DmDialogRow'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
  readForumWindowingItemGap,
  readForumWindowingMaxRender,
  readForumWindowingOverscan,
} from '../../../shared/utils/forumWindowingPresets'

export default function DmDialogsPane({
  dmDialogs,
  meId,
  dmDeletedMap,
  dmSeenMap,
  t,
  pushNavState,
  setInboxTab,
  setDmWithUserId,
  openDmDeletePopover,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  stripMediaUrlsFromText,
  dmDialogsHasMore,
  dmDialogsLoading,
  dmDialogsCursor,
  loadDmDialogs,
  dmDialogsLoaded,
  LoadMoreSentinel,
}) {
  const { win: dialogsWin, measureRef: dialogsMeasureRef } = useForumWindowing({
    active: true,
    items: dmDialogs || [],
    getItemKey: (dialog, index) => String(dialog?.userId || `dm:${index}`),
    getItemDomId: (dialog) => (
      dialog?.userId
        ? `dm_${String(dialog.userId).trim()}`
        : ''
    ),
    estimateItemHeight: () => readForumCardEstimate('dm_dialog'),
    maxRender: () => readForumWindowingMaxRender('dm_dialog'),
    overscanPx: ({ velocity }) => readForumWindowingOverscan('dm_dialog', velocity),
    itemGapPx: () => readForumWindowingItemGap('dm_dialog'),
    listId: 'forum:dm-dialogs',
  })

  return (
    <>
      {dialogsWin.top > 0 && <div aria-hidden="true" style={{ height: dialogsWin.top }} />}
      {(dmDialogs || []).slice(dialogsWin.start, dialogsWin.end).map((d) => (
        <div
          key={`dm:${String(d?.userId || '')}`}
          ref={dialogsMeasureRef(String(d?.userId || ''))}
        >
          <DmDialogRow
            dialog={d}
            meId={meId}
            dmDeletedMap={dmDeletedMap}
            dmSeenMap={dmSeenMap}
            t={t}
            onOpen={(uid, entryId) => {
              pushNavState(entryId || `dm_${uid}`)
              setInboxTab('messages')
              setDmWithUserId(uid)
            }}
            onDelete={(uid, nick, e) => openDmDeletePopover('dialog', { uid, nick }, e)}
            starredAuthors={starredAuthors}
            onToggleStar={toggleAuthorStar}
            onUserInfoToggle={handleUserInfoToggle}
            stripMediaUrlsFromText={stripMediaUrlsFromText}
          />
        </div>
      ))}
      {dialogsWin.bottom > 0 && <div aria-hidden="true" style={{ height: dialogsWin.bottom }} />}
      {dmDialogsHasMore && (
        <>
        <div className="loadMoreFooter dmLoadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading')}
          </div>
        </div>
        <LoadMoreSentinel
          disabled={dmDialogsLoading || !dmDialogsHasMore}
          onVisible={() => {
            if (dmDialogsCursor) loadDmDialogs(dmDialogsCursor)
          }}
        />
        </>
      )}
      {(dmDialogs || []).length === 0 && dmDialogsLoaded && !dmDialogsLoading && !dmDialogsHasMore && (
        <div className="meta">
          {t('empty_messages')}
        </div>
      )}
    </>
  )
}
