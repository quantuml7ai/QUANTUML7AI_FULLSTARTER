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

  test('keeps pooled post FX raster-cold while idle and restores the premium glow only for active particles', () => {
    const styles = read('app/forum/styles/ForumStyles.jsx')
    const qcoinStyles = read('app/forum/styles/modules/qcoinStyles.js')
    const layer = read('app/forum/features/feed/components/PostFxLayer.jsx')

    for (const source of [styles, qcoinStyles]) {
      expect(source).toMatch(/\.postFx\{[\s\S]*?will-change:auto;[\s\S]*?filter:none;[\s\S]*?text-shadow:none;[\s\S]*?\}/)
      expect(source).toMatch(/\.postFx\.isLive\{[\s\S]*?will-change:transform, opacity;[\s\S]*?hue-rotate\(var\(--hue\)\)[\s\S]*?drop-shadow\(0 0 calc\(12px \* var\(--glow\)\) rgba\(0,245,255,\.20\)\)[\s\S]*?text-shadow:/)
      expect(source).toMatch(/\.postFx\.postFx--bad\.isLive\{[\s\S]*?rgba\(255,80,120,\.18\)[\s\S]*?rgba\(178,0,255,\.10\)[\s\S]*?text-shadow:/)
      expect(source).toMatch(/\.postFx::after\{[\s\S]*?filter:none;[\s\S]*?animation:none;/)
      expect(source).toMatch(/\.postFx\.isLive::after\{[\s\S]*?drop-shadow\(0 0 16px rgba\(255,255,255,\.10\)\)[\s\S]*?drop-shadow\(0 0 18px rgba\(178,0,255,\.12\)\)[\s\S]*?postFxTrail/)
    }

    expect(layer).toContain("classList?.remove?.('isLive')")
    expect(layer).toContain("addEventListener('animationend', releaseFinishedPostFx)")
    expect(layer).toContain('const postFxAnimationBoundNodes = new WeakSet()')
    expect(layer).not.toContain('onAnimationEnd=')
    expect(layer).not.toContain('animationName')
  })

  test('keeps forum and DM pulse rails animated while removing their moving blur filters', () => {
    const styles = read('app/forum/styles/ForumStyles.jsx')
    const dmStyles = read('app/forum/styles/modules/dmStyles.js')

    expect(styles).toMatch(/article\[data-forum-post-card="1"\] \.forumDividerRail::after\{[\s\S]*?filter: none;[\s\S]*?animation: forumDividerPulse 2\.4s linear infinite;[\s\S]*?animation-delay: \.75s;/)
    expect(styles).toMatch(/\.forumDividerRail::after\{[\s\S]*?filter: none;[\s\S]*?animation: forumDividerPulse 2\.3s linear infinite;/)
    expect(styles).not.toMatch(/\.forumDividerRail::after\{[^}]*drop-shadow/)

    expect((styles.match(/\.dmRowRail::after\{/g) || []).length).toBeGreaterThanOrEqual(2)
    expect(styles).not.toMatch(/\.dmRowRail::after\{[^}]*drop-shadow/)
    expect(styles).toContain('animation: dmRailPulse 2.3s linear infinite;')
    expect(styles).toContain('animation: forumDividerPulse 2.3s linear infinite;')
    expect(styles).toContain('.dmRowRailTop::after{ animation-delay: .2s; }')
    expect(styles).toContain('.dmRowRailBottom::after{ animation-delay: .95s; }')

    expect(dmStyles).not.toMatch(/\.dmRowRail::after\{[^}]*drop-shadow/)
    expect(dmStyles).toContain('animation: dmRailPulse 2.3s linear infinite;')
    expect(dmStyles).toContain('.dmRowRailTop::after{ animation-delay: .2s; }')
    expect(dmStyles).toContain('.dmRowRailBottom::after{ animation-delay: .95s; }')
  })

  test('keeps nickname badge geometry static and replaces continuous gradient/glow repaint with a sparse sun glint across all nickname surfaces', () => {
    const styles = read('app/forum/styles/ForumStyles.jsx')
    const profileStyles = read('app/forum/styles/modules/profileStyles.js')
    const recommendation = read('app/forum/features/feed/components/UserRecommendationCard.jsx')
    const battleChatCss = read('app/exchange/battle-chat/BattleChat.module.css')
    const battleChatRow = read('app/exchange/battle-chat/BattleChatMessageRow.jsx')
    const metaMarket = read('components/MetaMarket.jsx')
    const forumHeader = read('app/forum/ForumHeaderPanel.jsx')
    const subscriptions = read('app/forum/features/subscriptions/components/SubscriptionsPopover.jsx')

    for (const source of [styles, profileStyles]) {
      expect(source).not.toContain('nickGlow')
      expect(source).not.toContain('nickGradient')
      expect(source).toMatch(/\.nick-animate\{[\s\S]*?background-size:100% 100%,100% 100%;[\s\S]*?animation:none;[\s\S]*?\}/)
      expect(source).toMatch(/\.nick-animate::after\{[\s\S]*?transform:translate3d\(0,0,0\) skewX\(-18deg\);[\s\S]*?animation:ql7NickSunGlint 7\.2s ease-in-out infinite;[\s\S]*?\}/)
      expect(source).toMatch(/@keyframes ql7NickSunGlint\{[\s\S]*?translate3d\(610%,0,0\)[\s\S]*?\}/)
      const shineRule = source.match(/\.nick-animate::after\{([\s\S]*?)\}/)?.[1] || ''
      expect(shineRule).not.toMatch(/filter\s*:|box-shadow\s*:|mix-blend-mode\s*:|will-change\s*:/)
    }

    expect(recommendation).toContain("className: 'recommendationCardNickBadge nick-animate'")
    expect(battleChatRow).toContain('styles.nickBadge')
    expect(battleChatCss).toMatch(/\.nickBadge \{[\s\S]*?position: relative;[\s\S]*?overflow: hidden;[\s\S]*?max-width: min\(280px, 100%\);/)
    expect(battleChatCss).toMatch(/\.nickBadge::after \{[\s\S]*?animation: battle-chat-nick-sun-glint 7\.2s ease-in-out infinite;[\s\S]*?\}/)
    const battleShineRule = battleChatCss.match(/\.nickBadge::after \{([\s\S]*?)\}/)?.[1] || ''
    expect(battleShineRule).not.toMatch(/filter\s*:|box-shadow\s*:|mix-blend-mode\s*:|will-change\s*:/)

    expect((metaMarket.match(/className="nick-badge nick-animate"/g) || []).length).toBe(2)
    expect(forumHeader).toContain("'nick-badge nick-animate avaNick'")
    expect(subscriptions).toContain("cls('nick-badge nick-animate')")
  })


  test('keeps custom video reaction bursts while replacing continuously animated good/bad glyphs with click-rotated emoji', () => {
    const external = read('app/forum/features/media/components/ExternalVideoPlayer.jsx')
    const nativeVideo = read('app/forum/features/media/components/VideoMedia.jsx')
    const styles = read('app/forum/styles/ForumStyles.jsx')

    for (const source of [external, nativeVideo]) {
      expect(source).toContain("const GOOD_EMOJIS = ['🔥', '✨', '🚀', '💎', '⚡', '👏', '🤩', '💯', '🫶', '🎉']")
      expect(source).toContain("const BAD_EMOJIS = ['😶', '🤨', '🙈', '😴', '💤', '🫠', '😵', '🙃', '😬', '🧊']")
      expect(source).toContain('className="ql7VideoRailEmoji"')
      expect(source).toContain("spawnEmojiBurst('good')")
      expect(source).toContain("spawnEmojiBurst('bad')")
      expect(source).not.toContain('<IconGood />')
      expect(source).not.toContain('<IconBad />')
      expect(source).not.toContain('<Ql7IconGood />')
      expect(source).not.toContain('<Ql7IconBad />')
    }

    expect(external).toContain('setGoodEmoji((current) => pickDifferent(GOOD_EMOJIS, current))')
    expect(external).toContain('setBadEmoji((current) => pickDifferent(BAD_EMOJIS, current))')
    expect(nativeVideo).toContain('setGoodEmoji((current) => pickDifferentEmoji(GOOD_EMOJIS, current))')
    expect(nativeVideo).toContain('setBadEmoji((current) => pickDifferentEmoji(BAD_EMOJIS, current))')
    expect(nativeVideo).not.toContain('ql7GoodRing')
    expect(nativeVideo).not.toContain('ql7BadHex')

    expect(styles).toMatch(/\.ql7VideoRailBtn--good::before,\s*\.ql7VideoRailBtn--bad::before\{[\s\S]*?content:none;[\s\S]*?display:none;[\s\S]*?animation:none;[\s\S]*?\}/)
    expect(styles).toMatch(/\.ql7VideoRailEmoji\{[\s\S]*?width:30\.4px;[\s\S]*?height:30\.4px;[\s\S]*?font-size:30\.4px;[\s\S]*?transform:translateX\(-3px\);[\s\S]*?\}/)
    expect(styles).toMatch(/\.ql7ExternalVideoSurface \.ql7VideoRailEmoji\{[\s\S]*?transform:translateX\(-8px\);[\s\S]*?\}/)
    expect(styles).toMatch(/\.ql7VideoSurface\.mediaBoxItem \.ql7VideoRailEmoji\{[\s\S]*?transform:translateX\(-13px\);[\s\S]*?\}/)
    expect(styles).not.toMatch(/\.ql7VideoRailBtn--good\{[^}]*rotate\(/)
    expect(styles).not.toMatch(/\.ql7VideoRailBtn--good \.ql7VideoRailEmoji\{[^}]*rotate\(/)
    expect(styles).toMatch(/\.ql7VideoRailBtn::before\{[\s\S]*?animation:ql7CenterGlint 2\.4s ease-in-out infinite;[\s\S]*?\}/)
    expect(styles).toMatch(/\.ql7VideoRailBtn--sound > svg\{[\s\S]*?width:40px;[\s\S]*?height:40px;/)
  })

})
