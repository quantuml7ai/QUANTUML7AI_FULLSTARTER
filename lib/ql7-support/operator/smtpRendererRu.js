function esc(value = '') {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char])
}

const RU_VALUES = Object.freeze({
  qcoin: 'QCoin',
  vip: 'VIP',
  ads_packages: 'Рекламный пакет',
  ads_campaigns: 'Рекламные кампании',
  payments: 'Платежи',
  moderation: 'Модерация',
  profile: 'Профиль',
  rating: 'Рейтинг экосистемы',
  support_system: 'Безопасность и работа QL7 Support',
  support_system_general: 'Общая безопасность Support',
  credible_threat: 'Достоверная угроза',
  direct_insult: 'Прямое оскорбление',
  critical: 'Критическая',
  high: 'Высокая',
  normal: 'Обычная',
  verified: 'Подтверждено',
  verified_empty: 'Подтверждено: данных нет',
  unavailable: 'Источник недоступен',
  inconsistent: 'Обнаружено несоответствие',
  synthetic_fixture: 'Синтетическая проверка',
  live_mongo_read: 'Live Mongo read-only',
  self: 'Только пользователь',
})

function str(value = '') {
  return String(value ?? '').trim()
}

function human(value = '') {
  const raw = str(value)
  if (!raw) return ''
  if (RU_VALUES[raw]) return RU_VALUES[raw]
  return raw
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^./u, (char) => char.toLocaleUpperCase('ru'))
}

function isPresent(value) {
  return value === 0 || value === false || (value !== undefined && value !== null && str(value) !== '')
}

function row(label, value) {
  if (!isPresent(value)) return ''
  return `<tr><td style="padding:9px 11px;border-bottom:1px solid rgba(127,190,255,.22);color:#b8d7ff;width:34%;vertical-align:top;background:#0b2340">${esc(label)}</td><td style="padding:9px 11px;border-bottom:1px solid rgba(127,190,255,.22);color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;vertical-align:top;background:#071a31">${esc(value)}</td></tr>`
}

function table(title, rows) {
  const body = rows.filter(Boolean).join('')
  if (!body) return ''
  return `<section style="margin:16px 0;border:1px solid rgba(128,204,255,.42);border-radius:16px;overflow:hidden;background:#092848!important;color:#ffffff!important"><h2 style="margin:0;padding:12px 14px;background:#113b67;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font:700 16px Arial,sans-serif">${esc(title)}</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font:14px Arial,sans-serif;color:#ffffff!important">${body}</table></section>`
}

function listRows(values = [], prefix = 'Пункт') {
  return (Array.isArray(values) ? values : [])
    .map((item, index) => row(`${prefix} ${index + 1}`, item))
}

function criterionRows(criteria = []) {
  return (Array.isArray(criteria) ? criteria : [])
    .map((item) => row(
      item?.label || human(item?.id),
      `${str(item?.value) || 'нет данных'}; вклад: ${Number(item?.points || 0) >= 0 ? '+' : ''}${Number(item?.points || 0)}; ${str(item?.explanation)}`,
    ))
}

function actionButton(url = '') {
  const href = str(url)
  if (!/^https:\/\//iu.test(href)) return ''
  return `<section style="margin:18px 0;padding:16px;border:1px solid rgba(132,219,255,.5);border-radius:16px;background:#092848!important;color:#ffffff!important"><h2 style="margin:0 0 12px;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font:700 16px Arial,sans-serif">Действие оператора</h2><a href="${esc(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:12px 16px;border-radius:12px;background:#1f7ae0;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;text-decoration:none;font:700 14px Arial,sans-serif">Открыть личную переписку с пользователем</a><p style="margin:10px 0 0;color:#cfe7ff!important;-webkit-text-fill-color:#cfe7ff!important;font:12px Arial,sans-serif">Кнопка ведёт в Forum DM с параметрами пользователя и support case.</p></section>`
}

function renderChecks(checksInput = []) {
  const checks = (Array.isArray(checksInput) ? checksInput : []).map((check) => row(
    human(check.adapter),
    [
      `результат: ${human(check.resultKind) || 'неизвестно'}`,
      `выполнено: ${check.executed ? 'да' : 'нет'}`,
      `read-only: ${check.readOnly === false ? 'нет' : 'да'}`,
      `записей в бизнес-коллекции: ${Number(check.writeCount || 0)}`,
      check.sourceType ? `источник: ${human(check.sourceType)}` : '',
      check.actorScope ? `scope: ${human(check.actorScope)}` : '',
      check.checkedAt ? `проверено: ${check.checkedAt}` : '',
    ].filter(Boolean).join('; '),
  ))
  if (!checks.length) checks.push(row('Результат', 'Проверки данных не выполнялись: обращение относится к безопасности, коммуникации или требует ручного read-only запуска.'))
  return checks
}

export function renderQl7SupportOperatorEmailRu(operatorCase = {}) {
  const c = operatorCase
  const recommendations = listRows(c.recommendations || [], 'Шаг')
  const contacts = c.contacts?.consent
    ? [
        row('Email', c.contacts.email),
        row('Телефон', c.contacts.phone),
        row('Telegram', c.contacts.telegram),
        row('Предпочтительный канал', c.contacts.preferred),
      ]
    : [row('Согласие', 'Контакты не предоставлены или пользователь не дал согласие на внешний контакт')]
  const criteria = criterionRows(c.rating?.criteria || [])
  const ratingSignals = [
    row('Позитивные сигналы', (c.rating?.positiveSignals || []).join('; ')),
    row('Риски/снижения', (c.rating?.negativeSignals || []).join('; ')),
    row('Недостающие сигналы', (c.rating?.missingSignals || []).join('; ')),
  ]
  const openDmUrl = str(c.links?.openUserDm)

  const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body bgcolor="#07111f" style="margin:0;background:#07111f!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important"><div style="max-width:820px;margin:0 auto;padding:18px;font-family:Arial,sans-serif;background:#07111f;color:#ffffff!important"><header style="padding:18px;border:1px solid rgba(128,204,255,.46);border-radius:18px;background:#092848!important;color:#ffffff!important"><div style="font-size:12px;letter-spacing:.16em;color:#8be7ff!important;-webkit-text-fill-color:#8be7ff!important">QUANTUM L7 AI GLOBAL</div><h1 style="margin:8px 0 4px;font-size:24px;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important">Обращение в QL7 Support</h1><p style="margin:0;color:#cfe7ff!important;-webkit-text-fill-color:#cfe7ff!important">${esc(c.id)} · ${esc(c.createdAt)}</p></header>${actionButton(openDmUrl)}${table('Пользователь', [row('Никнейм', c.user?.nickname), row('ID пользователя', c.user?.userIdMasked), row('Аккаунт / wallet', c.user?.accountIdMasked), row('Telegram ID', c.user?.telegramIdMasked), row('Язык', c.user?.locale), row('Дата регистрации', c.user?.createdAt), row('Последняя активность', c.user?.lastActivityAt)])}${table('Суть обращения', [row('Тема', human(c.request?.topic)), row('Подтема', human(c.request?.subtopic)), row('Акт сообщения', human(c.request?.messageAct)), row('Срочность', human(c.request?.urgency)), row('Категория безопасности', human(c.request?.safetyCategory)), row('Сообщение пользователя', c.request?.originalText), row('Смысл на русском', c.request?.meaningRu), row('Агрегированный смысл', c.request?.aggregateMeaningRu), row('Confidence', c.request?.confidence), row('Margin', c.request?.confidenceMargin), row('Semantic entropy', c.request?.semanticEntropy)])}${table('Рейтинг пользователя', [row('Оценка', isPresent(c.rating?.score) ? `${c.rating.score}/100` : ''), row('Уровень', c.rating?.band), row('Уверенность', isPresent(c.rating?.confidence) ? `${c.rating.confidence}%` : ''), row('Версия расчёта', c.rating?.calculationVersion), row('Основание', (c.rating?.reasons || []).join('; ') || 'Недостаточно данных'), ...ratingSignals])}${table('Критерии расчёта рейтинга', criteria)}${table('География', [row('Страна', c.geo?.country), row('Регион', c.geo?.region), row('Город', c.geo?.city), row('Точность', c.geo?.precision), row('Источник', c.geo?.source), row('Актуальность', c.geo?.asOf)])}${table('Активность и модерация', [row('Публикации', c.activity?.posts), row('Темы', c.activity?.topics), row('Комментарии', c.activity?.comments), row('Подписчики', c.activity?.followers), row('Подписки', c.activity?.following), row('Лайки', c.activity?.likes), row('Жалобы на публикации', c.activity?.reportsOnPosts), row('Жалобы, созданные пользователем', c.activity?.reportsByUser), row('Модерационные флаги', c.activity?.moderationFlags), row('Удалённые публикации', c.activity?.removedPosts)])}${table('Проведённые проверки', renderChecks(c.checks))}${table('Рекомендованные действия', recommendations)}${table('Контакты', contacts)}${table('Контур приватности', [row('Raw secrets included', c.report?.rawSecretsIncluded === true ? 'да' : 'нет'), row('Raw database dump included', c.report?.rawDatabaseDumpIncluded === true ? 'да' : 'нет'), row('Всего бизнес-записей', Number(c.report?.businessWriteCount || 0)), row('Surface hash', c.report?.surfaceHash)])}<footer style="margin-top:18px;color:#a9c8ec!important;-webkit-text-fill-color:#a9c8ec!important;font-size:12px">Внутренний конфиденциальный отчёт. Не пересылайте пользователю системные поля, хэши доказательств, служебные параметры и приватные данные.</footer></div></body></html>`

  return Object.freeze({
    subject: `[QL7 Support] ${human(c.request?.topic) || 'Обращение'} · ${c.user?.nickname || 'Пользователь'}`,
    html,
    text: [
      'QL7 Support',
      `Кейс: ${c.id || '—'}`,
      `Пользователь: ${c.user?.nickname || '—'}`,
      `ID: ${c.user?.userIdMasked || c.user?.accountIdMasked || '—'}`,
      `Тема: ${human(c.request?.topic) || '—'}`,
      `Смысл: ${c.request?.aggregateMeaningRu || c.request?.meaningRu || '—'}`,
      `Рейтинг: ${isPresent(c.rating?.score) ? `${c.rating.score}/100` : '—'}; критерии: ${(c.rating?.criteria || []).map((item) => `${item.label} ${item.points >= 0 ? '+' : ''}${item.points}`).join('; ')}`,
      `Активность: публикации ${c.activity?.posts ?? 0}; жалобы на публикации ${c.activity?.reportsOnPosts ?? 0}; флаги ${c.activity?.moderationFlags ?? 0}`,
      `Проверки: ${(c.checks || []).map((check) => `${human(check.adapter)}=${human(check.resultKind)} writeCount=${Number(check.writeCount || 0)}`).join('; ') || 'не выполнялись'}`,
      `Открыть личную переписку: ${openDmUrl || 'ссылка не сформирована'}`,
      `Рекомендации: ${(c.recommendations || []).join('; ')}`,
    ].join('\n'),
    replyTo: c.contacts?.consent ? c.contacts.email || '' : '',
  })
}
