import crypto from 'node:crypto'

function num(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0 }
function str(value) { return String(value ?? '').trim() }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)) }
function round(value, digits = 4) {
  const factor = 10 ** digits
  return Math.round(Number(value || 0) * factor) / factor
}
function stableHash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
function receiptId(source, key) {
  return `rating:${source}:${key}`
}
function factor({
  factorId,
  titleRu,
  descriptionRu,
  rawValue,
  normalizedValue,
  weight,
  contribution,
  direction,
  source,
  state = 'observed',
  checkedAt,
}) {
  return Object.freeze({
    factorId,
    titleRu,
    descriptionRu,
    rawValue,
    normalizedValue: round(normalizedValue),
    weight: round(weight),
    contribution: Math.round(contribution),
    direction,
    source,
    receiptId: receiptId(source, factorId),
    state,
    checkedAt,
  })
}

export function calculateQl7EcosystemRating({
  profile = {},
  activity = {},
  violations = {},
  support = {},
  now = Date.now,
} = {}) {
  const current = typeof now === 'function' ? Number(now()) : Number(now || Date.now())
  const checkedAt = new Date(current).toISOString()
  const snapshotInput = { profile, activity, violations, support }
  const snapshotHash = stableHash(snapshotInput)
  const factors = []
  const missing = []

  const registeredAt = Date.parse(profile?.registeredAt || profile?.createdAt || '')
  const accountAgeDays = Number.isFinite(registeredAt) ? Math.max(0, Math.floor((current - registeredAt) / 86400000)) : null
  if (accountAgeDays !== null && accountAgeDays > 0) {
    const normalizedValue = clamp(Math.log10(accountAgeDays + 1) / Math.log10(3650), 0, 1)
    factors.push(factor({
      factorId: 'account_age',
      titleRu: 'Возраст аккаунта',
      descriptionRu: 'Чем дольше аккаунт существует, тем выше устойчивость сигнала.',
      rawValue: accountAgeDays,
      normalizedValue,
      weight: 0.16,
      contribution: normalizedValue * 16,
      direction: 'positive',
      source: 'profile',
      checkedAt,
    }))
  } else {
    missing.push('account_age')
    factors.push(factor({
      factorId: 'account_age',
      titleRu: 'Возраст аккаунта',
      descriptionRu: 'Дата регистрации не найдена; фактор не штрафует рейтинг.',
      rawValue: null,
      normalizedValue: 0,
      weight: 0.16,
      contribution: 0,
      direction: 'neutral',
      source: 'profile',
      state: 'missing_no_zero_effect',
      checkedAt,
    }))
  }

  const completed = num(activity?.successfulOperations || activity?.completedActions)
  if (completed > 0) {
    const normalizedValue = clamp(Math.log10(completed + 1) / Math.log10(1000), 0, 1)
    factors.push(factor({
      factorId: 'successful_activity',
      titleRu: 'Успешная активность',
      descriptionRu: 'Учитывает подтвержденные действия пользователя в экосистеме.',
      rawValue: completed,
      normalizedValue,
      weight: 0.18,
      contribution: normalizedValue * 18,
      direction: 'positive',
      source: 'activity',
      checkedAt,
    }))
  } else {
    missing.push('successful_activity')
    factors.push(factor({
      factorId: 'successful_activity',
      titleRu: 'Успешная активность',
      descriptionRu: 'Подтвержденные действия не найдены; фактор не превращается в штраф.',
      rawValue: null,
      normalizedValue: 0,
      weight: 0.18,
      contribution: 0,
      direction: 'neutral',
      source: 'activity',
      state: 'missing_no_zero_effect',
      checkedAt,
    }))
  }

  if (profile?.nickname) {
    factors.push(factor({
      factorId: 'profile_nickname',
      titleRu: 'Заполненный никнейм',
      descriptionRu: 'Публичный профиль содержит читаемое имя.',
      rawValue: true,
      normalizedValue: 1,
      weight: 0.03,
      contribution: 3,
      direction: 'positive',
      source: 'profile',
      checkedAt,
    }))
  }
  if (profile?.locale) {
    factors.push(factor({
      factorId: 'profile_locale',
      titleRu: 'Язык профиля',
      descriptionRu: 'Профиль содержит языковой контекст для корректного ответа.',
      rawValue: str(profile.locale),
      normalizedValue: 1,
      weight: 0.02,
      contribution: 2,
      direction: 'positive',
      source: 'profile',
      checkedAt,
    }))
  }
  if (activity?.vipActive) {
    factors.push(factor({
      factorId: 'active_vip',
      titleRu: 'Активный VIP',
      descriptionRu: 'VIP-статус повышает доверие к экономическому контуру пользователя.',
      rawValue: true,
      normalizedValue: 1,
      weight: 0.04,
      contribution: 4,
      direction: 'positive',
      source: 'entitlements',
      checkedAt,
    }))
  }

  const confirmedViolations = num(violations?.confirmed)
  if (confirmedViolations > 0) {
    const contribution = -clamp(confirmedViolations * 8, 0, 32)
    factors.push(factor({
      factorId: 'confirmed_violations',
      titleRu: 'Подтвержденные нарушения',
      descriptionRu: 'Подтвержденная модерацией история снижает рейтинг.',
      rawValue: confirmedViolations,
      normalizedValue: clamp(confirmedViolations / 4, 0, 1),
      weight: 0.32,
      contribution,
      direction: 'negative',
      source: 'moderation',
      checkedAt,
    }))
  }
  const suspicious = num(violations?.suspiciousPatterns)
  if (suspicious > 0) {
    const contribution = -clamp(suspicious * 4, 0, 20)
    factors.push(factor({
      factorId: 'suspicious_patterns',
      titleRu: 'Подозрительные паттерны',
      descriptionRu: 'Неподтвержденные, но повторяющиеся риск-сигналы учитываются мягче.',
      rawValue: suspicious,
      normalizedValue: clamp(suspicious / 5, 0, 1),
      weight: 0.2,
      contribution,
      direction: 'negative',
      source: 'moderation',
      checkedAt,
    }))
  }
  const abandoned = num(support?.abandonedCases)
  if (abandoned > 0) {
    const contribution = -clamp(abandoned, 0, 8)
    factors.push(factor({
      factorId: 'abandoned_cases',
      titleRu: 'Незавершенные support-кейсы',
      descriptionRu: 'Часто брошенные обращения немного снижают уверенность.',
      rawValue: abandoned,
      normalizedValue: clamp(abandoned / 8, 0, 1),
      weight: 0.08,
      contribution,
      direction: 'negative',
      source: 'support',
      checkedAt,
    }))
  }

  const score = 50 + factors.reduce((sum, item) => sum + Number(item.contribution || 0), 0)
  const positiveFactors = factors.filter((item) => item.direction === 'positive')
  const negativeFactors = factors.filter((item) => item.direction === 'negative')
  const neutralFactors = factors.filter((item) => item.direction === 'neutral')
  const observedSignals = positiveFactors.length + negativeFactors.length
  const confidence = clamp(35 + observedSignals * 8 - missing.length * 4, 25, 95)
  const value = Math.round(clamp(score, 0, 100))
  const band = value >= 85 ? 'excellent' : value >= 70 ? 'strong' : value >= 50 ? 'established' : value >= 30 ? 'developing' : 'high_attention'
  const positiveContributors = positiveFactors.map((item) => ({ key: item.factorId, points: item.contribution, value: item.rawValue }))
  const negativeContributors = negativeFactors.map((item) => ({ key: item.factorId, points: item.contribution, value: item.rawValue }))
  const explanationRu = [
    `Рейтинг ${value}/100, уровень ${band}, уверенность ${Math.round(confidence)}%.`,
    positiveFactors.length ? `Позитивные факторы: ${positiveFactors.map((item) => `${item.titleRu} +${item.contribution}`).join('; ')}.` : '',
    negativeFactors.length ? `Факторы снижения: ${negativeFactors.map((item) => `${item.titleRu} ${item.contribution}`).join('; ')}.` : '',
    neutralFactors.length ? `Недостающие данные не были засчитаны как ноль: ${neutralFactors.map((item) => item.titleRu).join('; ')}.` : '',
  ].filter(Boolean).join(' ')

  return Object.freeze({
    value,
    ratingValue: value,
    band,
    ratingBand: band,
    confidence: Math.round(confidence),
    positiveContributors,
    negativeContributors,
    missingData: missing,
    positiveFactors,
    negativeFactors,
    neutralFactors,
    missingFactors: neutralFactors.map((item) => item.factorId),
    factorLedger: Object.freeze(factors),
    criteria: Object.freeze(factors.map((item) => ({
      id: item.factorId,
      label: item.titleRu,
      value: item.rawValue,
      points: item.contribution,
      explanation: item.descriptionRu,
      receiptId: item.receiptId,
      state: item.state,
    }))),
    receipts: Object.freeze(factors.map((item) => ({
      id: item.receiptId,
      source: item.source,
      readOnly: true,
      writeCount: 0,
      checkedAt: item.checkedAt,
    }))),
    calculationVersion: 'ql7-ecosystem-rating-v8-explainable',
    formulaVersion: 'ql7-ecosystem-rating-v8-explainable',
    generatedAt: checkedAt,
    calculatedAt: checkedAt,
    snapshotHash,
    punitiveActionAllowed: false,
    punitiveAction: false,
    explanation: `Rating ${value}/100 (${band}); confidence ${Math.round(confidence)}%.`,
    explanationRu,
    recommendedActionsRu: Object.freeze([
      'Использовать рейтинг только как объяснимый вспомогательный сигнал.',
      'Не применять санкции автоматически по одному рейтингу.',
      'При спорных кейсах сверять факторный ledger и первичные receipts.',
    ]),
    reasons: Object.freeze(factors.map((item) => `${item.titleRu}: ${item.contribution >= 0 ? '+' : ''}${item.contribution}`)),
    positiveSignals: Object.freeze(positiveFactors.map((item) => item.titleRu)),
    negativeSignals: Object.freeze(negativeFactors.map((item) => item.titleRu)),
    missingSignals: Object.freeze(neutralFactors.map((item) => item.titleRu)),
    userId: str(profile?.userId || profile?.id),
  })
}
