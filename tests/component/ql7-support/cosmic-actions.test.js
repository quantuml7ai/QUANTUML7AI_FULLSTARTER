import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { buildQl7SupportCard } from '../../../lib/ql7-support/cardSchema.js'

const read = (file) => fs.readFileSync(file, 'utf8')

describe('QL7 Support V11 action and localization UI contracts', () => {
  it('does not discard global-event actions before rendering', () => {
    const source = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(source).toContain('function isRenderableAction')
    expect(source).toContain("resolved.actionType === 'global_event'")
    expect(source).toContain('actionIdentity(candidate) === identity')
    expect(source).not.toContain("const href = actionHref(action)\n      if (!href) return false")
  })

  it('keeps a stable LTR card shell while exposing RTL text direction for Arabic, Hebrew, Persian and Urdu', () => {
    const source = read('app/forum/features/dm/components/Ql7SupportCard.js')
    expect(source).toContain("const textDirection = ['ar', 'he', 'fa', 'ur'].includes")
    expect(source).toContain("? 'rtl' : 'ltr'")
    expect(source).toContain("dir: 'ltr'")
    expect(source).toContain("lang: locale")
    expect(source).toContain("'data-ql7-support-text-direction': textDirection")
  })

  it('opens MetaStudio from the support deep action instead of only routing to Gameverse', () => {
    const page = read('app/game/page.js')
    const actions = read('lib/ql7-support/topicActionRegistry.js')
    expect(actions).toContain('/game?ql7Action=metastudio#metastudio')
    expect(page).toContain("params.get('ql7Action') !== 'metastudio'")
    expect(page).toContain('supportActionHandledRef')
    expect(page).toContain('openMetaStudio()')
  })
  it('filters external and targetless actions before rendering', () => {
    const card = buildQl7SupportCard({
      locale: 'en', title: 'Safe actions', summary: 'Only safe actions are rendered.',
      actions: [
        { id: 'wallet', routeId: 'wallet', label: 'Wallet' },
        { id: 'external', href: 'https://evil.example', label: 'External' },
        { id: 'protocol-relative', href: '//evil.example', label: 'Protocol relative' },
        { id: 'targetless', actionType: 'route', label: 'Targetless' },
      ],
    })
    expect(card.actions.map((row) => row.id)).toEqual(['wallet'])
  })

})
