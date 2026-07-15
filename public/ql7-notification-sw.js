const LEGACY_BADGE_TAG = 'ql7-unread-summary'
const SOURCE_TAG_PREFIX = 'ql7-notification-'

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

function sourceTag(source) {
  return `${SOURCE_TAG_PREFIX}${String(source || 'system').replace(/[^a-z0-9_-]/gi, '')}`
}

async function updateLauncherBadge(rawCount) {
  const count = Math.max(0, Number(rawCount) || 0)
  try {
    if (count > 0 && typeof self.navigator?.setAppBadge === 'function') {
      await self.navigator.setAppBadge(count)
    } else if (count <= 0 && typeof self.navigator?.clearAppBadge === 'function') {
      await self.navigator.clearAppBadge()
    }
  } catch {}
}

async function notifyOpenClients(payload) {
  const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  windows.forEach((client) => {
    client.postMessage({
      type: 'ql7:notification-received',
      source: String(payload?.source || 'system'),
      count: Math.max(0, Number(payload?.count) || 0),
      totalCount: Math.max(0, Number(payload?.totalCount) || 0),
    })
  })
}

function notificationMatches(notification, payload, safeCount) {
  const data = notification?.data || {}
  return (
    String(notification?.title || '') === String(payload?.title || 'Quantum System') &&
    String(notification?.body || '') === String(payload?.body || safeCount) &&
    String(data?.source || '') === String(payload?.source || 'system') &&
    Math.max(0, Number(data?.count) || 0) === safeCount &&
    String(data?.url || '/') === String(payload?.url || '/')
  )
}

async function updateSourceNotification(payload, silent = false) {
  const safeCount = Math.max(0, Number(payload?.count) || 0)
  const totalCount = Math.max(safeCount, Number(payload?.totalCount) || 0)
  const tag = sourceTag(payload?.source)
  const current = await self.registration.getNotifications({ tag })
  if (safeCount <= 0) {
    current.forEach((notification) => notification.close())
    return
  }

  // Не пересоздаём неизменившееся уведомление при фоновой синхронизации:
  // Android иначе воспринимает каждый focus/sync как новое событие.
  if (current.length === 1 && notificationMatches(current[0], payload, safeCount)) {
    return
  }

  current.forEach((notification) => notification.close())

  await self.registration.showNotification(String(payload?.title || 'Quantum System'), {
    body: String(payload?.body || safeCount),
    tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    silent,
    renotify: !silent,
    data: {
      source: String(payload?.source || 'system'),
      count: safeCount,
      totalCount,
      url: String(payload?.url || '/'),
    },
  })
}

self.addEventListener('message', (event) => {
  if (event?.data?.type !== 'ql7:badge-sync') return
  const sources = Array.isArray(event.data.sources) ? event.data.sources : []
  event.waitUntil((async () => {
    // Удаляем уведомление старого агрегированного формата после первого нового sync.
    const legacy = await self.registration.getNotifications({ tag: LEGACY_BADGE_TAG })
    legacy.forEach((notification) => notification.close())
    // Badge sync is a state reconciliation channel, not a visible notification channel.
    // It may close stale source notifications and update launcher badges, but only real
    // push events are allowed to call showNotification for positive counts.
    await Promise.all(sources.map(async (source) => {
      const safeCount = Math.max(0, Number(source?.count) || 0)
      if (safeCount > 0) return
      const current = await self.registration.getNotifications({ tag: sourceTag(source?.source) })
      current.forEach((notification) => notification.close())
    }))
    await updateLauncherBadge(event.data.totalCount)
  })())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data?.json?.() || {} } catch {}
  event.waitUntil(Promise.all([
    updateSourceNotification(payload, false),
    updateLauncherBadge(payload?.totalCount),
    notifyOpenClients(payload),
  ]))
})

self.addEventListener('notificationclick', (event) => {
  const target = new URL(event.notification?.data?.url || '/forum', self.location.origin).href

  event.waitUntil((async () => {
    // Нажатие только открывает нужную ветку. Уведомление и badge снимаются после фактического
    // попадания конкретного контента в поле зрения и серверной синхронизации прочтения.
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const existing = windows.find((client) => client.url.startsWith(self.location.origin))
    if (existing) {
      await existing.navigate(target)
      return existing.focus()
    }
    return self.clients.openWindow(target)
  })())
})
