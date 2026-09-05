import {isQl7AdsDateExpired as adsDateExpired} from './knowledge/adsReadPolicy.js'
import {getAdsReadOnlySnapshot, getAnalyticsForCampaign} from '../adsCore.js'

export const QL7_SUPPORT_ADS_READ_COLLECTIONS = Object.freeze(['ads_kv', 'ads_sets', 'ads_analytics', 'profile_aliases'])

function str(value) { return String(value ?? '').trim() }
function num(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? n : fallback }
function lower(value) { return str(value).toLowerCase() }
function unique(values = []) { return Array.from(new Set((Array.isArray(values) ? values : [values]).map(str).filter(Boolean))) }
function idFor(row = {}, kind = '') {
  if (kind === 'package') return str(row.id || row.packageId || row._id)
  return str(row.id || row.campaignId || row._id)
}
function timeScore(row = {}) {
  const value = row.updatedAt || row.startsAt || row.createdAt || row.expiresAt || 0
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return n
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}
function newest(rows = []) { return (Array.isArray(rows) ? rows : []).filter(Boolean).slice().sort((a, b) => timeScore(b) - timeScore(a)) }
function dedupeRows(rows = [], kind = '') {
  const out = []
  const seen = new Set()
  for (const row of newest(rows)) {
    const id = idFor(row, kind) || JSON.stringify(row)
    if (seen.has(id)) continue
    seen.add(id)
    out.push(row)
  }
  return out
}
function entityProbeIds(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  return unique([entities.campaignId, entities.packageId, entities.bareId])
}
function packageActive(row = {}, now = new Date()) {
  const status = lower(row.status || row.state || row.phase)
  if (/(expired|finished|done|closed|ended|cancel|deleted)/iu.test(status)) return false
  if (adsDateExpired(row.expiresAt || row.untilISO, now)) return false
  return status === 'active' || status === 'running' || status === 'paid' || (!status && Boolean(row.expiresAt || row.startsAt))
}
function metricsRequested(analysis = {}) {
  const intentConfirmation = analysis?.intentConfirmation && typeof analysis.intentConfirmation === 'object'
    ? analysis.intentConfirmation
    : {}
  const source = lower([
    analysis?.operation,
    analysis?.subIntent,
    intentConfirmation?.adapterOperationId,
    intentConfirmation?.slotValues?.operationId,
    analysis?.sanitizedText,
    analysis?.text,
    analysis?.canonicalText,
  ].filter(Boolean).join(' '))
  return /(?:show_metrics|ads_campaigns_metrics|метрик|аналитик|показ|просмотр|клик|ctr|metrics?|analytics?|impressions?|views?|clicks?)/iu.test(source)
}
function normalizeAnalytics(result = {}) {
  return {
    ok: result?.ok !== false,
    impressions: num(result?.impressionsTotal ?? result?.impressions ?? result?.views, 0),
    clicks: num(result?.clicksTotal ?? result?.clicks, 0),
    ctr: num(result?.ctrTotal ?? result?.ctr, 0),
    updatedAt: str(result?.updatedAt || result?.asOf || new Date().toISOString()),
    seriesCount: Array.isArray(result?.series) ? result.series.length : 0,
  }
}
async function readAnalytics(campaigns = [], analysis = {}) {
  if (!metricsRequested(analysis)) return []
  const now = new Date()
  const from = analysis?.timeScope === 'explicit' ? analysis?.from : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const to = analysis?.to || now.toISOString()
  const out = []
  for (const campaign of campaigns.slice(0, 8)) {
    const campaignId = idFor(campaign, 'campaign')
    if (!campaignId) continue
    const result = await getAnalyticsForCampaign({ campaignId, from, to, groupBy: 'day' })
      .catch((error) => ({ ok: false, error: str(error?.message || error) }))
    out.push({ campaignId, ...normalizeAnalytics(result) })
  }
  return out
}
async function readSameSourceSnapshots(userId = '', aliases = []) {
  const candidates = unique([userId, ...aliases])
  const snapshots = []
  for (const candidate of candidates.slice(0, 24)) {
    const snapshot = await getAdsReadOnlySnapshot(candidate).catch(() => null)
    if (!snapshot?.ok) continue
    snapshots.push(snapshot)
    if (snapshot.currentPackage || snapshot.package || snapshot.packages?.length || snapshot.campaigns?.length) break
  }
  return snapshots
}
function currentPackageFrom(snapshots = [], packages = [], now = new Date()) {
  for (const snapshot of snapshots) {
    const row = snapshot.currentPackage || snapshot.package
    if (row && packageActive(row, now)) return row
  }
  return packages.find((row) => packageActive(row, now)) || packages[0] || null
}
function classify({ currentPackage = null, packages = [], campaigns = [], analytics = [], now = new Date(), analysis = {} } = {}) {
  const activePackages = packages.filter((row) => packageActive(row, now))
  if (activePackages.length > 1) return 'ads_multiple_packages'
  const pkg = currentPackage || activePackages[0] || packages[0] || null
  const campaign = campaigns[0] || null
  const probes = entityProbeIds(analysis)
  const campaignIds = campaign ? unique([idFor(campaign, 'campaign'), campaign.campaignId, campaign._id, campaign._kvId]) : []
  const packageIds = pkg ? unique([idFor(pkg, 'package'), pkg.packageId, pkg._id, pkg._kvId]) : []
  const explicitCampaign = Boolean(campaign && probes.some((probe) => (
    campaignIds.includes(probe) || campaignIds.includes(`ads:campaign:${probe}`)
  )))
  const explicitPackage = Boolean(pkg && probes.some((probe) => (
    packageIds.includes(probe) || packageIds.includes(`ads:package:${probe}`)
  )))
  if (!pkg && !campaign) return 'ads_package_missing'
  const pkgStatus = lower(pkg?.status || pkg?.state || pkg?.phase)
  const campaignStatus = lower(campaign?.status || campaign?.state || campaign?.phase)
  if (pkg && (/(expired|finished|done|closed|ended|cancel|deleted)/iu.test(pkgStatus) || adsDateExpired(pkg?.expiresAt || pkg?.untilISO, now))) return 'ads_package_expired'
  if (campaign && /(finished|done|closed|ended|stopped|deleted|paused)/iu.test(campaignStatus)) return 'ads_campaign_finished'
  const impressions = analytics.reduce((sum, row) => sum + num(row.impressions, 0), 0)
  const clicks = analytics.reduce((sum, row) => sum + num(row.clicks, 0), 0)
  if (analytics.length && (impressions > 0 || clicks > 0)) return 'ads_metrics_ok'
  if (analytics.length && metricsRequested(analysis)) return 'ads_zero_metrics'
  if (metricsRequested(analysis) && campaign) return 'ads_campaign_active'
  if (explicitCampaign) return 'ads_campaign_active'
  if (explicitPackage && pkg && packageActive(pkg, now)) return 'ads_package_active'
  if (pkg && packageActive(pkg, now)) return 'ads_package_active'
  if (campaign) return 'ads_campaign_active'
  return 'ads_package_active'
}

export async function readQl7SupportAdsDiagnostic({
  database: _database,
  userId = '',
  aliases = [],
  analysis = {},
  now = new Date(),
} = {}) {
  const snapshots = await readSameSourceSnapshots(userId, aliases)
  const packages = dedupeRows(snapshots.flatMap((snapshot) => snapshot.packages || (snapshot.package ? [snapshot.package] : [])), 'package').slice(0, 12)
  const campaigns = dedupeRows(snapshots.flatMap((snapshot) => snapshot.campaigns || []), 'campaign').slice(0, 16)
  const currentPackage = currentPackageFrom(snapshots, packages, now)
  const probes = entityProbeIds(analysis)
  const ownedCampaigns = probes.length
    ? campaigns.filter((row) => probes.includes(idFor(row, 'campaign')) || probes.includes(str(row.packageId || row.pkgId || row.package_id)))
    : campaigns
  const analytics = await readAnalytics(ownedCampaigns.length ? ownedCampaigns : campaigns, analysis)
  const branch = classify({ currentPackage, packages, campaigns, analytics, now, analysis })
  const impressions = analytics.reduce((sum, row) => sum + num(row.impressions, 0), 0)
  const clicks = analytics.reduce((sum, row) => sum + num(row.clicks, 0), 0)
  const ctr = impressions > 0 ? clicks / impressions : 0
  const campaignRows = campaigns.slice(0, 8).map((campaign) => {
    const campaignId = idFor(campaign, 'campaign')
    const metric = analytics.find((row) => row.campaignId === campaignId) || {}
    return {
      campaignId,
      campaignName: str(campaign.name || campaign.title || campaign.campaignName || campaignId),
      packageId: str(campaign.packageId || campaign.pkgId || campaign.package_id),
      status: str(campaign.status || campaign.state || ''),
      impressions: num(metric.impressions, 0),
      clicks: num(metric.clicks, 0),
      ctr: num(metric.ctr, 0),
      metricsUpdatedAt: str(metric.updatedAt),
    }
  })
  const packageRow = currentPackage || packages[0] || null
  return Object.freeze({
    branch,
    status: ['ads_package_active', 'ads_campaign_active', 'ads_metrics_ok', 'ads_zero_metrics'].includes(branch) ? 'healthy' : (branch === 'ads_package_missing' ? 'waiting_user' : 'inconsistent'),
    packages,
    campaigns,
    analytics,
    currentPackage: packageRow,
    businessCollectionsRead: QL7_SUPPORT_ADS_READ_COLLECTIONS,
    sourceAdapter: 'adsCore.getAdsReadOnlySnapshot',
    readOnly: true,
    evidence: Object.freeze({
      packageCount: packages.length,
      activePackageCount: packages.filter((row) => packageActive(row, now)).length,
      campaignCount: campaigns.length,
      analyticsCount: analytics.length,
      metricsCount: analytics.length,
      packageStatus: str(packageRow?.status || packageRow?.state || ''),
      packageName: str(packageRow?.packageName || packageRow?.name || packageRow?.title || packageRow?.pkgType || packageRow?.planId || ''),
      packageStartsAt: str(packageRow?.startsAt || packageRow?.createdAt || ''),
      packageExpiresAt: str(packageRow?.expiresAt || packageRow?.untilISO || ''),
      packageDaysLeft: num(packageRow?.daysLeft, packageRow?.expiresAt ? Math.max(0, Math.ceil((Date.parse(packageRow.expiresAt) - (now instanceof Date ? now.getTime() : Date.parse(String(now || '')))) / 86400000)) : 0),
      packageUsedCampaigns: num(packageRow?.usedCampaigns, 0),
      packageMaxCampaigns: num(packageRow?.maxCampaigns, 0),
      campaignStatus: str(campaigns[0]?.status || campaigns[0]?.state || ''),
      campaignName: str(campaigns[0]?.name || campaigns[0]?.campaignName || campaigns[0]?.title || ''),
      impressions,
      clicks,
      ctr,
      metricsUpdatedAt: analytics.map((row) => row.updatedAt).filter(Boolean).sort().slice(-1)[0] || '',
      campaignRows,
      adapterId: 'ql7_support_ads_read_adapter_canonical_same_source',
      sourceAdapter: 'adsCore.getAdsReadOnlySnapshot',
    }),
  })
}
