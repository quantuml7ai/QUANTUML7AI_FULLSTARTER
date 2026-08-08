import { ql7Arr, ql7StableHash, ql7Str } from '../internal/text.js'

const REPORT_ORIGIN_FALLBACK = 'https://www.quantuml7ai.com'

function redact(value = '') {
  return ql7Str(value)
    .replace(/(?:seed|private\s*key|password|token|secret|парол[ья]?|приватн(?:ый|ий)\s*ключ)\s*[:=]\s*\S+/giu, '[REDACTED]')
    .replace(/\b(?:mongodb(?:\+srv)?|redis):\/\/[^\s]+/giu, '[REDACTED_CONNECTION_URI]')
    .replace(/\b(?:bearer\s+)?eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/giu, '[REDACTED_TOKEN]')
}

function first(...values) {
  for (const value of values) {
    const text = ql7Str(value)
    if (text) return text
  }
  return ''
}

function num(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : min))
}

function maskReference(value = '') {
  const raw = ql7Str(value)
  if (!raw) return ''
  if (/[…*]/u.test(raw)) return raw
  if (raw.length <= 12) return raw
  return `${raw.slice(0, 6)}…${raw.slice(-6)}`
}

function safeNickname(...values) {
  const raw = first(...values)
  if (!raw || /^ql7\s+support(?:\s+dm)?$/iu.test(raw)) return ''
  return raw.slice(0, 120)
}

function daysBetween(createdAt = '', now = '') {
  const start = Date.parse(ql7Str(createdAt))
  const end = Date.parse(ql7Str(now)) || Date.now()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
  return Math.floor((end - start) / 86_400_000)
}

function safeOrigin(value = '') {
  for (const candidate of [
    value,
    typeof process !== 'undefined' ? process.env.QL7_ADMIN_BASE_URL : '',
    typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL : '',
    REPORT_ORIGIN_FALLBACK,
  ]) {
    try {
      const url = new URL(ql7Str(candidate))
      if (url.protocol === 'https:' && !url.username && !url.password) return url.origin
    } catch {}
  }
  return REPORT_ORIGIN_FALLBACK
}

function safeQueryReference(value = '') {
  return redact(value).replace(/[^\p{L}\p{N}@._:…-]+/gu, '').slice(0, 240)
}

function buildOpenUserDmUrl({ origin = '', accountReference = '', userId = '', caseId = '', messageId = '', requestId = '' } = {}) {
  const dmUser = safeQueryReference(accountReference || userId)
  if (!dmUser) return ''
  const url = new URL('/forum', safeOrigin(origin))
  url.searchParams.set('inbox', 'messages')
  url.searchParams.set('dmUser', dmUser)
  if (caseId) url.searchParams.set('supportCase', safeQueryReference(caseId))
  if (messageId) url.searchParams.set('supportMessage', safeQueryReference(messageId))
  if (requestId) url.searchParams.set('supportRequest', safeQueryReference(requestId))
  return url.toString()
}

function signalText(value) {
  if (typeof value === 'string') return ql7Str(value)
  if (!value || typeof value !== 'object') return ''
  const label = ql7Str(value.label || value.reason || value.key)
  const points = value.points === undefined ? '' : ` (${Number(value.points) >= 0 ? '+' : ''}${Number(value.points)})`
  return `${label}${points}`.trim()
}

function bandFromScore(score = 0) {
  if (score >= 85) return 'очень высокий'
  if (score >= 70) return 'сильный'
  if (score >= 50) return 'стабильный'
  if (score >= 30) return 'требует внимания'
  return 'низкий'
}

function criterion(id, label, value, points, explanation) {
  return Object.freeze({ id, label, value: ql7Str(value), points: Number(points) || 0, explanation })
}

function buildRating({ rating = null, profile = {}, activity = {}, analysis = {}, receipts = [], now = '' } = {}) {
  const accountCreatedAt = first(profile.accountCreatedAt, profile.createdAt, profile.registeredAt, profile.registrationDate)
  const accountAgeDays = daysBetween(accountCreatedAt, now)
  const posts = num(activity.posts, profile?.stats?.posts)
  const topics = num(activity.topics, profile?.stats?.topics)
  const comments = num(activity.comments, profile?.stats?.comments)
  const likes = num(activity.likes, profile?.stats?.likes)
  const followers = num(activity.followers, profile?.stats?.followers)
  const reportsOnPosts = num(activity.reportsOnPosts, activity.postReports, activity.complaintsReceived, profile?.stats?.reportsOnPosts, profile?.stats?.complaintsReceived)
  const reportsByUser = num(activity.reportsByUser, activity.complaintsFiledByUser, profile?.stats?.reportsByUser, profile?.stats?.complaintsFiledByUser)
  const moderationFlags = num(activity.moderationFlags, profile?.stats?.moderationFlags)
  const executedChecks = ql7Arr(receipts).filter((row) => row?.executed === true)
  const readOnlyChecks = ql7Arr(receipts).filter((row) => Number(row?.writeCount || 0) === 0)

  const criteria = [
    criterion('account_age_days', 'Возраст аккаунта', `${accountAgeDays} дн.`, Math.min(12, Math.floor(accountAgeDays / 45)), 'Чем дольше аккаунт существует без критических сигналов, тем выше доверие.'),
    criterion('forum_activity', 'Полезная активность', `${posts} публикаций, ${topics} тем, ${comments} комментариев`, Math.min(16, Math.round(Math.log1p(posts + topics + comments) * 4)), 'Учитывается объём нормальной форумной активности без записи новых данных.'),
    criterion('community_trust', 'Социальные сигналы', `${followers} подписчиков, ${likes} лайков`, Math.min(12, Math.round(Math.log1p(followers + likes) * 2.5)), 'Лайки и подписчики повышают доверие только как вспомогательный сигнал.'),
    criterion('complaints_balance', 'Жалобы и модерация', `${reportsOnPosts} жалоб на публикации, ${reportsByUser} жалоб от пользователя, ${moderationFlags} флагов`, -Math.min(24, (reportsOnPosts * 4) + (moderationFlags * 6)), 'Жалобы не являются наказанием сами по себе, но требуют внимательной проверки контекста.'),
    criterion('verification_coverage', 'Покрытие проверками', `${executedChecks.length} выполнено, ${readOnlyChecks.length} read-only`, Math.min(10, readOnlyChecks.length * 2), 'Read-only receipts повышают уверенность отчёта без бизнес-записей.'),
    criterion('safety_context', 'Контекст безопасности', first(analysis.safetyCategory, analysis.messageAct, 'обычный'), analysis.safetyCategory === 'credible_threat' ? -20 : analysis.safetyCategory === 'direct_insult' ? -8 : 4, 'Угроза или грубость снижает операционный рейтинг, но не скрывает сам запрос.'),
  ]

  const calculated = clamp(50 + criteria.reduce((sum, row) => sum + row.points, 0))
  const providedScore = Number(rating?.score ?? rating?.value)
  const score = Number.isFinite(providedScore) ? clamp(providedScore) : calculated
  const confidence = clamp(rating?.confidence ?? (35 + Math.min(45, readOnlyChecks.length * 9) + Math.min(20, criteria.filter((row) => row.value).length * 3)))
  const providedReasons = ql7Arr(rating?.reasons || rating?.factors).map(signalText).filter(Boolean)
  const positiveSignals = ql7Arr(rating?.positiveContributors || rating?.positiveSignals).map(signalText).filter(Boolean)
  const negativeSignals = ql7Arr(rating?.negativeContributors || rating?.negativeSignals).map(signalText).filter(Boolean)
  const missingSignals = ql7Arr(rating?.missingData || rating?.missingSignals).map(signalText).filter(Boolean)

  return Object.freeze({
    score,
    confidence,
    band: first(rating?.band, rating?.level, bandFromScore(score)),
    reasons: providedReasons.length ? Object.freeze(providedReasons) : Object.freeze(criteria.map((row) => `${row.label}: ${row.points >= 0 ? '+' : ''}${row.points}`).slice(0, 8)),
    criteria: Object.freeze(criteria),
    positiveSignals: Object.freeze(positiveSignals),
    negativeSignals: Object.freeze(negativeSignals),
    missingSignals: Object.freeze(missingSignals),
    calculationVersion: 'ql7-ecosystem-rating-v14.10-operator-case',
  })
}

function buildRecommendations({ analysis = {}, checks = [] } = {}) {
  const resultKinds = new Set(checks.map((row) => row.resultKind).filter(Boolean))
  const recommendations = []
  if (analysis.safetyCategory === 'credible_threat') {
    recommendations.push('Проверить материалы безопасности и историю эскалаций перед любым действием.')
    recommendations.push('Не связываться с пользователем вне утверждённого процесса и не запрашивать секреты.')
  } else if (analysis.safetyCategory === 'direct_insult') {
    recommendations.push('Ответить спокойно, удержать границы общения и продолжить только по сути запроса.')
  }
  if (resultKinds.has('inconsistent')) recommendations.push('Отдельно сверить несоответствия receipts с заявлением пользователя и зафиксировать итог в DM.')
  if (resultKinds.has('unavailable')) recommendations.push('Сообщить пользователю, какой источник временно недоступен, и предложить повторную проверку.')
  if (!checks.length) recommendations.push('Если вопрос требует данных, запустить read-only Mongo/proof проверку перед финальным выводом.')
  recommendations.push('Открыть личную переписку из кнопки отчёта, сверить агрегированный смысл и ответить конкретным следующим шагом.')
  return Object.freeze(Array.from(new Set(recommendations)).slice(0, 8))
}

export function buildQl7SupportOperatorCase({
  requestId = '',
  caseId = '',
  messageId = '',
  finalMessageId = '',
  userId = '',
  actor = {},
  profile = {},
  analysis = {},
  originalText = '',
  translatedMeaning = '',
  receipts = [],
  rating = null,
  geo = {},
  activity = {},
  contacts = null,
  operatorDmUrl = '',
  siteOrigin = '',
  surfaceHash = '',
  now = new Date().toISOString(),
} = {}) {
  const accountReference = first(userId, actor.canonicalAccountId, actor.accountId, actor.userId, profile.userId, actor.maskedWallet, actor.accountIdMasked)
  const nickname = safeNickname(profile.nickname, profile.displayName, profile.nick, actor.nickname, actor.displayName) || maskReference(accountReference) || 'Пользователь'
  const safeContacts = contacts?.consent === true
    ? Object.freeze({
        consent: true,
        email: ql7Str(contacts.email),
        phone: ql7Str(contacts.phone),
        telegram: ql7Str(contacts.telegram),
        preferred: ql7Str(contacts.preferred),
      })
    : Object.freeze({
        consent: false,
        preferred: ql7Str(contacts?.preferred) === 'dm' ? 'dm' : '',
        dmOnly: ql7Str(contacts?.preferred) === 'dm' || contacts?.dmOnly === true,
      })

  const checks = ql7Arr(receipts).map((receipt) => Object.freeze({
    adapter: ql7Str(receipt.adapter),
    resultKind: ql7Str(receipt.resultKind),
    executed: receipt.executed === true,
    readOnly: Number(receipt.writeCount || 0) === 0,
    writeCount: Number(receipt.writeCount || 0),
    checkedAt: ql7Str(receipt.checkedAt),
    sourceType: ql7Str(receipt.sourceType),
    actorScope: ql7Str(receipt.actorScope),
    evidenceHash: ql7Str(receipt.evidenceHash),
  }))

  const activityModel = Object.freeze({
    posts: num(activity.posts, profile?.stats?.posts),
    topics: num(activity.topics, profile?.stats?.topics),
    comments: num(activity.comments, profile?.stats?.comments),
    followers: num(activity.followers, profile?.stats?.followers),
    following: num(activity.following, profile?.stats?.following),
    likes: num(activity.likes, profile?.stats?.likes),
    reportsOnPosts: num(activity.reportsOnPosts, activity.postReports, activity.complaintsReceived, profile?.stats?.reportsOnPosts, profile?.stats?.complaintsReceived),
    reportsByUser: num(activity.reportsByUser, activity.complaintsFiledByUser, profile?.stats?.reportsByUser, profile?.stats?.complaintsFiledByUser),
    moderationFlags: num(activity.moderationFlags, profile?.stats?.moderationFlags),
    removedPosts: num(activity.removedPosts, profile?.stats?.removedPosts),
  })
  const ratingModel = buildRating({ rating, profile, activity: activityModel, analysis, receipts: checks, now })
  const openUserDm = ql7Str(operatorDmUrl) || buildOpenUserDmUrl({ origin: siteOrigin, accountReference, userId, caseId, messageId, requestId })

  const model = {
    schema: 'ql7.support.operator-case',
    version: 14,
    id: ql7Str(caseId) || `case:${ql7StableHash(`${requestId}:${nickname}:${now}`)}`,
    requestId: ql7Str(requestId),
    messageId: ql7Str(messageId),
    finalMessageId: ql7Str(finalMessageId),
    user: Object.freeze({
      nickname,
      userIdMasked: maskReference(first(userId, actor.userId, profile.userId)),
      accountIdMasked: maskReference(first(actor.maskedWallet, actor.accountIdMasked, actor.canonicalAccountIdMasked, actor.accountId, profile.accountId)),
      telegramIdMasked: maskReference(first(actor.telegramId, profile.telegramId, profile.telegram?.id)),
      locale: ql7Str(actor.locale || profile.locale),
      createdAt: ql7Str(profile.accountCreatedAt || profile.createdAt || profile.registeredAt || profile.registrationDate),
      lastActivityAt: ql7Str(profile.lastActivityAt || profile.updatedAt),
    }),
    request: Object.freeze({
      originalText: redact(originalText),
      meaningRu: redact(translatedMeaning || originalText),
      aggregateMeaningRu: redact(translatedMeaning || analysis.aggregateMeaningRu || analysis.summaryRu || originalText),
      topic: ql7Str(analysis.topic),
      subtopic: ql7Str(analysis.subtopic || analysis.subIntent),
      messageAct: ql7Str(analysis.messageAct || analysis.role),
      urgency: ql7Str(analysis.urgency),
      safetyCategory: ql7Str(analysis.safetyCategory),
      confidence: Number.isFinite(Number(analysis.confidence)) ? Number(analysis.confidence) : undefined,
      confidenceMargin: Number.isFinite(Number(analysis.confidenceMargin)) ? Number(analysis.confidenceMargin) : undefined,
      semanticEntropy: Number.isFinite(Number(analysis.semanticEntropy)) ? Number(analysis.semanticEntropy) : undefined,
    }),
    rating: ratingModel,
    geo: Object.freeze({
      country: ql7Str(geo.country),
      region: ql7Str(geo.region),
      city: ql7Str(geo.city),
      precision: ql7Str(geo.precision),
      source: ql7Str(geo.source),
      asOf: ql7Str(geo.asOf),
    }),
    activity: activityModel,
    checks: Object.freeze(checks),
    contacts: safeContacts,
    links: Object.freeze({
      openUserDm,
    }),
    recommendations: buildRecommendations({ analysis, checks }),
    report: Object.freeze({
      surfaceHash: ql7Str(surfaceHash),
      privacyBoundary: 'operator_internal_privacy_safe',
      rawDatabaseDumpIncluded: false,
      rawSecretsIncluded: false,
      businessWriteCount: checks.reduce((sum, row) => sum + Number(row.writeCount || 0), 0),
    }),
    createdAt: now,
  }
  return Object.freeze({ ...model, integrity: Object.freeze({ hash: ql7StableHash(JSON.stringify(model)) }) })
}

export const QL7_SUPPORT_OPERATOR_UNCERTAIN_BOUNDARY_CONTRACT='uncertain-no-operator-case-confirmed-policy-only'
