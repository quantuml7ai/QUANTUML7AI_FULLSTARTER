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

function clean(value) {
  return String(value || '').trim()
}

function finiteCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function maxCount(...values) {
  return values.reduce((max, value) => Math.max(max, finiteCount(value)), 0)
}

function hasPostCounterAuthority(post = {}) {
  return Boolean(
    post?.__ql7PostCountersCoreHydrated ||
    post?.__ql7PostCountersThreadIndexHydrated ||
    post?.__ql7InboxCountersReadFallback ||
    post?.counters?.__ql7PostCountersCoreHydrated ||
    post?.counters?.__ql7PostCountersThreadIndexHydrated ||
    String(post?.__ql7CounterSource || post?.counters?.__ql7CounterSource || '').trim() === 'forum_core_posts' ||
    String(post?.__ql7CounterSource || post?.counters?.__ql7CounterSource || '').trim() === 'forum_thread_index'
  )
}

function readCanonicalPostCounters(post = {}) {
  const authoritative = hasPostCounterAuthority(post)
  const likes = maxCount(post?.likes, post?.counters?.likes)
  const dislikes = maxCount(post?.dislikes, post?.counters?.dislikes)
  const reactions = maxCount(
    post?.reactions,
    post?.reactionCount,
    post?.counters?.reactions,
    post?.counters?.reactionCount,
    authoritative ? 0 : post?.sort?.likes,
    likes + dislikes,
  )
  return {
    views: maxCount(post?.views, post?.counters?.views, authoritative ? 0 : post?.sort?.views),
    replies: maxCount(
      post?.replyCount,
      post?.repliesCount,
      post?.answersCount,
      post?.commentsCount,
      post?.__repliesCount,
      post?.replies,
      post?.counters?.replies,
      post?.counters?.replyCount,
      post?.counters?.repliesCount,
      post?.counters?.answersCount,
      post?.counters?.commentsCount,
      authoritative ? 0 : post?.sort?.replies,
      authoritative ? 0 : post?.sort?.replyCount,
      authoritative ? 0 : post?.sort?.repliesCount,
      authoritative ? 0 : post?.sort?.answersCount,
      authoritative ? 0 : post?.sort?.commentsCount,
    ),
    likes,
    reactions,
    dislikes,
  }
}

function readReplyTargetPost(post, parentPost) {
  if (parentPost && typeof parentPost === 'object') return parentPost
  if (post?.parentPost && typeof post.parentPost === 'object') return post.parentPost
  if (post?.replyTarget && typeof post.replyTarget === 'object') return post.replyTarget
  if (post?.replyTo && typeof post.replyTo === 'object') return post.replyTo
  const parentId = clean(post?.parentId || post?.replyToPostId)
  if (!parentId) return null
  return {
    id: parentId,
    postId: parentId,
    topicId: clean(post?.topicId),
    userId: clean(post?.replyToUserId || post?.replyToAccountId || post?.parentUserId || post?.parentAccountId),
    accountId: clean(post?.replyToAccountId || post?.replyToUserId || post?.parentAccountId || post?.parentUserId),
    nickname: clean(post?.replyToName || post?.replyToNickname || post?.parentAuthor || post?.parentNickname),
    icon: clean(post?.replyToIcon || post?.parentIcon),
    text: clean(post?.parentText || post?._parentText),
  }
}

function readReplyTargetAuthor(post, parentAuthor, fallbackPost) {
  const direct = clean(parentAuthor)
  if (direct) return direct
  const replyAuthor = post?.replyToAuthor && typeof post.replyToAuthor === 'object' ? post.replyToAuthor : null
  return clean(
    post?.parentAuthor ||
    post?.parentNickname ||
    post?.replyToName ||
    post?.replyToNickname ||
    replyAuthor?.nickname ||
    replyAuthor?.name ||
    fallbackPost?.nickname ||
    fallbackPost?.nick,
  )
}

function readReplyTargetText(post, parentText, fallbackPost) {
  return clean(
    parentText ||
    post?.parentText ||
    post?._parentText ||
    fallbackPost?.textSnippet ||
    fallbackPost?.text ||
    fallbackPost?.body ||
    fallbackPost?.message,
  )
}

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
  const effectiveParentPost = React.useMemo(
    () => readReplyTargetPost(p, parentPost),
    [p, parentPost],
  )
  const effectiveParentAuthor = React.useMemo(
    () => readReplyTargetAuthor(p, parentAuthor, effectiveParentPost),
    [p, parentAuthor, effectiveParentPost],
  )
  const effectiveParentText = React.useMemo(
    () => readReplyTargetText(p, parentText, effectiveParentPost),
    [p, parentText, effectiveParentPost],
  )

  const { parentSnippet, jumpToParent } = usePostParentReplyNav({
    post: p,
    parentText: effectiveParentText,
    parentPost: effectiveParentPost,
    onOpenThread,
  })

  const [, setLightbox] = React.useState({ open: false, src: null, idx: 0, list: [] })

  const canonicalCounters = React.useMemo(() => readCanonicalPostCounters(p), [p])
  const views = canonicalCounters.views
  const authorId = String(resolveProfileAccountId(p?.userId || p?.accountId) || '').trim()
  const rawUserId = String(p?.userId || p?.accountId || '').trim()
  const isSelf = !!isSelfAuthor
  const isStarred = !!isStarredAuthor
  const isVipAuthor = useVipFlag(authorId, p?.vipActive ?? p?.isVip ?? p?.vip ?? p?.vipUntil ?? null)

  const replies = canonicalCounters.replies
  const likes = canonicalCounters.likes
  const dislikes = canonicalCounters.dislikes

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
  const hasNativeVideo = videoLines.length > 0

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
      data-video-feed-card={isVideoFeed ? '1' : undefined}
      data-forum-native-video-card={hasNativeVideo ? '1' : undefined}
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
          parentAuthor={effectiveParentAuthor}
          parentSnippet={parentSnippet}
          onJumpToParent={jumpToParent}
          t={t}
        />
        </div>

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
          isVideoFeed={isVideoFeed}
        />
      <div className="postBodyFrame">
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
       </div>
        <PostTranslateToggle
          hasCleanedText={hasCleanedText}
          isTranslated={isTranslated}
          translateLoading={translateLoading}
          translateBtnLabel={translateBtnLabel}
          onToggleTranslate={handleToggleTranslate}
        />
      
    </article>
  )
}
