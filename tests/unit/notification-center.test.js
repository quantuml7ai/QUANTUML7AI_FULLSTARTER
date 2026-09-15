import { describe, expect, test } from 'vitest'
import {
  NOTIFICATION_SOURCES,
  buildNotificationDescriptor,
  normalizeNotificationCounts,
  totalNotificationCounts,
} from '../../lib/notificationCenter.js'

describe('notification center', () => {
  test('builds localized source notifications with stable routes', () => {
    expect(buildNotificationDescriptor(NOTIFICATION_SOURCES.MESSENGER_MESSAGES, 3, 'ru')).toMatchObject({
      title: 'Quantum Messenger',
      body: 'Новые сообщения: 3',
      url: '/forum?ql7Notice=messenger_messages',
    })
    expect(buildNotificationDescriptor(NOTIFICATION_SOURCES.METAMARKET_GIFTS, 2, 'uk')).toMatchObject({
      title: 'MetaMarket',
      body: 'Нові подарунки: 2',
      url: '/?ql7Notice=metamarket_gifts',
    })
  })

  test('keeps independent source counts and calculates one launcher total', () => {
    const counts = normalizeNotificationCounts({
      messenger_messages: 4,
      messenger_replies: 7,
      metamarket_gifts: 2,
    })
    expect(totalNotificationCounts(counts)).toBe(13)
    expect(counts.system).toBe(0)
    expect(counts.admin).toBe(0)
  })

  test('falls back safely for future and malformed notification input', () => {
    const descriptor = buildNotificationDescriptor('unknown', 100000, 'unknown')
    expect(descriptor.source).toBe(NOTIFICATION_SOURCES.SYSTEM)
    expect(descriptor.count).toBe(9999)
    expect(descriptor.body).toBe('System notifications: 9999')
  })
})
