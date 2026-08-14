import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const root = process.cwd()
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

describe('Global Visual Activity V3 project contracts', () => {
  test('mounts one StrictMode-safe root controller and uses lifecycle pause rather than animation reset', () => {
    const layout = read('app/layout.js')
    const globals = read('app/globals.css')
    const host = read('components/visual-runtime/GlobalVisualActivityRuntime.jsx')
    expect((layout.match(/<GlobalVisualActivityRuntime \/>/g) || []).length).toBe(1)
    expect(host).toContain('scheduleDestructiveTeardown(generation)')
    expect(host).toContain('pendingDestructiveTeardown = window.setTimeout')
    expect(host).toContain('const generation = ++controllerGeneration')
    const cleanup = host.slice(host.indexOf('return () => {'))
    expect(cleanup).not.toContain('teardownVisualActivityRegistry()')
    expect(globals).toContain("[data-ql7-visual-state='paused']")
    expect(globals).toContain('animation-play-state: paused !important')
    expect(globals).toContain('html[data-ql7-document-hidden] [data-ql7-visual-scope]')
    expect(globals).not.toMatch(/data-ql7-visual-state[^}]+animation\s*:\s*none/)
  })

  test('forbids the R8 main-thread regression architecture and keeps pinned assets structural', () => {
    const registry = read('lib/visual-runtime/visualActivityRegistry.js')
    const host = read('components/visual-runtime/GlobalVisualActivityRuntime.jsx')
    const image = read('components/visual-runtime/ViewportAnimatedImage.jsx')
    const source = `${registry}\n${host}\n${image}`
    for (const forbidden of [
      /document\.getAnimations\s*\(/,
      /new\s+MutationObserver\s*\(/,
      /querySelectorAll\(\s*['"]img['"]\s*\)/,
      /querySelectorAll\(\s*['"]\*['"]\s*\)/,
      /getComputedStyle\s*\(/,
      /getBoundingClientRect\s*\(/,
      /\.scrollHeight\b/,
      /\.clientHeight\b/,
      /\.srcset\s*=/,
      /\.sizes\s*=/,
    ]) expect(source).not.toMatch(forbidden)
    expect(host).toContain("document.querySelectorAll('[data-ql7-visual-scope]')")
    expect(image).toContain('node.dataset.ql7VisualMargin = profile')
    expect(image).toContain("node.dataset.ql7VisualPinned = '1'")
    expect(image).toContain("node.dataset.ql7VisualPinnedActive = '1'")
    expect(image).toContain('enabled: true')
    expect(image).not.toContain('ViewportPinnedActivityContext')
    expect(image).not.toContain('ViewportPinnedActivityProvider')
    expect(registry).toContain('if (record.viewportPinned)')
    expect(registry).toContain("viewportPinned: node.dataset.ql7VisualPinned === '1'")
    expect(image).not.toContain('React.useEffect(() => () =>')
  })

  test('uses explicit animated-image adapters at known bundled GIF sites and closes Profile/VIP dense roots', () => {
    const sites = [
      ['components/TopBar.js', '/game/game.gif'],
      ['components/BgAudio.js', '/audio/bgaudio.gif'],
      ['components/AuthNavClient.jsx', '/click/telegram.gif'],
      ['components/InviteFriendPopup.jsx', '/friends/invitation.gif'],
      ['app/tma/auto/page.jsx', '/click/authorization.gif'],
      ['app/exchange/ai-box/AIWorkbench.jsx', '/ai/ai.gif'],
      ['app/forum/ForumAds.js', '/audio/bgaudio.gif'],
      ['app/forum/features/ui/components/ForumActionRow.jsx', '/friends/invitation.gif'],
      ['app/forum/features/qcoin/components/QCoinWithdrawPopover.jsx', '/click/quest.gif'],
    ]
    for (const [file, asset] of sites) {
      const source = read(file)
      expect(source).toContain('ViewportAnimatedImage')
      expect(source).toContain(asset)
    }

    const forumAction = read('app/forum/features/ui/components/ForumActionRow.jsx')
    const forumHeader = read('app/forum/ForumHeaderPanel.jsx')
    expect(forumAction).toContain('viewportPinned')
    expect(forumHeader).not.toContain('ViewportPinnedActivityProvider')
    expect(forumHeader).toContain('{actionCluster}')

    const avatarEmoji = read('app/forum/features/profile/components/AvatarEmoji.jsx')
    expect(avatarEmoji).toContain('ViewportAnimatedImage')
    expect(avatarEmoji).toContain('data-ql7-animated-role="profile-avatar"')

    const emoji = read('app/forum/features/ui/components/ComposerEmojiPanel.jsx')
    const profile = read('app/forum/features/profile/components/ProfilePopover.jsx')
    expect(emoji).toContain('data-ql7-visual-scroll-root="1"')
    expect(emoji).toContain("data-ql7-visual-surface={emojiTab === 'stickers' ? 'vip-stickers' : 'emoji-picker'}")
    expect(emoji).toContain('const DENSE_INITIAL_WARM_COUNT = 24')
    expect(emoji).toContain('initialPoster={emojiIndex >= DENSE_INITIAL_WARM_COUNT}')
    expect(emoji).toContain('marginProfile="near50"')

    expect(profile).toContain('data-ql7-visual-scroll-root="1"')
    expect(profile).toContain('data-ql7-visual-surface="profile-vip-avatars"')
    expect(profile).toContain('const DENSE_INITIAL_WARM_COUNT = 24')
    expect(profile).toContain('initialPoster={avatarIndex >= DENSE_INITIAL_WARM_COUNT}')
    expect(profile).toContain('marginProfile="near50"')
  })

  test('QCoin product labels use one static-gold signature with a rare narrow glint', () => {
    const globals = read('app/globals.css')
    expect(globals).toContain('.qcoinLabel.ql7QCoinGoldLabel')
    expect(globals).toContain('@keyframes ql7QCoinGoldGlint')
    expect(globals).toContain('ql7QCoinGoldGlint 7s ease-in-out infinite')
    for (const phase of ['61%', '65%', '70%', '77%', '83%', '100%']) {
      expect(globals).toContain(phase)
    }
    expect(globals).not.toMatch(/ql7QCoinGoldGlint[\s\S]{0,900}filter\s*:/)
    const sites = [
      'app/exchange/page.js',
      'app/forum/features/qcoin/components/QCoinInline.jsx',
      'app/forum/features/qcoin/components/QCoinWithdrawPopover.jsx',
      'app/forum/ForumAds.js',
      'app/ads/page.jsx',
      'app/ads/home.js',
    ]
    sites.forEach((file) => expect(read(file)).toContain('qcoinLabel ql7QCoinGoldLabel'))

    const home = read('app/page.js')
    expect(home).toContain("import { QuantumWalletLaunchButton } from '../components/QuantumWalletLaunchIcon'")
    expect(home).toContain('<QuantumWalletLaunchButton')
    expect(home).not.toContain('qcoinLabel ql7QCoinGoldLabel')

    expect(read('components/QCoinDropFX.jsx')).not.toContain('ql7QCoinGoldLabel')
  })

  test('forum GIF upload preserves source URL compatibility and adds deterministic poster metadata', () => {
    const upload = read('app/api/forum/upload/route.js')
    const keys = read('lib/storage/mediaKeys.js')
    for (const token of ['const outBuf = isGif', '? input', 'createAnimatedPosterKey(key)', 'page: 0', 'posterUrl', 'urls.push(url)']) {
      expect(upload).toContain(token)
    }
    expect(upload.replace(/\s+/g, ' ')).toContain('items.push({ draftId, index, url, animated: !!animatedMeta, mime: contentType, posterUrl: animatedMeta ? posterUrl : null, width: animatedMeta?.width || null, height: animatedMeta?.height || null, error: null, })')
    expect(keys).toContain('export function createAnimatedPosterKey')
  })

  test('long lists expose card/row ownership and decorative loops use subscriptions', () => {
    const scoped = [
      ['app/forum/features/feed/components/ForumPostCard.jsx', 'data-ql7-visual-scope="card"'],
      ['app/forum/features/feed/components/TopicItem.jsx', 'data-ql7-visual-scope="card"'],
      ['app/forum/features/dm/components/DmDialogRow.jsx', 'data-ql7-visual-scope="row"'],
      ['app/forum/features/dm/components/DmThreadMessageRow.jsx', 'data-ql7-visual-scope="row"'],
      ['components/MetaMarket.jsx', 'data-ql7-visual-scope="card"'],
      ['app/exchange/battle-chat/BattleChatMessageRow.jsx', 'data-ql7-visual-scope="row"'],
      ['app/ads/home.js', 'data-ql7-visual-scope="card"'],
    ]
    scoped.forEach(([file, token]) => expect(read(file)).toContain(token))
    for (const file of ['components/MediaPipelineProgress.jsx', 'app/exchange/ai-box/AIWorkbench.jsx', 'app/components/CryptoNewsLens.jsx']) {
      expect(read(file)).toContain('subscribeVisualActivity')
      expect(read(file)).toContain('loop: true')
    }
  })

  test('visual runtime cannot mutate product video/audio playback ownership', () => {
    const source = read('lib/visual-runtime/visualActivityRegistry.js') + read('components/visual-runtime/GlobalVisualActivityRuntime.jsx')
    for (const banned of ['video.pause(', 'audio.pause(', '.currentTime =', '.playbackRate =', '.volume =', '.muted =']) expect(source).not.toContain(banned)
    expect(read('app/forum/features/media/hooks/useForumMediaCoordinator.js').length).toBeGreaterThan(1000)
  })
})
