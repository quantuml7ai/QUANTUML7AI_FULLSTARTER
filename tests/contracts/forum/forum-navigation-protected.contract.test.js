import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const protectedContracts = [
  ['app/forum/features/feed/utils/navScroll.js', ['getScrollSnapshot', 'getEntryOffset', 'restoreScrollSnapshot', 'restoreEntryPosition']],
  ['app/forum/features/feed/utils/postFocus.js', ['centerNodeInScroll', 'centerPostAfterDom', 'centerAndFlashPostAfterDom']],
  ['app/forum/features/feed/utils/navOrchestrator.js', ['applyNavStateSnapshot', 'handleGlobalBackFlow', 'computeCanGlobalBack']],
  ['app/forum/features/feed/hooks/useForumDeepLinkFlow.js', ['useForumDeepLinkFlow', 'waitFor']],
  ['app/forum/features/feed/hooks/useForumNavigationRuntime.js', ['useForumNavigationRuntime']],
  ['app/forum/features/feed/hooks/useThreadOpenNavigation.js', ['useThreadOpenNavigation', 'threadLocate', 'threadPage']],
  ['app/forum/features/feed/hooks/usePostParentReplyNav.js', ['usePostParentReplyNav', 'onOpenThread']],
  ['app/forum/features/dm/utils/alignInboxStartUnderTabs.js', ['alignInboxStartUnderTabs', '__forumProgrammaticScrollReason']],
  ['app/forum/features/media/utils/videoFeedScroll.js', ['snapVideoFeedToFirstCardTop', 'video_feed_first_card_snap']],
  ['app/forum/features/ui/hooks/useForumHeadCollapse.js', ['useForumHeadCollapse', '__forumProgrammaticScrollReason']],
  ['app/forum/features/ui/hooks/useScrollResizeCompensation.js', ['useScrollResizeCompensation', 'resize_compensation']],
]

describe('forum navigation and system-scroll protected contracts', () => {
  test('keeps canonical navigation, deep-link, restore and alignment symbols', () => {
    for (const [file, tokens] of protectedContracts) {
      const source = read(file)
      for (const token of tokens) expect(source, `${file}: ${token}`).toContain(token)
    }
  })

  test('runtime-stability implementation does not move server paging into protected navigation helpers', () => {
    for (const [file] of protectedContracts) {
      const source = read(file)
      expect(source, file).not.toContain('forumHeightIndex')
      expect(source, file).not.toContain('LoadMoreSentinel')
    }
  })
})
