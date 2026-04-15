import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

describe('forum media contracts', () => {
  test('layout keeps early diag master-gated and not forumPath auto-started', () => {
    const src = read('app/layout.js')
    expect(src).toContain('NEXT_PUBLIC_FORUM_EARLY_DIAG_ENABLED')
    expect(src).not.toContain('var forumPath = /^\\\\/forum')
    expect(src).not.toContain('traceEnabled = !!(forumPath')
  })

  test('media lifecycle runtime does not hard-reset persisted mute on startup', () => {
    const src = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    expect(src).not.toMatch(/localStorage\.setItem\(MEDIA_MUTED_KEY,\s*['"]1['"]\)/)
    expect(src).not.toMatch(/localStorage\.setItem\(MEDIA_VIDEO_MUTED_KEY,\s*['"]1['"]\)/)
  })

  test('qcast does not persist global mute directly from toggle handler', () => {
    const src = read('app/forum/features/media/components/QCastPlayer.jsx')
    expect(src).not.toMatch(/toggleMute[\s\S]*writeMuted\(\!\!audio\.muted\)/)
  })

  test('forum ads autoplay fallback does not persist global mute', () => {
    const src = read('app/forum/ForumAds.js')
    expect(src).not.toMatch(/forum-ads-autoplay-fallback[\s\S]*writeMutedPrefToStorage\(true/)
  })
})