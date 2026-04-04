'use client'

import React from 'react'
import DmDeletePopover from './DmDeletePopover'
import VideoOverlay from '../../media/components/VideoOverlay'
import VideoLimitOverlay from '../../media/components/VideoLimitOverlay'
import ReportPopover from '../../moderation/components/ReportPopover'
import SharePopover from '../../../SharePopover'
import UserInfoPopover from '../../profile/components/UserInfoPopover'
import QuestClaimOverlay from '../../quests/components/QuestClaimOverlay'

export default function ForumOverlayStack({
  dmDeletePopover,
  dmDeleteText,
  dmDeleteCheckboxLabel,
  dmDeleteForAll,
  setDmDeleteForAll,
  closeDmDeletePopover,
  confirmDmDelete,
  t,
  videoOpen,
  videoState,
  videoElapsed,
  videoStreamRef,
  overlayMediaUrl,
  pendingVideo,
  overlayMediaKind,
  acceptMediaFromOverlay,
  startVideo,
  stopVideo,
  resetOrCloseOverlay,
  videoLimitOverlay,
  videoLimitCopy,
  forumVideoMaxSeconds,
  closeVideoLimitOverlay,
  reportUI,
  closeReportPopover,
  handleReportSelect,
  reportBusy,
  reportPopoverRef,
  uiDir,
  shareUI,
  closeSharePopover,
  toast,
  userInfoAnchorRef,
  userInfoOpen,
  closeUserInfoPopover,
  userInfoUid,
  onOpenUserPosts,
  onOpenUserTopics,
  rich,
  formatCount,
  claimFx,
  closeQuestClaimOverlay,
  confirmQuestClaim,
}) {
  return (
    <>
      <DmDeletePopover
        open={!!dmDeletePopover}
        rect={dmDeletePopover?.rect}
        title=""
        text={dmDeleteText}
        checkboxLabel={dmDeleteCheckboxLabel}
        checked={dmDeleteForAll}
        onChecked={setDmDeleteForAll}
        onCancel={closeDmDeletePopover}
        onConfirm={confirmDmDelete}
        cancelLabel={t('dm_delete_cancel') || t('forum_cancel')}
        confirmLabel={t('dm_delete_confirm') || t('forum_delete')}
      />
      <VideoOverlay
        open={videoOpen}
        state={
          !videoOpen
            ? 'hidden'
            : (videoState === 'recording'
                ? 'recording'
                : (videoState === 'preview'
                    ? 'preview'
                    : (videoState === 'processing' ? 'processing' : 'live')))
        }
        elapsed={videoElapsed}
        streamRef={videoStreamRef}
        previewUrl={overlayMediaUrl || pendingVideo}
        mediaKind={overlayMediaKind}
        onAccept={acceptMediaFromOverlay}
        onStart={startVideo}
        onStop={stopVideo}
        onResetConfirm={resetOrCloseOverlay}
        t={t}
      />
      <VideoLimitOverlay
        open={!!videoLimitOverlay?.open}
        copy={videoLimitCopy}
        maxSec={forumVideoMaxSeconds}
        durationSec={videoLimitOverlay?.durationSec}
        reason={videoLimitOverlay?.reason}
        onClose={closeVideoLimitOverlay}
      />
      <ReportPopover
        open={reportUI.open}
        anchorRect={reportUI.anchorRect}
        onClose={closeReportPopover}
        onSelect={handleReportSelect}
        t={t}
        busy={reportBusy}
        popoverRef={reportPopoverRef}
        dir={uiDir}
      />
      <SharePopover
        open={shareUI.open}
        post={shareUI.post}
        onClose={closeSharePopover}
        t={t}
        toast={toast}
      />
      <UserInfoPopover
        anchorRef={userInfoAnchorRef}
        open={userInfoOpen}
        onClose={closeUserInfoPopover}
        rawUserId={userInfoUid}
        t={t}
        renderRich={rich}
        formatCountFn={formatCount}
        onOpenUserPosts={onOpenUserPosts}
        onOpenUserTopics={onOpenUserTopics}
      />
      <QuestClaimOverlay
        claimFx={claimFx}
        t={t}
        onClose={closeQuestClaimOverlay}
        onClaim={confirmQuestClaim}
      />
    </>
  )
}
