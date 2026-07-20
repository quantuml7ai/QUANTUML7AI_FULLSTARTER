'use client'

import React from 'react'
import DmDialogRow from './DmDialogRow'
import useForumWindowing from '../../../shared/hooks/useForumWindowing'
import {
  readForumCardEstimate,
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
  openQl7SupportThread,
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
    listId: 'forum:dm-dialogs',
  })
  const supportLabel = t?.('ql7_support_open_cta') || 'QL7 Support'
  const supportHint = t?.('ql7_support_open_hint') || supportLabel

  return (
    <>
      <div className="dmSupportLauncher" aria-label={supportHint}>
        <button
          type="button"
          className="dmSupportLauncherBtn"
          onClick={() => openQl7SupportThread?.()}
          aria-label={supportHint}
        >
          <span className="dmSupportLauncherIcon" aria-hidden="true">
            <svg viewBox="0 0 32 32" focusable="false">
              <path d="M7 18v-3a9 9 0 0 1 18 0v3" />
              <path d="M7 18h4v7H8.5A2.5 2.5 0 0 1 6 22.5v-2A2.5 2.5 0 0 1 8.5 18H11" />
              <path d="M25 18h-4v7h2.5A2.5 2.5 0 0 0 26 22.5v-2A2.5 2.5 0 0 0 23.5 18H21" />
              <path d="M21 25c0 2-1.7 3-5 3h-2" />
              <path d="M13 28h3" />
            </svg>
          </span>
          <span className="dmSupportLauncherText">{supportLabel}</span>
        </button>
      </div>
      <div className="dmSupportLauncherRail" aria-hidden="true" />
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
          <div className="loadMoreShimmer" role="status" aria-label={t?.('loading') || 'Loading'} />
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
