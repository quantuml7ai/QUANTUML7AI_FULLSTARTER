import mongoClient from '../mongo/client.cjs'
import { getAnalyticsForCampaign } from '../adsCore.js'
import {
  notifyQl7AdsExpiring,
  notifyQl7AdsFinalSummary,
  notifyQl7AdsMetricsWeekly,
  notifyQl7VipExpired,
  notifyQl7VipExpiring,
} from './events.js'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_LIMIT = 250
const MAX_LIMIT = 1000
const SCHEDULER_INDEX_KEY = '__ql7SupportSchedulerIndexesV1'

let ql7SupportSchedulerTestDb = null

function str(value) {
  return String(value ?? '').trim()
}

function clampLimit(limit) {
  const value = Number(limit)
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT
  return Math.max(1, Math.min(Math.floor(value), MAX_LIMIT))
}

function timeMs(value) {
  const ts = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isFinite(ts) ? ts : 0
}

function isoDate(value) {
  const ts = timeMs(value)
  return ts ? new Date(ts).toISOString().slice(0, 10) : ''
}

function nowDate(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  return Number.isFinite(date.getTime()) ? date : new Date()
}

function daysLeft(untilISO, now = new Date()) {
  const until = timeMs(untilISO)
  if (!until) return null
  const diff = until - now.getTime()
  if (diff <= 0) return 0
  return Math.ceil(diff / DAY_MS)
}

function warningTimestamp(untilISO, days) {
  const until = timeMs(untilISO)
  if (!until) return ''
  return isoDate(until - Number(days || 0) * DAY_MS)
}

function isoWeekId(date) {
  const source = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = source.getUTCDay() || 7
  source.setUTCDate(source.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(source.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((source - yearStart) / DAY_MS) + 1) / 7)
  return `${source.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

function ctrText(views, clicks) {
  const v = Number(views || 0)
  const c = Number(clicks || 0)
  if (!v) return '0%'
  return `${((c / v) * 100).toFixed(2)}%`
}

function cleanPackageName(pkg = {}) {
  return str(pkg.packageName || pkg.label || pkg.name || pkg.pkgType || pkg.planId || pkg.type || 'Ads')
}

function cleanCampaignName(campaign = {}, fallback = '') {
  return str(campaign.name || campaign.title || campaign.campaignName || campaign.note || fallback || campaign.campaignId || campaign.id || 'Ads campaign')
}

function kvValue(doc) {
  if (!doc) return null
  if (doc.value && typeof doc.value === 'object') return doc.value
  if (doc.raw) {
    try { return JSON.parse(String(doc.raw)) } catch {}
  }
  return doc.value ?? null
}

async function db() {
  const handle = ql7SupportSchedulerTestDb || await mongoClient.getMongoDb()
  const database = handle?.db && typeof handle.db.collection === 'function' ? handle.db : handle
  if (!database || typeof database.collection !== 'function') throw new Error('mongo_db_unavailable')
  if (!globalThis[SCHEDULER_INDEX_KEY]) {
    globalThis[SCHEDULER_INDEX_KEY] = Promise.allSettled([
      database.collection('vip_subscriptions').createIndex({ untilISO: 1 }),
      database.collection('ads_kv').createIndex({ _id: 1 }),
      database.collection('ads_sets').createIndex({ _id: 1 }),
    ]).catch((error) => {
      delete globalThis[SCHEDULER_INDEX_KEY]
      throw error
    })
  }
  await globalThis[SCHEDULER_INDEX_KEY]
  return database
}

export function __setQl7SupportSchedulerTestDb(database) {
  ql7SupportSchedulerTestDb = database || null
  delete globalThis[SCHEDULER_INDEX_KEY]
}

async function listVipRows(database, limit) {
  return database.collection('vip_subscriptions')
    .find({ untilISO: { $exists: true, $ne: '' } })
    .sort({ untilISO: 1 })
    .limit(limit)
    .toArray()
}

async function listAdsPackages(database, limit) {
  const rows = await database.collection('ads_kv')
    .find({ _id: /^ads:package:/ })
    .sort({ _id: 1 })
    .limit(limit)
    .toArray()
  return rows.map(kvValue).filter(Boolean)
}

async function listAdsCampaigns(database, limit) {
  const rows = await database.collection('ads_kv')
    .find({ _id: /^ads:campaign:/ })
    .sort({ _id: 1 })
    .limit(limit)
    .toArray()
  return rows.map(kvValue).filter(Boolean)
}

async function campaignIdsForPackage(database, packageId) {
  const id = str(packageId)
  if (!id) return []
  const doc = await database.collection('ads_sets').findOne({ _id: `ads:campaigns:pkg:${id}` }).catch(() => null)
  return Array.from(new Set((Array.isArray(doc?.members) ? doc.members : []).map(str).filter(Boolean)))
}

async function campaignById(database, campaignId) {
  const id = str(campaignId)
  if (!id) return null
  const doc = await database.collection('ads_kv').findOne({ _id: `ads:campaign:${id}` }).catch(() => null)
  return kvValue(doc)
}

async function emitPlan(rows, dryRun, sender) {
  const out = []
  for (const row of rows) {
    if (dryRun !== false) {
      out.push({ ...row, dryRun: true })
      continue
    }
    const result = await sender(row)
    out.push({ ...row, dryRun: false, result })
  }
  return out
}

export async function runQl7SupportVipScheduler({
  now = new Date(),
  dryRun = true,
  limit = DEFAULT_LIMIT,
} = {}) {
  const at = nowDate(now)
  const database = await db()
  const rows = await listVipRows(database, clampLimit(limit))
  const candidates = []

  for (const row of rows) {
    const userId = str(row?.accountId || row?.userId || row?.uid || '').toLowerCase()
    const until = str(row?.untilISO)
    if (!userId || !until) continue
    const left = daysLeft(until, at)
    if (left === null) continue
    if (left === 0) {
      candidates.push({ kind: 'vip_expired', userId, until, timestamp: until })
    } else if ([1, 2, 3].includes(left)) {
      candidates.push({
        kind: 'vip_expiring',
        userId,
        until,
        daysLeft: left,
        timestamp: warningTimestamp(until, left),
      })
    }
  }

  const results = await emitPlan(candidates, dryRun, (row) => (
    row.kind === 'vip_expired'
      ? notifyQl7VipExpired({
        userId: row.userId,
        until: row.until,
        expiredAt: row.timestamp,
      })
      : notifyQl7VipExpiring({
        userId: row.userId,
        until: row.until,
        daysLeft: row.daysLeft,
        warningAt: row.timestamp,
      })
  ))

  return {
    ok: true,
    dryRun: dryRun !== false,
    scanned: rows.length,
    planned: candidates.length,
    results,
    storagePrimary: 'mongo',
  }
}

export async function runQl7SupportAdsScheduler({
  now = new Date(),
  dryRun = true,
  limit = DEFAULT_LIMIT,
  includeWeeklyMetrics = true,
  includeExpiry = true,
  includeFinalSummary = true,
} = {}) {
  const at = nowDate(now)
  const database = await db()
  const max = clampLimit(limit)
  const packages = await listAdsPackages(database, max)
  const campaigns = await listAdsCampaigns(database, max)
  const candidates = []
  const weekId = isoWeekId(at)
  const period = `${weekId}:${isoDate(at)}`

  if (includeExpiry) {
    for (const pkg of packages) {
      const userId = str(pkg?.accountId || pkg?.userId || pkg?.uid || '').toLowerCase()
      const expiresAt = str(pkg?.expiresAt)
      if (!userId || !expiresAt) continue
      const left = daysLeft(expiresAt, at)
      if (![1, 2, 3].includes(left)) continue
      candidates.push({
        kind: 'ads_expiring',
        userId,
        packageName: cleanPackageName(pkg),
        campaign: str(pkg?.note || pkg?.id),
        expiresAt,
        daysLeft: left,
        timestamp: warningTimestamp(expiresAt, left),
      })
    }
  }

  if (includeFinalSummary) {
    for (const pkg of packages) {
      const userId = str(pkg?.accountId || pkg?.userId || pkg?.uid || '').toLowerCase()
      const expiresAt = str(pkg?.expiresAt)
      if (!userId || !expiresAt || timeMs(expiresAt) > at.getTime()) continue
      const ids = await campaignIdsForPackage(database, pkg.id)
      for (const campaignId of ids.length ? ids : [pkg.id]) {
        const campaign = await campaignById(database, campaignId)
        const metrics = await getAnalyticsForCampaign({
          campaignId,
          from: pkg.startsAt || pkg.createdAt || new Date(at.getTime() - 7 * DAY_MS).toISOString(),
          to: expiresAt,
          groupBy: 'day',
        }).catch(() => null)
        const views = Number(metrics?.impressionsTotal || 0)
        const clicks = Number(metrics?.clicksTotal || 0)
        candidates.push({
          kind: 'ads_final_summary',
          userId,
          campaign: cleanCampaignName(campaign, campaignId),
          packageName: cleanPackageName(pkg),
          views,
          clicks,
          ctr: ctrText(views, clicks),
          reportId: `${campaignId}:final:${expiresAt}`,
          timestamp: expiresAt,
        })
      }
    }
  }

  if (includeWeeklyMetrics) {
    for (const campaign of campaigns) {
      const userId = str(campaign?.accountId || campaign?.userId || campaign?.uid || '').toLowerCase()
      const campaignId = str(campaign?.campaignId || campaign?.id)
      if (!userId || !campaignId) continue
      const metrics = await getAnalyticsForCampaign({
        campaignId,
        from: new Date(at.getTime() - 7 * DAY_MS).toISOString(),
        to: at.toISOString(),
        groupBy: 'day',
      }).catch(() => null)
      const views = Number(metrics?.impressionsTotal || 0)
      const clicks = Number(metrics?.clicksTotal || 0)
      candidates.push({
        kind: 'ads_metrics_weekly',
        userId,
        campaign: cleanCampaignName(campaign, campaignId),
        packageName: cleanPackageName(campaign),
        views,
        clicks,
        ctr: ctrText(views, clicks),
        period,
        reportId: `${campaignId}:weekly:${weekId}`,
        timestamp: weekId,
      })
    }
  }

  const results = await emitPlan(candidates, dryRun, (row) => {
    if (row.kind === 'ads_expiring') {
      return notifyQl7AdsExpiring({
        userId: row.userId,
        campaign: row.campaign,
        packageName: row.packageName,
        expiresAt: row.expiresAt,
        daysLeft: row.daysLeft,
        warningAt: row.timestamp,
      })
    }
    if (row.kind === 'ads_final_summary') {
      return notifyQl7AdsFinalSummary({
        userId: row.userId,
        campaign: row.campaign,
        packageName: row.packageName,
        views: row.views,
        clicks: row.clicks,
        ctr: row.ctr,
        reportId: row.reportId,
        finishedAt: row.timestamp,
      })
    }
    return notifyQl7AdsMetricsWeekly({
      userId: row.userId,
      campaign: row.campaign,
      packageName: row.packageName,
      views: row.views,
      clicks: row.clicks,
      ctr: row.ctr,
      period: row.period,
      reportId: row.reportId,
      reportedAt: row.timestamp,
    })
  })

  return {
    ok: true,
    dryRun: dryRun !== false,
    scannedPackages: packages.length,
    scannedCampaigns: campaigns.length,
    planned: candidates.length,
    results,
    storagePrimary: 'mongo',
  }
}

export async function runQl7SupportScheduler(input = {}) {
  const [vip, ads] = await Promise.all([
    runQl7SupportVipScheduler(input),
    runQl7SupportAdsScheduler(input),
  ])
  return {
    ok: true,
    dryRun: input?.dryRun !== false,
    vip,
    ads,
    planned: Number(vip?.planned || 0) + Number(ads?.planned || 0),
    storagePrimary: 'mongo',
  }
}
