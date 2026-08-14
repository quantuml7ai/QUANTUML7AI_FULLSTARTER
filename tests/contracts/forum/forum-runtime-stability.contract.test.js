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
    expect(media).toContain('const POST_NATIVE_SRC_CAP = 2')
    expect(media).toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL')
    expect(media).not.toContain('nativePrimeSrcState')
    expect(media).not.toContain('__nativePrime')
  })
})
