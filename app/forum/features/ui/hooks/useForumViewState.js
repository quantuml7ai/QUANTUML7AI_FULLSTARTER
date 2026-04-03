import React from 'react'

const VIDEO_PAGE_SIZE = 5
const TOPIC_PAGE_SIZE = 10
const REPLIES_PAGE_SIZE = 5
const THREAD_PAGE_SIZE = 5
const DM_PAGE_SIZE = 5
const DM_ACTIVE_THROTTLE_MS = 30000
const DM_BG_THROTTLE_MS = 30000
const PUBLISHED_PAGE_SIZE = 5

export default function useForumViewState() {
  const [starMode, setStarMode] = React.useState(false)
  const [q, setQ] = React.useState('')
  const [topicFilterId, setTopicFilterId] = React.useState(null)
  const [topicSort, setTopicSort] = React.useState('top')
  const [postSort, setPostSort] = React.useState('new')
  const [drop, setDrop] = React.useState(false)
  const [sortOpen, setSortOpen] = React.useState(false)

  const [visibleVideoCount, setVisibleVideoCount] = React.useState(VIDEO_PAGE_SIZE)
  const [visibleTopicsCount, setVisibleTopicsCount] = React.useState(TOPIC_PAGE_SIZE)
  const [visibleRepliesCount, setVisibleRepliesCount] = React.useState(REPLIES_PAGE_SIZE)
  const [visibleThreadPostsCount, setVisibleThreadPostsCount] = React.useState(THREAD_PAGE_SIZE)
  const [visiblePublishedCount, setVisiblePublishedCount] = React.useState(PUBLISHED_PAGE_SIZE)

  const [questOpen, setQuestOpen] = React.useState(false)
  const [questSel, setQuestSel] = React.useState(null)

  React.useEffect(() => {
    setVisibleTopicsCount(TOPIC_PAGE_SIZE)
  }, [topicSort, topicFilterId, starMode])

  return {
    starMode,
    setStarMode,
    q,
    setQ,
    topicFilterId,
    setTopicFilterId,
    topicSort,
    setTopicSort,
    postSort,
    setPostSort,
    drop,
    setDrop,
    sortOpen,
    setSortOpen,
    visibleVideoCount,
    setVisibleVideoCount,
    visibleTopicsCount,
    setVisibleTopicsCount,
    visibleRepliesCount,
    setVisibleRepliesCount,
    visibleThreadPostsCount,
    setVisibleThreadPostsCount,
    visiblePublishedCount,
    setVisiblePublishedCount,
    questOpen,
    setQuestOpen,
    questSel,
    setQuestSel,
    VIDEO_PAGE_SIZE,
    TOPIC_PAGE_SIZE,
    REPLIES_PAGE_SIZE,
    THREAD_PAGE_SIZE,
    DM_PAGE_SIZE,
    DM_ACTIVE_THROTTLE_MS,
    DM_BG_THROTTLE_MS,
    PUBLISHED_PAGE_SIZE,
  }
}
