'use client'

import React from 'react'

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

  return (
    <>
      <div
        className="grid gap-2 mt-2"
        suppressHydrationWarning
        data-profile-branch-root={isProfileTopicsBranch ? '1' : undefined}
      >
        {(visibleTopics || []).map((topic, idx) => {
          const agg = aggregates.get(topic.id) || { posts: 0, likes: 0, dislikes: 0, views: 0 }
          return (
            <TopicItem
              key={`t:${topic.id}`}
              t={topic}
              dataProfileBranchStart={isProfileTopicsBranch && idx === 0 ? '1' : undefined}
              agg={agg}
              onOpen={(tt, entryId) => {
                pushNavState(entryId || `topic_${tt?.id}`)
                setSel(tt)
                setThreadRoot(null)
              }}
              onView={markViewTopic}
              isAdmin={isAdmin}
              onDelete={delTopic}
              authId={viewerId}
              onOwnerDelete={delTopicOwn}
              viewerId={viewerId}
              starredAuthors={starredAuthors}
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
