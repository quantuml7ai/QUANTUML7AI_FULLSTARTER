import {isQl7SupportActive} from './config/featureFlag.js'
import {deliverQl7SupportEvent} from './server.js'
import crypto from 'crypto'
import mongoClient from '../mongo/client.cjs'
import {QL7_SUPPORT_CASE_COLLECTION} from './runtime/caseStoreContract.js'
import {describeQl7SupportReportProgress} from './reportPolicyRegistry.js'
import {QL7_SUPPORT_ALL_LOCALES} from './config/behaviorManifest.js'
import {
  buildQl7SupportEventEnvelope,
  buildQl7SupportEventSourceProposition,
} from './eventNotificationCatalog.js'

const QL7_SUPPORT_ADMIN_EVENT_COLLECTION = 'ql7_support_admin_events'

function normalizeEventLocale(value = '') {
  const lang = str(value).toLowerCase().split(/[-_]/)[0]
  return QL7_SUPPORT_ALL_LOCALES.includes(lang) ? lang : 'en'
}

async function resolveEventLocale(userId = '', preferred = '') {
  const direct = normalizeEventLocale(preferred)
  if (str(preferred) && direct) return direct
  try {
    const handle = await mongoClient.getMongoDb()
    const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
    const uid = str(userId)
    const profile = await database.collection('profiles').findOne({
      $or: [{ _id: `profile:${uid}` }, { accountId: uid }, { canonicalAccountId: uid }, { userId: uid }],
    }, { projection: { locale: 1, language: 1, preferredLocale: 1 } })
    const profileLocale = str(profile?.locale || profile?.language || profile?.preferredLocale)
    if (profileLocale) return normalizeEventLocale(profileLocale)

    const recentCase = await database.collection(QL7_SUPPORT_CASE_COLLECTION).findOne(
      { userId: uid },
      { sort: { updatedAt: -1, _id: -1 }, projection: { selectedLocale: 1, detectedLanguage: 1 } },
    ).catch(() => null)
    const caseLocale = str(recentCase?.selectedLocale || recentCase?.detectedLanguage)
    if (caseLocale) return normalizeEventLocale(caseLocale)
  } catch {}
  return 'en'
}

function str(value) {
  return String(value ?? '').trim()
}

function nowIso() {
  return new Date().toISOString()
}

function maskId(value = '') {
  const clean = str(value)
  if (!clean) return ''
  if (clean.length < 10) return `${clean.slice(0, 2)}***`
  return `${clean.slice(0, 4)}…${clean.slice(-4)}`
}

async function recordAdminEvent({ eventType, userId, reporterId = '', subjectId = '', payload = {} } = {}) {
  const handle = await mongoClient.getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database?.collection) return null
  const at = nowIso()
  const digest = crypto.createHash('sha256').update([eventType, userId, reporterId, subjectId, at].join(':')).digest('hex').slice(0, 28)
  const doc = {
    _id: `support-admin-event:${digest}`,
    eventType: str(eventType),
    userId: str(userId),
    reporterId: str(reporterId),
    reporterIdMasked: maskId(reporterId),
    subjectId: str(subjectId),
    payload: JSON.parse(JSON.stringify(payload || {})),
    createdAt: at,
    visibility: 'admin_only',
    storagePrimary: 'mongo',
  }
  await database.collection(QL7_SUPPORT_ADMIN_EVENT_COLLECTION).insertOne(doc)
  return doc
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
  surfaceFacts = null,
  sourceReceipt = null,
  sourceReceiptId = '',
} = {}) {
  const eventEnvelope = buildQl7SupportEventEnvelope({
    userId,
    actorId: `ql7-support:event-producer:${eventType}`,
    type: eventType,
    subjectId,
    locale,
    payload: withTimestamp(payload, timestamp),
    timestamp: str(timestamp) || str(payload?.timestamp) || nowIso(),
    push,
    surfaceFacts,
    sourceReceipt,
    sourceReceiptId,
  })
  return deliverQl7SupportEvent({
    userId,
    userAliases,
    eventEnvelope,
  })
}

export async function notifyQl7Welcome({ userId, userAliases = [], locale = '', registeredAt = '' } = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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

export async function notifyQl7PurchaseStatus({
  userId,userAliases=[],locale='',status='',product='qcoin',amount='',currency='',invoiceId='',paymentId='',reasonCode='',occurredAt='',
}={}){
  if(!isQl7SupportActive())return{ok:true,skipped:true,reason:'ql7_support_disabled',supportActive:false}
  const normalized=str(status).toLowerCase()
  const failed=/^(?:failed|failure|expired|cancelled|canceled|rejected|credit_failed|invalid_invoice)$/u.test(normalized)
  const succeeded=/^(?:paid|success|succeeded|credited|completed)$/u.test(normalized)
  const eventType=succeeded?'purchase_succeeded':failed?'purchase_failed':'purchase_pending'
  return emit({userId,userAliases,eventType,subjectId:subject(product,invoiceId,paymentId),locale,payload:{product,status:normalized||'pending',amount,currency,invoiceId,paymentId,reasonCode},timestamp:occurredAt})
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  snapshot = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const eventLocale = await resolveEventLocale(userId, locale)
  const safeSnapshot = snapshot && typeof snapshot === 'object' ? snapshot : null
  const eventSubject = subject(postId, reportType, reportedAt)
  const adminEvent = await recordAdminEvent({
    eventType: 'report_received',
    userId,
    reporterId,
    subjectId: eventSubject,
    payload: { postId, reportType, snapshot: safeSnapshot },
  }).catch(() => null)
  return emit({
    userId,
    userAliases,
    eventType: 'report_received',
    subjectId: eventSubject,
    locale: eventLocale,
    payload: { postId, reportType, reporterPrivate: true },
    timestamp: reportedAt,
    sourceReceipt: adminEvent ? {
      receiptId: adminEvent._id,
      sourceType: 'mongo_admin_event',
      sourceOperationId: adminEvent._id,
    } : null,
    surfaceFacts: safeSnapshot ? {
      snapshot: {
        ...safeSnapshot,
        postId,
        reportType,
        capturedAt: safeSnapshot.capturedAt || reportedAt,
        reportProgress: describeQl7SupportReportProgress({
          reportType,
          currentReports: Number(safeSnapshot.thresholdCount || 1),
        }),
      },
    } : null,
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
  snapshot = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const eventLocale = await resolveEventLocale(userId, locale)
  return emit({
    userId,
    userAliases,
    eventType: 'report_threshold',
    subjectId: subject(postId, reportType, count),
    locale: eventLocale,
    payload: { postId, reportType, count },
    timestamp: reachedAt,
    surfaceFacts: snapshot ? {
      snapshot: {
        ...snapshot,
        postId,
        reportType,
        thresholdCount: count,
        reportProgress: describeQl7SupportReportProgress({ reportType, currentReports: count }),
        capturedAt: snapshot.capturedAt || reachedAt,
      },
    } : null,
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
  snapshot = null,
} = {}) {
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const eventLocale = await resolveEventLocale(userId, locale)
  return emit({
    userId,
    userAliases,
    eventType: 'post_removed',
    subjectId: subject(postId, rev),
    locale: eventLocale,
    payload: { postId, reason, rev },
    timestamp: removedAt,
    surfaceFacts: snapshot ? {
      snapshot: {
        ...snapshot,
        postId,
        reportType: reason,
        removed: true,
        reportProgress: {
          ...describeQl7SupportReportProgress({
            reportType: reason,
            currentReports: Number(snapshot.thresholdCount || 0),
          }),
          reviewStatus: 'removed',
        },
        capturedAt: snapshot.capturedAt || removedAt,
      },
    } : null,
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const announcement = buildQl7SupportEventSourceProposition({
    eventType: 'broadcast',
    sourceText: message,
    sourceLocale: locale,
  })
  return emit({
    userId,
    userAliases,
    eventType: 'broadcast',
    subjectId: subject(broadcastId),
    locale,
    payload: { announcement, broadcastId: subject(broadcastId) },
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
  if (!isQl7SupportActive()) return { ok: true, skipped: true, reason: 'ql7_support_disabled', supportActive: false }
  const securityNotice = buildQl7SupportEventSourceProposition({
    eventType: 'critical_security',
    sourceText: message,
    sourceLocale: locale,
  })
  return emit({
    userId,
    userAliases,
    eventType: 'critical_security',
    subjectId: subject(securityId),
    locale,
    payload: { securityNotice },
    timestamp: sentAt,
  })
}
