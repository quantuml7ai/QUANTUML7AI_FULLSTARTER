import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('QL7 global screen/media lifecycle contracts', () => {
  test('mounts exactly one wake-lock runtime and one global hidden-media runtime', () => {
    const layout = read('app/layout.js')

    expect((layout.match(/<ScreenWakeLockRuntime \/>/g) || []).length).toBe(1)
    expect((layout.match(/<GlobalMediaVisibilityRuntime \/>/g) || []).length).toBe(1)
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

  test('hidden lifecycle pauses native media and provider/generic media iframes without a timer loop', () => {
    const source = read('components/GlobalMediaVisibilityRuntime.jsx')

    expect(source).toContain("querySelectorAll('audio,video')")
    expect(source).toContain("querySelectorAll('iframe')")
    expect(source).toContain("'visibilitychange'")
    expect(source).toContain("'pagehide'")
    expect(source).toContain("'pageshow'")
    expect(source).toContain("'freeze'")
    expect(source).toContain("'site-media-play'")
    expect(source).toContain("func: 'pauseVideo'")
    expect(source).toContain("{ type: 'pause', 'x-tiktok-player': true }")
    expect(source).toContain("frame.setAttribute('src', 'about:blank')")
    expect(source).toContain("media.dataset.__systemPause = '1'")
    expect(source).not.toContain('setInterval(')
    expect(source).not.toContain('setTimeout(')
  })
})
