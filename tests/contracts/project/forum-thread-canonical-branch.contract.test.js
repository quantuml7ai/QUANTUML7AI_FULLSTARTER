import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

const threadOpen = readRepoFile('app/forum/features/feed/hooks/useThreadOpenNavigation.js')
const feedRuntime = readRepoFile('app/forum/features/feed/hooks/useForumFeedRuntime.js')
const threadModel = readRepoFile('app/forum/features/feed/hooks/useThreadPostsModel.js')
const deepLink = readRepoFile('app/forum/features/feed/hooks/useForumDeepLinkFlow.js')
const search = readRepoFile('app/forum/features/ui/components/ForumSearchSortControls.jsx')
const postFocus = readRepoFile('app/forum/features/feed/utils/postFocus.js')
const forumRoot = readRepoFile('app/forum/ForumRoot.jsx')

describe('forum canonical thread branch contract', () => {
  it('separates canonical Mongo root ownership from the visual target post', () => {
    expect(threadOpen).toContain('__threadCanonicalRootId')
    expect(threadOpen).toContain('__threadTargetPostId')
    expect(threadOpen).toContain('forumThreadProjectionOwner(topicId, rootPostId)')
    expect(feedRuntime).toContain('threadRoot?.__threadCanonicalRootId')
    expect(feedRuntime).toContain('targetPostId: targetPostId || rootPostId')
  })

  it('does not schedule the duplicate branch fetch while open hydration is in flight or already handed off', () => {
    expect(feedRuntime).toContain("const threadBranchLoadKeyRef = useRef('')")
    expect(feedRuntime).toContain('if (threadRoot?.__threadOpening === true) return undefined')
    expect(feedRuntime).toContain('threadRoot?.__threadOpenHydrated === true')
    expect(feedRuntime).toContain('threadBranchLoadKeyRef.current === loadKey')
  })

  it('keeps the clicked target as the visual head and renders only its direct replies', () => {
    expect(threadModel).toContain("const rootId = String(threadRoot.id || threadRoot.postId || '')")
    expect(threadModel).toContain('const directChildren = sortChildren(startChildren || [])')
    expect(threadModel).toContain('const childRows = directChildren.map((child) => ({')
    expect(threadModel).toContain('return [rootRow, ...childRows]')
    expect(threadModel).not.toContain('const walk = (node, level) =>')
    expect(threadModel).not.toContain('for (const child of sortedChildren) walk(child, level + 1)')
  })

  it('keeps search/deep-link target handoff and centering intact', () => {
    expect(search).toContain('forumThreadProjectionOwner(topicId, postId)')
    expect(deepLink).toContain('forumThreadProjectionOwner(topicId, postId)')
    expect(deepLink).toContain("centerAndFlashPostAfterDomEvent(postId, 'auto')")
    expect(postFocus).toContain('revealForumWindowedDomId(`post_${pid}`')
    expect(forumRoot).toContain('scheduleEditModeBranchAlign(targetPostId)')
  })
})
