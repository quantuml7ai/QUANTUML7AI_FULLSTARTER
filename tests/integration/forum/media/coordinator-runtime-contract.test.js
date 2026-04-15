import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('coordinator runtime contract', () => {
  test('VideoMedia does not run local post-video src detach recovery', () => {
    const src = read('app/forum/features/media/components/VideoMedia.jsx')
    expect(src).toContain("if (String(dataForumVideo || '') === 'post' || coordinatorOwnsLifecycle)")
  })

  test('coordinator defers hard unload during settling', () => {
    const src = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(src).toContain('hard_unload_deferred_settling')
    expect(src).toContain('markSettling')
  })

  test('media lifecycle runtime exports touch marker for resident policy', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).toContain('export function __markMediaLifecycleTouch')
    expect(src).toContain('shouldKeepResidentPostVideo')
  })
})