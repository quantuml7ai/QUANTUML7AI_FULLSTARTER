'use client'
import React from 'react'
import { buildQl7SupportAuthHeaders, buildQl7SupportRouteContext, fetchQl7SupportAuthenticated, readQl7SupportAuthSnapshot } from '../services/supportAuthClient.js'
import { QL7_SUPPORT_ID } from '../../../../../lib/ql7-support/systemActor.js'
import { countQl7SupportGraphemes, QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES } from '../../../../../lib/ql7-support/limits.js'
import { dedupeQl7SupportChoices } from '../../../../../lib/ql7-support/response/choiceDiversity.js'

const h = React.createElement
function s(value) { return String(value ?? '').trim() }
function mutationId(id = '') { return `support-choice:${Date.now()}:${s(id).replace(/[^A-Za-z0-9_-]/g, '_')}:${Math.random().toString(36).slice(2, 10)}`.slice(0, 160) }

export default function Ql7SupportChoiceCard({ card }) {
  const [otherOpen, setOtherOpen] = React.useState(false)
  const [otherText, setOtherText] = React.useState('')
  const [busy, setBusy] = React.useState('')
  const [sent, setSent] = React.useState('')
  const [error, setError] = React.useState('')
  const refs = React.useRef([])
  const otherCount = countQl7SupportGraphemes(otherText, s(card?.locale) || 'en')
  const otherValid = otherCount >= 1 && otherCount <= QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES

  const send = React.useCallback(async (option, text) => {
    const clean = s(text)
    if (!clean || busy) return
    if (countQl7SupportGraphemes(clean, s(card?.locale) || 'en') > QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES) {
      setError(s(card?.labels?.tooLong) || `Maximum ${QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES} characters.`)
      return
    }
    const id = s(option?.id || 'other')
    const clientMutationId = mutationId(id)
    setBusy(id)
    setError('')
    try {
      const auth = readQl7SupportAuthSnapshot()
      const from = s(auth.accountId || auth.walletAddress)
      const result = await fetchQl7SupportAuthenticated('/api/dm/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forum-user-id': from, 'x-forum-locale': s(card.locale), ...buildQl7SupportAuthHeaders(auth) },
        body: JSON.stringify({
          to: QL7_SUPPORT_ID,
          text: clean,
          attachments: [],
          locale: s(card.locale),
          clientMutationId,
          correlationId: clientMutationId,
          routeContext: buildQl7SupportRouteContext(),
          supportChoice: {
            cardIntegrity: s(card?.integrity?.signature || card.integrity),
            optionId: id,
            topic: s(option?.semantic?.topic),
            subIntent: s(option?.semantic?.subIntent),
            caseId: s(option?.semantic?.caseId),
            signedToken: s(option?.signedToken),
          },
        }),
      }, { waitTimeoutMs: 12000, retryOnFreshAuth: true })
      if (!result?.response?.ok || result?.data?.ok === false) throw new Error(s(result?.data?.error) || 'send_failed')
      setSent(id)
    } catch (sendError) {
      setError(s(card?.labels?.sendError) || s(sendError?.message) || 'Unable to send this choice. Please try again.')
    } finally { setBusy('') }
  }, [busy, card])

  const options = dedupeQl7SupportChoices(Array.isArray(card?.options) ? card.options : []).filter((option) => s(option?.id) && s(option?.label)).slice(0, 4)
  if (!options.length) return null
  const buttons = options.map((option, index) => h('button', {
    key: option.id,
    ref: (node) => { refs.current[index] = node },
    type: 'button',
    className: 'ql7SupportChoiceButton',
    disabled: Boolean(busy || sent),
    'aria-pressed': sent === option.id,
    'data-confidence': s(option.confidenceBand || 'medium'),
    onKeyDown: (event) => {
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) { event.preventDefault(); refs.current[(index + 1) % options.length]?.focus() }
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) { event.preventDefault(); refs.current[(index - 1 + options.length) % options.length]?.focus() }
    },
    onClick: () => send(option, option.label),
  }, h('span', { className: 'ql7SupportChoiceIcon', 'aria-hidden': 'true' }, s(option.icon) || '✦'), h('span', { className: 'ql7SupportChoiceText' }, h('span', { className: 'ql7SupportChoiceLabel' }, s(option.label)), s(option.description) ? h('small', null, s(option.description)) : null), h('span', { className: 'ql7SupportChoiceArrow', 'aria-hidden': 'true' }, '›')))
  const other = card?.other && typeof card.other === 'object' ? card.other : null
  const choiceCount = options.length + (other ? 1 : 0)
  return h('div', { className: 'ql7SupportChoicePanel', role: 'group', 'aria-label': s(card?.title) || 'Choose the closest option', 'data-ql7-support-choice-panel': '1', 'data-ql7-support-choice-layout': 'stacked-full-width', 'data-ql7-support-choice-rail': choiceCount === 5 ? 'five-full-width' : 'compact', 'data-ql7-support-choice-count': String(choiceCount) },
    h('div', { className: 'ql7SupportChoiceRail', 'aria-hidden': 'true' }, h('i'), h('span'), h('i')),
    h('div', { className: 'ql7SupportChoiceGrid', 'data-ql7-support-choice-list': '1' }, buttons),
    other ? h('div', { className: 'ql7SupportChoiceOther' },
      h('button', { type: 'button', className: 'ql7SupportChoiceButton ql7SupportChoiceButton--other', 'data-ql7-support-choice-other': '1', disabled: Boolean(busy || sent), onClick: () => setOtherOpen((value) => !value) }, h('span', { className: 'ql7SupportChoiceIcon', 'aria-hidden': 'true' }, '…'), h('span', { className: 'ql7SupportChoiceLabel' }, s(other.label))),
      otherOpen ? h('div', { className: 'ql7SupportChoiceOtherEditor' },
        h('textarea', { value: otherText, rows: 3, placeholder: s(other.placeholder), onChange: (event) => setOtherText(String(event.target.value || '')), 'aria-describedby': 'ql7-support-other-count' }),
        h('div', { id: 'ql7-support-other-count', className: `ql7SupportChoiceCounter${otherCount > 600 ? ' ql7SupportChoiceCounter--error' : ''}` }, `${otherCount}/${QL7_SUPPORT_USER_INPUT_MAX_GRAPHEMES}`),
        h('button', { type: 'button', className: 'ql7SupportChoiceSend', disabled: !otherValid || Boolean(busy || sent), onClick: () => send(other, otherText) }, s(card?.labels?.send) || 'Send')) : null) : null,
    busy ? h('p', { className: 'ql7SupportChoiceState', role: 'status' }, s(card?.labels?.sending) || 'Sending…') : null,
    sent ? h('p', { className: 'ql7SupportChoiceState ql7SupportChoiceState--sent', role: 'status' }, s(card?.labels?.sent) || 'Sent') : null,
    error ? h('p', { className: 'ql7SupportChoiceState ql7SupportChoiceState--error', role: 'alert' }, error) : null,
  )
}
