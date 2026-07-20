import { deliverQl7SupportEvent } from './server.js'
import { buildQl7SupportDedupeKey } from './templates.js'

function str(value) {
  return String(value ?? '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function subject(...parts) {
  return parts.map(str).filter(Boolean).join(':') || 'event'
}

function withTimestamp(payload = {}, timestamp = '') {
  const ts = str(timestamp) || str(payload?.timestamp) || nowIso()
  return { ...(payload || {}), timestamp: ts }
}

async function emit({
  userId,
  userAliases = [],
  eventType,
  subjectId,
  locale = '',
  payload = {},
  timestamp = '',
  push = true,
} = {}) {
  const dedupeKey = buildQl7SupportDedupeKey({
    userId,
    eventType,
    subjectId,
  })
  return deliverQl7SupportEvent({
    userId,
    userAliases,
    eventType,
    subjectId,
    locale,
    payload: withTimestamp(payload, timestamp),
    dedupeKey,
    push,
  })
}

export async function notifyQl7Welcome({ userId, userAliases = [], locale = '', registeredAt = '' } = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'welcome',
    subjectId: 'registration',
    locale,
    payload: {},
    timestamp: registeredAt,
  })
}

export async function notifyQl7QcoinCredited({
  userId,
  userAliases = [],
  locale = '',
  amount = '',
  balance = '',
  invoiceId = '',
  paymentId = '',
  creditedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'qcoin_credit',
    subjectId: subject(invoiceId, paymentId),
    locale,
    payload: { amount, balance, invoiceId, paymentId },
    timestamp: creditedAt,
  })
}

export async function notifyQl7VipActivated({
  userId,
  userAliases = [],
  locale = '',
  until = '',
  paymentId = '',
  activatedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'vip_activated',
    subjectId: subject(paymentId, until),
    locale,
    payload: { until, paymentId },
    timestamp: activatedAt || until,
  })
}

export async function notifyQl7VipExpiring({
  userId,
  userAliases = [],
  locale = '',
  daysLeft,
  until = '',
  warningAt = '',
} = {}) {
  const days = Number(daysLeft)
  const eventType = days === 3 ? 'vip_expiring_3d' : (days === 2 ? 'vip_expiring_2d' : 'vip_expiring_1d')
  return emit({
    userId,
    userAliases,
    eventType,
    subjectId: subject(until, `${days || 1}d`),
    locale,
    payload: { until, daysLeft: days || 1 },
    timestamp: warningAt || until,
  })
}

export async function notifyQl7VipExpired({
  userId,
  userAliases = [],
  locale = '',
  until = '',
  expiredAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'vip_expired',
    subjectId: subject(until),
    locale,
    payload: { until },
    timestamp: expiredAt || until,
  })
}

export async function notifyQl7AdsActivated({
  userId,
  userAliases = [],
  locale = '',
  packageName = '',
  campaign = '',
  invoiceId = '',
  activatedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'ads_activated',
    subjectId: subject(invoiceId, packageName, campaign),
    locale,
    payload: { package: packageName, campaign, invoiceId },
    timestamp: activatedAt,
  })
}

export async function notifyQl7AdsMetricsWeekly({
  userId,
  userAliases = [],
  locale = '',
  campaign = '',
  packageName = '',
  views = 0,
  clicks = 0,
  ctr = '',
  period = '',
  reportId = '',
  reportedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'ads_metrics_weekly',
    subjectId: subject(reportId, campaign, period),
    locale,
    payload: { campaign, package: packageName, views, clicks, ctr, period },
    timestamp: reportedAt || period,
  })
}

export async function notifyQl7AdsExpiring({
  userId,
  userAliases = [],
  locale = '',
  daysLeft,
  campaign = '',
  packageName = '',
  expiresAt = '',
  warningAt = '',
} = {}) {
  const days = Number(daysLeft)
  const eventType = days === 3 ? 'ads_expiring_3d' : (days === 2 ? 'ads_expiring_2d' : 'ads_expiring_1d')
  return emit({
    userId,
    userAliases,
    eventType,
    subjectId: subject(campaign, expiresAt, `${days || 1}d`),
    locale,
    payload: { campaign, package: packageName, expiresAt, daysLeft: days || 1 },
    timestamp: warningAt || expiresAt,
  })
}

export async function notifyQl7AdsFinalSummary({
  userId,
  userAliases = [],
  locale = '',
  campaign = '',
  packageName = '',
  views = 0,
  clicks = 0,
  ctr = '',
  reportId = '',
  finishedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'ads_final_summary',
    subjectId: subject(reportId, campaign, finishedAt),
    locale,
    payload: { campaign, package: packageName, views, clicks, ctr },
    timestamp: finishedAt,
  })
}

export async function notifyQl7ReportReceived({
  userId,
  userAliases = [],
  locale = '',
  postId = '',
  reportType = '',
  reporterId = '',
  reportedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'report_received',
    subjectId: subject(postId, reportType, reporterId),
    locale,
    payload: { postId, reportType, reporterId },
    timestamp: reportedAt,
  })
}

export async function notifyQl7ReportThreshold({
  userId,
  userAliases = [],
  locale = '',
  postId = '',
  reportType = '',
  count = 0,
  reachedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'report_threshold',
    subjectId: subject(postId, reportType, count),
    locale,
    payload: { postId, reportType, count },
    timestamp: reachedAt,
  })
}

export async function notifyQl7PostRemoved({
  userId,
  userAliases = [],
  locale = '',
  postId = '',
  reason = '',
  rev = '',
  removedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'post_removed',
    subjectId: subject(postId, rev),
    locale,
    payload: { postId, reason, rev },
    timestamp: removedAt,
  })
}

export async function notifyQl7MediaLock({
  userId,
  userAliases = [],
  locale = '',
  until = '',
  reason = '',
  lockedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'media_lock',
    subjectId: subject(until, reason),
    locale,
    payload: { until, reason },
    timestamp: lockedAt || until,
  })
}

export async function notifyQl7RulesWarning({
  userId,
  userAliases = [],
  locale = '',
  reason = '',
  warningId = '',
  warnedAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'rules_warning',
    subjectId: subject(warningId, reason),
    locale,
    payload: { reason },
    timestamp: warnedAt,
  })
}

export async function notifyQl7Broadcast({
  userId,
  userAliases = [],
  locale = '',
  message = '',
  broadcastId = '',
  sentAt = '',
  push = true,
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'broadcast',
    subjectId: subject(broadcastId),
    locale,
    payload: { message, broadcastId: subject(broadcastId) },
    timestamp: sentAt,
    push,
  })
}

export async function notifyQl7Security({
  userId,
  userAliases = [],
  locale = '',
  message = '',
  securityId = '',
  sentAt = '',
} = {}) {
  return emit({
    userId,
    userAliases,
    eventType: 'critical_security',
    subjectId: subject(securityId),
    locale,
    payload: { message },
    timestamp: sentAt,
  })
}
