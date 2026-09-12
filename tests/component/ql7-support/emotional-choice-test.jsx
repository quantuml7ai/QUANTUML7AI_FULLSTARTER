import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

vi.mock('next/image', () => ({ default: (props) => React.createElement('img', props) }))
import Ql7SupportCard from '../../../app/forum/features/dm/components/Ql7SupportCard.js'
import { buildQl7SupportCard } from '../../../lib/ql7-support/cardSchema.js'

function choiceCard() {
  return buildQl7SupportCard({
    purpose: 'choice', locale: 'ru', title: 'Уточните запрос', summary: 'Выберите ближайший вариант.',
    visualTheme: 'emotion-analytical', emotion: { emotion: 'analytical', intensity: 'medium', confidence: 0.9, pulse: 'scan', glyph: '⌁' },
    options: [1, 2, 3, 4].map((id) => ({ id: `o${id}`, label: `Вариант ${id}`, semantic: { topic: 'ads_packages', subIntent: `option_${id}` } })),
    other: { id: 'other', label: 'Другое', placeholder: 'Опишите свой вариант' },
  })
}

describe('QL7 Support canonical emotional and choice card surface', () => {
  test('renders emotion semantics and exactly four options plus Other in a stacked full-width panel', () => {
    const { container } = render(React.createElement(Ql7SupportCard, { card: choiceCard() }))
    const article = container.querySelector('[data-ql7-support-card="choice"]')
    expect(article).toHaveAttribute('data-ql7-support-emotion', 'analytical')
    expect(article).toHaveAttribute('data-ql7-support-pulse', 'scan')
    expect(article.className).toContain('ql7SupportTheme--emotion-analytical')
    const panel = container.querySelector('[data-ql7-support-choice-layout="stacked-full-width"]')
    expect(panel).toHaveAttribute('data-ql7-support-choice-count', '5')
    const primaryButtons = screen.getAllByRole('button', { name: /^Вариант [1-4]$/u })
    expect(primaryButtons).toHaveLength(4)
    for (const button of primaryButtons) {
      expect(button).toHaveAttribute('type', 'button')
      expect(button).toHaveAttribute('aria-pressed', 'false')
    }
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByRole('button', { name: /Другое/u })).toBeInTheDocument()
  })
})
