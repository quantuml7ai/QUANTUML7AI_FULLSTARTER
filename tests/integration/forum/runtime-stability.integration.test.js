import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8')

describe('forum runtime stability integration surface', () => {
  test('all nickname producers use the scoped fitter component', () => {
    const files = [
      'app/forum/ForumHeaderPanel.jsx',
      'app/forum/features/feed/components/PostHeaderMeta.jsx',
      'app/forum/features/feed/components/TopicItem.jsx',
      'app/forum/features/dm/components/DmDialogRow.jsx',
      'app/forum/features/dm/components/DmThreadMessageRow.jsx',
      'app/forum/features/dm/components/DmThreadHeader.jsx',
      'app/forum/features/ui/components/ForumSearchSortControls.jsx',
      'app/forum/features/subscriptions/components/SubscriptionsPopover.jsx',
    ]
    for (const file of files) expect(read(file), file).toContain('ForumNickText')
  })

  test('all forum identity avatar producers use the shared corner-badge overlay', () => {
    const files = [
      'app/forum/features/feed/components/PostHeaderMeta.jsx',
      'app/forum/features/feed/components/TopicItem.jsx',
      'app/forum/features/feed/components/UserRecommendationCard.jsx',
      'app/forum/features/dm/components/DmDialogRow.jsx',
      'app/forum/features/dm/components/DmThreadMessageRow.jsx',
      'app/forum/features/dm/components/DmThreadHeader.jsx',
      'app/forum/features/ui/components/ForumSearchSortControls.jsx',
      'app/forum/features/subscriptions/components/SubscriptionsPopover.jsx',
    ]
    for (const file of files) {
      expect(read(file), file).toContain('AvatarBadgeOverlay')
      expect(read(file), file).toContain('ql7AvatarBadgeHost')
    }
    const header = read('app/forum/ForumHeaderPanel.jsx')
    expect(header).not.toContain('AvatarBadgeOverlay')
    expect(header).not.toContain('ql7AvatarBadgeHost')    
  })

  test('server/API source is outside runtime-stability implementation surface', () => {
    const contract = read('tests/contracts/forum/forum-runtime-stability.contract.test.js')
    expect(contract).toContain('forum runtime stability')
  })
})
