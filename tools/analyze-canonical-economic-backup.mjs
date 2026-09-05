import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

function arg(name, fallback = '') {
  const prefix = `--${name}=`
  const value = process.argv.slice(2).find((entry) => entry.startsWith(prefix))
  return value ? value.slice(prefix.length) : fallback
}

function unwrap(value) {
  if (Array.isArray(value)) return value.map(unwrap)
  if (!value || typeof value !== 'object') return value
  for (const key of ['$numberInt', '$numberLong', '$numberDouble', '$numberDecimal']) {
    if (Object.prototype.hasOwnProperty.call(value, key)) return Number(value[key])
  }
  if (Object.prototype.hasOwnProperty.call(value, '$date')) return unwrap(value.$date)
  if (Object.prototype.hasOwnProperty.call(value, '$oid')) return String(value.$oid)
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, unwrap(item)]))
}

function text(value) {
  return String(value ?? '').trim()
}

function wallet(value) {
  const raw = text(value).replace(/^wallet:/iu, '')
  return /^0x[0-9a-f]{40}$/iu.test(raw) ? raw.toLowerCase() : ''
}

function telegram(value) {
  const raw = text(value).toLowerCase().replace(/^(?:telegram:id:|telegramid:|telegram:|tguid:|tg:uid:|tg:|tma:)/u, '')
  return /^\d{5,20}$/u.test(raw) ? raw : ''
}

function principal(value) {
  return wallet(value) || text(value).toLowerCase()
}

function aliasTarget(row = {}) {
  return text(row.canonicalAccountId || row.accountId || row.userId)
}

function shortHash(value) {
  return crypto.createHash('sha256').update(text(value)).digest('hex').slice(0, 16)
}

const input = path.resolve(arg('input'))
const output = path.resolve(arg('output', '.codex_tmp/canonical-economic-backup-proof.latest.json'))
const focusRaw = text(arg('focus'))
const focus = wallet(focusRaw) || principal(focusRaw)

if (!input || !fs.existsSync(input)) throw new Error(`backup_input_missing:${input}`)
if (!focus) throw new Error('focus_principal_required')

const backupBytes = fs.readFileSync(input)
const backupSha256 = crypto.createHash('sha256').update(backupBytes).digest('hex')
const backup = unwrap(JSON.parse(backupBytes.toString('utf8')))
const collections = new Map((backup.collections || []).map((entry) => [entry.name, entry.documents || []]))
const rows = (name) => collections.get(name) || []

const aliases = rows('account_aliases')
const profiles = rows('profiles')
const staleAliasRows = aliases.filter((row) => {
  const target = principal(aliasTarget(row))
  const legacyUser = principal(row.userId)
  return Boolean(target && legacyUser && target !== legacyUser)
})

const telegramOwners = new Map()
const addOwner = (telegramId, owner) => {
  const tg = telegram(telegramId)
  const id = wallet(owner) || principal(owner)
  if (!tg || !id) return
  if (!telegramOwners.has(tg)) telegramOwners.set(tg, new Set())
  telegramOwners.get(tg).add(id)
}

profiles.forEach((row) => {
  const owner = row.walletId || row.principalId || row.canonicalAccountId || row.accountId || row.userId
  for (const value of [row.telegramId, row.tgId, row.tg_id]) addOwner(value, owner)
})
aliases.forEach((row) => {
  const owner = aliasTarget(row)
  for (const value of [row.alias, row.aliasId, row.aliasValue]) addOwner(value, owner)
})

const ambiguousTelegram = Array.from(telegramOwners.entries())
  .filter(([, owners]) => Array.from(owners).filter(wallet).length > 1)
const focusAmbiguities = ambiguousTelegram.filter(([, owners]) => owners.has(focus))

const qcoinRows = rows('qcoin_accounts')
const focusQcoin = qcoinRows.filter((row) => [row._id, row.uid, row.userId, row.accountId]
  .some((value) => wallet(text(value).replace(/^account:/u, '')) === focus))

const focusTelegramIds = new Set(focusAmbiguities.map(([tg]) => tg))
const linkedOwners = new Set([focus])
for (const [tg, owners] of focusAmbiguities) {
  if (!focusTelegramIds.has(tg)) continue
  owners.forEach((owner) => linkedOwners.add(owner))
}
const linkedQcoin = qcoinRows.filter((row) => [row._id, row.uid, row.userId, row.accountId]
  .some((value) => linkedOwners.has(wallet(text(value).replace(/^account:/u, '')) || principal(value))))

const events = rows('metamarket_events')
const eventIds = new Set(events.flatMap((row) => [row._id, row.txId]).map(text).filter(Boolean))
const focusTokens = rows('metamarket_tokens').filter((row) => wallet(row.ownerId) === focus)
const orphanFocusTokens = focusTokens.filter((row) => text(row.lastTxId) && !eventIds.has(text(row.lastTxId)))
const focusEconomicRows = [...rows('economic_idempotency'), ...rows('economic_idempotency_v51')]
  .filter((row) => {
    const actor = wallet(row.actorAccountId || row.userId || row.accountId)
    const route = text(row.routeId || row.operation?.routeId || row.envelope?.routeId)
    return actor === focus && route.startsWith('metamarket.')
  })

const report = {
  ok: true,
  kind: 'ql7-canonical-economic-backup-read-only-proof-v1',
  generatedAt: new Date().toISOString(),
  source: {
    input: path.basename(input),
    sha256: backupSha256,
    format: backup.format || '',
    generatedAt: backup.generatedAt || '',
    collections: collections.size,
    documents: Array.from(collections.values()).reduce((sum, list) => sum + list.length, 0),
  },
  focus: {
    principal: focusRaw,
    normalized: focus,
  },
  identity: {
    accountAliasRows: aliases.length,
    staleAuthoritativeTargetVsUserIdRows: staleAliasRows.length,
    ambiguousTelegramPrincipals: ambiguousTelegram.length,
    focusAmbiguousTelegramPrincipals: focusAmbiguities.map(([tg, owners]) => ({
      telegramHash: shortHash(tg),
      ownerCount: owners.size,
      ownerHashes: Array.from(owners).map(shortHash).sort(),
    })),
  },
  qcoin: {
    accountRows: qcoinRows.length,
    focusRows: focusQcoin.map((row) => ({
      rowHash: shortHash(row._id),
      balance: Number(row.balance || 0),
      seconds: Number(row.seconds || 0),
    })),
    ambiguityGroupRows: linkedQcoin.map((row) => ({
      principalHash: shortHash(row.accountId || row.userId || row.uid || row._id),
      balance: Number(row.balance || 0),
      seconds: Number(row.seconds || 0),
    })),
  },
  metamarket: {
    tokenRows: rows('metamarket_tokens').length,
    eventRows: events.length,
    focusTokenCount: focusTokens.length,
    orphanFocusTokensWithoutEvent: orphanFocusTokens.map((row) => ({
      tokenHash: shortHash(row.tokenId || row._id),
      itemId: text(row.itemId),
      lastTxHash: shortHash(row.lastTxId),
      status: text(row.status),
    })),
    focusEconomicOperations: focusEconomicRows.map((row) => ({
      rowHash: shortHash(row._id || row.operationId),
      routeId: text(row.routeId || row.operation?.routeId || row.envelope?.routeId),
      state: text(row.state || row.status),
    })),
  },
  verdict: {
    mongoCompactionReady: false,
    reasonCodes: [
      ...(focusAmbiguities.length ? ['focus_identity_ambiguous'] : []),
      ...(orphanFocusTokens.length ? ['focus_metamarket_orphan_asset'] : []),
      ...(staleAliasRows.length ? ['legacy_alias_target_conflicts_present'] : []),
    ],
    note: 'Read-only evidence only. No Mongo document was changed.',
  },
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({
  ok: report.ok,
  backupSha256,
  staleAliasRows: report.identity.staleAuthoritativeTargetVsUserIdRows,
  ambiguousTelegramPrincipals: report.identity.ambiguousTelegramPrincipals,
  focusAmbiguities: report.identity.focusAmbiguousTelegramPrincipals.length,
  focusQcoinRows: report.qcoin.focusRows.length,
  orphanFocusTokens: report.metamarket.orphanFocusTokensWithoutEvent.length,
  output,
}))
