'use client'

import React from 'react'
import ForumPostCard from './ForumPostCard'
import { rich } from '../../../shared/utils/richText'
import { arePostCardBridgePropsEqual } from '../utils/cardMemo'
import {
  __rearmPooledFxNode,
  VideoMedia,
  QCastPlayer,
  enableVideoControlsOnTap,
} from '../../media/utils/mediaLifecycleRuntime'

const PostCardBridge = React.memo(function PostCardBridge({
  p,
  parentAuthor,
  parentText,
  parentPost,
  onReport,
  onShare,
  onOpenThread,
  threadOpenOptions = null,
  onReact,
  isAdmin,
  onDeletePost,
  onOwnerDelete,
  onBanUser,
  onUnbanUser,
  isBanned,
  authId,
  markView,
  t,
  isVideoFeed = false,
  isSelfAuthor = false,
  isStarredAuthor = false,
  onToggleStar,
  onUserInfoToggle,
}) {
  const handleOpenThread = React.useCallback(
    (clickPost) => {
      onOpenThread?.(clickPost || p, threadOpenOptions || undefined)
    },
    [onOpenThread, p, threadOpenOptions],
  )

  return (
    <ForumPostCard
      p={p}
      parentAuthor={parentAuthor}
      parentText={parentText}
      parentPost={parentPost}
      onReport={onReport}
      onShare={onShare}
      onOpenThread={handleOpenThread}
      onReact={onReact}
      isAdmin={isAdmin}
      onDeletePost={onDeletePost}
      onOwnerDelete={onOwnerDelete}
      onBanUser={onBanUser}
      onUnbanUser={onUnbanUser}
      isBanned={isBanned}
      authId={authId}
      markView={markView}
      t={t}
      isVideoFeed={isVideoFeed}
      isSelfAuthor={isSelfAuthor}
      isStarredAuthor={isStarredAuthor}
      onToggleStar={onToggleStar}
      onUserInfoToggle={onUserInfoToggle}
      richRenderer={rich}
      enableVideoControlsOnTap={enableVideoControlsOnTap}
      rearmPooledFxNode={__rearmPooledFxNode}
      VideoMediaComponent={VideoMedia}
      QCastPlayerComponent={QCastPlayer}
    />
  )
}, arePostCardBridgePropsEqual)

PostCardBridge.displayName = 'PostCardBridge'

export default PostCardBridge
