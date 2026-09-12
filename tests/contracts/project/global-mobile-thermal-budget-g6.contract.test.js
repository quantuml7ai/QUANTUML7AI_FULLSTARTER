import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('G6 global mobile animation budget', () => {
  test('uses one managed near-viewport observer for motion only', () => {
    const registry = read('lib/visual-runtime/visualActivityRegistry.js')
    expect(registry).toContain("near100: '160px 96px 160px 96px'")
    expect(registry).toContain("near50: '96px 64px 96px 64px'")
    expect(registry).toContain('const pool = getObserver(record.root, record.marginProfile, record.renderManaged)')
    expect(registry).toContain("renderManaged ? 'managed-motion' : 'visual'")
    expect(registry).not.toContain('MANAGED_PREPAINT_MARGIN_PROFILES')
    expect(registry).not.toContain('motionPoolKey')
    expect(registry).toContain('isIOSExchangeMotionContinuityRuntime')
    expect(registry).toContain("if (isIOSExchangeMotionContinuityRuntime()) return 'running'")
  })

  test('publishes only HOT/PAUSED motion state and leaves static paint untouched', () => {
    const registry = read('lib/visual-runtime/visualActivityRegistry.js')
    const globals = read('app/globals.css')
    expect(registry).toContain('ql7MotionMode')
    expect(registry).toContain("next !== 'running' ? 'paused' : 'hot'")
    expect(registry).toContain('motionModeWrites')
    expect(registry).toContain('const motionModes = { hot: 0, warm: 0, paused: 0 }')
    expect(registry).not.toContain('ql7RenderMode')
    expect(globals).toContain('[data-ql7-render-managed="1"][data-ql7-motion-mode="paused"]')
    expect(globals).toContain('animation-play-state: paused !important')
    expect(globals).not.toContain('transition-property: none !important')
  })

  test('does not reintroduce global scroll/layout polling into the shared visual runtime', () => {
    const registry = read('lib/visual-runtime/visualActivityRegistry.js')
    expect(registry).not.toMatch(/new\s+MutationObserver\s*\(/)
    expect(registry).not.toMatch(/getBoundingClientRect\s*\(/)
    expect(registry).not.toMatch(/addEventListener\(\s*['"]scroll['"]/)
    expect(registry).not.toMatch(/requestAnimationFrame\s*\(/)
    expect(registry).not.toMatch(/document\.getAnimations\s*\(/)
  })

  test('shrinks idle reaction DOM pools without reducing the visible burst count', () => {
    const postFx = read('app/forum/features/feed/hooks/usePostFx.js')
    const qcast = read('app/forum/features/media/components/QCastPlayer.jsx')
    expect(postFx).toContain('const FX_POOL = 10')
    expect(postFx).toContain('const FX_BURST_BASE = 5')
    expect(qcast).toContain('const burst = mobileLean ? 3 : 5')
    expect(qcast).toContain('pool: mobileLean ? 6 : 24')
    expect(qcast).toContain('return { viz: false, boom: false, burst: 2, pool: 6, fullscreen: true }')
  })
})
