import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const ROOT = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8')

describe('forum ad discovery surface contracts', () => {
  test('keeps click-through on the prompt and lens only', () => {
    const source = read('app/forum/ForumAds.js')
    expect(source).not.toContain('<a\n        href={clickHref}\n        target="_blank"')
    expect(source).toContain('data-ad-destination-trigger="1"')
    expect(source).toContain('className="forum-ad-discoveryPrompt"')
    expect(source).toContain('className="forum-ad-lens"')
    expect(source).toContain('onClick={activateMediaSurface}')
  })

  test('uses actual native-video play time for the 3s and 45s prompt cadence', () => {
    const source = read('app/forum/ForumAds.js')
    const helper = read('lib/ads/adDiscoveryPrompt.js')
    expect(source).toContain("video.addEventListener('playing', startTicker)")
    expect(source).toContain('watchedMs += Math.min(1000')
    expect(source).toContain('getAdDiscoveryThresholdMs(promptNumber)')
    expect(helper).toContain('AD_DISCOVERY_FIRST_DELAY_MS = 3000')
    expect(helper).toContain('AD_DISCOVERY_REPEAT_INTERVAL_MS = 45000')
    expect(helper).toContain('AD_DISCOVERY_VISIBLE_MS = 10000')
  })

  test('forum and global controllers always play and unmute on media-surface activation', () => {
    const forumSlot = read('app/forum/features/ui/components/ForumAdSlot.jsx')
    const globalAds = read('app/ads.js')
    expect(forumSlot).toContain('onMediaSurfaceActivate={handleForumAdMediaActivate}')
    expect(forumSlot).toContain('applyAdVideoSound(video, false)')
    expect(forumSlot).toContain('video.play?.().catch(() => {})')
    expect(globalAds).toContain('onMediaSurfaceActivate={handleMediaSurfaceActivate}')
    expect(globalAds).toContain("syncMutedPrefEverywhere(false, playerIdRef.current, 'site-ads-surface-activate')")
    expect(globalAds).toContain("markSiteAdPlaying(true, 'surface_activate')")
  })

  test('ships seven translated prompt variants in all split dictionaries', async () => {
    const langs = ['ru', 'en', 'zh', 'uk', 'ar', 'tr', 'es']
    for (const lang of langs) {
      const mod = await import(`../../../components/i18n-dicts/${lang}.js`)
      const dict = mod.default
      for (let index = 1; index <= 7; index += 1) {
        expect(String(dict[`forum_ad_discovery_title_${index}`] || '').trim()).not.toBe('')
        expect(String(dict[`forum_ad_discovery_body_${index}`] || '').trim()).not.toBe('')
      }
      expect(String(dict.forum_ad_media_activate_aria || '').trim()).not.toBe('')
      expect(String(dict.forum_ad_discovery_open_aria || '').trim()).not.toBe('')
    }
  })
})
