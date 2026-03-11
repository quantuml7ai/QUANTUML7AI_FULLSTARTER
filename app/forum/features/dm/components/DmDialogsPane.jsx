'use client'

import React from 'react'
import DmDialogRow from './DmDialogRow'

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
  return (
    <>
      {(dmDialogs || []).map((d) => (
        <DmDialogRow
          key={`dm:${String(d?.userId || '')}`}
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
      ))}
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
