import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('QL7 global screen lifecycle contracts', () => {
  test('keeps exactly one wake-lock runtime and retires global hidden-media ownership from layout', () => {
    const layout = read('app/layout.js')

    expect((layout.match(/<ScreenWakeLockRuntime \/>/g) || []).length).toBe(1)
    expect(layout).not.toContain("import GlobalMediaVisibilityRuntime")
    expect(layout).not.toContain('<GlobalMediaVisibilityRuntime />')
  })

  test('wake lock is event-driven, reacquires across iOS lifecycle edges, and has no polling timers', () => {
    const source = read('components/ScreenWakeLockRuntime.jsx')

    expect(source).toMatch(
      /navigator\.wakeLock\s*\.\s*request\(\s*['"]screen['"]\s*\)/,
    )
    expect(source).toContain("'visibilitychange'")
    expect(source).toContain("'pageshow'")
    expect(source).toContain("'focus'")
    expect(source).toContain("'pointerdown'")
    expect(source).toContain("'touchstart'")
    expect(source).toContain("'sentinel-release'")
    expect(source).toContain('__ql7ScreenWakeLockState')
    expect(source).not.toContain('setInterval(')
    expect(source).not.toContain('setTimeout(')
  })

  test('leaves the old hidden-media implementation dormant and unmounted', () => {
    const source = read('components/GlobalMediaVisibilityRuntime.jsx')
    expect(source).toContain("querySelectorAll('audio,video')")
    expect(source).toContain("querySelectorAll('iframe')")
    const layout = read('app/layout.js')
    expect(layout).not.toContain('GlobalMediaVisibilityRuntime')
  })
})
