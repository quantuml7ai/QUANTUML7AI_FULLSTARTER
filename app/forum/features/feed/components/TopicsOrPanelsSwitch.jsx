'use client'

import React from 'react'
import VideoFeedPane from '../../media/components/VideoFeedPane'
import QuestPane from '../../quests/components/QuestPane'
import InboxPane from '../../dm/components/InboxPane'
import TopicsPane from './TopicsPane'
import UserPostsPane from './UserPostsPane'

export default function TopicsOrPanelsSwitch({
  videoFeedOpen,
  t,
  vfWin,
  vfSlots,
  vfMeasureRef,
  dataPosts,
  openThreadForPost,
  resolveNickForDisplay,
  openReportPopover,
  openSharePopover,
  reactMut,
  isAdmin,
  delPost,
  delPostOwn,
  banUser,
  unbanUser,
  bannedSet,
  viewerId,
  markViewPost,
  starredAuthors,
  toggleAuthorStar,
  handleUserInfoToggle,
  pickAdUrlForSlot,
  compensateScrollOnResize,
  videoHasMore,
  setVisibleVideoCount,
  videoPageSize,
  videoFeed,
  PostCard,
  ForumAdSlot,
  LoadMoreSentinel,
  questOpen,
  questEnabled,
  quests,
  questProg,
  isCardCompleted,
  isCardClaimable,
  readEnv,
  vipActive,
  getTaskRemainMs,
  taskDelayMs,
  openQuestCardChecked,
  setQuestSel,
  markTaskDone,
  questSel,
  inboxOpen,
  inboxPaneProps,
  profileBranchMode,
  profileBranchUserId,
  profileBranchUserNick,
  clearProfileBranch,
  visibleProfilePosts,
  profilePostsHasMore,
  setVisibleProfilePostsCount,
  profilePostsPageSize,
  profilePostsLength,
  visibleTopics,
  aggregates,
  pushNavState,
  setSel,
  setThreadRoot,
  markViewTopic,
  delTopic,
  delTopicOwn,
  formatCount,
  topicsHasMore,
  setVisibleTopicsCount,
  topicPageSize,
  sortedTopicsLength,
  TopicItem,
}) {
  if (videoFeedOpen) {
    return (
      <VideoFeedPane
        t={t}
        vfWin={vfWin}
        vfSlots={vfSlots}
        vfMeasureRef={vfMeasureRef}
        dataPosts={dataPosts}
        openThreadForPost={openThreadForPost}
        resolveNickForDisplay={resolveNickForDisplay}
        openReportPopover={openReportPopover}
        openSharePopover={openSharePopover}
        reactMut={reactMut}
        isAdmin={isAdmin}
        delPost={delPost}
        delPostOwn={delPostOwn}
        banUser={banUser}
        unbanUser={unbanUser}
        bannedSet={bannedSet}
        viewerId={viewerId}
        markViewPost={markViewPost}
        starredAuthors={starredAuthors}
        toggleAuthorStar={toggleAuthorStar}
        handleUserInfoToggle={handleUserInfoToggle}
        pickAdUrlForSlot={pickAdUrlForSlot}
        compensateScrollOnResize={compensateScrollOnResize}
        videoHasMore={videoHasMore}
        setVisibleVideoCount={setVisibleVideoCount}
        videoPageSize={videoPageSize}
        videoFeed={videoFeed}
        PostCard={PostCard}
        ForumAdSlot={ForumAdSlot}
        LoadMoreSentinel={LoadMoreSentinel}
      />
    )
  }

  if (questOpen && questEnabled) {
    return (
      <QuestPane
        t={t}
        quests={quests}
        questProg={questProg}
        isCardCompleted={isCardCompleted}
        isCardClaimable={isCardClaimable}
        readEnv={readEnv}
        vipActive={vipActive}
        getTaskRemainMs={getTaskRemainMs}
        taskDelayMs={taskDelayMs}
        openQuestCardChecked={openQuestCardChecked}
        setQuestSel={setQuestSel}
        markTaskDone={markTaskDone}
        questSel={questSel}
      />
    )
  }

  if (inboxOpen) {
    return <InboxPane {...inboxPaneProps} />
  }

  if (profileBranchMode === 'posts') {
    return (
      <UserPostsPane
        t={t}
        branchUserNick={profileBranchUserNick}
        branchUserId={profileBranchUserId}
        onClearBranch={clearProfileBranch}
        visibleUserPosts={visibleProfilePosts}
        dataPosts={dataPosts}
        resolveNickForDisplay={resolveNickForDisplay}
        openReportPopover={openReportPopover}
        openSharePopover={openSharePopover}
        openThreadForPost={openThreadForPost}
        reactMut={reactMut}
        isAdmin={isAdmin}
        delPost={delPost}
        delPostOwn={delPostOwn}
        banUser={banUser}
        unbanUser={unbanUser}
        bannedSet={bannedSet}
        viewerId={viewerId}
        markViewPost={markViewPost}
        starredAuthors={starredAuthors}
        toggleAuthorStar={toggleAuthorStar}
        handleUserInfoToggle={handleUserInfoToggle}
        userPostsHasMore={profilePostsHasMore}
        setVisibleUserPostsCount={setVisibleProfilePostsCount}
        userPostsPageSize={profilePostsPageSize}
        allUserPostsLength={profilePostsLength}
        PostCard={PostCard}
        LoadMoreSentinel={LoadMoreSentinel}
      />
    )
  }

  return (
    <TopicsPane
      visibleTopics={visibleTopics}
      aggregates={aggregates}
      pushNavState={pushNavState}
      setSel={setSel}
      setThreadRoot={setThreadRoot}
      markViewTopic={markViewTopic}
      isAdmin={isAdmin}
      delTopic={delTopic}
      viewerId={viewerId}
      delTopicOwn={delTopicOwn}
      starredAuthors={starredAuthors}
      toggleAuthorStar={toggleAuthorStar}
      handleUserInfoToggle={handleUserInfoToggle}
      formatCount={formatCount}
      topicsHasMore={topicsHasMore}
      setVisibleTopicsCount={setVisibleTopicsCount}
      topicPageSize={topicPageSize}
      sortedTopicsLength={sortedTopicsLength}
      t={t}
      TopicItem={TopicItem}
      LoadMoreSentinel={LoadMoreSentinel}
    />
  )
}
