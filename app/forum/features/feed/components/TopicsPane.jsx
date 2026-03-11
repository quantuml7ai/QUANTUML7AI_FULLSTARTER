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
  t,
  TopicItem,
  LoadMoreSentinel,
}) {
  return (
    <>
      <div className="grid gap-2 mt-2" suppressHydrationWarning>
        {(visibleTopics || []).map((topic) => {
          const agg = aggregates.get(topic.id) || { posts: 0, likes: 0, dislikes: 0, views: 0 }
          return (
            <TopicItem
              key={`t:${topic.id}`}
              t={topic}
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

