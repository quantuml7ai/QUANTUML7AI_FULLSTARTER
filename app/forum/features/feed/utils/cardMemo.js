function readPrimitiveSig(value) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return JSON.stringify(value)
}

function readMediaEntrySig(entry) {
  if (!entry || typeof entry !== 'object') return readPrimitiveSig(entry)
  return [
    entry.url,
    entry.src,
    entry.href,
    entry.file,
    entry.mime,
    entry.type,
    entry.mediaType,
  ].map(readPrimitiveSig).join('::')
}

function readMediaListSig(list) {
  if (!Array.isArray(list) || !list.length) return ''
  return list.map(readMediaEntrySig).join('|')
}

function readEntitySig(value) {
  if (!value || typeof value !== 'object') return readPrimitiveSig(value)
  return [
    value.id,
    value._id,
    value.postId,
    value.topicId,
    value.parentId,
    value.parentPostId,
    value.userId,
    value.accountId,
    value.authorId,
    value.nickname,
    value.name,
    value.displayName,
    value.title,
    value.text,
    value.message,
    value.body,
    value.html,
    value.icon,
    value.avatar,
    value.avatarUrl,
    value.imageUrl,
  ].map(readPrimitiveSig).join('::')
}

export function readPostRenderSig(post) {
  if (!post || typeof post !== 'object') return ''
  return [
    post.id,
    post.topicId,
    post.parentId,
    post.ts,
    post.updatedAt,
    post.editedAt,
    post.userId,
    post.accountId,
    post.nickname,
    post.icon,
    post.text,
    post.message,
    post.body,
    post.html,
    post.parentText,
    post._parentText,
    post.parentAuthor,
    post.parentNickname,
    post.parentName,
    post.parentAccountId,
    post.parentAuthorId,
    post.parentPostId,
    post.replyToPostId,
    post.replyToAccountId,
    post.replyToAuthorId,
    post.replyToName,
    post.replyToNickname,
    post.replyToDisplayName,
    post.replyToText,
    post.replyToExcerpt,
    readEntitySig(post.parentPost),
    readEntitySig(post.replyTarget),
    readEntitySig(post.replyTo),
    readEntitySig(post.replyToAuthor),
    readEntitySig(post.parentAuthorProfile),
    post.views,
    post.likes,
    post.dislikes,
    post.reactions,
    post.reactionCount,
    post.replies,
    post.myReaction,
    post.replyCount,
    post.repliesCount,
    post.answersCount,
    post.commentsCount,
    post.__repliesCount,
    post.counters?.views,
    post.counters?.likes,
    post.counters?.dislikes,
    post.counters?.reactions,
    post.counters?.reactionCount,
    post.counters?.replies,
    post.counters?.replyCount,
    post.counters?.repliesCount,
    post.counters?.answersCount,
    post.counters?.commentsCount,
    post.counters?.top,
    post.sort?.views,
    post.sort?.likes,
    post.sort?.reactions,
    post.sort?.reactionCount,
    post.sort?.replies,
    post.sort?.replyCount,
    post.sort?.repliesCount,
    post.sort?.answersCount,
    post.sort?.commentsCount,
    post.sort?.top,
    post.sort?.new,
    post.vipActive,
    post.isVip,
    post.vip,
    post.vipUntil,
    post.posterUrl,
    post.imageUrl,
    post.videoUrl,
    post.audioUrl,
    readMediaListSig(post.attachments),
    readMediaListSig(post.files),
  ].map(readPrimitiveSig).join('|')
}

export function readParentPostSig(post) {
  if (!post || typeof post !== 'object') return ''
  return [
    post.id,
    post._id,
    post.postId,
    post.topicId,
    post.parentId,
    post.parentPostId,
    post.ts,
    post.updatedAt,
    post.userId,
    post.accountId,
    post.authorId,
    post.nickname,
    post.name,
    post.displayName,
    post.icon,
    post.avatar,
    post.avatarUrl,
    post.text,
    post.message,
    post.body,
    post.html,
  ].map(readPrimitiveSig).join('|')
}

export function arePostCardBridgePropsEqual(prevProps, nextProps) {
  return (
    prevProps.parentAuthor === nextProps.parentAuthor &&
    prevProps.parentText === nextProps.parentText &&
    prevProps.onReport === nextProps.onReport &&
    prevProps.onShare === nextProps.onShare &&
    prevProps.onOpenThread === nextProps.onOpenThread &&
    prevProps.threadOpenOptions === nextProps.threadOpenOptions &&
    prevProps.onReact === nextProps.onReact &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.onDeletePost === nextProps.onDeletePost &&
    prevProps.onOwnerDelete === nextProps.onOwnerDelete &&
    prevProps.onBanUser === nextProps.onBanUser &&
    prevProps.onUnbanUser === nextProps.onUnbanUser &&
    prevProps.isBanned === nextProps.isBanned &&
    prevProps.authId === nextProps.authId &&
    prevProps.markView === nextProps.markView &&
    prevProps.t === nextProps.t &&
    prevProps.isVideoFeed === nextProps.isVideoFeed &&
    prevProps.isSelfAuthor === nextProps.isSelfAuthor &&
    prevProps.isStarredAuthor === nextProps.isStarredAuthor &&
    prevProps.onToggleStar === nextProps.onToggleStar &&
    prevProps.onUserInfoToggle === nextProps.onUserInfoToggle &&
    prevProps.richRenderer === nextProps.richRenderer &&
    prevProps.enableVideoControlsOnTap === nextProps.enableVideoControlsOnTap &&
    prevProps.rearmPooledFxNode === nextProps.rearmPooledFxNode &&
    prevProps.VideoMediaComponent === nextProps.VideoMediaComponent &&
    prevProps.QCastPlayerComponent === nextProps.QCastPlayerComponent &&
    readPostRenderSig(prevProps.p) === readPostRenderSig(nextProps.p) &&
    readParentPostSig(prevProps.parentPost) === readParentPostSig(nextProps.parentPost)
  )
}

export function readTopicSig(topic) {
  if (!topic || typeof topic !== 'object') return ''
  return [
    topic.id,
    topic.userId,
    topic.accountId,
    topic.nickname,
    topic.icon,
    topic.title,
    topic.description,
    topic.ts,
    topic.views,
    topic.likes,
    topic.dislikes,
    topic.reactions,
    topic.reactionCount,
    topic.postsCount,
    topic.posts,
    topic.replies,
    topic.repliesCount,
    topic.counters?.views,
    topic.counters?.likes,
    topic.counters?.dislikes,
    topic.counters?.reactions,
    topic.counters?.reactionCount,
    topic.counters?.posts,
    topic.counters?.replies,
    topic.counters?.repliesCount,
    topic.counters?.top,
    topic.sort?.views,
    topic.sort?.likes,
    topic.sort?.reactions,
    topic.sort?.reactionCount,
    topic.sort?.posts,
    topic.sort?.replies,
    topic.sort?.repliesCount,
    topic.sort?.top,
    topic.sort?.new,
    topic.vipActive,
    topic.isVip,
    topic.vip,
    topic.vipUntil,
  ].map(readPrimitiveSig).join('|')
}

export function readAggSig(agg) {
  if (!agg || typeof agg !== 'object') return '0|0|0|0'
  return [
    agg.posts ?? 0,
    agg.likes ?? 0,
    agg.dislikes ?? 0,
    agg.views ?? 0,
  ].map(readPrimitiveSig).join('|')
}

export function areTopicItemPropsEqual(prevProps, nextProps) {
  return (
    prevProps.onOpen === nextProps.onOpen &&
    prevProps.onView === nextProps.onView &&
    prevProps.isAdmin === nextProps.isAdmin &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.authId === nextProps.authId &&
    prevProps.onOwnerDelete === nextProps.onOwnerDelete &&
    prevProps.isSelfAuthor === nextProps.isSelfAuthor &&
    prevProps.isStarredAuthor === nextProps.isStarredAuthor &&
    prevProps.onToggleStar === nextProps.onToggleStar &&
    prevProps.onUserInfoToggle === nextProps.onUserInfoToggle &&
    prevProps.formatCount === nextProps.formatCount &&
    prevProps.dataProfileBranchStart === nextProps.dataProfileBranchStart &&
    readTopicSig(prevProps.t) === readTopicSig(nextProps.t) &&
    readAggSig(prevProps.agg) === readAggSig(nextProps.agg)
  )
}
