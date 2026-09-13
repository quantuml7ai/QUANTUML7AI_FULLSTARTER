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

  test('windowing keeps native active-scroll anchoring plus explicit idle-maintenance anchor ownership', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'app/forum/shared/hooks/useForumWindowing.js'), 'utf8')
    for (const token of [
      'ensureItemRenderedByKey',
      'ensureItemRenderedByDomId',
      'applyAnchoredScrollDelta',
      'targetLockRef',
      'mediaKeepaliveRef',
      'buildForumHeightPrefix',
      'readItemLayoutFootprint',
      'readListRelativeViewportTop',
      'pendingVisualAnchorRef',
      'resolveForumIdleVisualAnchorDelta',
      'captureIdleVisualAnchor',
      'restoreIdleVisualAnchor',
      'useLayoutEffect(() => {',
    ]) {
      expect(src).toContain(token)
    }

    expect(src).toContain("emitWindowingDiag('anchor_adjust_skip_native_anchor'")
    for (const reason of ['anchor_flush', 'scroll_settle', 'media_keepalive_expiry', 'measured_height', 'row_gap']) {
      expect(src).toContain(`captureIdleVisualAnchor('${reason}')`)
    }
    const captureBeforeFlush = src.indexOf("captureIdleVisualAnchor('anchor_flush')")
    const applyPending = src.indexOf("applyPendingMeasuredHeights('scroll_settled')", captureBeforeFlush)
    expect(captureBeforeFlush).toBeGreaterThanOrEqual(0)
    expect(applyPending).toBeGreaterThan(captureBeforeFlush)

    const nullRefStart = src.indexOf('if (!node) {')
    const nullRefEnd = src.indexOf('measuredNodesRef.current.set(key, node)', nullRefStart)
    const nullRefBranch = src.slice(nullRefStart, nullRefEnd)
    expect(nullRefBranch).not.toContain('pendingHeightsRef.current.delete(key)')

    expect(src).not.toContain('pendingReverseAnchorRef')
    expect(src).not.toContain('windowing_reverse_anchor_residual')
    expect(src).not.toContain('const nextHeight = Math.round(h)')
    expect(src).not.toMatch(/for\s*\(let i = 0; i < start; i \+= 1\) top \+= getHeightAtIndex/)
  })

  test('video-feed scroll stability uses stable measurement refs and skips the settle-only recalc', () => {
    const windowing = fs.readFileSync(path.join(process.cwd(), 'app/forum/shared/hooks/useForumWindowing.js'), 'utf8')
    const videoFeed = fs.readFileSync(path.join(process.cwd(), 'app/forum/features/media/hooks/useVideoFeedWindowing.js'), 'utf8')

    expect(windowing).toContain('measureCallbackCacheRef')
    expect(windowing).toContain('measureQueueRef')
    expect(windowing).toContain('scheduleMeasuredNodeUpdate')
    expect(windowing).toContain('measureHandlerRef.current = handleMeasuredNode')
    expect(windowing).toContain('const renderedKeys = new Set(itemKeys.slice(win.start, win.end))')
    expect(windowing).toContain('measureQueue.clear()')
    expect(windowing).toContain('measureCallbackCache.clear()')
    expect(windowing).not.toContain('const measureRef = useCallback((rawKey) => (node) => {')
    expect(windowing).toContain('if (recalcOnScrollSettle) {')
    expect(windowing).toContain('direction: 0,')
    expect(videoFeed).toContain('recalcOnScrollSettle: false')
  })

  test('video-feed media keepalive has explicit opt-out, expiry recalc and a bounded post-expansion budget', () => {
    const windowing = fs.readFileSync(path.join(process.cwd(), 'app/forum/shared/hooks/useForumWindowing.js'), 'utf8')
    const mediaStack = fs.readFileSync(path.join(process.cwd(), 'app/forum/features/feed/components/PostMediaStack.jsx'), 'utf8')

    expect(windowing).toContain('WINDOWING_KEEPALIVE_OPT_OUT_SELECTOR')
    expect(windowing).toContain('isInsideWindowingKeepaliveOptOut')
    expect(windowing).toContain('isForumWindowingMediaKeepaliveSensitive')
    expect(windowing).toContain('stableDescendants')
    expect(windowing).toContain('!isInsideWindowingKeepaliveOptOut(candidate, node)')
    expect(windowing).toContain('mediaKeepaliveTimerRef')
    expect(windowing).toContain('scheduleMediaKeepaliveExpiry')
    expect(windowing).toContain("emitWindowingDiag('windowing_media_keepalive_expired'")
    expect(windowing).toContain('MEDIA_KEEPALIVE_RUNWAY_ITEMS = 4')
    expect(windowing).toContain('clampKeepaliveExpansionToBudget')
    expect(windowing).toContain('nextMaxRender + MEDIA_KEEPALIVE_RUNWAY_ITEMS')
    expect(windowing).toContain("emitWindowingDiag('windowing_media_keepalive_final_cap'")
    expect(windowing).toContain('mediaKeepaliveRef.current.size > 0')
    expect(windowing).toContain('velocity: 0')
    expect(windowing).toContain('function hasStableLayoutShell(node)')
    expect(windowing).toContain('function containsStableLayoutShell(node)')
    expect(windowing).toContain('const stableMediaShell = hasStableLayoutShell(node)')
    expect(windowing).toContain('const cardContainsStableMediaShell = !stableMediaShell && containsStableLayoutShell(node)')
    expect(windowing).toContain('stableMediaShell || cardContainsStableMediaShell')

    const optOutCount = (mediaStack.match(/data-windowing-keepalive=\{isVideoFeed \? "0" : "media"\}/g) || []).length
    expect(optOutCount).toBeGreaterThanOrEqual(4)
  })

})
