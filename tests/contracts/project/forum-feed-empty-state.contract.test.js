import { describe, expect, it } from 'vitest'
import { readRepoFile } from '../../support/projectSurface.js'

function readCssBlock(source, selector) {
  const start = source.indexOf(`${selector}{`)
  expect(start).toBeGreaterThanOrEqual(0)
  const end = source.indexOf('}', start)
  expect(end).toBeGreaterThan(start)
  return source.slice(start, end + 1).replace(/\s+/g, '')
}

describe('Forum feed empty-state contract', () => {
  it('keeps empty feed notices centered, premium, and below live feed cards', () => {
    const styles = readRepoFile('app/forum/styles/ForumStyles.jsx')
    const emptyState = readCssBlock(styles, '.forumFeedEmptyState')
    const emptyStateText = readCssBlock(styles, '.forumFeedEmptyStateText')

    expect(emptyState).toContain('position:relative;')
    expect(emptyState).toContain('z-index:0;')
    expect(emptyState).toContain('width:max-content;')
    expect(emptyState).toContain('margin:56pxauto18px;')
    expect(emptyState).toContain('pointer-events:none;')
    expect(emptyState).toContain('opacity:1;')
    expect(emptyState).toContain('overflow:hidden;')
    expect(emptyState).toContain('isolation:isolate;')
    expect(emptyState).toContain('border-radius:999px;')
    expect(emptyState).not.toContain('position:fixed;')
    expect(emptyState).not.toContain('position:sticky;')

    expect(emptyStateText).toContain('position:relative;')
    expect(emptyStateText).toContain('z-index:1;')
    expect(styles).toContain('@keyframes forumFeedEmptyStateGlint')
    expect(styles).toContain('@media (prefers-reduced-motion:reduce)')
    expect(styles).toContain('.forumFeedEmptyState::after{animation:none;opacity:0;}')
  })

  it('uses the shared empty-state capsule only on feed-like empty surfaces', () => {
    const surfaces = [
      'app/forum/features/media/components/VideoFeedPane.jsx',
      'app/forum/features/feed/components/PublishedPostsPane.jsx',
      'app/forum/features/feed/components/TopicsPane.jsx',
      'app/forum/features/feed/components/ThreadRepliesPane.jsx',
      'app/forum/features/feed/components/UserPostsPane.jsx',
      'app/forum/features/dm/components/InboxRepliesPane.jsx',
    ].map(readRepoFile)

    for (const source of surfaces) {
      expect(source).toContain('className="meta forumFeedEmptyState"')
      expect(source).toContain('className="forumFeedEmptyStateText"')
    }
  })

  it('preserves the existing localized empty-state keys', () => {
    const videoPane = readRepoFile('app/forum/features/media/components/VideoFeedPane.jsx')
    const publishedPane = readRepoFile('app/forum/features/feed/components/PublishedPostsPane.jsx')
    const topicsPane = readRepoFile('app/forum/features/feed/components/TopicsPane.jsx')
    const threadPane = readRepoFile('app/forum/features/feed/components/ThreadRepliesPane.jsx')
    const userPostsPane = readRepoFile('app/forum/features/feed/components/UserPostsPane.jsx')
    const inboxRepliesPane = readRepoFile('app/forum/features/dm/components/InboxRepliesPane.jsx')

    expect(videoPane).toContain("t('forum_search_empty')")
    expect(publishedPane).toContain("t('empty_published')")
    expect(topicsPane).toContain("t?.('forum_no_topics_yet') || t?.('forum_no_posts_yet')")
    expect(threadPane).toContain("t('forum_no_posts_yet')")
    expect(userPostsPane).toContain("t?.('forum_no_posts_yet')")
    expect(inboxRepliesPane).toContain('!serverRepliesLoading && sortedRepliesLength === 0')
    expect(inboxRepliesPane).toContain("t('forum_inbox_empty')")
  })
})
