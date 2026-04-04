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
  dmMode,
  onSendClick,
  setText,
  setComposerActive,
  pendingImgs,
  setPendingImgs,
  pendingVideo,
  pendingVideoMirrorPreview,
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
}) {
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
          />
          <ComposerActionRail
            text={text}
            textLimit={textLimit}
            mediaLocked={mediaLocked}
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
            dmMode={dmMode}
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
            text={text}
            setText={setText}
            t={t}
          />
        </div>

        <ComposerAttachmentPreview
          pendingImgs={pendingImgs}
          setPendingImgs={setPendingImgs}
          pendingVideo={pendingVideo}
          mirrorPreview={pendingVideoMirrorPreview}
          pendingAudio={pendingAudio}
          t={t}
          onOpenVideoFullscreen={openPendingVideoFullscreen}
          onRemoveVideo={removePendingVideoAttachment}
          onRemoveAudio={() => setPendingAudio(null)}
          AudioPreviewPlayer={DmVoicePlayer}
        />

        <ComposerEmojiPanel
          emojiOpen={emojiOpen}
          emojiTab={emojiTab}
          setEmojiTab={setEmojiTab}
          setEmojiOpen={setEmojiOpen}
          addEmoji={addEmoji}
          VIP_EMOJI={VIP_EMOJI}
          EMOJI={EMOJI}
          t={t}
        />
      </div>

      <ComposerFileInput
        fileInputRef={fileInputRef}
        onFilesChosen={onFilesChosen}
        mediaLocked={mediaLocked}
      />
    </>
  )
}
