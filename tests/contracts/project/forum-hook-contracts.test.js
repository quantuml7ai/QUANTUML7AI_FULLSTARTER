import { describe, expect, it } from 'vitest'
import {
  basenameWithoutExtension,
  listProjectFiles,
  readRepoFile,
} from '../../support/projectSurface.js'

const forumHookFiles = listProjectFiles(
  'app/forum',
  (relPath) => /\/hooks\/use[A-Z][^/]*\.jsx?$/.test(relPath),
)

function findExportedHookNames(source) {
  const rx =
    /\bexport\s+(?:default\s+)?function\s+(use[A-Z][A-Za-z0-9_]*)\b|\bexport\s+(?:const|let|var)\s+(use[A-Z][A-Za-z0-9_]*)\b|\bexport\s*\{([^}]*)\}/g

  const names = new Set()
  let match

  while ((match = rx.exec(source)) !== null) {
    if (match[1]) names.add(match[1])
    if (match[2]) names.add(match[2])
    if (match[3]) {
      match[3]
        .split(',')
        .map((chunk) => chunk.trim())
        .forEach((chunk) => {
          const named = chunk.match(/\b(use[A-Z][A-Za-z0-9_]*)\b/)
          if (named?.[1]) names.add(named[1])
        })
    }
  }

  return Array.from(names)
}

describe('Forum hook contracts', () => {
  it('discovers the hook surface of the forum runtime', () => {
    expect(forumHookFiles.length).toBeGreaterThan(40)
  })

  it.each(forumHookFiles)('%s exports at least one hook symbol', (hookFile) => {
    const source = readRepoFile(hookFile)
    const hookName = basenameWithoutExtension(hookFile)
    const exportedHookNames = findExportedHookNames(source)

    expect(exportedHookNames.length).toBeGreaterThan(0)
    expect(hookName.startsWith('use')).toBe(true)
  })

  it('keeps forum diagnostics hook guarded by the master env flag', () => {
    const source = readRepoFile('app/forum/features/diagnostics/hooks/useForumDiagnostics.js')

    expect(source).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED')
    expect(source).toContain('if (!isDiagMasterEnabled()) return false')
  })

  it('keeps PostCardBridge and TopicItem memoized at the list entrypoints', () => {
    const postCardSource = readRepoFile('app/forum/features/feed/components/PostCardBridge.jsx')
    const topicItemSource = readRepoFile('app/forum/features/feed/components/TopicItem.jsx')

    expect(postCardSource).toContain('React.memo')
    expect(postCardSource).toContain('arePostCardBridgePropsEqual')
    expect(topicItemSource).toContain('React.memo')
    expect(topicItemSource).toContain('areTopicItemPropsEqual')
  })

  it('keeps feed panes passing memo-friendly author flags instead of bulky viewer context', () => {
    const videoFeedPane = readRepoFile('app/forum/features/media/components/VideoFeedPane.jsx')
    const threadRepliesPane = readRepoFile('app/forum/features/feed/components/ThreadRepliesPane.jsx')
    const inboxRepliesPane = readRepoFile('app/forum/features/dm/components/InboxRepliesPane.jsx')
    const userPostsPane = readRepoFile('app/forum/features/feed/components/UserPostsPane.jsx')
    const publishedPostsPane = readRepoFile('app/forum/features/feed/components/PublishedPostsPane.jsx')
    const topicsPane = readRepoFile('app/forum/features/feed/components/TopicsPane.jsx')

    ;[
      videoFeedPane,
      threadRepliesPane,
      inboxRepliesPane,
      userPostsPane,
      publishedPostsPane,
    ].forEach((source) => {
      expect(source).toContain('isSelfAuthor={isSelfAuthor}')
      expect(source).toContain('isStarredAuthor={isStarredAuthor}')
      expect(source).not.toContain('viewerId={viewerId}')
      expect(source).not.toContain('starredAuthors={starredAuthors}')
    })

    expect(topicsPane).toContain('isSelfAuthor={isSelfAuthor}')
    expect(topicsPane).toContain('isStarredAuthor={isStarredAuthor}')
    expect(topicsPane).not.toContain('viewerId={viewerId}')
    expect(topicsPane).not.toContain('starredAuthors={starredAuthors}')
  })

  it('keeps heavy card components consuming memo-friendly booleans instead of global viewer sets', () => {
    const forumPostCardSource = readRepoFile('app/forum/features/feed/components/ForumPostCard.jsx')
    const topicItemSource = readRepoFile('app/forum/features/feed/components/TopicItem.jsx')

    expect(forumPostCardSource).toContain('isSelfAuthor = false')
    expect(forumPostCardSource).toContain('isStarredAuthor = false')
    expect(forumPostCardSource).toContain('const isSelf = !!isSelfAuthor')
    expect(forumPostCardSource).toContain('const isStarred = !!isStarredAuthor')
    expect(forumPostCardSource).not.toContain('starredAuthors')

    expect(topicItemSource).toContain('isSelfAuthor = false')
    expect(topicItemSource).toContain('isStarredAuthor = false')
    expect(topicItemSource).toContain('const isSelf = !!isSelfAuthor')
    expect(topicItemSource).toContain('const isStarred = !!isStarredAuthor')
    expect(topicItemSource).not.toContain('starredAuthors')
  })
})
