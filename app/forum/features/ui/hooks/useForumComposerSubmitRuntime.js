import useForumCreateTopicAction from '../../feed/hooks/useForumCreateTopicAction'
import useForumCreatePostAction from '../../feed/hooks/useForumCreatePostAction'
import useForumViewTracking from '../../feed/hooks/useForumViewTracking'
import useComposerEmojiState from './useComposerEmojiState'
import useComposerActionHandlers from './useComposerActionHandlers'
import useForumComposerAttachments from '../../media/hooks/useForumComposerAttachments'

export default function useForumComposerSubmitRuntime({
  createTopicArgs,
  createPostArgs,
  viewTrackingArgs,
  emojiArgs,
  actionHandlersArgs,
  attachmentsArgs,
  text,
  pendingImgs,
  pendingSticker,
  pendingAudio,
  pendingVideo,
}) {
  const canSend = (String(text || '').trim().length > 0)
    || (pendingImgs.length > 0)
    || !!pendingSticker?.src
    || !!pendingAudio
    || !!pendingVideo

  const { createTopic } = useForumCreateTopicAction(createTopicArgs)
  const { postingRef, createPost } = useForumCreatePostAction(createPostArgs)
  const { markViewPost, markViewTopic } = useForumViewTracking(viewTrackingArgs)

  const {
    emojiOpen,
    setEmojiOpen,
    emojiTab,
    setEmojiTab,
    addEmoji,
  } = useComposerEmojiState(emojiArgs)

  const {
    handleComposerVideoButtonClick,
    handleComposerSendButtonClick,
  } = useComposerActionHandlers({
    ...actionHandlersArgs,
    createPost,
    postingRef,
    pendingVideo,
    videoOpen: actionHandlersArgs.videoOpen,
    setEmojiOpen,
  })

  const {
    fileInputRef,
    fileInputAccept,
    handleAttachClick,
    onFilesChosen,
  } = useForumComposerAttachments(attachmentsArgs)

  return {
    canSend,
    createTopic,
    postingRef,
    markViewPost,
    markViewTopic,
    emojiOpen,
    setEmojiOpen,
    emojiTab,
    setEmojiTab,
    addEmoji,
    handleComposerVideoButtonClick,
    handleComposerSendButtonClick,
    fileInputRef,
    fileInputAccept,
    handleAttachClick,
    onFilesChosen,
  }
}
