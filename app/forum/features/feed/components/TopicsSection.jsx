'use client'

import React from 'react'
import ForumHeaderPanel from '../../../ForumHeaderPanel'
import MainForumActionCluster from '../../ui/components/MainForumActionCluster'
import TopicsOrPanelsSwitch from './TopicsOrPanelsSwitch'

export default function TopicsSection({
  forumHeaderPanelProps,
  actionClusterProps,
  topicsSwitchProps,
  bodyRef,
}) {
  return (
    <section className="glass neon" style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>
      <ForumHeaderPanel
        {...forumHeaderPanelProps}
        actionCluster={<MainForumActionCluster {...actionClusterProps} />}
      />
      <div
        className="body"
        data-forum-scroll="1"
        data-forum-scroll-root="topics"
        ref={bodyRef}
        style={{ flex: '1 1 auto', minHeight: 0, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div data-forum-topics-start="1" />

        <TopicsOrPanelsSwitch {...topicsSwitchProps} />
      </div>
    </section>
  )
}
