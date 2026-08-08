import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import Ql7SemanticBadge from '../../../app/forum/features/dm/components/Ql7SemanticBadge.js'
import Ql7SupportCard from '../../../app/forum/features/dm/components/Ql7SupportCard.js'
import { buildQl7SupportCardV4 } from '../../../lib/ql7-support/cardSchemaV4.js'
import { QL7_SUPPORT_SVG_ROLES } from '../../../lib/ql7-support/presentation/svgRegistry.js'
import { listQl7SemanticBadgeKeysV11_6 } from '../../../lib/ql7-support/semanticBadgeRegistryV11_6.js'

vi.mock('next/image', () => ({ default: (props) => React.createElement('img', props) }))

describe('QL7 Support V11.6 premium semantic SVG language', () => {
  const requiredV12Roles = [
    'information', 'analytics', 'confirmed', 'partial', 'warning', 'blocked', 'security',
    'checking', 'waiting', 'clarification', 'choice', 'success', 'joy', 'gratitude',
    'humor', 'serious', 'operator_handoff', 'translation', 'qcoin', 'ads_package',
    'ads_metrics', 'vip', 'wallet', 'forum', 'moderation', 'account_deletion', 'privacy',
    'payment', 'exchange', 'time', 'context', 'identity', 'conversation', 'evidence',
    'incident', 'appeal', 'fraud', 'threat', 'cooldown', 'resolved',
  ]

  test('renders every semantic role as a lightweight inline SVG without canvas or image assets', () => {
    for (const key of listQl7SemanticBadgeKeysV11_6()) {
      const { container, unmount } = render(React.createElement(Ql7SemanticBadge, { iconKey: key, label: key }))
      expect(container.querySelector(`[data-ql7-semantic-icon="${key}"] svg`)).toBeTruthy()
      expect(container.querySelector('canvas,img')).toBeNull()
      unmount()
    }
  })

  test('covers the canonical V14 premium SVG catalog with unique detailed role shapes', () => {
    expect(QL7_SUPPORT_SVG_ROLES).toHaveLength(32)
    const signatures = new Map()
    for (const key of QL7_SUPPORT_SVG_ROLES) {
      const { container, unmount } = render(React.createElement(Ql7SemanticBadge, { iconKey: key, assetId: `${key}-v1`, label: key }))
      const wrapper = container.querySelector(`[data-ql7-svg-role="${key}"]`)
      const svg = wrapper?.querySelector('svg')
      expect(wrapper).toBeTruthy()
      expect(wrapper).toHaveAttribute('data-ql7-svg-quality', 'premium-detailed')
      expect(wrapper).toHaveAttribute('data-ql7-svg-legacy', '0')
      expect(svg).toBeTruthy()
      expect(svg.getAttribute('viewBox')).toBe('0 0 48 48')
      const words = Array.from(svg.querySelectorAll('text')).map((node) => node.textContent).join(' ')
      expect(words).not.toMatch(/\b(?:STOP|WARNING|OPERATOR)\b/u)
      const signature = wrapper.getAttribute('data-ql7-svg-path-hash')
      expect(signature).toMatch(/^[a-f0-9]{8}$/u)
      expect(signatures.get(signature)).toBeUndefined()
      signatures.set(signature, key)
      expect(svg.querySelectorAll('path,circle,rect,line,polyline,polygon').length).toBeGreaterThanOrEqual(8)
      unmount()
    }
  })

  test('localizes warning operator and paused rail badges while keeping STOP only inside the SVG shield', () => {
    const card = buildQl7SupportCardV4({
      locale: 'ru',
      title: 'Safety',
      summary: 'Safety state',
      semanticIcon: 'stop',
      status: 'blocked',
      badges: [
        { id: 'warning', label: 'WARNING', tone: 'warning', icon: 'warning' },
        { id: 'operator', label: 'OPERATOR', tone: 'operator', icon: 'operator' },
        { id: 'blocked', label: 'Blocked', tone: 'blocked', icon: 'stop', seconds: 1800 },
      ],
    })
    const { container, queryByText, getByText } = render(React.createElement(Ql7SupportCard, { card, locale: 'ru' }))
    expect(getByText('\u041f\u0440\u0435\u0434\u0443\u043f\u0440\u0435\u0436\u0434\u0435\u043d\u0438\u0435')).toBeTruthy()
    expect(getByText('\u041f\u0435\u0440\u0435\u0434\u0430\u043d\u043e \u043e\u043f\u0435\u0440\u0430\u0442\u043e\u0440\u0443')).toBeTruthy()
    expect(getByText('\u041f\u0430\u0443\u0437\u0430 30:00')).toBeTruthy()
    expect(queryByText(/^(?:WARNING|OPERATOR|Warning|Operator)$/u)).toBeNull()
    const badgeText = Array.from(container.querySelectorAll('.ql7SupportBadgeLabel')).map((node) => node.textContent).join('\n')
    expect(badgeText).not.toMatch(/\b(?:WARNING|OPERATOR|Warning|Operator|STOP)\b/u)
    const svgText = Array.from(container.querySelectorAll('[data-ql7-semantic-icon="stop"] svg text')).map((node) => node.textContent).join(' ')
    expect(svgText).toContain('STOP')
  })
})
