export const NOTIFICATION_SOURCES = Object.freeze({
  MESSENGER_MESSAGES: 'messenger_messages',
  MESSENGER_REPLIES: 'messenger_replies',
  METAMARKET_GIFTS: 'metamarket_gifts',
  SYSTEM: 'system',
  ADMIN: 'admin',
})

const SUPPORTED_LANGS = new Set(['en', 'ru', 'uk', 'es', 'tr', 'ar', 'zh'])

// Единый каталог источников: новую ветку уведомлений добавляем здесь, не размазывая
// её маршруты, подписи и локализацию по API-роутам, service worker и Android shell.
const DEFINITIONS = Object.freeze({
  [NOTIFICATION_SOURCES.MESSENGER_MESSAGES]: {
    channel: 'messenger',
    title: 'Quantum Messenger',
    url: '/forum?ql7Notice=messenger_messages',
    body: {
      en: 'New messages: {count}',
      ru: 'Новые сообщения: {count}',
      uk: 'Нові повідомлення: {count}',
      es: 'Mensajes nuevos: {count}',
      tr: 'Yeni mesajlar: {count}',
      ar: 'رسائل جديدة: {count}',
      zh: '新消息：{count}',
    },
  },
  [NOTIFICATION_SOURCES.MESSENGER_REPLIES]: {
    channel: 'messenger',
    title: 'Quantum Messenger',
    url: '/forum?ql7Notice=messenger_replies',
    body: {
      en: 'New comments and replies: {count}',
      ru: 'Новые комментарии и ответы: {count}',
      uk: 'Нові коментарі та відповіді: {count}',
      es: 'Comentarios y respuestas nuevos: {count}',
      tr: 'Yeni yorumlar ve yanıtlar: {count}',
      ar: 'تعليقات وردود جديدة: {count}',
      zh: '新评论和回复：{count}',
    },
  },
  [NOTIFICATION_SOURCES.METAMARKET_GIFTS]: {
    channel: 'metamarket',
    title: 'MetaMarket',
    url: '/?ql7Notice=metamarket_gifts',
    body: {
      en: 'New gifts: {count}',
      ru: 'Новые подарки: {count}',
      uk: 'Нові подарунки: {count}',
      es: 'Regalos nuevos: {count}',
      tr: 'Yeni hediyeler: {count}',
      ar: 'هدايا جديدة: {count}',
      zh: '新礼物：{count}',
    },
  },
  [NOTIFICATION_SOURCES.SYSTEM]: {
    channel: 'system',
    title: 'Quantum System',
    url: '/?ql7Notice=system',
    body: {
      en: 'System notifications: {count}',
      ru: 'Системные уведомления: {count}',
      uk: 'Системні сповіщення: {count}',
      es: 'Notificaciones del sistema: {count}',
      tr: 'Sistem bildirimleri: {count}',
      ar: 'إشعارات النظام: {count}',
      zh: '系统通知：{count}',
    },
  },
  [NOTIFICATION_SOURCES.ADMIN]: {
    channel: 'admin',
    title: 'Quantum Administration',
    url: '/?ql7Notice=admin',
    body: {
      en: 'Administrative notifications: {count}',
      ru: 'Административные уведомления: {count}',
      uk: 'Адміністративні сповіщення: {count}',
      es: 'Notificaciones administrativas: {count}',
      tr: 'Yönetim bildirimleri: {count}',
      ar: 'إشعارات إدارية: {count}',
      zh: '管理通知：{count}',
    },
  },
})

export const NOTIFICATION_SOURCE_LIST = Object.freeze(Object.keys(DEFINITIONS))

export function normalizeNotificationLang(raw) {
  const base = String(raw || '').trim().toLowerCase().split(/[-_]/)[0]
  if (base === 'ua') return 'uk'
  return SUPPORTED_LANGS.has(base) ? base : 'en'
}

export function normalizeNotificationSource(raw, fallback = NOTIFICATION_SOURCES.SYSTEM) {
  const source = String(raw || '').trim().toLowerCase()
  return Object.prototype.hasOwnProperty.call(DEFINITIONS, source) ? source : fallback
}

export function clampNotificationCount(raw) {
  return Math.max(0, Math.min(9999, Math.floor(Number(raw) || 0)))
}

export function normalizeNotificationCounts(raw) {
  const input = raw && typeof raw === 'object' ? raw : {}
  return Object.fromEntries(
    NOTIFICATION_SOURCE_LIST.map((source) => [source, clampNotificationCount(input[source])]),
  )
}

export function totalNotificationCounts(raw) {
  return Object.values(normalizeNotificationCounts(raw))
    .reduce((sum, value) => sum + value, 0)
}

export function buildNotificationDescriptor(sourceRaw, countRaw, langRaw, overrides = {}) {
  const source = normalizeNotificationSource(sourceRaw)
  const definition = DEFINITIONS[source]
  const count = clampNotificationCount(countRaw)
  const lang = normalizeNotificationLang(langRaw)
  const bodyTemplate = definition.body[lang] || definition.body.en

  return {
    source,
    channel: definition.channel,
    count,
    title: String(overrides?.title || definition.title),
    body: String(overrides?.body || bodyTemplate).replaceAll('{count}', String(count)),
    url: String(overrides?.url || definition.url),
  }
}
