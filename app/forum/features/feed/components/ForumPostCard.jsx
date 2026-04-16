'use client'

import React from 'react'
import { useI18n } from '../../../../../components/i18n'
import useVipFlag from '../../profile/hooks/useVipFlag'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'
import PostActionBar from './PostActionBar'
import PostMediaStack from './PostMediaStack'
import PostBodyContent from './PostBodyContent'
import PostTranslateToggle from './PostTranslateToggle'
import PostOwnerMenu from './PostOwnerMenu'
import PostFxLayer from './PostFxLayer'
import PostHeaderMeta from './PostHeaderMeta'
import usePostTranslation from '../hooks/usePostTranslation'
import usePostMediaTextModel from '../hooks/usePostMediaTextModel'
import usePostFx from '../hooks/usePostFx'
import usePostParentReplyNav from '../hooks/usePostParentReplyNav'

export default function ForumPostCard({
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
  isSelfAuthor = false,
  isStarredAuthor = false,
  onToggleStar,
  onUserInfoToggle,
  richRenderer,
  enableVideoControlsOnTap,
  rearmPooledFxNode,
  VideoMediaComponent,
  QCastPlayerComponent,
}) {
  const { locale } = useI18n()
  const cardRef = React.useRef(null)

  const { parentSnippet, jumpToParent } = usePostParentReplyNav({
    post: p,
    parentText,
    parentPost,
    onOpenThread,
  })

  const [, setLightbox] = React.useState({ open: false, src: null, idx: 0, list: [] })

  const views = Number(p?.views ?? 0)
  const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
  const rawUserId = String(p?.userId || p?.accountId || '').trim()
  const isSelf = !!isSelfAuthor
  const isStarred = !!isStarredAuthor
  const isVipAuthor = useVipFlag(authorId, p?.vipActive ?? p?.isVip ?? p?.vip ?? p?.vipUntil ?? null)

  const replies = Number(
    p?.replyCount ??
      p?.repliesCount ??
      p?.answersCount ??
      p?.commentsCount ??
      p?.__repliesCount ??
      0,
  )
  const likes = Number(p?.likes ?? 0)
  const dislikes = Number(p?.dislikes ?? 0)

  const {
    FX_POOL,
    BOOM_POOL,
    POST_BOOM_ENABLED,
    setFxNodeRef,
    setBoomNodeRef,
    runPostButtonFx,
  } = usePostFx({
    cardRef,
    rearmPooledFxNode,
  })

  const {
    cleanedText,
    stickerEntries,
    imgLines,
    videoLines,
    ytLines,
    tiktokLines,
    audioLines,
    ytEmbedParams,
    YT_RE,
  } = usePostMediaTextModel({
    text: [p?.text, p?.message, p?.body, p?.html].filter(Boolean).join('\n'),
    postId: p?.id,
    isVideoFeed,
  })

  const {
    isTranslated,
    translateLoading,
    displayText,
    translateBtnLabel,
    hasCleanedText,
    handleToggleTranslate,
  } = usePostTranslation({
    postId: p?.id,
    cleanedText,
    locale,
    t,
  })

  const isOwner = !!authId && String(authId) === String(resolveProfileAccountId(p?.userId || p?.accountId))
  const markFocusedView = React.useCallback(() => {
    const id = p?.id
    if (!id) return
    try {
      markView?.(id)
    } catch {}
  }, [markView, p?.id])

  return (
    <article
      ref={cardRef}
      className="item"
      style={{ position: 'relative' }}
      data-forum-post-card="1"
      data-forum-post-id={String(p?.id || '')}
      role="article"
      aria-label={t('forum_post_aria')}
      onPointerEnter={markFocusedView}
      onFocusCapture={markFocusedView}
      onTouchStart={markFocusedView}
    >
      <PostFxLayer
        FX_POOL={FX_POOL}
        BOOM_POOL={BOOM_POOL}
        POST_BOOM_ENABLED={POST_BOOM_ENABLED}
        setFxNodeRef={setFxNodeRef}
        setBoomNodeRef={setBoomNodeRef}
      />

      <div className="postBodyFrame">
        <PostOwnerMenu isOwner={isOwner} post={p} onOwnerDelete={onOwnerDelete} t={t} />
        <PostHeaderMeta
          p={p}
          authorId={authorId}
          rawUserId={rawUserId}
          isSelf={isSelf}
          isStarred={isStarred}
          isVipAuthor={isVipAuthor}
          onToggleStar={onToggleStar}
          onUserInfoToggle={onUserInfoToggle}
          parentAuthor={parentAuthor}
          parentSnippet={parentSnippet}
          onJumpToParent={jumpToParent}
          t={t}
        />
        <PostMediaStack
          imgLines={imgLines}
          videoLines={videoLines}
          ytLines={ytLines}
          tiktokLines={tiktokLines}
          audioLines={audioLines}
          onOpenLightbox={(src, idx, list) => setLightbox({ open: true, src, idx, list })}
          VideoMediaComponent={VideoMediaComponent}
          onEnableVideoControls={enableVideoControlsOnTap}
          QCastPlayerComponent={QCastPlayerComponent}
          ytEmbedParams={ytEmbedParams}
          postId={p?.id}
          posterUrl={p?.posterUrl}
          YT_RE={YT_RE}
        />

        <PostBodyContent
          displayText={displayText}
          renderRich={richRenderer}
          stickerEntries={stickerEntries}
        />
        <div className="forumDividerRail forumDividerRail--gold" aria-hidden="true" />

        <PostActionBar
          t={t}
          p={p}
          views={views}
          replies={replies}
          likes={likes}
          dislikes={dislikes}
          runPostButtonFx={runPostButtonFx}
          onOpenThread={onOpenThread}
          onReact={onReact}
          onShare={onShare}
          onReport={onReport}
          isAdmin={isAdmin}
          onDeletePost={onDeletePost}
          isBanned={isBanned}
          onUnbanUser={onUnbanUser}
          onBanUser={onBanUser}
        />
        <div className="forumDividerRail forumDividerRail--gold" aria-hidden="true" />

        <PostTranslateToggle
          hasCleanedText={hasCleanedText}
          isTranslated={isTranslated}
          translateLoading={translateLoading}
          translateBtnLabel={translateBtnLabel}
          onToggleTranslate={handleToggleTranslate}
        />
      </div>
    </article>
  )
}
