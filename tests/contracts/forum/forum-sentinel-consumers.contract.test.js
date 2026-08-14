import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const consumers = [
  'app/forum/features/feed/components/TopicsPane.jsx',
  'app/forum/features/feed/components/ThreadRepliesPane.jsx',
  'app/forum/features/feed/components/PublishedPostsPane.jsx',
  'app/forum/features/feed/components/UserPostsPane.jsx',
  'app/forum/features/media/components/VideoFeedPane.jsx',
  'app/forum/features/dm/components/DmDialogsPane.jsx',
  'app/forum/features/dm/components/DmThreadLoadMore.jsx',
  'app/forum/features/dm/components/InboxRepliesPane.jsx',
]

describe('LoadMoreSentinel consumer contract', () => {
  test('all eight call sites carry a stable progress key', () => {
    for (const file of consumers) {
      const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
      expect(src, file).toContain('<LoadMoreSentinel')
      expect(src, file).toContain('loadKey=')
      expect(src, file).not.toContain('repeatMs=')
    }
  })
})
