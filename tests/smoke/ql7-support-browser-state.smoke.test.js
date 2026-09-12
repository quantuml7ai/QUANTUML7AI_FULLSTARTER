import fs from 'node:fs'
import { describe, it, expect } from 'vitest'

describe('R90 REV6 browser-facing source smoke', () => {
  it('removes delayed support history replay and fixes visual hydration at the visual owner', () => {
    const send = fs.readFileSync('app/forum/features/dm/services/sendDmComposerMessage.js', 'utf8')
    const visual = fs.readFileSync('components/visual-runtime/GlobalVisualActivityRuntime.jsx', 'utf8')
    const registry = fs.readFileSync('lib/visual-runtime/visualActivityRegistry.js', 'utf8')
    const state = fs.readFileSync('app/forum/features/dm/services/ql7SupportRuntimeStateReducer.js', 'utf8')
    expect(send).not.toContain('supportReplayOffsetMs += 140')
    expect(visual).not.toContain('requestAnimationFrame')
    expect(registry).not.toContain('ql7Hydrated')
    expect(registry).toContain('publishState: false')
    expect(registry).toContain('const runtimePausedCss = new WeakMap()')
    expect(visual).toContain('reconcileVisualScopeAnimationTarget(scope, target)')
    expect(state).toContain('shouldApplyQl7SupportRuntimeEvent')
  })

  it('keeps safety badge and removes timed restriction badge', () => {
    expect(fs.existsSync('components/composer-safety/ComposerSafetyBadge.jsx')).toBe(true)
    expect(fs.existsSync('components/composer-safety/ComposerRestrictionBadge.jsx')).toBe(false)
  })
})
