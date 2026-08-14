import React from 'react'
import fs from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import Ql7SupportMessageSurface from '../../app/forum/features/dm/components/Ql7SupportMessageSurface.jsx'
import Ql7SupportOperator from '../../app/forum/features/dm/components/Ql7SupportOperator.jsx'
import Ql7SupportChoiceCard from '../../app/forum/features/dm/components/Ql7SupportChoiceCard.js'
import { executeQl7SupportTurnRuntime } from '../../lib/ql7-support/runtime/executeTurn.js'
import { buildQl7SupportCardV4 } from '../../lib/ql7-support/contracts/supportCard.js'

describe('QL7 Support V14 premium surface component', () => {
  it('renders the canonical premium card with semantic SVG evidence', () => {
    const result = executeQl7SupportTurnRuntime({
      mode: 'test',
      requestId: 'component:qcoin',
      conversationId: 'component:qcoin',
      userTurnId: 'component:user:qcoin',
      selectedLocale: 'ru',
      text: 'покажи баланс qcoin',
      now: '2026-07-31T00:00:00.000Z',
      adapterReceipts: [{
        id: 'component:qcoin:receipt',
        adapter: 'qcoin',
        executed: true,
        sourceType: 'synthetic_fixture',
        source: 'fixture:qcoin',
        actorScope: 'self',
        resultKind: 'verified',
        result: { balance: 17, available: 15, pending: 2, currency: 'QCoin' },
        durationMs: 1,
        writeCount: 0,
        evidenceHash: 'component-evidence',
        checkedAt: '2026-07-31T00:00:00.000Z',
      }],
    })
    const card = buildQl7SupportCardV4({ ...result.surface, caseId: 'component:qcoin' })
    const html = renderToStaticMarkup(React.createElement(Ql7SupportMessageSurface, { card, locale: 'ru' }))
    expect(html).toContain('data-ql7-support-card=')
    expect(html).toContain('data-ql7-support-svg-asset-id=')
    const verifiedBadgeLabels = html.match(/class="ql7SupportBadgeLabel">Подтверждено<\/span>/gu) || []
    expect(verifiedBadgeLabels).toHaveLength(1)
    expect(html).not.toMatch(/class="ql7SupportStatusPill[^"]*"[^>]*><i[^>]*><\/i>Подтверждено<\/span>/u)
    expect(html).toContain('QCoin')
  })

  it('renders the canonical operator media without the legacy SVG persona', () => {
    const html = renderToStaticMarkup(React.createElement(Ql7SupportOperator, { state: 'analyzing' }))
    expect(html).toContain('data-ql7-support-operator=')
    expect(html).toContain('data-ql7-operator-static="/ql7/static.png"')
    expect(html).toContain('data-ql7-operator-video="/ql7/video.mp4"')
    expect(html).toContain('data-ql7-operator-media-fit="contain"')
    expect(html).toContain('data-ql7-operator-overlay="over-media-top"')
    expect(html).toContain('data-ql7-operator-label-fit="autoscale"')
    expect(html).toContain('data-ql7-operator-mobile-fit="single-line-shrink"')
    expect(html).toContain('data-ql7-operator-typewriter="smooth-letter"')
    expect(html).toContain('data-ql7-operator-video-states="understanding checking analyzing preparing_response"')
    expect(html).toContain('data-ql7-operator-static-states="idle greeting answer_ready needs_clarification attention_required temporarily_unavailable"')
    expect(html).toContain('data-ql7-operator-video-contract="one-operation-one-session-graceful-stop-after-current-loop"')
    expect(html).toContain('class="ql7SupportOperatorStatic"')
    expect(html).toContain('class="ql7SupportOperatorVideo"')
    expect(html).toContain('class="ql7SupportOperatorLabelText"')
    expect(html).toContain('class="ql7SupportOperatorCursor"')
    expect(html).toContain('muted=""')
    expect(html).toContain('loop=""')
    expect(html).toContain('playsinline=""')
    expect(html).not.toContain('<svg')
    expect(html).not.toContain('controls=')
  })

  it('keeps TЗ runtime states on active operator video instead of falling back to idle', () => {
    const cases = [
      ['reading_data', 'checking'],
      ['translation', 'preparing_response'],
      ['accepted', 'understanding'],
    ]
    for (const [state, publicState] of cases) {
      const html = renderToStaticMarkup(React.createElement(Ql7SupportOperator, { state }))
      expect(html).toContain(`ql7SupportOperator--${publicState}`)
      expect(html).toContain(`data-support-ui-state="${publicState}"`)
      expect(html).toContain('data-ql7-operator-video-active="1"')
      expect(html).toContain('data-support-active="1"')
    }
  })

  it('keeps post-answer and cooldown states on the static operator image', () => {
    const cases = [
      ['answer_committed', 'answer_ready'],
      ['input_ready', 'answer_ready'],
      ['waiting_user', 'needs_clarification'],
      ['waiting_admin', 'attention_required'],
      ['cooldown', 'attention_required'],
      ['operator_pending', 'attention_required'],
      ['offline', 'temporarily_unavailable'],
    ]
    for (const [state, publicState] of cases) {
      const html = renderToStaticMarkup(React.createElement(Ql7SupportOperator, { state }))
      expect(html).toContain(`ql7SupportOperator--${publicState}`)
      expect(html).toContain(`data-support-ui-state="${publicState}"`)
      expect(html).toContain('data-ql7-operator-video-active="0"')
      expect(html).toContain('data-support-active="0"')
      expect(html).toContain('data-ql7-operator-static-state="1"')
    }
  })

  it('renders five full-width clarification buttons including Other', () => {
    const html = renderToStaticMarkup(React.createElement(Ql7SupportChoiceCard, {
      card: {
        locale: 'ru',
        title: 'Уточнение',
        options: [
          { id: 'qcoin', label: 'QCoin и баланс', signedToken: 't1', semantic: { topic: 'qcoin' } },
          { id: 'ads', label: 'Рекламные метрики', signedToken: 't2', semantic: { topic: 'ads_campaigns' } },
          { id: 'profile', label: 'Профиль и активность', signedToken: 't3', semantic: { topic: 'profile' } },
          { id: 'partner', label: 'Партнерство', signedToken: 't4', semantic: { topic: 'partnership' } },
        ],
        other: { id: 'other', label: 'Другое', placeholder: 'Расскажите подробнее.', signedToken: 't5' },
        labels: { send: 'Отправить' },
      },
    }))
    expect(html).toContain('data-ql7-support-choice-rail="five-full-width"')
    expect(html).toContain('data-ql7-support-choice-count="5"')
    expect((html.match(/class="ql7SupportChoiceButton/gmu) || [])).toHaveLength(5)
    expect(html).toContain('Другое')
  })

  it('keeps composer Enter on the shared send handler and modifiers as newline keys', () => {
    const input = fs.readFileSync('app/forum/features/ui/components/ComposerTextInput.jsx', 'utf8')
    const core = fs.readFileSync('app/forum/features/ui/components/ComposerCore.jsx', 'utf8')
    expect(input).toContain('onKeyDown={handleKeyDown}')
    expect(input).toContain("event.key !== 'Enter'")
    expect(input).toContain('event.isComposing')
    expect(input).toContain('event.nativeEvent?.isComposing')
    expect(input).toContain('event.keyCode === 229')
    expect(input).toContain('event.shiftKey || event.ctrlKey')
    expect(input).toContain('event.preventDefault()')
    expect(input).toContain('onSendClick?.(event)')
    expect(core).toMatch(/<ComposerTextInput[\s\S]*onSendClick=\{onSendClick\}/u)
  })
})
