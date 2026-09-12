import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('forum runtime stability protected contracts', () => {
  test('removes known accumulating hot-path anti-patterns', () => {
    const data = read('app/forum/features/feed/hooks/useForumDataRuntime.js')
    const sentinel = read('app/forum/features/feed/components/LoadMoreSentinel.jsx')
    const rootSource = read('app/forum/ForumRoot.jsx')
    expect(data).not.toMatch(/localStorage\.setItem\(['\"]forum:snap['\"]/)
    expect(sentinel).not.toMatch(/setInterval\s*\(/)
    expect(sentinel).not.toContain('repeatMs')
    expect(rootSource).not.toContain('function useForumNickBadgeFit()')
  })

  test('keeps the empty windowing path idempotent and prevents RAF-driven update loops', () => {
    const windowing = read('app/forum/shared/hooks/useForumWindowing.js')
    expect(windowing).toContain('const emptyWindowUnchanged =')
    expect(windowing).toContain('if (emptyWindowUnchanged) return')
    expect(windowing.indexOf('if (emptyWindowUnchanged) return')).toBeLessThan(
      windowing.indexOf('setWin(nextEmpty)'),
    )
  })


  test('keeps nickname fit local, StrictMode-safe and equivalent to the original full-text policy', () => {
    const nick = read('app/forum/shared/hooks/useForumNickBadgeFit.js')
    const nickText = read('app/forum/shared/components/ForumNickText.jsx')
    expect(nick).toContain('const MIN_FONT_PX = 7')
    expect(nick).toContain('const MAX_BADGE_WIDTH_PX = 130')
    expect(nick).toContain('const wanted = textEl.scrollWidth || 0')
    expect(nick).toContain('(baseFontPx * available) / wanted')
    expect(nick).toContain("textEl.style.textOverflow = 'clip'")
    expect(nick).toContain('fitBatches: fitBatchCount')
    expect(nick).toContain('singleFrameFit: true')
    expect(nick).toContain('let fitRaf = 0')
    expect(nick).not.toContain('measureRaf')
    expect(nick).not.toContain('resetRaf')
    expect(nick).not.toContain('useLayoutEffect(() => () => {')
    expect(nick).not.toMatch(/MutationObserver\s*\(/)
    expect(nickText).toContain("useForumNickBadgeFit(textValue)")
    expect(nickText).toContain('fitRef(node)')
    expect(nickText).not.toMatch(/MutationObserver\s*\(/)
  })

  test('exposes progress-based sentinel diagnostics without restoring interval polling', () => {
    const sentinel = read('app/forum/features/feed/components/LoadMoreSentinel.jsx')
    expect(sentinel).toContain('progressCount')
    expect(sentinel).toContain('progressTransitions')
    expect(sentinel).toContain('progressTokenRef')
    expect(sentinel).toContain('sentinelDiag.progressTransitions += 1')
    expect(sentinel).not.toMatch(/setInterval\s*\(/)
  })

  test('keeps native media state bounded after poster-first prewarm replaces prime state', () => {
    const media = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(media).toMatch(/srcKickState\.size\s*<=\s*220/)
    expect(media).toContain('QL7_FORUM_NATIVE_SRC_BUDGET_R25_STRICT_FINAL')
    expect(media).toContain('QL7_FORUM_MEDIA_RETENTION_R26_FINAL')
    expect(media).toContain('const POST_NATIVE_SRC_CAP = 2')
    expect(media).toContain('selectNativeSrcBudgetSurvivors(rows, POST_NATIVE_SRC_CAP)')
    expect(media).toContain("media.dataset.__strictNativeSrcCapDetach = '1'")
    expect(media).toContain("hardUnloadMedia(media, 'resident_cap_overflow')")
    expect(media).toContain('__nativeSrcCapBlockedUntil')
    expect(media).toContain('selfHealDisconnectedMediaRegistry(`lifecycle_${reason}`)')
    expect(media).toContain("releaseDetachedManagedVideoPipeline(owner, 'detached_registry_release')")
    expect(media).toContain('rewarmBlockedUntil > now')
    expect(media).toContain('nativePrewarmConnected')
    expect(media).toContain('registryDisconnected')
    expect(media).toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL')
    expect(media).not.toContain('nativePrimeSrcState')
    expect(media).not.toContain('__nativePrime')
  })

  test('keeps dormant search and profile presentation models off the normal feed hot path', () => {
    const search = read('app/forum/features/ui/components/ForumSearchSortControls.jsx')
    const profile = read('app/forum/features/feed/hooks/useUserPostsBranchModel.js')
    const inboxModel = read('app/forum/features/dm/hooks/useInboxRepliesModel.js')
    const dmRuntime = read('app/forum/features/dm/hooks/useForumDmRuntime.js')

    expect(search).toContain('const searchIndexesActive = !!drop && !!query')
    expect(search).toContain('const EMPTY_SEARCH_INDEX_SOURCE = Object.freeze([])')
    expect(search).toContain('const searchPostsSource = useMemo(')
    expect(search).toContain('const searchTopicsSource = useMemo(')
    expect(search).toContain('searchIndexesActive ? (data?.posts || EMPTY_SEARCH_INDEX_SOURCE) : EMPTY_SEARCH_INDEX_SOURCE')
    expect(search).toContain('searchIndexesActive ? (data?.topics || EMPTY_SEARCH_INDEX_SOURCE) : EMPTY_SEARCH_INDEX_SOURCE')
    expect(search).toContain('for (const post of searchPostsSource || [])')
    expect(search).not.toContain('new Map((data?.posts || []).map')

    expect(profile).toContain("if (!String(authorFilterUserId || '').trim()) return map")
    expect(profile).toContain('const EMPTY_PROFILE_POSTS = Object.freeze([])')
    expect(profile).toContain("if (profileBranchMode !== 'posts') return EMPTY_PROFILE_POSTS")

    expect(inboxModel).toContain('presentationActive = true')
    expect(inboxModel).toContain('const EMPTY_INBOX_REPLY_COUNT_SOURCE = Object.freeze([])')
    expect(inboxModel).toContain('const replyCountSource = useMemo(')
    expect(inboxModel).toContain('presentationActive && meId ? (posts || EMPTY_INBOX_REPLY_COUNT_SOURCE) : EMPTY_INBOX_REPLY_COUNT_SOURCE')
    expect(inboxModel).toContain('for (const post of replyCountSource)')
    expect(inboxModel).toContain('if (!presentationActive) return repliesToMe')
    expect(dmRuntime).toContain("presentationActive: inboxOpen && inboxTab === 'replies'")
  })

  test('keeps one DM notification retry owner while preserving initial and Support reads', () => {
    const runtime = read('app/forum/features/dm/hooks/useForumDmRuntime.js')
    const lifecycle = read('app/forum/features/dm/hooks/useDmLoadLifecycle.js')
    const refreshStart = runtime.indexOf('const runDmRealtimeRefresh = useCallback')
    const openStart = runtime.indexOf('// Every real dialog open must ask the server')
    const refreshBlock = runtime.slice(refreshStart, openStart)

    expect(refreshStart).toBeGreaterThan(-1)
    expect(openStart).toBeGreaterThan(refreshStart)
    expect(runtime).toContain('const DM_REALTIME_THREAD_RETRY_MS = [0, 350, 900, 1800, 3200]')
    expect(refreshBlock).toContain('isQl7SupportPeerId(uid) ? [0] : DM_REALTIME_THREAD_RETRY_MS')
    expect(runtime).not.toContain('runOpenDmThreadRealtimeImpulse')
    expect(runtime).toContain("runDmRealtimeRefresh('notification-state')")
    expect(runtime).toContain("runDmRealtimeRefresh('notification-count')")
    expect(runtime).toContain("runDmRealtimeRefresh('open-notification')")
    expect(runtime).toContain("runDmRealtimeRefresh('service-worker-push')")
    expect(runtime).toContain("runDmRealtimeRefresh('mounted-notification-state')")
    expect(runtime).toContain('const openDelays = isQl7SupportPeerId(uid) ? [0] : [250, 900]')
    expect(lifecycle).toContain('loadDmThread(uid, null, { force: true, refresh: true, bypassThrottle: true })')
    expect(read('app/forum/features/dm/utils/dmLoaders.js')).toContain("opts?.bypassThrottle !== true")
    expect(runtime).toContain("fetchDmThreadRealtime(uid, 'support-auth-ready')")
    expect(runtime).toContain('applyDmRealtimeDeleteImpulse(detail)')
  })

  test('binds load-more and managed visuals to a real inner forum scroller only when one is an ancestor', () => {
    const sentinel = read('app/forum/features/feed/components/LoadMoreSentinel.jsx')
    const thread = read('app/forum/features/feed/components/ThreadSection.jsx')
    expect(sentinel).toContain('export function resolveLoadMoreSentinelRoot')
    expect(sentinel).toContain("node.closest?.('[data-forum-scroll=\"1\"]')")
    expect(sentinel).toContain('{ root: observerRoot, rootMargin, threshold: 0 }')
    expect(sentinel).toContain("rootMargin = '700px 0px'")
    expect(thread).toContain('data-ql7-visual-scroll-root="1"')
    for (const file of [
      'app/forum/features/feed/components/PublishedPostsPane.jsx',
      'app/forum/features/feed/components/ThreadRepliesPane.jsx',
      'app/forum/features/media/components/VideoFeedPane.jsx',
    ]) {
      expect(read(file), file).toContain('rootMargin="1200px 0px"')
    }
  })

})
