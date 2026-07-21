'use client'

import React from 'react'
import ComposerMediaProgressBar from './ComposerMediaProgressBar'
import ComposerActionRail from './ComposerActionRail'
import ComposerTextInput from './ComposerTextInput'
import ComposerEmojiPreview from './ComposerEmojiPreview'
import ComposerEmojiPanel from './ComposerEmojiPanel'
import ComposerFileInput from './ComposerFileInput'
import ComposerAttachmentPreview from '../../media/components/ComposerAttachmentPreview'
import DmVoicePlayer from '../../dm/components/DmVoicePlayer'
import { cls } from '../../../shared/utils/classnames'

export default function ComposerCore({
  composerActive,
  mediaBarOn,
  mediaPhase,
  mediaPct,
  formatMediaPhase,
  t,
  cancelMediaOperation,
  text,
  textLimit,
  mediaLocked,
  composerMediaKind,
  handleAttachClick,
  setEmojiOpen,
  videoState,
  onVideoButtonClick,
  recState,
  voiceTapLabel,
  stopRecord,
  startRecord,
  recElapsed,
  postingRef,
  cooldownLeft,
  canSend,
  composerBusy,
  dmMode,
  dmSupportMode,
  onSendClick,
  setText,
  setComposerActive,
  pendingImgs,
  setPendingImgs,
  pendingSticker,
  setPendingSticker,
  pendingVideo,
  pendingVideoInfoRef,
  pendingVideoBlobMetaRef,
  pendingAudio,
  openPendingVideoFullscreen,
  removePendingVideoAttachment,
  setPendingAudio,
  emojiOpen,
  emojiTab,
  setEmojiTab,
  addEmoji,
  VIP_EMOJI,
  EMOJI,
  fileInputRef,
  onFilesChosen,
  fileInputAccept,
}) {
  const pendingVideoMirror = React.useMemo(() => {
    const src = String(pendingVideo || '').trim()
    if (!src) return false
    let meta = null
    try { meta = pendingVideoBlobMetaRef?.current?.get?.(src) || null } catch {}
    try { if (!meta) meta = pendingVideoInfoRef?.current || null } catch {}
    const facingMode = String(meta?.cameraFacingMode || '').toLowerCase()
    return !!(meta?.frontCameraMirror || meta?.mirrorVideo || facingMode === 'user' || facingMode === 'front')
  }, [pendingVideo, pendingVideoBlobMetaRef, pendingVideoInfoRef])

  return (
    <>
      <div className="forumComposer">
        <div className="taWrap" data-active={composerActive}>
          <ComposerMediaProgressBar
            mediaBarOn={mediaBarOn}
            mediaPhase={mediaPhase}
            mediaPct={mediaPct}
            formatMediaPhase={formatMediaPhase}
            t={t}
            onCancel={cancelMediaOperation}
            pipelineKind={pendingVideo ? 'video' : (pendingAudio ? 'audio' : 'media')}
          />
          <ComposerActionRail
            text={text}
            textLimit={textLimit}
            mediaLocked={mediaLocked}
            composerMediaKind={composerMediaKind}
            handleAttachClick={handleAttachClick}
            t={t}
            setEmojiOpen={setEmojiOpen}
            videoState={videoState}
            onVideoButtonClick={onVideoButtonClick}
            recState={recState}
            voiceTapLabel={voiceTapLabel}
            stopRecord={stopRecord}
            startRecord={startRecord}
            recElapsed={recElapsed}
            cls={cls}
            postingRef={postingRef}
            cooldownLeft={cooldownLeft}
            canSend={canSend}
            composerBusy={composerBusy}
            dmMode={dmMode}
            dmSupportMode={dmSupportMode}
            onSendClick={onSendClick}
          />

          <ComposerTextInput
            text={text}
            setText={setText}
            textLimit={textLimit}
            t={t}
            setComposerActive={setComposerActive}
          />

          <ComposerEmojiPreview
            pendingSticker={dmSupportMode ? null : pendingSticker}
            setPendingSticker={setPendingSticker}
            t={t}
          />
        </div>

        <ComposerAttachmentPreview
          pendingImgs={dmSupportMode ? [] : pendingImgs}
          setPendingImgs={setPendingImgs}
          pendingVideo={dmSupportMode ? '' : pendingVideo}
          pendingVideoMirror={pendingVideoMirror}
          pendingAudio={dmSupportMode ? '' : pendingAudio}
          t={t}
          onOpenVideoFullscreen={openPendingVideoFullscreen}
          onRemoveVideo={removePendingVideoAttachment}
          onRemoveAudio={() => setPendingAudio(null)}
          AudioPreviewPlayer={DmVoicePlayer}
        />

        <ComposerEmojiPanel
          emojiOpen={dmSupportMode ? false : emojiOpen}
          emojiTab={emojiTab}
          setEmojiTab={setEmojiTab}
          setEmojiOpen={setEmojiOpen}
          addEmoji={addEmoji}
          VIP_EMOJI={VIP_EMOJI}
          EMOJI={EMOJI}
          t={t}
          stickersDisabled={!!composerMediaKind && composerMediaKind !== 'sticker'}
        />
      </div>

      <ComposerFileInput
        fileInputRef={fileInputRef}
        onFilesChosen={onFilesChosen}
        mediaLocked={mediaLocked || dmSupportMode}
        accept={fileInputAccept}
      />
    </>
  )
}
