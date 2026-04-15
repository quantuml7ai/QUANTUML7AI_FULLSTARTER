'use client'

import React from 'react'
import { resolveProfileAccountId } from '../../profile/utils/profileCache'

const EMPTY_TOPIC_AGG = Object.freeze({
  posts: 0,
  likes: 0,
  dislikes: 0,
  views: 0,
})

export default function TopicsPane({
  visibleTopics,
  aggregates,
  pushNavState,
  setSel,
  setThreadRoot,
  markViewTopic,
  isAdmin,
  delTopic,
  viewerId,
  delTopicOwn,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  formatCount,
  topicsHasMore,
  setVisibleTopicsCount,
  topicPageSize,
  sortedTopicsLength,
  profileBranchMode,
  t,
  TopicItem,
  LoadMoreSentinel,
}) {
  const isProfileTopicsBranch = profileBranchMode === 'topics'
  const handleOpenTopic = React.useCallback((topic, entryId) => {
    pushNavState(entryId || `topic_${topic?.id}`)
    setSel(topic)
    setThreadRoot(null)
  }, [pushNavState, setSel, setThreadRoot])

  return (
    <>
      <div
        className="grid gap-2 mt-2"
        suppressHydrationWarning
        data-profile-branch-root={isProfileTopicsBranch ? '1' : undefined}
      >
        {(visibleTopics || []).map((topic, idx) => {
          const agg = aggregates.get(topic.id) || EMPTY_TOPIC_AGG
          const authorId = String(resolveProfileAccountId(topic?.userId || topic?.accountId) || '').trim()
          const isSelfAuthor = !!viewerId && !!authorId && String(viewerId) === authorId
          const isStarredAuthor = !!authorId && !!starredAuthors?.has?.(authorId)
          return (
            <TopicItem
              key={`t:${topic.id}`}
              t={topic}
              dataProfileBranchStart={isProfileTopicsBranch && idx === 0 ? '1' : undefined}
              agg={agg}
              onOpen={handleOpenTopic}
              onView={markViewTopic}
              isAdmin={isAdmin}
              onDelete={delTopic}
              authId={viewerId}
              onOwnerDelete={delTopicOwn}
              isSelfAuthor={isSelfAuthor}
              isStarredAuthor={isStarredAuthor}
              onToggleStar={toggleAuthorStar}
              onUserInfoToggle={handleUserInfoToggle}
              formatCount={formatCount}
            />
          )
        })}
      </div>
      {topicsHasMore && (
        <div className="loadMoreFooter">
          <div className="loadMoreShimmer">
            {t?.('loading')}
          </div>
          <LoadMoreSentinel
            onVisible={() =>
              setVisibleTopicsCount((c) =>
                Math.min(c + topicPageSize, sortedTopicsLength),
              )
            }
          />
        </div>
      )}
    </>
  )
}
