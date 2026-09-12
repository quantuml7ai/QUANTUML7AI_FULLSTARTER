import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('next/image', () => ({ default: ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props) }))
vi.mock('../../../app/forum/features/dm/services/supportAuthClient.js', () => ({
  buildQl7SupportAuthHeaders: () => ({}), buildQl7SupportRouteContext: () => ({}),
  fetchQl7SupportAuthenticated: vi.fn(), readQl7SupportAuthSnapshot: () => ({ ready: true, accountId: 'test-user' }),
}))

import Ql7SupportCard from '../../../app/forum/features/dm/components/Ql7SupportCard.js'
import { buildQl7SupportCard } from '../../../lib/ql7-support/cardSchema.js'

class ImmediateIntersectionObserver { constructor(callback) { this.callback = callback } observe(target) { this.callback([{ isIntersecting: true, target }]) } disconnect() {} }

describe('QL7 Support card V2 presentation', () => {
  beforeEach(() => { vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver) })

  test('localizes ISO dates and machine content type', () => {
    const card = buildQl7SupportCard({ kind: 'moderation_snapshot', locale: 'ru', title: 'Проверка публикации', snapshot: { postId: 'post-1', contentType: 'image', createdAt: '2026-07-24T12:30:00.000Z', capturedAt: '2026-07-24T13:30:00.000Z' } })
    const { container } = render(React.createElement(Ql7SupportCard, { card }))
    expect(screen.getByText('Изображение')).toBeInTheDocument()
    expect(container.textContent).not.toContain('2026-07-24T12:30:00.000Z')
    expect(container.textContent).not.toContain('adapterId')
  })

  test('renders choices, table and timeline without empty sections', () => {
    const card = buildQl7SupportCard({
      kind: 'clarification_choices', locale: 'en', title: 'Choose a topic', summary: 'Select the closest option.',
      options: [{ id: 'ql7_choice_exchange', label: 'Exchange analytics', semantic: { topic: 'exchange' } }, { id: 'ql7_choice_qcoin', label: 'QCoin payment', semantic: { topic: 'qcoin' } }],
      other: { id: 'ql7_choice_other', label: 'Something else', placeholder: 'Describe the issue' },
      table: { columns: [{ key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }], rows: [{ metric: 'CTR', value: '4.2%' }] },
      timeline: [{ label: 'Request received', asOf: '2026-07-24T10:00:00.000Z' }],
    })
    const { container } = render(React.createElement(Ql7SupportCard, { card }))
    expect(screen.getByRole('button', { name: /Exchange analytics/i })).toBeInTheDocument()
    expect(screen.getByText('CTR')).toBeInTheDocument()
    expect(screen.getByText('Request received')).toBeInTheDocument()
    expect(container.querySelector('[data-ql7-support-choice-panel="1"]')).toBeInTheDocument()
  })
})
