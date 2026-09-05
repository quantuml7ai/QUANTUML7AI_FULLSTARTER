import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function block(source, start, end) {
  const a = source.indexOf(start)
  const b = source.indexOf(end, a + start.length)
  expect(a, `missing ${start}`).toBeGreaterThanOrEqual(0)
  expect(b, `missing ${end}`).toBeGreaterThan(a)
  return source.slice(a, b)
}

describe('QL7 forum native video poster-first light prewarm R24', () => {
  test('removes synthetic first-frame priming and keeps a bounded metadata-only runway', () => {
    const media = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(media).toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_FINAL')
    expect(media).toContain('const POST_NATIVE_SRC_CAP = 2')
    expect(media).toContain('Math.max(420, Math.min(720, Math.round(viewportH * 0.62)))')
    expect(media).toContain('Math.max(360, Math.min(640, Math.round(viewportH * 0.54)))')
    expect(media).toContain('Math.max(220, Math.min(420, Math.round(viewportH * 0.34)))')
    expect(media).not.toContain('const primeNativeFirstFrame =')
    expect(media).not.toContain('native_prime_offscreen_warmup_play')
    expect(media).not.toContain('nativePrimeSrcState')
    expect(media).not.toContain('__nativePrime')
    expect(media).not.toContain('requestVideoFrameCallback')

    const prewarm = block(
      media,
      "const prepareNativePriorityPrewarm = (el, reason = 'native_priority_prewarm') => {",
      '// Best-effort loop для iframe',
    )
    expect(prewarm).toContain("media.preload = 'metadata'")
    expect(prewarm).toContain("preloadMode: 'metadata'")
    expect(prewarm).not.toContain('.play(')
    expect(prewarm).not.toContain('playMedia(')
    expect(prewarm).not.toContain('startHtmlMedia(')
  })

  test('preserves the existing active autoplay/manual playback path', () => {
    const media = read('app/forum/features/media/hooks/useForumMediaCoordinator.js')
    expect(media).toMatch(/candidate_activate_native_pending_play[\s\S]{0,900}playMedia\(active\)/)
    expect(media).toMatch(/candidate_activate[\s\S]{0,900}playMedia\(active\)/)
    expect(media).toContain("startHtmlMedia(el, el.muted ? 'play_pending_muted' : 'play_pending_user_sound')")
    expect(media).toContain("startHtmlMedia(el, 'play_now')")
  })

  test('does not let shared lifecycle or the leaf inflate paused forum prewarm back to auto', () => {
    const lifecycle = read('app/forum/features/media/utils/mediaLifecycleRuntime.js')
    const leaf = read('app/forum/features/media/components/VideoMedia.jsx')
    expect(lifecycle).toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2_RUNTIME')
    expect(lifecycle).toContain("el.preload = isPostFeedVideo ? 'metadata' : (keepWarmFetchOnSoftUnload ? 'auto' : 'metadata')")
    expect(lifecycle).not.toContain('__nativePrime')
    expect(leaf).toContain("const renderPreload = coordinatorOwnsPostLifecycle ? 'none' : (isPostVideo ? 'metadata' : preload)")
    expect(leaf).toContain("postPlaybackIntent ? 'auto' : (wantsWarm ? 'metadata' : 'none')")
    expect(leaf).toMatch(/isNewMediaNode && isPostVideo[\s\S]{0,560}el\.preload = 'none'/)
  })

  test('keeps the prewarm feature scoped out of DM and ads runtimes', () => {
    const dm = read('app/forum/features/dm/components/DmMediaRenderer.jsx')
    const forumAds = read('app/forum/ForumAds.js')
    const globalAds = read('app/ads.js')
    for (const source of [dm, forumAds, globalAds]) {
      expect(source).not.toContain('QL7_FORUM_NATIVE_VIDEO_POSTER_FIRST_LIGHT_PREWARM_R24_FIX2')
    }
  })
})
