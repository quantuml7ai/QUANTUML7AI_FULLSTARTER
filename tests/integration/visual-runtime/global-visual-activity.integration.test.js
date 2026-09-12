import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { createAnimatedPosterKey } from '../../../lib/storage/mediaKeys.js'
import { buildBundledPosterPath, buildManagedMediaPosterUrl, preferredMarginProfileForAnimatedPath } from '../../../lib/visual-runtime/animatedAssetManifest.js'

const root = process.cwd()

describe('Global Visual Activity V3 cross-layer integration', () => {
  test('server poster key and client managed-media convention stay aligned', () => {
    expect(createAnimatedPosterKey('forum/images/example.gif')).toBe('forum/images/example-poster.webp')
    expect(buildManagedMediaPosterUrl('https://media.quantuml7ai.com/forum/images/example.gif'))
      .toBe('https://media.quantuml7ai.com/forum/images/example-poster.webp')
  })

  test('bundled poster paths and dense prewarm profiles are deterministic', () => {
    expect(buildBundledPosterPath('/game/game.gif')).toBe('/__ql7_visual_posters/game/game.gif.webp')
    expect(preferredMarginProfileForAnimatedPath('/vip/emoji/e12.gif')).toBe('near50')
    expect(preferredMarginProfileForAnimatedPath('/friends/invitation.gif')).toBe('near100')
  })

  test('bundled manifest contains every verified animated asset from the supplied public tree, including all VIP avatars and stickers', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/__ql7_visual_posters/manifest.json'), 'utf8'))
    expect(manifest.schema).toBe('ql7-animated-asset-manifest-v2')
    expect(manifest.animatedAssetCount).toBe(295)
    expect(manifest.assets).toHaveLength(295)
    expect(manifest.assets.every((row) => row.sourceSha256 && row.posterSha256 && row.firstFramePixelSha256)).toBe(true)

    const vipAvatars = manifest.assets.filter((row) => /^\/vip\/avatars\/a\d+\.gif$/i.test(String(row.source || '')))
    const vipEmoji = manifest.assets.filter((row) => /^\/vip\/emoji\/e\d+\.gif$/i.test(String(row.source || '')))
    expect(vipAvatars).toHaveLength(130)
    expect(vipEmoji).toHaveLength(149)
    expect([...vipAvatars, ...vipEmoji].every((row) => String(row.poster || '').startsWith('/__ql7_visual_posters/vip/'))).toBe(true)
  })
})
