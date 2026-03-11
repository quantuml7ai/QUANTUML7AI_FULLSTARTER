'use client'

import React from 'react'
import ForumPostCard from './ForumPostCard'
import { rich } from '../../../shared/utils/richText'
import {
  __rearmPooledFxNode,
  VideoMedia,
  QCastPlayer,
  enableVideoControlsOnTap,
} from '../../media/utils/mediaLifecycleRuntime'

export default function PostCardBridge({
  p,
  parentAuthor,
  parentText,
  parentPost,
  onReport,
  onShare,
  onOpenThread,
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
  viewerId,
  starredAuthors,
  onToggleStar,
  onUserInfoToggle,
}) {
  return (
    <ForumPostCard
      p={p}
      parentAuthor={parentAuthor}
      parentText={parentText}
      parentPost={parentPost}
      onReport={onReport}
      onShare={onShare}
      onOpenThread={onOpenThread}
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
      viewerId={viewerId}
      starredAuthors={starredAuthors}
      onToggleStar={onToggleStar}
      onUserInfoToggle={onUserInfoToggle}
      richRenderer={rich}
      enableVideoControlsOnTap={enableVideoControlsOnTap}
      rearmPooledFxNode={__rearmPooledFxNode}
      VideoMediaComponent={VideoMedia}
      QCastPlayerComponent={QCastPlayer}
    />
  )
}

