import {applyQl7SupportAdultLanguagePolicy, formatQl7SupportDate, redactQl7SupportSecrets} from './adultLanguagePolicy.js'

function str(value) { return String(value ?? '').trim() }
function neutralizeVisibleServiceBrand(value = '') { return str(value).replace(/q[\s._-]*l[\s._-]*7(?:[\s._-]*support)?/giu, 'поддержка') }
function esc(value) {
  return str(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch])
}
function clone(value) { try { return JSON.parse(JSON.stringify(value ?? null)) } catch { return null } }
const KNOWN_VALUE_LABELS = Object.freeze({
  ql7_support_dm: 'Личный диалог поддержки',
  user_safe_evidence_only: 'только безопасные данные пользователя',
  admin_only_evidence_separated: 'администраторский контекст отделён от пользовательского',
  ready_for_diagnostic: 'готово к проверке',
  collecting_context: 'сбор контекста',
  awaiting_admin: 'ожидает проверки оператора',
  user_notified: 'пользователь уведомлён',
  not_started: 'не начато',
  support_auto_reply: 'автоответ поддержки',
  safety_escalation: 'эскалация безопасности',
  abuse_review: 'проверка нарушения',
  diagnostic_result: 'результат диагностики',
  no_action_required: 'действие оператора не требуется',
  review_required: 'требуется проверка',
  normal: 'обычный',
  urgent: 'срочно',
  review: 'проверка',
  open: 'открыт',
  ready: 'готово',
  moderation: 'модерация',
  ads_packages: 'рекламные пакеты',
  ads_campaigns: 'рекламные кампании',
  qcoin: 'QCoin',
  vip: 'VIP',
  exchange: 'обмен',
  battlecoin: 'BattleCoin',
  contact: 'контакт',
  contact_form_received: 'заявка из контактной формы',
})
function safe(value, max = 4000) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    return applyQl7SupportAdultLanguagePolicy(humanReadableValue(value, max), { maxLength: max })
  }
  return applyQl7SupportAdultLanguagePolicy(humanReadableScalar(value), { maxLength: max })
}
function humanize(key = '') {
  const raw = str(key)
  const mapped = KNOWN_VALUE_LABELS[raw] || KNOWN_VALUE_LABELS[raw.toLowerCase()]
  if (mapped) return mapped
  const clean = raw
    .replace(/[._-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : ''
}
function humanReadableScalar(value = '') {
  const clean = neutralizeVisibleServiceBrand(redactQl7SupportSecrets(str(value)))
  const mapped = KNOWN_VALUE_LABELS[clean] || KNOWN_VALUE_LABELS[clean.toLowerCase()]
  if (mapped) return mapped
  if (/^[a-z][a-z0-9_.:-]{2,}$/iu.test(clean) && /[_.:-]/u.test(clean)) return humanize(clean)
  return clean
}
function humanReadableValue(value, max = 1200, depth = 0) {
  if (value === null || value === undefined) return ''
  if (depth > 4) return humanReadableScalar(value).slice(0, max)
  if (Array.isArray(value)) {
    return value
      .map((item) => humanReadableValue(item, Math.max(140, Math.floor(max / 3)), depth + 1))
      .filter(Boolean)
      .join('; ')
      .slice(0, max)
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, item]) => {
        const rendered = humanReadableValue(item, Math.max(140, Math.floor(max / 4)), depth + 1)
        return rendered ? `${humanize(key)}: ${rendered}` : ''
      })
      .filter(Boolean)
    return entries.join(' | ').slice(0, max)
  }
  return humanReadableScalar(value).slice(0, max)
}
function listify(values = [], max = 8) {
  return (Array.isArray(values) ? values : [values])
    .map((item) => safe(item, 800))
    .filter(Boolean)
    .slice(0, max)
}
function safeAdminOrigin() {
  const fallback = 'https://www.quantuml7ai.com'
  const candidates = [
    process.env.QL7_ADMIN_BASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    fallback,
  ]
  for (const candidate of candidates) {
    try {
      const url = new URL(str(candidate))
      if (url.protocol !== 'https:' || url.username || url.password) continue
      return url.origin
    } catch {}
  }
  return fallback
}
function safeOpaqueReference(value = '', max = 240) {
  const redacted = redactQl7SupportSecrets(str(value))
  if (!redacted || redacted.includes('[redacted]')) return ''
  return redacted.replace(/[^\p{L}\p{N}@._:-]+/gu, '').slice(0, max)
}
function safeQueryValue(value = '', max = 180) {
  return safeOpaqueReference(value, max)
}
function adminUrl(path = '/', params = {}) {
  const url = new URL(path, safeAdminOrigin())
  for (const [key, value] of Object.entries(params || {})) {
    const clean = safeQueryValue(value)
    if (clean) url.searchParams.set(key, clean)
  }
  return url.toString()
}
function buildAdminActions({ caseId = '', messageId = '', topic = '', accountReference = '', correlationId = '' } = {}) {
  if (!accountReference) return Object.freeze([])
  return Object.freeze([
    Object.freeze({
      label: 'Open direct conversation',
      href: adminUrl('/forum', {
        inbox: 'messages',
        dmUser: accountReference,
        supportCase: caseId,
        supportMessage: messageId,
        supportTopic: topic,
        correlation: correlationId,
      }),
    }),
  ])
}
function rows(title, values = []) {
  const safeRows = values.map(([key, value]) => [str(key), safe(value, 1400)]).filter(([, value]) => value)
  if (!safeRows.length) return ''
  return `<section class="section"><h2>${esc(title)}</h2><table role="presentation">${safeRows.map(([key, value]) => `<tr><th>${esc(key)}</th><td>${esc(value)}</td></tr>`).join('')}</table></section>`
}
function operatorActionLabel(action = {}) {
  const label = str(action.label)
  if (/open direct conversation/iu.test(label)) return 'Открыть прямой диалог в DM'
  return label || 'Открыть действие оператора'
}
function actionButtons(actions = []) {
  const safeActions = (Array.isArray(actions) ? actions : []).filter((action) => str(action?.label) && /^https:\/\//i.test(str(action?.href)))
  if (!safeActions.length) return ''
  return `<section class="section"><h2>Действия оператора</h2><div class="actions">${safeActions.map((action) => `<a class="actionBtn" href="${esc(action.href)}" target="_blank" rel="noopener noreferrer">${esc(operatorActionLabel(action))}</a>`).join('')}</div></section>`
}

export function composeQl7SupportAdminReport({
  source = 'ql7_support_dm',
  report = {},
  message = '',
  name = '',
  email = '',
} = {}) {
  const input = report && typeof report === 'object' ? clone(report) || {} : {}
  const diagnostic = input.diagnostic && typeof input.diagnostic === 'object' ? input.diagnostic : {}
  const timeline = Array.isArray(input.timeline) ? input.timeline.slice(0, 30) : []
  const facts = Array.isArray(diagnostic.facts) ? diagnostic.facts : []
  const anomalies = Array.isArray(diagnostic.anomalies) ? diagnostic.anomalies : []
  const checks = Array.isArray(diagnostic.checks) ? diagnostic.checks : []
  const generatedAt = new Date().toISOString()
  const rating = input.ecosystemRating && typeof input.ecosystemRating === 'object' ? input.ecosystemRating : null
  const confidence = Math.max(0, Math.min(100, Number(input.confidence || diagnostic.confidence || diagnostic.confidencePercent || rating?.confidence || 0)))
  const caseId = str(input.caseId)
  const messageId = str(input.messageId)
  const topic = humanize(input.topic)
  const accountReference = safeOpaqueReference(input.user || input.actor?.accountIdMasked || input.actor?.canonicalAccountIdMasked || input.actor?.canonicalAccountId, 240)
  const correlationId = str(input.correlationId || input.conversationDecision?.correlationId)
  const positiveSignals = listify(rating?.positiveContributors, 8)
  const negativeSignals = listify(rating?.negativeContributors, 8)
  const missingSignals = listify(rating?.missingData, 8)

  return Object.freeze({
    version: 2,
    source: str(source || input.source || 'ql7_support_dm'),
    title: 'Отчёт поддержки оператору',
    subject: `Поддержка: обращение ${str(input.caseId || input.messageId || 'на проверку')}`,
    priority: input.safetyEscalation === true ? 'urgent' : (anomalies.length ? 'review' : 'normal'),
    case: Object.freeze({
      caseId,
      messageId,
      eventId: str(input.eventId || input.materialEventKey),
      correlationId,
      topic,
      messageAct: humanize(input.messageAct || input.role),
      subIntent: humanize(input.subIntent),
      caseStatus: humanize(input.caseStatus),
      diagnosticStatus: humanize(input.diagnosticStatus),
      responseCode: humanize(input.responseCode),
      generatedAt,
      urgency: input.safetyEscalation === true ? 'critical' : (anomalies.length ? 'review' : 'normal'),
    }),
    user: Object.freeze({
      displayName: safe(input.profile?.nickname || input.profile?.displayName || input.profile?.nick || input.actor?.nickname || name || input.user, 180),
      contactEmail: safe(email, 320),
      accountReference,
      language: safe(input.detectedLanguage || input.locale, 40),
      safeGeo: safe(input.safeGeo, 800),
      registeredAt: safe(input.profile?.registeredAt || input.profile?.createdAt, 100),
      gender: safe(input.profile?.gender, 80),
      vipStatus: safe(input.profile?.vipStatus || input.profile?.vip, 300),
      adsPackages: safe(input.profile?.adsPackages || input.profile?.ads, 600),
      openCases: safe(input.openCases, 500),
    }),
    summary: Object.freeze({
      userClaim: safe(input.userMessagePreview || message, 4000),
      confirmedFacts: Object.freeze(facts.map((item) => safe(item?.label ? `${item.label}: ${item.value}` : item, 600)).filter(Boolean).slice(0, 16)),
      checks: Object.freeze(checks.map((item) => safe(item, 600)).filter(Boolean).slice(0, 16)),
      anomalies: Object.freeze(anomalies.map((item) => safe(item, 600)).filter(Boolean).slice(0, 16)),
      recommendation: safe(input.recommendedAction, 1200),
    }),
    assessment: Object.freeze({
      confidence: Math.round(confidence),
      confidenceExplanation: safe(input.confidenceExplanation || diagnostic.confidenceExplanation || `Основано на подтверждённых фактах: ${facts.length}, проверках: ${checks.length}, несоответствиях: ${anomalies.length}.`, 1000),
      risk: safe(input.riskAssessment || (anomalies.length ? 'review_required' : 'normal'), 200),
      rating: rating ? Object.freeze({
        value: Number(rating.value ?? rating.score ?? 0),
        band: safe(rating.band || rating.level || 'unrated', 100),
        confidence: Math.round(Math.max(0, Math.min(100, Number(rating.confidence || confidence || 0)))),
        positiveSignals,
        negativeSignals,
        missingSignals,
      }) : null,
      recommendedActions: Object.freeze((Array.isArray(input.recommendedActions) ? input.recommendedActions : [input.recommendedAction]).map((item) => safe(item, 1000)).filter(Boolean).slice(0, 8)),
      alternativeActions: Object.freeze((Array.isArray(input.alternativeActions) ? input.alternativeActions : []).map((item) => safe(item, 1000)).filter(Boolean).slice(0, 8)),
      noActionOption: safe(input.noActionOption || 'Продолжать наблюдение, если существенное несоответствие не подтверждено.', 600),
    }),
    timeline: Object.freeze(timeline.map((item) => ({
      at: formatQl7SupportDate(item?.at || item?.createdAt || item?.ts, 'ru') || '',
      event: humanize(item?.type || item?.event || item?.state || 'event'),
      detail: safe(item?.detail || item?.message || item?.status || '', 800),
    }))),
    privacy: Object.freeze({
      reporterIdentityIncluded: false,
      rawSecretsIncluded: false,
      rawDatabaseDumpIncluded: false,
      userControlledQueryIncluded: false,
    }),
    actions: buildAdminActions({ caseId, messageId, topic: input.topic || topic, accountReference, correlationId }),
    generatedAt,
  })
}

export function renderQl7SupportAdminReportText(report = {}) {
  const facts = report?.summary?.confirmedFacts || []
  const checks = report?.summary?.checks || []
  const anomalies = report?.summary?.anomalies || []
  return [
    report.title || 'Отчёт поддержки оператору',
    '',
    `Тема письма: ${report.subject || '-'}`,
    `Кейс: ${report.case?.caseId || '-'}`,
    `Тема: ${report.case?.topic || '-'}`,
    `Статус: ${report.case?.caseStatus || report.case?.diagnosticStatus || '-'}`,
    `Приоритет: ${report.priority || 'обычный'}`,
    `Пользователь: ${report.user?.displayName || report.user?.accountReference || '-'}`,
    `Язык пользователя: ${report.user?.language || '-'}`,
    `Уверенность: ${report.assessment?.confidence || 0}%`,
    `Рейтинг экосистемы: ${report.assessment?.rating?.value ?? '-'} (${report.assessment?.rating?.band || '-'})`,
    '',
    'Полный пользовательский запрос:',
    report.summary?.userClaim || '-',
    '',
    'Подтверждённые факты:',
    ...(facts.length ? facts.map((item) => `- ${item}`) : ['- нет подтверждённых фактов']),
    '',
    'Результаты read-only проверки:',
    ...(checks.length ? checks.map((item) => `- ${item}`) : ['- нет записей']),
    '',
    'Несоответствия:',
    ...(anomalies.length ? anomalies.map((item) => `- ${item}`) : ['- нет записей']),
    '',
    'Рекомендуемое действие:',
    report.summary?.recommendation || '-',
    '',
    'Действия оператора:',
    ...((report.actions || []).length ? (report.actions || []).map((action) => `- ${operatorActionLabel(action)}: ${action.href}`) : ['- нет действий']),
  ].join('\n')
}

export function renderQl7SupportAdminReportHtml(report = {}) {
  const facts = report?.summary?.confirmedFacts || []
  const checks = report?.summary?.checks || []
  const anomalies = report?.summary?.anomalies || []
  const timeline = report?.timeline || []
  const privacy = report?.privacy || {}
  const list = (items) => items.length ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>` : '<p class="muted">Нет записей.</p>'
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><style>
  body{margin:0;background:#07111f;color:#ffffff;font-family:Inter,Segoe UI,Arial,sans-serif}.wrap{max-width:960px;margin:0 auto;padding:28px}.hero,.section{border:1px solid rgba(94,213,255,.28);border-radius:18px;background:linear-gradient(145deg,rgba(18,38,66,.98),rgba(7,17,31,.98));box-shadow:0 18px 50px rgba(0,0,0,.28);padding:22px;margin-bottom:16px}.hero h1{margin:0 0 10px;color:#ffffff;font-size:26px}.badges,.actions{display:flex;gap:8px;flex-wrap:wrap}.actions{width:100%}.badge,.actionBtn{border:1px solid rgba(117,230,255,.48);border-radius:999px;padding:6px 11px;color:#ffffff;background:rgba(43,113,156,.24);font-size:12px}.actionBtn{box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:100%;min-height:42px;padding:0 16px;text-decoration:none;font-weight:800;color:#07111f!important;background:#aef5ff;background:linear-gradient(135deg,#7df1ff,#ffe58b);border-color:rgba(255,233,142,.82)}.section h2{font-size:17px;color:#ffd979;margin:0 0 14px}table{border-collapse:collapse;width:100%}th,td{padding:10px 12px;border-bottom:1px solid rgba(102,195,255,.12);text-align:left;vertical-align:top;font-size:13px}th{width:220px;color:#c8f4ff}td{color:#ffffff}.claim{white-space:pre-wrap;border:1px solid #9edfff;border-radius:14px;padding:14px;background:#092848!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font-weight:650;line-height:1.55;overflow-wrap:anywhere}.claim *{color:#ffffff!important;-webkit-text-fill-color:#ffffff!important}ul{margin:0;padding-left:22px}.muted{color:#cbeaff}.ok{color:#8fffc4}.warn{color:#ffd179}
  </style></head><body bgcolor="#07111f" style="margin:0;background:#07111f!important;color:#ffffff!important"><div class="wrap" style="background:#07111f;color:#ffffff">
  <div class="hero"><h1>${esc(report.title || 'Отчёт поддержки оператору')}</h1><div class="badges"><span class="badge">${esc(humanize(report.priority || 'normal'))}</span><span class="badge">${esc(report.case?.topic || 'Support')}</span><span class="badge">${esc(report.case?.caseStatus || report.case?.diagnosticStatus || 'открыт')}</span></div></div>
  ${actionButtons(report.actions)}
  ${rows('Кейс и событие', [['Тема письма', report.subject], ['Приоритет', humanize(report.priority || 'normal')], ['Тип события', report.case?.messageAct || report.case?.topic], ['Статус кейса', report.case?.caseStatus || report.case?.diagnosticStatus], ['Дата и время', report.case?.generatedAt], ['ID кейса', report.case?.caseId], ['ID сообщения', report.case?.messageId], ['Тема', report.case?.topic], ['Статус диагностики', report.case?.diagnosticStatus]])}
  ${rows('Контекст пользователя', [['Никнейм', report.user?.displayName], ['Маскированный идентификатор аккаунта', report.user?.accountReference], ['Email для связи', report.user?.contactEmail], ['Язык пользователя', report.user?.language], ['Безопасное geo: страна/регион/город', report.user?.safeGeo], ['VIP', report.user?.vipStatus], ['Рекламные пакеты и кампании', report.user?.adsPackages], ['Открытые Support cases', report.user?.openCases]])}
  <section class="section"><h2>Полный пользовательский запрос</h2><div class="claim" bgcolor="#092848" style="white-space:pre-wrap;border:1px solid #9edfff;border-radius:14px;padding:14px;background:#092848!important;color:#ffffff!important;-webkit-text-fill-color:#ffffff!important;font-weight:650;line-height:1.55;overflow-wrap:anywhere"><span style="color:#ffffff!important;-webkit-text-fill-color:#ffffff!important">${esc(report.summary?.userClaim || '')}</span></div></section>
  <section class="section"><h2>Подтверждённые факты</h2>${list(facts)}</section>
  <section class="section"><h2>Результаты read-only проверки</h2>${list(checks)}</section>
  <section class="section"><h2>Несоответствия и точки проверки</h2>${list(anomalies)}</section>
  ${rows('Confidence и объяснение', [['Уверенность оценки', `${report.assessment?.confidence || 0}%`], ['Почему получена такая оценка', report.assessment?.confidenceExplanation], ['Риск', report.assessment?.risk], ['Рейтинг экосистемы', report.assessment?.rating ? `${report.assessment.rating.value}/100 | ${report.assessment.rating.band} | confidence ${report.assessment.rating.confidence}%` : 'недоступно'], ['Положительные сигналы', report.assessment?.rating?.positiveSignals], ['Риск-сигналы', report.assessment?.rating?.negativeSignals], ['Недостающие данные', report.assessment?.rating?.missingSignals]])}
  ${rows('Рекомендуемое действие', [['Основное действие', report.summary?.recommendation], ['Рекомендуемые действия', report.assessment?.recommendedActions], ['Альтернативные действия', report.assessment?.alternativeActions], ['Вариант без действия', report.assessment?.noActionOption]])}
  ${timeline.length ? rows('Краткий контекст предыдущих реплик', timeline.map((item, index) => [`${index + 1}. ${item.event}`, [item.at, item.detail].filter(Boolean).join(' - ')])) : ''}
  ${rows('Privacy proof', [['Личность жалобщика включена', privacy.reporterIdentityIncluded ? 'да' : 'нет'], ['Raw secrets включены', privacy.rawSecretsIncluded ? 'да' : 'нет'], ['Raw database dump включён', privacy.rawDatabaseDumpIncluded ? 'да' : 'нет'], ['User-controlled query включён', privacy.userControlledQueryIncluded ? 'да' : 'нет']])}
  </div></body></html>`
}
