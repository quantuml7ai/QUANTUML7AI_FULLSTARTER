import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const files = [
  'app/forum/features/feed/utils/navScroll.js',
  'app/forum/features/feed/utils/postFocus.js',
  'app/forum/features/feed/utils/navOrchestrator.js',
  'app/forum/features/feed/hooks/useForumDeepLinkFlow.js',
  'app/forum/features/feed/hooks/useForumNavigationRuntime.js',
  'app/forum/features/feed/hooks/useThreadOpenNavigation.js',
  'app/forum/features/feed/hooks/usePostParentReplyNav.js',
  'app/forum/features/dm/utils/alignInboxStartUnderTabs.js',
  'app/forum/features/media/utils/videoFeedScroll.js',
  'app/forum/features/ui/hooks/useForumHeadCollapse.js',
  'app/forum/features/ui/hooks/useScrollResizeCompensation.js',
]
const markers = {
  'app/forum/features/feed/utils/navScroll.js': ['getScrollSnapshot', 'getEntryOffset', 'restoreScrollSnapshot', 'restoreEntryPosition'],
  'app/forum/features/feed/utils/postFocus.js': ['centerNodeInScroll', 'centerPostAfterDom', 'centerAndFlashPostAfterDom'],
  'app/forum/features/feed/utils/navOrchestrator.js': ['applyNavStateSnapshot', 'handleGlobalBackFlow', 'computeCanGlobalBack'],
  'app/forum/features/feed/hooks/useForumDeepLinkFlow.js': ['useForumDeepLinkFlow', 'waitFor'],
  'app/forum/features/feed/hooks/useForumNavigationRuntime.js': ['useForumNavigationRuntime'],
  'app/forum/features/feed/hooks/useThreadOpenNavigation.js': ['useThreadOpenNavigation', 'threadLocate', 'threadPage'],
  'app/forum/features/feed/hooks/usePostParentReplyNav.js': ['usePostParentReplyNav', 'onOpenThread'],
  'app/forum/features/dm/utils/alignInboxStartUnderTabs.js': ['alignInboxStartUnderTabs', '__forumProgrammaticScrollReason'],
  'app/forum/features/media/utils/videoFeedScroll.js': ['snapVideoFeedToFirstCardTop', 'video_feed_first_card_snap'],
  'app/forum/features/ui/hooks/useForumHeadCollapse.js': ['useForumHeadCollapse', '__forumProgrammaticScrollReason'],
  'app/forum/features/ui/hooks/useScrollResizeCompensation.js': ['useScrollResizeCompensation', 'resize_compensation'],
}

const rows = files.map((file) => {
  const full = path.join(root, file)
  const bytes = fs.readFileSync(full)
  const text = bytes.toString('utf8')
  const required = markers[file] || []
  const missing = required.filter((token) => !text.includes(token))
  return {
    file,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex').toUpperCase(),
    required,
    missing,
    ok: missing.length === 0,
  }
})

const report = {
  ok: rows.every((row) => row.ok),
  generatedAt: new Date().toISOString(),
  files: rows,
}
const outArg = process.argv.find((arg) => arg.startsWith('--out='))
if (outArg) {
  const out = path.resolve(root, outArg.slice('--out='.length))
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exitCode = 1
