import React from 'react'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('next/image', () => ({
  default: ({ unoptimized: _unoptimized, ...props }) => React.createElement('img', props),
}))

import Ql7SupportCard, { isRenderableQl7SupportCard } from '../../../app/forum/features/dm/components/Ql7SupportCard.js'
import { buildQl7SupportCard } from '../../../lib/ql7-support/cardSchema.js'

class ImmediateIntersectionObserver {
  constructor(callback) { this.callback = callback }
  observe(element) { this.callback([{ isIntersecting: true, target: element }]) }
  disconnect() {}
  unobserve() {}
}

function renderCard(card) {
  return render(React.createElement(Ql7SupportCard, { card }))
}

describe('QL7 Support premium rich card', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver)
    Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: vi.fn(() => Promise.resolve()) })
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() })
  })

  test('rejects a forged or tampered card', () => {
    const valid = buildQl7SupportCard({ kind: 'status', title: 'Verified' })
    const tampered = { ...valid, integrity: 'bad' }
    expect(isRenderableQl7SupportCard(valid)).toBe(true)
    expect(isRenderableQl7SupportCard(tampered)).toBe(false)
    const { container } = renderCard(tampered)
    expect(container).toBeEmptyDOMElement()
  })

  test('renders Arabic text inside a stable LTR card shell without raw machine keys or empty sections', () => {
    const card = buildQl7SupportCard({
      kind: 'diagnostic',
      locale: 'ar',
      title: 'نتيجة الفحص',
      summary: 'تم التحقق من المصدر.',
      facts: [{ label: 'الحالة', value: 'نشط', source: 'profiles', asOf: '2026-07-24T00:00:00.000Z' }],
      source: { adapterId: 'profile:bounded-read-v1', collections: ['profiles'], readOnly: true },
      asOf: '2026-07-24T00:00:00.000Z',
    })
    const { container } = renderCard(card)
    const article = container.querySelector('[data-ql7-support-card="diagnostic_result"]')
    expect(article).toHaveAttribute('dir', 'ltr')
    expect(article).toHaveAttribute('data-ql7-support-source-kind', 'diagnostic')
    expect(screen.getByText('حقائق مؤكدة')).toBeInTheDocument()
    expect(screen.queryByText(/ql7SupportTab\.|diagnosticStatusKey/)).not.toBeInTheDocument()
    expect(container.querySelectorAll('.ql7SupportCardSection')).toHaveLength(1)
    expect(screen.getAllByText('نشط')).toHaveLength(1)
  })

  test('uses the ordinary DM media renderer for video, audio and lazy image preview', () => {
    const card = buildQl7SupportCard({
      kind: 'moderation_snapshot',
      locale: 'en',
      title: 'Moderation evidence',
      snapshot: {
        postId: 'post-1',
        authorIdMasked: 'user…1234',
        text: 'Immutable snapshot',
        reportType: 'violence',
        thresholdCount: 3,
        capturedAt: '2026-07-24T00:00:00.000Z',
        media: [
          { type: 'video', url: '/evidence.mp4', poster: '/poster.jpg' },
          { type: 'audio', url: '/evidence.mp3' },
          { type: 'image', url: '/evidence.jpg', alt: 'Evidence image' },
        ],
      },
    })
    const { container } = renderCard(card)
    const video = container.querySelector('video')
    const audio = container.querySelector('audio')
    const image = container.querySelector('img')
    expect(container.querySelector('[data-dm-media-renderer="support-complaint"]')).toBeInTheDocument()
    expect(video).toHaveAttribute('data-dm-media', '1')
    expect(video).toHaveAttribute('data-dm-media-kind', 'video')
    expect(video).toHaveAttribute('playsinline')
    expect(video.autoplay).toBe(false)
    expect(audio.autoplay).toBe(false)
    expect(video.closest('.dmMediaBox')).toHaveAttribute('data-kind', 'video')
    expect(audio.closest('.dmMediaBox')).toHaveAttribute('data-kind', 'audio')
    expect(image.closest('.dmMediaBox')).toHaveAttribute('data-kind', 'image')
    expect(image).toHaveAttribute('loading', 'lazy')
  })

  test('renders every advertising campaign in the responsive matrix table', () => {
    const card = buildQl7SupportCard({
      kind: 'diagnostic',
      topic: 'ads_campaigns',
      locale: 'ru',
      title: 'Рекламные кампании',
      summary: 'Проверенные данные получены из разрешённого источника.',
      table: {
        title: '',
        schema: 'ql7.table.ads.campaigns.matrix',
        layout: 'matrix',
        columns: [
          { key: 'campaign', label: 'Кампания', format: 'text' },
          { key: 'status', label: 'Статус', format: 'text' },
          { key: 'views', label: 'Просмотры', format: 'integer' },
          { key: 'ctr', label: 'CTR', format: 'percent' },
        ],
        rows: [
          { key: 'campaign-1', campaign: 'Alpha', status: 'active', views: 1000, ctr: 0.04 },
          { key: 'campaign-2', campaign: 'Beta', status: 'active', views: 500, ctr: 0.02 },
        ],
      },
    })

    const { container } = renderCard(card)
    expect(container.querySelector('.ql7SupportMatrixTable')).toBeInTheDocument()
    expect(container.querySelectorAll('.ql7SupportMatrixRow[role="row"]')).toHaveLength(3)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
    expect(screen.getByText(/4\s*%/u)).toBeInTheDocument()
    expect(screen.getByText(/2\s*%/u)).toBeInTheDocument()
  })
})
