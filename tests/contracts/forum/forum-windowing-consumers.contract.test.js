import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const consumers = [
  'app/forum/features/feed/components/TopicsPane.jsx',
  'app/forum/features/feed/components/ThreadRepliesPane.jsx',
  'app/forum/features/feed/components/PublishedPostsPane.jsx',
  'app/forum/features/feed/components/UserPostsPane.jsx',
  'app/forum/features/dm/components/DmDialogsPane.jsx',
  'app/forum/features/dm/components/DmMessagesPane.jsx',
  'app/forum/features/dm/components/InboxRepliesPane.jsx',
  'app/forum/features/media/hooks/useVideoFeedWindowing.js',
]

describe('forum windowing consumer contract', () => {
  test('all eight consumers remain connected to canonical hook', () => {
    for (const file of consumers) {
      const src = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
      expect(src, file).toContain('useForumWindowing')
    }
  })

  test('windowing hook keeps full-card measurement and native reverse anchoring while using prefix index', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'app/forum/shared/hooks/useForumWindowing.js'), 'utf8')
    for (const token of ['ensureItemRenderedByKey', 'ensureItemRenderedByDomId', 'applyAnchoredScrollDelta', 'targetLockRef', 'mediaKeepaliveRef', 'buildForumHeightPrefix', 'readItemLayoutFootprint', 'readListRelativeViewportTop']) {
      expect(src).toContain(token)
    }
    expect(src).not.toContain('pendingReverseAnchorRef')
    expect(src).not.toContain('windowing_reverse_anchor_residual')
    expect(src).not.toContain('const nextHeight = Math.round(h)')
    expect(src).not.toMatch(/for\s*\(let i = 0; i < start; i \+= 1\) top \+= getHeightAtIndex/)
  })
})
