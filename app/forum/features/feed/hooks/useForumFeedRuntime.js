'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import useForumDeepLinkFlow from './useForumDeepLinkFlow'
import useThreadOpenNavigation from './useThreadOpenNavigation'
import useThreadPostsModel from './useThreadPostsModel'
import useTopicDiscoveryModel from './useTopicDiscoveryModel'
import {
  centerNodeInScroll as centerNodeInScrollUtil,
  centerPostAfterDom as centerPostAfterDomUtil,
  centerAndFlashPostAfterDom as centerAndFlashPostAfterDomUtil,
} from '../utils/postFocus'

export default function useForumFeedRuntime({
  selectedTopicId,
  setSelectedTopic,
  data,
  postSort,
  topicSort,
  topicFilterId,
  authorFilterUserId,
  query,
  activeStarredAuthors,
  visibleThreadPostsCount,
  setVisibleThreadPostsCount,
  threadPageSize,
  visibleTopicsCount,
  setTopicFilterId,
  setInboxOpen,
  setVideoFeedOpenFn,
  pushNavStateStable,
  isBrowserFn,
  bodyRef,
  toast,
  t,
  resolveNickForDisplayFn,
  extractDmStickersFromTextFn,
  stripMediaUrlsFromTextFn,
  extractUrlsFromTextFn,
  isImageUrlFn,
  isVideoUrlFn,
  isAudioUrlFn,
  isYouTubeUrlFn,
  isTikTokUrlFn,
  buildSearchVideoMediaFn,
  starredFirstFn,
}) {
  const [threadRoot, setThreadRoot] = useState(null)
  const navStackRef = useRef([])
  const [navDepth, setNavDepth] = useState(0)
  const navRestoringRef = useRef(false)
  const navPendingThreadRootRef = useRef(null)
  const navStateRef = useRef({})

  const {
    allPosts,
    idMap,
    flat,
    visibleFlat,
    threadHasMore,
  } = useThreadPostsModel({
    selectedTopicId,
    posts: data?.posts,
    threadRoot,
    postSort,
    activeStarredAuthors,
    visibleThreadPostsCount,
  })

  const {
    openThreadForPost,
    pendingThreadRootIdRef,
    pendingScrollToPostIdRef,
  } = useThreadOpenNavigation({
    selId: selectedTopicId,
    dataTopics: data?.topics,
    dataPosts: data?.posts,
    idMap,
    pushNavStateStable,
    setInboxOpen,
    setVideoFeedOpen: setVideoFeedOpenFn,
    setThreadRoot,
    setSel: setSelectedTopic,
    navPendingThreadRootRef,
    navRestoringRef,
    isBrowserFn,
    threadRoot,
  })

  const centerNodeInScroll = useCallback((node, behavior = 'smooth') => {
    centerNodeInScrollUtil(node, {
      behavior,
      isBrowserFn,
      getScrollEl: () => (
        bodyRef.current ||
        document.querySelector('[data-forum-scroll="1"]') ||
        null
      ),
    })
  }, [bodyRef, isBrowserFn])

  const centerPostAfterDom = useCallback((postId, behavior = 'smooth') => {
    centerPostAfterDomUtil(postId, {
      behavior,
      isBrowserFn,
      centerNodeInScrollFn: centerNodeInScroll,
    })
  }, [centerNodeInScroll, isBrowserFn])

  const centerAndFlashPostAfterDom = useCallback((postId, behavior = 'smooth') => {
    centerAndFlashPostAfterDomUtil(postId, {
      behavior,
      isBrowserFn,
      centerNodeInScrollFn: centerNodeInScroll,
      getScrollEl: () => (
        bodyRef.current ||
        document.querySelector('[data-forum-scroll="1"]') ||
        null
      ),
      postsLen: Array.isArray(data?.posts) ? data.posts.length : 0,
      visibleThreadPostsCount,
      setVisibleThreadPostsCount,
    })
  }, [
    bodyRef,
    centerNodeInScroll,
    data?.posts,
    isBrowserFn,
    setVisibleThreadPostsCount,
    visibleThreadPostsCount,
  ])

  const { deeplinkUI } = useForumDeepLinkFlow({
    isBrowserFn,
    data,
    selectedTopicId,
    idMap,
    allPosts,
    openThreadForPost,
    setTopicFilterId,
    setSel: setSelectedTopic,
    setVisibleThreadPostsCount,
    centerAndFlashPostAfterDom,
    toast,
    t,
  })

  useEffect(() => {
    setVisibleThreadPostsCount(threadPageSize)
  }, [postSort, selectedTopicId, setVisibleThreadPostsCount, threadPageSize, threadRoot])

  const bannedSet = useMemo(() => new Set(data?.bans || []), [data?.bans])

  const {
    aggregates,
    results,
    sortedTopics,
    visibleTopics,
    topicsHasMore,
  } = useTopicDiscoveryModel({
    query,
    topics: data?.topics,
    posts: data?.posts,
    authorFilterUserId,
    resolveNickForDisplayFn,
    extractDmStickersFromTextFn,
    stripMediaUrlsFromTextFn,
    extractUrlsFromTextFn,
    isImageUrlFn,
    isVideoUrlFn,
    isAudioUrlFn,
    isYouTubeUrlFn,
    isTikTokUrlFn,
    buildSearchVideoMediaFn,
    topicSort,
    topicFilterId,
    starredFirstFn,
    visibleTopicsCount,
    setTopicFilterId,
  })

  return {
    threadRoot,
    setThreadRoot,
    navStackRef,
    navDepth,
    setNavDepth,
    navRestoringRef,
    navPendingThreadRootRef,
    navStateRef,
    allPosts,
    idMap,
    flat,
    visibleFlat,
    threadHasMore,
    openThreadForPost,
    pendingThreadRootIdRef,
    pendingScrollToPostIdRef,
    centerNodeInScroll,
    centerPostAfterDom,
    centerAndFlashPostAfterDom,
    deeplinkUI,
    bannedSet,
    aggregates,
    results,
    sortedTopics,
    visibleTopics,
    topicsHasMore,
  }
}
