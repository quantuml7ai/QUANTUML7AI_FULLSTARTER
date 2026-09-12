import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

const retention = readRepoFile('app/forum/features/feed/utils/transientProjectionRetention.js')
const dataRuntime = readRepoFile('app/forum/features/feed/hooks/useForumDataRuntime.js')
const syncLoop = readRepoFile('app/forum/features/feed/hooks/useForumSyncLoop.js')
const feedRuntime = readRepoFile('app/forum/features/feed/hooks/useForumFeedRuntime.js')
const threadOpen = readRepoFile('app/forum/features/feed/hooks/useThreadOpenNavigation.js')
const videoRuntime = readRepoFile('app/forum/features/media/hooks/useForumVideoFeedRuntime.js')
const videoState = readRepoFile('app/forum/features/media/hooks/useVideoFeedState.js')
const published = readRepoFile('app/forum/features/feed/hooks/usePublishedPostsModel.js')
const profileBranch = readRepoFile('app/forum/features/feed/hooks/useUserPostsBranchModel.js')
const dmRuntime = readRepoFile('app/forum/features/dm/hooks/useForumDmRuntime.js')
const search = readRepoFile('app/forum/features/ui/components/ForumSearchSortControls.jsx')
const deepLink = readRepoFile('app/forum/features/feed/hooks/useForumDeepLinkFlow.js')
const snapshotTransforms = readRepoFile('app/forum/features/feed/utils/snapshotTransforms.js')

describe('forum transient server projection retention contract', () => {
  it('owns transient merges centrally and releases them symmetrically', () => {
    expect(dataRuntime).toContain('mergeForumTransientProjection')
    expect(dataRuntime).toContain('mergeForumCanonicalProjection')
    expect(dataRuntime).toContain('releaseForumTransientProjection')
    expect(dataRuntime).toContain('const hasTopicsProjection = Array.isArray(detail.topics)')
    expect(dataRuntime).toContain('const hasPostsProjection = Array.isArray(detail.posts)')
    expect(dataRuntime).toContain('hasProjectionWork')
    expect(dataRuntime).toContain("window.addEventListener('forum:server-items-release', onRelease)")
    expect(dataRuntime).toContain("window.removeEventListener('forum:server-items-release', onRelease)")
    expect(retention).toContain('FORUM_TRANSIENT_PROJECTION_ONLY_FIELD')
    expect(retention).toContain('FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD')
  })

  it('keeps the pre-existing branch-preservation business rule unchanged while transient release stays orthogonal', () => {
    const keepMatch = syncLoop.match(/function keepPreviousBranchPost\(item\) \{([\s\S]*?)\n\}/)
    expect(keepMatch).toBeTruthy()
    expect(keepMatch[1]).toContain('parentId')
    expect(keepMatch[1]).toContain('replyToPostId')
    expect(keepMatch[1]).toContain('__threadBranchRoot')
    expect(keepMatch[1]).toContain('depth > 0')
    expect(syncLoop).toContain('FORUM_TRANSIENT_PROJECTION_OWNERS_FIELD')
    expect(syncLoop).toContain('projectionOwners.length > 0')
    expect(syncLoop).toContain('promoteForumTransientProjectionMetadata(out)')
  })

  it('scopes topic/thread hydration and releases the previous reachable branch', () => {
    expect(feedRuntime).toContain('forumTopicRootsProjectionOwner(topicId)')
    expect(feedRuntime).toContain('forumThreadProjectionOwner(topicId, rootPostId)')
    expect(feedRuntime).toContain('dispatchForumTransientProjectionRelease(previousTopicOwner)')
    expect(feedRuntime).toContain('dispatchForumTransientProjectionRelease(previousThreadOwner)')
    expect(threadOpen).toContain('const projectionOwner = forumThreadProjectionOwner')
    expect(threadOpen).toContain("dispatchServerItemsMerge([seed], 'thread_open_seed', { projectionOwner, reset: true })")
  })

  it('releases duplicated video-feed projection data without changing player lifecycle policy', () => {
    expect(videoRuntime).toContain('QL7_MEDIA_FEED_PROJECTION_OWNER')
    expect(videoRuntime).toContain('dispatchForumTransientProjectionRelease(QL7_MEDIA_FEED_PROJECTION_OWNER)')
    expect(videoRuntime).toContain('setServerVideoPosts([])')
    expect(videoRuntime).toContain('setVideoFeed([])')
    expect(videoState).toContain('if (!videoFeedOpen) return')
    expect(videoRuntime).not.toContain('HTMLMediaElement.prototype')
  })

  it('releases inbox/profile/published projections when their surfaces stop owning them', () => {
    expect(dmRuntime).toContain('forumInboxRepliesProjectionOwner')
    expect(dmRuntime).toContain('serverRepliesRequestSeqRef.current += 1')
    expect(dmRuntime).toContain('dispatchForumTransientProjectionRelease(inboxRepliesProjectionOwner)')
    expect(dmRuntime).toContain('active: inboxOpen')
    expect(published).toContain('if (!active || !meId')
    expect(published).toContain('dispatchForumTransientProjectionRelease(projectionOwner)')
    expect(profileBranch).toContain('forumProfileBranchProjectionOwner')
    expect(profileBranch).toContain('dispatchForumTransientProjectionRelease(projectionOwner)')
  })

  it('bounds search/deeplink hydration with owners and transfers navigation data to the active thread/topic owner', () => {
    expect(search).toContain('forumSearchProjectionOwner(query)')
    expect(search).toContain('dispatchForumTransientProjectionRelease(searchProjectionOwner)')
    expect(search).toContain('forumTopicRootsProjectionOwner(topic.id)')
    expect(search).toContain('forumThreadProjectionOwner(topicId, postId)')
    expect(deepLink).toContain('forumThreadProjectionOwner(topicId, postId)')
    expect(deepLink).toContain('forumTopicRootsProjectionOwner(topicId)')
    expect(deepLink).toContain("reason: 'deeplink_topic_hydrate'")
    expect(deepLink).toContain("activeThreadProjectionOwner = ''")
    expect(deepLink).toContain("activeTopicProjectionOwner = ''")
  })

  it('promotes canonical/full-snapshot rows by stripping transient ownership metadata', () => {
    expect(snapshotTransforms).toContain('stripForumTransientProjectionMetadata')
    expect(retention).toContain('mergeForumCanonicalProjection')
    expect(retention).toContain('promotedIds')
    expect(retention).toContain('promoteForumTransientProjectionMetadata')
  })
})
