import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const checks = []
const check = (id, ok, detail = '') => checks.push({ id, ok: !!ok, detail })

const windowing = read('app/forum/shared/hooks/useForumWindowing.js')
const sentinel = read('app/forum/features/feed/components/LoadMoreSentinel.jsx')
const media = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
const data = read('app/forum/features/feed/hooks/useForumDataRuntime.js')
const rootSource = read('app/forum/ForumRoot.jsx')
const nick = read('app/forum/shared/hooks/useForumNickBadgeFit.js')
const nickText = read('app/forum/shared/components/ForumNickText.jsx')
const vip = read('app/forum/features/profile/hooks/useVipFlag.js')
const ads = read('app/forum/ForumAds.js')

check('windowing-prefix-index', windowing.includes('buildForumHeightPrefix') && windowing.includes('findForumWindowStartIndex'))
check('windowing-reveal-contracts', windowing.includes('ensureItemRenderedByKey') && windowing.includes('ensureItemRenderedByDomId') && windowing.includes('targetLockRef'))
check('windowing-empty-state-noop-guard', windowing.includes('const emptyWindowUnchanged =') && windowing.includes('if (emptyWindowUnchanged) return') && windowing.indexOf('if (emptyWindowUnchanged) return') < windowing.indexOf('setWin(nextEmpty)'))
check('sentinel-no-interval', !/setInterval\s*\(/.test(sentinel) && !sentinel.includes('repeatMs'))
check('snap-no-sync-write', !/localStorage\.setItem\(['\"]forum:snap['\"]/.test(data))
check('nick-no-body-observer', !rootSource.includes('function useForumNickBadgeFit()') && !/MutationObserver\s*\(/.test(nick))
check('nick-strictmode-callback-ref-owner', nick.includes('cleanupRef.current?.()') && !nick.includes('useLayoutEffect(() => () => {'))
check('nick-full-text-fit-contract', nick.includes('const MIN_FONT_PX = 7') && nick.includes('const MAX_BADGE_WIDTH_PX = 130') && nick.includes('const wanted = textEl.scrollWidth || 0') && nick.includes('(baseFontPx * available) / wanted') && nick.includes("textEl.style.textOverflow = 'clip'"))
check('nick-single-frame-fit-no-visible-reset', nick.includes('let fitRaf = 0') && nick.includes('singleFrameFit: true') && nick.includes('reset -> measure -> final fit all happen inside ONE RAF callback') && !nick.includes('measureRaf') && !nick.includes('resetRaf'))
check('nick-component-wiring', nickText.includes("useForumNickBadgeFit(textValue)") && nickText.includes('fitRef(node)') && !/MutationObserver\s*\(/.test(nickText))
check('sentinel-progress-diagnostic', sentinel.includes('progressCount') && sentinel.includes('progressTransitions') && sentinel.includes('progressTokenRef') && sentinel.includes('sentinelDiag.progressTransitions += 1'))
check('media-registry', media.includes('const mediaRegistry = new Set()'))
check('media-double-unobserve', media.includes('io?.unobserve?.(owner)') && media.includes('nearIo?.unobserve?.(owner)'))
check('media-deferred-removal', media.includes('pendingRemovedMediaOwners') && media.includes('mutation_removed_confirmed'))
check('media-diagnostic-counters', media.includes('sweeps: mediaLifecycleSweepCount') && media.includes('snapshots: mediaLifecycleSnapshotCount') && media.includes('globalDiagnosticScans: mediaGlobalDiagnosticScanCount'))
check('media-caps-preserved', /srcKickState\.size\s*<=\s*220/.test(media) && /const POST_NATIVE_SRC_CAP = 2/.test(media) && !/nativePrimeSrcState|__nativePrime/.test(media))
check('vip-bounded', /VIP_PROBE_CACHE_LIMIT\s*=\s*1000/.test(vip))
check('ads-bounded', /ADS_SLOT_HISTORY_LIMIT\s*=\s*512/.test(ads))

const sentinelConsumers = [
  'app/forum/features/feed/components/TopicsPane.jsx',
  'app/forum/features/feed/components/ThreadRepliesPane.jsx',
  'app/forum/features/feed/components/PublishedPostsPane.jsx',
  'app/forum/features/feed/components/UserPostsPane.jsx',
  'app/forum/features/media/components/VideoFeedPane.jsx',
  'app/forum/features/dm/components/DmDialogsPane.jsx',
  'app/forum/features/dm/components/DmThreadLoadMore.jsx',
  'app/forum/features/dm/components/InboxRepliesPane.jsx',
]
check('sentinel-consumers-8', sentinelConsumers.every((file) => read(file).includes('loadKey=')), sentinelConsumers.join(','))

const windowingConsumers = [
  'app/forum/features/feed/components/TopicsPane.jsx',
  'app/forum/features/feed/components/ThreadRepliesPane.jsx',
  'app/forum/features/feed/components/PublishedPostsPane.jsx',
  'app/forum/features/feed/components/UserPostsPane.jsx',
  'app/forum/features/dm/components/DmDialogsPane.jsx',
  'app/forum/features/dm/components/DmMessagesPane.jsx',
  'app/forum/features/dm/components/InboxRepliesPane.jsx',
  'app/forum/features/media/hooks/useVideoFeedWindowing.js',
]
check('windowing-consumers-8', windowingConsumers.every((file) => read(file).includes('useForumWindowing')), windowingConsumers.join(','))

const report = {
  ok: checks.every((row) => row.ok),
  generatedAt: new Date().toISOString(),
  checks,
}
const outArg = process.argv.find((arg) => arg.startsWith('--out='))
if (outArg) {
  const out = path.resolve(root, outArg.slice('--out='.length))
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}
console.log(JSON.stringify(report, null, 2))
if (!report.ok) process.exitCode = 1
