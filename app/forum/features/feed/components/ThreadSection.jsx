'use client'

import React from 'react'
import ForumHeaderPanel from '../../../ForumHeaderPanel'
import ThreadForumActionCluster from '../../ui/components/ThreadForumActionCluster'
import ThreadTitle from './ThreadTitle'
import ThreadRepliesPane from './ThreadRepliesPane'

export default function ThreadSection({
  forumHeaderPanelProps,
  actionClusterProps,
  threadRoot,
  selectedTopic,
  t,
  bodyRef,
  threadRepliesPaneProps,
}) {
  return (
    <section className="glass neon" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
      <ForumHeaderPanel
        {...forumHeaderPanelProps}
        actionCluster={<ThreadForumActionCluster {...actionClusterProps} />}
        showBottomActionDivider
      />
      <div data-forum-topics-start="1" />
      <ThreadTitle
        threadRoot={threadRoot}
        selectedTopic={selectedTopic}
        t={t}
      />

      <div
        className="body"
        data-forum-scroll="1"
        data-sticky-feed-off="1"
        ref={bodyRef}
        style={{ flex: '1 1 auto', minHeight: 0, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div data-forum-thread-start="1" />
        <ThreadRepliesPane {...threadRepliesPaneProps} />
      </div>
    </section>
  )
}
