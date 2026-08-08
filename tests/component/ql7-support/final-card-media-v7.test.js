import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'vitest'
import { buildQl7SupportCard, validateQl7SupportCard } from '../../../lib/ql7-support/cards.js'
const root = process.cwd()

describe('QL7 Support V7 premium cards and shared media', () => {
  test('creates a signed premium ambiguity card with Other', () => {
    const card = buildQl7SupportCard({ kind: 'clarification_choices', title: 'Возможно, вы имели в виду…', summary: 'Выберите наиболее близкий вариант.', locale: 'ru', options: [{ id: 'option_vip', label: 'Проверить VIP', semantic: { topic: 'vip', subIntent: 'status_followup' } }, { id: 'option_ads', label: 'Проверить рекламный пакет', semantic: { topic: 'ads_packages', subIntent: 'status_followup' } }], other: { id: 'other', label: 'Другое', placeholder: 'Расскажите подробнее.' } })
    expect(validateQl7SupportCard(card)).toMatchObject({ ok: true })
    expect(card.options).toHaveLength(2)
    expect(card.other.label).toBe('Другое')
  })

  test('injects the exact ordinary-DM player stack into ordinary and Support media', () => {
    const ordinary = fs.readFileSync(path.join(root, 'app/forum/features/dm/components/DmThreadMessageRow.jsx'), 'utf8')
    const surface = fs.readFileSync(path.join(root, 'app/forum/features/dm/components/Ql7SupportMessageSurface.jsx'), 'utf8')
    const support = fs.readFileSync(path.join(root, 'app/forum/features/dm/components/Ql7SupportCard.js'), 'utf8')
    const shared = fs.readFileSync(path.join(root, 'app/forum/features/dm/components/DmMediaRenderer.jsx'), 'utf8')
    expect(ordinary).toMatch(/import \{ NativeSafeVideoPlayer \} from ['"]\.\.\/\.\.\/media\/utils\/mediaLifecycleRuntime['"]/u)
    expect(ordinary).toMatch(/import DmVoicePlayer from ['"]\.\/DmVoicePlayer['"]/u)
    expect(ordinary).toMatch(/<Ql7SupportMessageSurface[\s\S]*VideoPlayer=\{NativeSafeVideoPlayer\}[\s\S]*VoicePlayer=\{DmVoicePlayer\}/u)
    expect(surface).toMatch(/function Ql7SupportMessageSurface\(\{card,text='',metadata=null,locale='en',VideoPlayer,VoicePlayer\}\)/u)
    expect(surface).toMatch(/h\(Ql7SupportCard,\{card,VideoPlayer,VoicePlayer\}\)/u)
    expect(ordinary).toMatch(/<DmMediaRenderer[\s\S]*source="ordinary-dm"[\s\S]*VideoPlayer=\{NativeSafeVideoPlayer\}[\s\S]*VoicePlayer=\{DmVoicePlayer\}/u)
    expect(support).toMatch(/function Ql7SupportCard\(\{ card, VideoPlayer, VoicePlayer \}\)/u)
    expect(support).toMatch(/h\(DmMediaRenderer,[\s\S]*VideoPlayer,[\s\S]*VoicePlayer/u)
    expect(shared).not.toMatch(/mediaLifecycleRuntime|import DmVoicePlayer/u)
    expect(shared).toMatch(/VideoPlayer\s*=\s*NativeVideoFallback/u)
    expect(shared).toMatch(/VoicePlayer\s*=\s*NativeAudioFallback/u)
    expect(shared).toMatch(/VIDEO_SHELL_CLASS\s*=\s*['"]videoCard mediaBox dmMediaBox['"]/u)
    expect(shared).toMatch(/MEDIA_ITEM_CLASS\s*=\s*['"]mediaBoxItem['"]/u)
    expect(shared).toMatch(/React\.createElement/u)
    expect(support).not.toMatch(/style=\{\{\s*minHeight/u)
  })
})
