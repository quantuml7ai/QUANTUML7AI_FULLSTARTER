import { describe, expect, test } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

describe('global Deep Translate typewriter presentation contract', () => {
  test('owns the AI Box cadence in one visual-runtime primitive', () => {
    const typewriter = read('components/visual-runtime/TypewriterText.jsx')
    const aiBox = read('app/exchange/ai-box/AIWorkbench.jsx')

    expect(typewriter).toContain('export const QL7_TYPEWRITER_SPEED_MS = 42')
    expect(typewriter).toContain('export const QL7_TYPEWRITER_CHARS_PER_TICK = 15')
    expect(typewriter).toContain('registerVisualScope')
    expect(typewriter).toContain('subscribeVisualActivity')
    expect(typewriter).toContain('loop: true')
    expect(typewriter).toContain("node.removeAttribute('data-ql7-visual-scope')")
    expect(typewriter).toContain('const releaseManagedScope = () => {')
    expect(typewriter).toContain('if (index >= normalizedText.length) {')
    expect(typewriter).toContain('releaseManagedScope()')
    expect(typewriter).toContain('animationKey')
    expect(typewriter).toContain('renderHtml')
    expect(typewriter).toContain("const displayText = animate ? typedText : String(text || '')")

    expect(aiBox).toContain("import { useTypewriterText } from '../../../components/visual-runtime/TypewriterText'")
    expect(aiBox).toContain('const typedReasons = useTypewriterText(')
    expect(aiBox).toContain('  42,')
    expect(aiBox).toContain('  15,')
    expect(aiBox).not.toContain('function useTypewriter(')
  })

  test('fails open to full text when reduced motion disables the visual loop', () => {
    const typewriter = read('components/visual-runtime/TypewriterText.jsx')

    expect(typewriter).toContain("const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'")
    expect(typewriter).toContain('if (prefersReducedMotion()) {')
    expect(typewriter).toContain('setValue(normalizedText)')
    expect(typewriter).toContain('if (!cancelled && index < normalizedText.length && prefersReducedMotion()) {')
    expect(typewriter).toContain('index = normalizedText.length')
    expect(typewriter).toContain('complete()')
  })

  test('animates both translated and restored originals in CryptoRadar and Battle Chat', () => {
    const cryptoRadar = read('app/components/CryptoNewsLens.jsx')
    const battleChat = read('app/exchange/battle-chat/BattleChatMessageRow.jsx')

    expect(cryptoRadar).toContain("import TypewriterText from '../../components/visual-runtime/TypewriterText'")
    expect(cryptoRadar).toContain('as="h3"')
    expect(cryptoRadar).toContain('as="p"')
    expect(cryptoRadar).toContain('setTranslationAnimationKey((value) => value + 1)')
    expect(cryptoRadar).toContain('setTranslationAnimationEnabled(false)')
    expect(cryptoRadar).toContain("fetch('/api/deep-translate'")

    expect(battleChat).toContain("import TypewriterText from '../../../components/visual-runtime/TypewriterText'")
    expect(battleChat).toContain('text={shownText}')
    expect(battleChat).toContain('animate={translationAnimationEnabled}')
    expect(battleChat).toContain('animationKey={translationAnimationKey}')
    expect((battleChat.match(/setTranslationAnimationKey\(\(value\) => value \+ 1\)/g) || [])).toHaveLength(3)
    expect(battleChat).toContain("fetch('/api/deep-translate'")
  })

  test('covers forum Post Card, ordinary DM and profile bio without bypassing rich-text sanitizers', () => {
    const postHook = read('app/forum/features/feed/hooks/usePostTranslation.js')
    const postBody = read('app/forum/features/feed/components/PostBodyContent.jsx')
    const postCard = read('app/forum/features/feed/components/ForumPostCard.jsx')
    const dmRow = read('app/forum/features/dm/components/DmThreadMessageRow.jsx')
    const userInfo = read('app/forum/features/profile/components/UserInfoPopover.jsx')

    expect(postHook).toContain('translationAnimationKey')
    expect(postHook).toContain('translationAnimationEnabled')
    expect(postHook).toContain('setTranslationAnimationKey((value) => value + 1)')
    expect(postBody).toContain("import TypewriterText from '../../../../../components/visual-runtime/TypewriterText'")
    expect(postBody).toContain('renderHtml={renderRich}')
    expect(postCard).toContain('translationAnimationKey={translationAnimationKey}')
    expect(postCard).toContain('translationAnimationEnabled={translationAnimationEnabled}')

    expect(dmRow).toContain("import TypewriterText from '../../../../../components/visual-runtime/TypewriterText'")
    expect(dmRow).toContain('renderHtml={safeHtml}')
    expect(dmRow).toContain('const dmTranslationAnimationEnabled = !supportCard')
    expect(dmRow).toContain('const tBody = await translateText(dmTranslateSource, locale)')
    expect(dmRow).toContain('translateQl7SupportCard({ deliveryReceiptId, targetLocale: locale })')

    expect(userInfo).toContain("import TypewriterText from '../../../../../components/visual-runtime/TypewriterText'")
    expect(userInfo).toContain('renderHtml={safeRich}')
    expect(userInfo).toContain('bioTranslationAnimationEnabled')
    expect(userInfo).toContain('const translated = await translateText(data.about)')
  })

  test('keeps the global Deep Translate server contour untouched by presentation animation', () => {
    const route = read('app/api/deep-translate/route.js')
    const service = read('lib/deepTranslateService.js')

    expect(route).toContain("from '../../../lib/deepTranslateService.js'")
    expect(route).not.toContain('TypewriterText')
    expect(route).not.toContain('visual-runtime')
    expect(service).toContain('GLOBAL_DEEP_TRANSLATE_MIRRORS')
    expect(service).not.toContain('TypewriterText')
    expect(service).not.toContain('visual-runtime')
  })
})
