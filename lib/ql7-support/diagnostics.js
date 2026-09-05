import crypto from 'node:crypto'
import {
  QL7_SUPPORT_ECOSYSTEM_TOPICS,
  getQl7SupportDiagnosticBranches,
  getQl7SupportReadCollections,
  normalizeQl7SupportTopic,
} from './ecosystemCatalog.js'
import {
  QL7_SUPPORT_ADS_READ_COLLECTIONS,
  readQl7SupportAdsDiagnostic,
} from './adsSupportReadAdapter.js'

export const QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION = 'ql7_support_diagnostic_runs'

export const QL7_SUPPORT_QCOIN_DIAGNOSTIC_BRANCHES = Object.freeze([
  'qcoin_balance_ok',
  'qcoin_security_evidence',
  'invoice_missing',
  'pending',
  'paid_without_webhook',
  'webhook_without_ledger',
  'ledger_balance_ok',
  'credit_failed',
  'underpaid',
  'invalid',
  'multiple_invoices',
  'foreign_account',
  'mongo_unavailable',
  'timeout',
])

export const QL7_SUPPORT_ADS_DIAGNOSTIC_BRANCHES = Object.freeze([
  'ads_package_missing',
  'ads_package_active',
  'ads_package_expired',
  'ads_campaign_active',
  'ads_campaign_finished',
  'ads_metrics_ok',
  'ads_zero_metrics',
  'ads_multiple_packages',
  'foreign_account',
  'mongo_unavailable',
  'timeout',
])

export const QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS = QL7_SUPPORT_ECOSYSTEM_TOPICS

export const QL7_SUPPORT_GENERIC_DIAGNOSTIC_BRANCHES = Object.freeze([
  'no_source',
  'source_present',
  'healthy',
  'inconsistent',
  'foreign_account',
  'mongo_unavailable',
  'timeout',
])

const BUSINESS_QCOIN_COLLECTIONS = Object.freeze([
  'qcoin_topup_invoices',
  'qcoin_topup_events',
  'qcoin_topup_payment_dedupe',
  'qcoin_ledger',
  'qcoin_accounts',
])

const BUSINESS_ADS_COLLECTIONS = Object.freeze([
  ...QL7_SUPPORT_ADS_READ_COLLECTIONS,
])

function str(value) {
  return String(value ?? '').trim()
}

function lower(value) {
  return str(value).toLowerCase()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function hash16(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex').slice(0, 16)
}

function nowIso(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  return Number.isFinite(date.getTime()) ? date.toISOString() : new Date().toISOString()
}

function timeScore(doc = {}) {
  const value = doc?.updatedAt ?? doc?.creditedAt ?? doc?.paidAt ?? doc?.createdAt ?? doc?.ts ?? 0
  const n = Number(value)
  if (Number.isFinite(n) && n > 0) return n
  const parsed = Date.parse(String(value || ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function newestFirst(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && typeof item === 'object')
    .slice()
    .sort((a, b) => timeScore(b) - timeScore(a))
}

function uniqueValues(values = []) {
  return Array.from(new Set(values.map(str).filter(Boolean)))
}

function kvValue(row = {}) {
  if (!row || typeof row !== 'object') return null
  const value = row.value && typeof row.value === 'object' ? row.value : row
  return value && typeof value === 'object' ? { ...value, _kvId: row._id } : null
}

function isUserOwned(row = {}, ids = []) {
  const values = [
    row.userId,
    row.accountId,
    row.uid,
    row.ownerId,
    row.rawAccountId,
    row.walletAddress,
    row.wallet,
  ].map(str)
  return ids.some((id) => values.includes(id))
}

function entityProbeIds(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  return uniqueValues([
    entities.invoiceId,
    entities.orderId,
    entities.postId,
    entities.campaignId,
    entities.packageId,
    entities.accountId,
    entities.walletAddress,
    entities.transactionHash,
    entities.telegramId,
    entities.nickname,
    entities.bareId,
    entities.amount && String(entities.amount).length >= 4 ? entities.amount : '',
  ])
}

function genericUserClauses(ids = []) {
  if (!ids.length) return []
  return [
    { _id: { $in: ids } },
    { _id: { $in: ids.map((id) => `account:${id}`) } },
    { userId: { $in: ids } },
    { accountId: { $in: ids } },
    { uid: { $in: ids } },
    { ownerId: { $in: ids } },
    { ownerUserId: { $in: ids } },
    { rawAccountId: { $in: ids } },
    { walletAddress: { $in: ids } },
    { wallet: { $in: ids } },
  ]
}

function genericProbeClauses(probes = []) {
  if (!probes.length) return []
  return [
    { _id: { $in: probes } },
    { id: { $in: probes } },
    { caseId: { $in: probes } },
    { messageId: { $in: probes } },
    { threadId: { $in: probes } },
    { postId: { $in: probes } },
    { orderId: { $in: probes } },
    { invoiceId: { $in: probes } },
    { paymentId: { $in: probes } },
    { campaignId: { $in: probes } },
    { packageId: { $in: probes } },
    { telegramId: { $in: probes } },
    { nickname: { $in: probes } },
  ]
}

async function safeFindRows(database, collectionName, filter, options = {}) {
  try {
    return await findRows(database, collectionName, filter, options)
  } catch {
    return []
  }
}

function classifyGenericBranch({ rowsByCollection = {}, userIds = [] } = {}) {
  const rows = Object.values(rowsByCollection).flat()
  if (!rows.length) return 'no_source'
  if (userIds.length && rows.some((row) => !isUserOwned(row, userIds))) return 'foreign_account'
  if (rows.some((row) => /error|failed|blocked|rejected|expired|invalid|inconsistent/iu.test(lower(row.status || row.state || row.phase || row.reason)))) {
    return 'inconsistent'
  }
  return 'source_present'
}

function invoiceProbeIds(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  return uniqueValues([
    entities.invoiceId,
    entities.paymentId,
    entities.transactionId,
    entities.orderId,
    entities.amount && String(entities.amount).length >= 4 ? entities.amount : '',
  ])
}

function userAliases(userId = '', aliases = []) {
  return uniqueValues([
    userId,
    ...(Array.isArray(aliases) ? aliases : []),
  ])
}

function isUserInvoice(invoice = {}, ids = []) {
  const values = [
    invoice.accountId,
    invoice.userId,
    invoice.uid,
    invoice.rawAccountId,
  ].map(str)
  return ids.some((id) => values.includes(id))
}

async function findRows(database, collectionName, filter, { sort = { updatedAt: -1 }, limit = 50 } = {}) {
  const collection = database.collection(collectionName)
  const cursor = collection.find(filter || {})
  if (sort && typeof cursor.sort === 'function') cursor.sort(sort)
  if (limit && typeof cursor.limit === 'function') cursor.limit(limit)
  return cursor.toArray()
}

async function findInvoiceRows(database, { userId, aliases = [], analysis = {} } = {}) {
  const probes = invoiceProbeIds(analysis)
  const ids = userAliases(userId, aliases)
  const clauses = []
  if (probes.length) {
    clauses.push(
      { _id: { $in: probes } },
      { id: { $in: probes } },
      { internalId: { $in: probes } },
      { invoiceId: { $in: probes } },
      { externalId: { $in: probes } },
      { paymentId: { $in: probes } },
      { orderId: { $in: probes } },
    )
  }
  if (ids.length) {
    clauses.push(
      { accountId: { $in: ids } },
      { userId: { $in: ids } },
      { uid: { $in: ids } },
      { rawAccountId: { $in: ids } },
    )
  }
  const rows = clauses.length
    ? await findRows(database, 'qcoin_topup_invoices', { $or: clauses }, { limit: 25 })
    : []
  const sorted = newestFirst(rows)
  if (!probes.length) return sorted.filter((row) => isUserInvoice(row, ids)).slice(0, 10)
  return sorted
}

function invoiceIds(invoice = {}) {
  return uniqueValues([
    invoice._id,
    invoice.id,
    invoice.internalId,
    invoice.invoiceId,
    invoice.externalId,
    invoice.paymentId,
    invoice.orderId,
  ])
}

async function findTopupEvents(database, invoice = {}) {
  const ids = invoiceIds(invoice)
  if (!ids.length) return []
  return newestFirst(await findRows(database, 'qcoin_topup_events', {
    $or: [
      { invoiceId: { $in: ids } },
      { internalId: { $in: ids } },
      { externalId: { $in: ids } },
      { paymentId: { $in: ids } },
      { orderId: { $in: ids } },
    ],
  }, { limit: 25 }))
}

async function findLedgerRows(database, invoice = {}, events = []) {
  const ids = uniqueValues([
    ...invoiceIds(invoice),
    ...events.flatMap((event) => invoiceIds(event)),
  ])
  const eventIds = uniqueValues(events.map((event) => event?._id || event?.id || event?.txId || event?.sourceEventId))
  const clauses = []
  if (ids.length) {
    clauses.push(
      { invoiceId: { $in: ids } },
      { sourceInvoiceId: { $in: ids } },
      { 'meta.invoiceId': { $in: ids } },
      { 'meta.externalId': { $in: ids } },
      { 'meta.paymentId': { $in: ids } },
      { idempotencyKey: { $in: ids.map((id) => `qcoin:topup:paid:${id}`) } },
    )
  }
  if (eventIds.length) {
    clauses.push(
      { txId: { $in: eventIds } },
      { sourceEventId: { $in: eventIds } },
      { 'meta.sourceEventId': { $in: eventIds } },
    )
  }
  if (!clauses.length) return []
  return newestFirst(await findRows(database, 'qcoin_ledger', { $or: clauses }, { limit: 50 }))
}

async function findAccount(database, invoice = {}, userId = '', aliases = []) {
  const ids = uniqueValues([
    invoice.accountId,
    invoice.userId,
    invoice.uid,
    invoice.rawAccountId,
    userId,
    ...(Array.isArray(aliases) ? aliases : []),
  ])
  if (!ids.length) return null
  const rows = await findRows(database, 'qcoin_accounts', {
    $or: [
      { _id: { $in: ids.map((id) => `account:${id}`) } },
      { uid: { $in: ids } },
      { userId: { $in: ids } },
      { accountId: { $in: ids } },
    ],
  }, { limit: 25 })
  return newestFirst(rows)[0] || null
}

function isWalletAddress(value = '') {
  return /^0x[a-f0-9]{40}$/iu.test(str(value))
}

function escapeRegExp(value = '') {
  return str(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function walletCaseRegex(value = '', prefix = '') {
  const raw = str(value)
  if (!isWalletAddress(raw)) return null
  return new RegExp(`^${escapeRegExp(prefix)}${escapeRegExp(raw)}$`, 'i')
}

function accountIdFromDoc(doc = {}) {
  const raw = str(doc.accountId || doc.userId || doc.uid || '').replace(/^wallet:/iu, '')
  if (raw) return raw
  const id = str(doc._id)
  return id.startsWith('account:') ? id.slice('account:'.length) : id
}

async function findQcoinAccountProjection(database, ids = []) {
  const cleanIds = uniqueValues(ids)
  const walletClauses = cleanIds.filter(isWalletAddress).flatMap((id) => {
    const exact = walletCaseRegex(id)
    const account = walletCaseRegex(id, 'account:')
    return [
      account ? { _id: account } : null,
      exact ? { uid: exact } : null,
      exact ? { userId: exact } : null,
      exact ? { accountId: exact } : null,
      exact ? { walletAddress: exact } : null,
      exact ? { wallet: exact } : null,
    ].filter(Boolean)
  })
  const rows = await findRows(database, 'qcoin_accounts', {
    $or: [
      { _id: { $in: cleanIds.map((id) => `account:${id}`) } },
      { uid: { $in: cleanIds } },
      { userId: { $in: cleanIds } },
      { accountId: { $in: cleanIds } },
      { walletAddress: { $in: cleanIds } },
      { wallet: { $in: cleanIds } },
      ...walletClauses,
    ],
  }, { limit: 200 }).catch(() => [])
  const docs = newestFirst(rows)
  const preferred = cleanIds[0] || ''
  const canonicalDoc = docs.find((doc) => {
    const id = str(preferred)
    return id && (str(doc._id) === `account:${id}` || str(doc.uid) === id || str(doc.userId) === id || str(doc.accountId) === id)
  }) || null
  const newest = canonicalDoc || docs[0] || null
  const legacyDocs = docs.filter((doc) => doc !== canonicalDoc)
  const canonicalBalance = canonicalDoc ? num(canonicalDoc.balance, 0) : 0
  const legacyBalance = legacyDocs.reduce((max, doc) => Math.max(max, num(doc?.balance, 0)), 0)
  const balance = canonicalDoc
    ? (canonicalBalance >= legacyBalance ? canonicalBalance : canonicalBalance + legacyBalance)
    : Math.max(legacyBalance, num(newest?.balance, 0))
  const accountId = accountIdFromDoc(canonicalDoc || newest || { userId: preferred })
  return {
    account: newest ? {
      ...newest,
      accountId,
      balance,
      canonicalBalance,
      legacyBalance,
      aliasDocCount: docs.length,
    } : null,
    balance,
    accountId,
    accountFound: Boolean(newest),
    aliasDocCount: docs.length,
    lastActiveAt: newest?.lastActiveAt || newest?.updatedAt || newest?.updatedTs || newest?.createdAt || '',
    seconds: num(newest?.seconds, 0),
    paused: newest?.paused === true,
  }
}

function isQcoinSelfStatus(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  const role = str(analysis?.role || analysis?.messageAct)
  const subIntent = str(analysis?.subIntent)
  const operation = str(analysis?.operation)
  return entities.selfReference === true ||
    role === 'personal_status_request' ||
    operation === 'check_status' ||
    /(?:^|_)(?:self|personal)_status$/u.test(subIntent)
}

function hasExplicitQcoinTransactionReference(analysis = {}) {
  return invoiceProbeIds(analysis).length > 0
}

function isQcoinSecurityCheck(analysis = {}) {
  const source = lower([analysis?.microIntent, analysis?.subIntent, analysis?.operation, analysis?.sanitizedText, analysis?.text, analysis?.canonicalText].filter(Boolean).join(' '))
  return /(?:qcoin[._-]security|stolen|unauthorized|theft|украл|пропал|списал|盗|גנב)/iu.test(source)
}

async function findRecentQcoinLedgerEvidence(database, ids = [], now = new Date()) {
  const cleanIds = uniqueValues(ids)
  const clauses = genericUserClauses(cleanIds)
  const rows = clauses.length ? await findRows(database, 'qcoin_ledger', { $or: clauses }, { sort: { createdAt: -1 }, limit: 100 }).catch(() => []) : []
  const recent = newestFirst(rows).slice(0, 50)
  const outgoing = recent.filter((row) => {
    const amount = num(row.amount ?? row.delta ?? row.qcoinAmount, 0)
    const type = lower(row.type || row.direction || row.kind || row.action)
    return amount < 0 || /(?:debit|withdraw|spend|transfer_out|outgoing|burn|списан|расход)/iu.test(type)
  })
  const pending = recent.filter((row) => /(?:pending|waiting|confirming|new)/iu.test(lower(row.status || row.state || row.phase)))
  const timestamps = recent.map(timeScore).filter((value) => value > 0)
  return {
    rows: recent,
    operationCount: recent.length,
    outgoingCount: outgoing.length,
    pendingCount: pending.length,
    windowStart: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : '',
    windowEnd: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : nowIso(now),
    latestOperationAt: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : '',
  }
}

function classifyQcoinBranch({
  invoiceRows = [],
  invoice = null,
  events = [],
  ledgerRows = [],
  account = null,
  userIds = [],
} = {}) {
  if (!invoiceRows.length) return 'invoice_missing'
  if (invoiceRows.length > 1) return 'multiple_invoices'
  if (invoice && userIds.length && !isUserInvoice(invoice, userIds)) return 'foreign_account'

  const status = lower(invoice?.status || invoice?.lastStatus || invoice?.paymentStatus || invoice?.payment_status)
  if (status.includes('credit_failed') || invoice?.creditError) return 'credit_failed'
  if (status.includes('underpaid') || num(invoice?.underpayFiat, 0) > 0) return 'underpaid'
  if (/(invalid|failed|fail|expired|cancel|rejected|refunded)/iu.test(status)) return 'invalid'
  if (!status || /(pending|waiting|new|created|confirming)/iu.test(status)) return 'pending'

  const paid = /(paid|finished|confirmed|completed|done|sending)/iu.test(status) || invoice?.activated === true
  if (paid && !events.length) return 'paid_without_webhook'
  if (paid && events.length && !ledgerRows.length) return 'webhook_without_ledger'

  const expected = num(invoice?.qcoinAmount || invoice?.amount || events?.[0]?.qcoinAmount, 0)
  const accountBalance = num(account?.balance, 0)
  if (paid && ledgerRows.length && (!expected || accountBalance >= expected || account?.balance !== undefined)) {
    return 'ledger_balance_ok'
  }
  return 'webhook_without_ledger'
}

async function recordDiagnosticRun(database, run = {}) {
  const at = nowIso(run.now)
  const id = `ql7-support-diagnostic:${run.topic || 'general'}:${hash16([
    run.userId,
    run.caseId,
    run.branch,
    at,
    run.subjectId,
  ].join('|'))}`
  const doc = {
    _id: id,
    runId: id,
    topic: run.topic || 'general',
    branch: run.branch || 'unknown',
    userId: str(run.userId),
    caseId: str(run.caseId),
    subjectId: str(run.subjectId),
    status: run.status || 'completed',
    readOnly: true,
    businessCollectionsRead: Array.isArray(run.businessCollectionsRead)
      ? run.businessCollectionsRead
      : BUSINESS_QCOIN_COLLECTIONS,
    businessCollectionsWritten: [],
    supportCollectionsWritten: [QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION],
    storagePrimary: 'mongo',
    evidence: run.evidence || {},
    createdAt: at,
    updatedAt: at,
  }
  await database.collection(QL7_SUPPORT_DIAGNOSTIC_RUN_COLLECTION).insertOne(doc)
  return doc
}

export async function runQl7SupportQcoinDiagnostic({
  database,
  userId,
  aliases = [],
  caseId = '',
  analysis = {},
  now = new Date(),
  timeoutMs = 2500,
} = {}) {
  const uid = str(userId)
  const ids = userAliases(uid, aliases)
  if (!database || typeof database.collection !== 'function') {
    return {
      ok: false,
      topic: 'qcoin',
      branch: 'mongo_unavailable',
      status: 'failed',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsWritten: [],
      error: 'mongo_db_unavailable',
    }
  }
  if (Number(timeoutMs) <= 0) {
    const doc = await recordDiagnosticRun(database, {
      topic: 'qcoin',
      branch: 'timeout',
      status: 'timeout',
      userId: uid,
      caseId,
      subjectId: invoiceProbeIds(analysis)[0] || '',
      now,
      evidence: { timeoutMs: Number(timeoutMs) || 0 },
    })
    return { ok: false, ...doc }
  }

  try {
    if (isQcoinSecurityCheck(analysis)) {
      const accountProjection = await findQcoinAccountProjection(database, ids)
      const ledgerEvidence = await findRecentQcoinLedgerEvidence(database, ids, now)
      const requestedAmount = num(analysis?.entities?.amount, 0)
      const hasTimeScope = Boolean(analysis?.entities?.from || analysis?.entities?.to || analysis?.from || analysis?.to)
      const doc = await recordDiagnosticRun(database, {
        topic: 'qcoin',
        branch: 'qcoin_security_evidence',
        status: 'partial',
        userId: uid,
        caseId,
        subjectId: accountProjection.accountId || uid,
        now,
        businessCollectionsRead: BUSINESS_QCOIN_COLLECTIONS,
        evidence: {
          accountFound: accountProjection.accountFound,
          balance: accountProjection.balance,
          ledgerOperationCount: ledgerEvidence.operationCount,
          outgoingOperationCount: ledgerEvidence.outgoingCount,
          pendingOperationCount: ledgerEvidence.pendingCount,
          windowStart: ledgerEvidence.windowStart,
          windowEnd: ledgerEvidence.windowEnd,
          latestOperationAt: ledgerEvidence.latestOperationAt,
          amountProvided: requestedAmount > 0,
          timeScopeProvided: hasTimeScope,
          checkedAt: nowIso(now),
          conclusionCode: ledgerEvidence.outgoingCount === 0 ? 'no_outgoing_found_in_window' : 'outgoing_requires_user_confirmation',
        },
      })
      return { ok: true, ...doc }
    }
    if (isQcoinSelfStatus(analysis) && !hasExplicitQcoinTransactionReference(analysis)) {
      const accountProjection = await findQcoinAccountProjection(database, ids)
      const doc = await recordDiagnosticRun(database, {
        topic: 'qcoin',
        branch: 'qcoin_balance_ok',
        status: 'healthy',
        userId: uid,
        caseId,
        subjectId: accountProjection.accountId || uid,
        now,
        businessCollectionsRead: BUSINESS_QCOIN_COLLECTIONS,
        evidence: {
          accountFound: accountProjection.accountFound,
          accountId: accountProjection.accountId || uid,
          accountBalance: accountProjection.balance,
          balance: accountProjection.balance,
          aliasDocCount: accountProjection.aliasDocCount,
          seconds: accountProjection.seconds,
          paused: accountProjection.paused,
          lastActiveAt: accountProjection.lastActiveAt,
          checkedAt: nowIso(now),
        },
      })
      return { ok: true, ...doc }
    }
    const invoiceRows = await findInvoiceRows(database, { userId: uid, aliases, analysis })
    const invoice = newestFirst(invoiceRows)[0] || null
    const events = invoice ? await findTopupEvents(database, invoice) : []
    const ledgerRows = invoice ? await findLedgerRows(database, invoice, events) : []
    const account = invoice ? await findAccount(database, invoice, uid, aliases) : null
    const branch = classifyQcoinBranch({
      invoiceRows,
      invoice,
      events,
      ledgerRows,
      account,
      userIds: ids,
    })
    const status = branch === 'ledger_balance_ok' ? 'healthy' : (
      ['pending', 'invoice_missing'].includes(branch) ? 'waiting_user' : 'inconsistent'
    )
    const doc = await recordDiagnosticRun(database, {
      topic: 'qcoin',
      branch,
      status,
      userId: uid,
      caseId,
      subjectId: invoiceProbeIds(analysis)[0] || str(invoice?.internalId || invoice?._id || ''),
      now,
      evidence: {
        invoiceCount: invoiceRows.length,
        eventCount: events.length,
        ledgerCount: ledgerRows.length,
        accountFound: !!account,
        invoiceStatus: str(invoice?.status || invoice?.lastStatus),
        invoiceAccountId: str(invoice?.accountId || invoice?.userId || invoice?.uid),
        expectedQcoin: num(invoice?.qcoinAmount || invoice?.amount || 0, 0),
        accountBalance: account?.balance,
      },
    })
    return { ok: true, ...doc }
  } catch (error) {
    const doc = await recordDiagnosticRun(database, {
      topic: 'qcoin',
      branch: 'mongo_unavailable',
      status: 'failed',
      userId: uid,
      caseId,
      subjectId: invoiceProbeIds(analysis)[0] || '',
      now,
      evidence: { error: String(error?.message || error) },
    }).catch(() => null)
    return {
      ok: false,
      ...(doc || {}),
      topic: 'qcoin',
      branch: 'mongo_unavailable',
      status: 'failed',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsWritten: [],
      error: String(error?.message || error),
    }
  }
}

function adsProbeIds(analysis = {}) {
  const entities = analysis?.entities && typeof analysis.entities === 'object' ? analysis.entities : {}
  return uniqueValues([
    entities.campaignId,
    entities.packageId,
    entities.bareId,
    entities.accountId,
    entities.walletAddress,
    entities.nickname,
  ])
}

async function listAdsKv(database, prefix, limit = 80) {
  const rows = await findRows(database, 'ads_kv', { _id: new RegExp(`^ads:${prefix}:`) }, { sort: { _id: 1 }, limit })
  return rows.map(kvValue).filter(Boolean)
}

async function findAdsPackages(database, { userId, aliases = [], analysis = {} } = {}) {
  const ids = userAliases(userId, aliases)
  const probes = adsProbeIds(analysis)
  const packages = await listAdsKv(database, 'package')
  return newestFirst(packages.filter((pkg) => {
    const packageIds = uniqueValues([pkg.id, pkg.packageId, pkg._id, pkg._kvId])
    const matchesProbe = probes.length
      ? probes.some((probe) => packageIds.includes(probe) || packageIds.includes(`ads:package:${probe}`))
      : false
    return matchesProbe || isUserOwned(pkg, ids)
  }))
}

async function findAdsCampaigns(database, { userId, aliases = [], analysis = {}, packages = [] } = {}) {
  const ids = userAliases(userId, aliases)
  const probes = adsProbeIds(analysis)
  const packageIds = uniqueValues(packages.flatMap((pkg) => [pkg.id, pkg.packageId]))
  const setDocs = []
  for (const packageId of packageIds) {
    const doc = await database.collection('ads_sets').findOne({ _id: `ads:campaigns:pkg:${packageId}` }).catch(() => null)
    if (doc) setDocs.push(doc)
  }
  const memberCampaignIds = uniqueValues(setDocs.flatMap((doc) => Array.isArray(doc.members) ? doc.members : []))
  const campaigns = await listAdsKv(database, 'campaign')
  return newestFirst(campaigns.filter((campaign) => {
    const campaignIds = uniqueValues([campaign.id, campaign.campaignId, campaign._id, campaign._kvId])
    const matchesProbe = probes.length
      ? probes.some((probe) => campaignIds.includes(probe) || campaignIds.includes(`ads:campaign:${probe}`))
      : false
    const packageMatch = packageIds.some((id) => uniqueValues([campaign.packageId, campaign.pkgId, campaign.package_id]).includes(id))
      || memberCampaignIds.some((id) => campaignIds.includes(id))
    return matchesProbe || packageMatch || isUserOwned(campaign, ids)
  }))
}

function adsDateExpired(value, now = new Date()) {
  const text = str(value)
  if (!text) return false
  const ts = Date.parse(text)
  const nowTs = now instanceof Date ? now.getTime() : Date.parse(String(now || ''))
  return Number.isFinite(ts) && Number.isFinite(nowTs) && ts < nowTs
}

function classifyAdsBranch({ packages = [], campaigns = [], metrics = [], userIds = [], now = new Date() } = {}) {
  if (packages.length > 1) return 'ads_multiple_packages'
  const pkg = packages[0] || null
  const campaign = campaigns[0] || null
  if (pkg && userIds.length && !isUserOwned(pkg, userIds)) return 'foreign_account'
  if (campaign && userIds.length && !isUserOwned(campaign, userIds)) return 'foreign_account'
  if (!pkg && !campaign) return 'ads_package_missing'
  const pkgStatus = lower(pkg?.status || pkg?.state || pkg?.phase)
  const campaignStatus = lower(campaign?.status || campaign?.state || campaign?.phase)
  if (pkg && (/(expired|finished|done|closed|ended|cancel)/iu.test(pkgStatus) || adsDateExpired(pkg?.expiresAt || pkg?.untilISO, now))) {
    return 'ads_package_expired'
  }
  if (campaign && /(finished|done|closed|ended|stopped|deleted|paused)/iu.test(campaignStatus)) {
    return 'ads_campaign_finished'
  }
  const impressions = metrics.reduce((sum, row) => sum + num(row.impressions || row.impressionsTotal || row.views || row.viewsTotal, 0), 0)
  const clicks = metrics.reduce((sum, row) => sum + num(row.clicks || row.clicksTotal, 0), 0)
  if (metrics.length && (impressions > 0 || clicks > 0)) return 'ads_metrics_ok'
  if (metrics.length) return 'ads_zero_metrics'
  if (campaign) return 'ads_campaign_active'
  return 'ads_package_active'
}

export async function runQl7SupportAdsDiagnostic({
  database,
  userId,
  aliases = [],
  caseId = '',
  analysis = {},
  now = new Date(),
  timeoutMs = 2500,
} = {}) {
  const uid = str(userId)
  const ids = userAliases(uid, aliases)
  if (!database || typeof database.collection !== 'function') {
    return {
      ok: false,
      topic: 'ads',
      branch: 'mongo_unavailable',
      status: 'failed',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsRead: BUSINESS_ADS_COLLECTIONS,
      businessCollectionsWritten: [],
      error: 'mongo_db_unavailable',
    }
  }
  if (Number(timeoutMs) <= 0) {
    const doc = await recordDiagnosticRun(database, {
      topic: 'ads',
      branch: 'timeout',
      status: 'timeout',
      userId: uid,
      caseId,
      subjectId: adsProbeIds(analysis)[0] || '',
      now,
      businessCollectionsRead: BUSINESS_ADS_COLLECTIONS,
      evidence: { timeoutMs: Number(timeoutMs) || 0 },
    })
    return { ok: false, ...doc }
  }

  try {
    const canonical = await readQl7SupportAdsDiagnostic({
      database,
      userId: uid,
      aliases,
      analysis,
      now,
    })
    const doc = await recordDiagnosticRun(database, {
      topic: 'ads',
      branch: canonical.branch,
      status: canonical.status,
      userId: uid,
      caseId,
      subjectId: adsProbeIds(analysis)[0] || str(canonical.campaigns?.[0]?.campaignId || canonical.campaigns?.[0]?.id || canonical.packages?.[0]?.id || canonical.packages?.[0]?.packageId),
      now,
      businessCollectionsRead: BUSINESS_ADS_COLLECTIONS,
      evidence: canonical.evidence,
    })
    return { ok: true, ...doc }
  } catch (error) {
    const doc = await recordDiagnosticRun(database, {
      topic: 'ads',
      branch: 'mongo_unavailable',
      status: 'failed',
      userId: uid,
      caseId,
      subjectId: adsProbeIds(analysis)[0] || '',
      now,
      businessCollectionsRead: BUSINESS_ADS_COLLECTIONS,
      evidence: { error: String(error?.message || error) },
    }).catch(() => null)
    return {
      ok: false,
      ...(doc || {}),
      topic: 'ads',
      branch: 'mongo_unavailable',
      status: 'failed',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsRead: BUSINESS_ADS_COLLECTIONS,
      businessCollectionsWritten: [],
      error: String(error?.message || error),
    }
  }
}

export function isQl7SupportDiagnosticTopic(topic = '') {
  const clean = normalizeQl7SupportTopic(topic)
  return clean === 'qcoin' || clean === 'ads' || QL7_SUPPORT_ECOSYSTEM_DIAGNOSTIC_TOPICS.includes(clean)
}

export async function runQl7SupportGenericDomainDiagnostic({
  database,
  userId,
  aliases = [],
  caseId = '',
  analysis = {},
  topic = '',
  now = new Date(),
  timeoutMs = 2500,
} = {}) {
  const cleanTopic = normalizeQl7SupportTopic(topic || analysis?.topic || 'support_system')
  const uid = str(userId)
  const ids = userAliases(uid, aliases)
  const probes = entityProbeIds(analysis)
  const collections = getQl7SupportReadCollections(cleanTopic)
  if (!database || typeof database.collection !== 'function') {
    return {
      ok: false,
      topic: cleanTopic,
      branch: 'mongo_unavailable',
      status: 'failed',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsRead: collections,
      businessCollectionsWritten: [],
      error: 'mongo_db_unavailable',
    }
  }
  if (Number(timeoutMs) <= 0) {
    const doc = await recordDiagnosticRun(database, {
      topic: cleanTopic,
      branch: 'timeout',
      status: 'timeout',
      userId: uid,
      caseId,
      subjectId: probes[0] || '',
      now,
      businessCollectionsRead: collections,
      evidence: { timeoutMs: Number(timeoutMs) || 0 },
    })
    return { ok: false, ...doc }
  }

  try {
    const clauses = [
      ...genericProbeClauses(probes),
      ...genericUserClauses(ids),
    ]
    const filter = clauses.length ? { $or: clauses } : {}
    const rowsByCollection = {}
    for (const collectionName of collections) {
      rowsByCollection[collectionName] = await safeFindRows(database, collectionName, filter, {
        sort: { updatedAt: -1 },
        limit: 12,
      })
    }
    const branch = classifyGenericBranch({ rowsByCollection, userIds: ids })
    const status = branch === 'source_present' || branch === 'healthy'
      ? 'healthy'
      : (branch === 'no_source' ? 'waiting_user' : 'inconsistent')
    const doc = await recordDiagnosticRun(database, {
      topic: cleanTopic,
      branch,
      status,
      userId: uid,
      caseId,
      subjectId: probes[0] || uid,
      now,
      businessCollectionsRead: collections,
      evidence: {
        topic: cleanTopic,
        probeCount: probes.length,
        collectionHits: Object.fromEntries(
          Object.entries(rowsByCollection).map(([key, rows]) => [key, Array.isArray(rows) ? rows.length : 0]),
        ),
        rowsFound: Object.values(rowsByCollection).reduce((sum, rows) => sum + (Array.isArray(rows) ? rows.length : 0), 0),
        userSafe: true,
      },
    })
    return { ok: true, ...doc }
  } catch (error) {
    const doc = await recordDiagnosticRun(database, {
      topic: cleanTopic,
      branch: 'mongo_unavailable',
      status: 'failed',
      userId: uid,
      caseId,
      subjectId: probes[0] || '',
      now,
      businessCollectionsRead: collections,
      evidence: { error: String(error?.message || error) },
    }).catch(() => null)
    return {
      ok: false,
      ...(doc || {}),
      topic: cleanTopic,
      branch: 'mongo_unavailable',
      status: 'failed',
      readOnly: true,
      storagePrimary: 'mongo',
      businessCollectionsRead: collections,
      businessCollectionsWritten: [],
      error: String(error?.message || error),
    }
  }
}

export async function runQl7SupportReadOnlyDiagnostic(input = {}) {
  const topic = normalizeQl7SupportTopic(input?.analysis?.topic || input?.topic)
  if (topic === 'ads' || topic === 'ads_packages' || topic === 'ads_campaigns') return runQl7SupportAdsDiagnostic(input)
  if (topic !== 'qcoin') return runQl7SupportGenericDomainDiagnostic({ ...input, topic })
  return runQl7SupportQcoinDiagnostic(input)
}
