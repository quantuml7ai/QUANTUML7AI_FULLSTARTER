import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')
const registry = read('lib/visual-runtime/visualActivityRegistry.js')
const host = read('components/visual-runtime/GlobalVisualActivityRuntime.jsx')

describe('QL7 visual activity V3 performance-safe registry', () => {
  test('uses shared observers with only the approved 100px and 50px profiles', () => {
    expect(registry).toContain("near100: '100px 0px 100px 0px'")
    expect(registry).toContain("near50: '50px 0px 50px 0px'")
    expect(registry).toContain('const observerPools = new Map()')
    expect(registry).toContain('const records = new WeakMap()')
    expect(registry).toContain('threshold: [0, 0.001]')
    expect(registry).toContain('EXIT_HYSTERESIS_MS = 90')
  })

  test('never performs R8-style global animation/image/body mutation discovery', () => {
    const source = `${registry}\n${host}`
    expect(source).not.toMatch(/document\.getAnimations\s*\(/)
    expect(source).not.toMatch(/new\s+MutationObserver\s*\(/)
    expect(source).not.toMatch(/querySelectorAll\(\s*['"]img['"]\s*\)/)
    expect(source).not.toMatch(/querySelectorAll\(\s*['"]\*['"]\s*\)/)
    expect(source).not.toMatch(/getComputedStyle\s*\(/)
    expect(source).not.toMatch(/getBoundingClientRect\s*\(/)
    expect(source).not.toMatch(/\.scrollHeight\b|\.clientHeight\b/)
    expect(source).not.toMatch(/addEventListener\(\s*['"]scroll['"]/)
    expect(host).toContain("document.querySelectorAll('[data-ql7-visual-scope]')")
  })

  test('keeps runtime cost diagnostics hard-zero for forbidden scan classes', () => {
    for (const token of [
      'forcedLayoutReads: 0',
      'globalAnimationScans: 0',
      'bodyMutationObservers: 0',
      'descendantStateScans: 0',
    ]) expect(registry).toContain(token)
  })

  test('only resumes WAAPI animations that the runtime itself paused', () => {
    expect(registry).toContain('const runtimePausedWaapi = new WeakMap()')
    expect(registry).toContain("animation.playState !== 'running'")
    expect(registry).toContain('runtimePausedWaapi.set(record.node, owned)')
    expect(registry).toContain("animation.playState === 'paused'")
  })


  test('treats viewport-pinned scopes as structural, but keeps document visibility and reduced motion authoritative', () => {
    const desiredStart = registry.indexOf('function desiredState(record)')
    const desiredEnd = registry.indexOf('function isCssAnimation', desiredStart)
    const desired = registry.slice(desiredStart, desiredEnd)
    expect(desired).toContain("if (!documentVisible) return 'paused'")
    expect(desired).toContain("if (reducedMotion) return 'paused'")
    expect(desired).toContain("if (record.viewportPinned) return 'running'")

    const observeStart = registry.indexOf('function observeRecord(record)')
    const observeEnd = registry.indexOf('function unobserveRecord', observeStart)
    const observe = registry.slice(observeStart, observeEnd)
    expect(observe).toContain('if (record.viewportPinned)')
    expect(observe).toContain("record.poolKey = ''")
    expect(observe.indexOf('if (record.viewportPinned)')).toBeLessThan(observe.indexOf('getObserver('))
  })

  test('contains no product media playback mutation', () => {
    const source = `${registry}\n${host}`
    for (const banned of ['video.pause(', 'audio.pause(', '.currentTime =', '.playbackRate =', '.volume =', '.muted =']) {
      expect(source).not.toContain(banned)
    }
  })
})
