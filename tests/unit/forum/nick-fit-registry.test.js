import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const source = fs.readFileSync(path.join(root, 'app/forum/shared/hooks/useForumNickBadgeFit.js'), 'utf8')

describe('forum nickname fit registry', () => {
  test('uses mounted-node registry, shared ResizeObserver and batched RAF', () => {
    expect(source).toContain('const records = new Map()')
    expect(source).toContain('const dirty = new Set()')
    expect(source).toContain('new ResizeObserver')
    expect(source).toContain('requestAnimationFrame')
    expect(source).toContain('let fitRaf = 0')
    expect(source).toContain('singleFrameFit: true')
    expect(source).not.toContain('measureRaf')
    expect(source).not.toContain('resetRaf')
    expect(source).toContain('unregisterForumNickBadge')
    expect(source).toContain('const MIN_FONT_PX = 7')
    expect(source).toContain('const MAX_BADGE_WIDTH_PX = 130')
    expect(source).toContain("textEl.style.maxWidth = '100%'")
    expect(source).toContain("textEl.style.textOverflow = 'clip'")
    expect(source).toContain('const wanted = textEl.scrollWidth || 0')
    expect(source).toContain('(baseFontPx * available) / wanted')
    expect(source).toContain('fitBatches: fitBatchCount')
    expect(source).toContain('reset -> measure -> final fit all happen inside ONE RAF callback')
    expect(source).not.toContain('useLayoutEffect(() => () => {')
    expect(source).not.toMatch(/MutationObserver\s*\(/)
    expect(source).not.toMatch(/querySelectorAll\([^)]*nick-badge/)
  })
})
