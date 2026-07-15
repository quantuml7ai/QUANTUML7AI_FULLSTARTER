// Canonical Redis->Mongo identity contract.
//
// The Redis baseline did not treat every numeric-looking id as one global user.
// It resolved exact ids through a narrow order: TG runtime keys first for bare
// numeric Telegram ids, then profile aliases. Mongo callers use this module to
// keep that behavior while storing permanent data in Mongo.

const profilePrimary = require('../mongo/profile-primary.cjs')

const TG_RUNTIME_PREFIXES = ['tguid:', 'tg:']
const TG_ALIAS_PREFIXES = ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']

function str(value) {
  return String(value ?? '').trim()
}

function isWalletLike(value) {
  const s = str(value)
  return /^0x[a-f0-9]{40}$/i.test(s) || /^wallet:/i.test(s)
}

function stripRuntimePrefix(raw) {
  const s = str(raw)
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const prefix of TG_RUNTIME_PREFIXES) {
    if (lower.startsWith(prefix)) return s.slice(prefix.length).trim()
  }
  return s
}

function stripAnyTelegramPrefix(raw) {
  const s = str(raw)
  if (!s) return ''
  const lower = s.toLowerCase()
  for (const prefix of TG_ALIAS_PREFIXES) {
    if (lower.startsWith(prefix)) return s.slice(prefix.length).trim()
  }
  return s
}

function telegramAliasSet(raw) {
  const exact = stripAnyTelegramPrefix(raw)
  if (!/^\d+$/.test(exact)) return []
  return [
    exact,
    `telegram:${exact}`,
    `telegramid:${exact}`,
    `telegram:id:${exact}`,
    `tguid:${exact}`,
    `tg:${exact}`,
    `tg:uid:${exact}`,
  ]
}

function unique(values = []) {
  return Array.from(new Set(values.map(str).filter(Boolean)))
}

function buildLookupOrder(raw) {
  const rawInputId = str(raw)
  const exactEtalonUid = stripRuntimePrefix(rawInputId)
  const order = []
  if (rawInputId) order.push(rawInputId)
  if (exactEtalonUid && exactEtalonUid !== rawInputId) order.push(exactEtalonUid)
  if (/^\d+$/.test(exactEtalonUid)) {
    order.push(`tguid:${exactEtalonUid}`)
    order.push(`tg:${exactEtalonUid}`)
    order.push(`telegram:id:${exactEtalonUid}`)
    order.push(`telegram:${exactEtalonUid}`)
    order.push(`telegramid:${exactEtalonUid}`)
    order.push(`tg:uid:${exactEtalonUid}`)
  }
  return unique(order)
}

async function listVerifiedAliases(canonicalAccountId, seed = []) {
  const canonical = str(canonicalAccountId)
  const aliases = []
  if (canonical) aliases.push(canonical)
  for (const value of seed) aliases.push(value)
  if (!canonical || typeof profilePrimary.listAliasesForAccount !== 'function') return unique(aliases)
  const rows = await profilePrimary.listAliasesForAccount(canonical).catch(() => [])
  for (const row of rows || []) {
    if (typeof row === 'string') {
      aliases.push(row)
      continue
    }
    for (const value of [row?.alias, row?.aliasId, row?.aliasValue, row?.accountId, row?.canonicalAccountId, row?.userId, row?.uid]) {
      aliases.push(value)
    }
  }
  return unique(aliases)
}

function chooseDomainId({ mode = '', rawInputId = '', exactEtalonUid = '', canonicalAccountId = '' } = {}) {
  const canonical = str(canonicalAccountId)
  const exact = str(exactEtalonUid || rawInputId)
  if (mode === 'referral-owner' || mode === 'referral-visitor') return exact || canonical
  if (mode === 'qcoin-account' && !canonical) return exact
  if (mode === 'profile-read') return exact || canonical
  return canonical || exact
}

async function resolve(raw, options = {}) {
  const mode = str(options.mode || 'generic')
  const source = str(options.source || '')
  const rawInputId = str(raw)
  const exactEtalonUid = stripRuntimePrefix(rawInputId)
  const lookupOrder = buildLookupOrder(rawInputId)
  const conflictWarnings = []
  let canonicalAccountId = ''

  for (const candidate of lookupOrder) {
    const mapped = await profilePrimary.resolveCanonicalAccountId(candidate).catch(() => '')
    if (!mapped) continue
    if (!canonicalAccountId) {
      canonicalAccountId = str(mapped)
      continue
    }
    if (str(mapped) !== canonicalAccountId) {
      conflictWarnings.push({
        type: 'alias_maps_to_multiple_accounts',
        candidate,
        first: canonicalAccountId,
        next: str(mapped),
      })
    }
  }

  if (!canonicalAccountId && isWalletLike(exactEtalonUid)) canonicalAccountId = exactEtalonUid
  const verifiedAliases = await listVerifiedAliases(canonicalAccountId, lookupOrder)
  const aliasSet = unique([
    ...lookupOrder,
    ...telegramAliasSet(rawInputId),
    ...verifiedAliases,
  ])
  const domainId = chooseDomainId({ mode, rawInputId, exactEtalonUid, canonicalAccountId })

  return {
    rawInputId,
    exactEtalonUid,
    canonicalAccountId,
    mode,
    source,
    aliasSet,
    profileLookupOrder: unique([exactEtalonUid, rawInputId, canonicalAccountId, ...verifiedAliases]),
    qcoinLookupOrder: unique([domainId, canonicalAccountId, exactEtalonUid, ...verifiedAliases]),
    forumLookupOrder: unique([canonicalAccountId, exactEtalonUid, rawInputId, ...verifiedAliases]),
    telegramLookupOrder: telegramAliasSet(rawInputId),
    qcoinUid: mode === 'referral-owner' ? (exactEtalonUid || rawInputId || canonicalAccountId) : (canonicalAccountId || exactEtalonUid || rawInputId),
    paymentAccountId: canonicalAccountId || exactEtalonUid || rawInputId,
    vipEntitlementId: canonicalAccountId || exactEtalonUid || rawInputId,
    adsOwnerId: canonicalAccountId || exactEtalonUid || rawInputId,
    metamarketOwnerId: canonicalAccountId || exactEtalonUid || rawInputId,
    battlecoinAccountId: canonicalAccountId || exactEtalonUid || rawInputId,
    conflictWarnings,
  }
}

module.exports = {
  TG_ALIAS_PREFIXES,
  TG_RUNTIME_PREFIXES,
  buildLookupOrder,
  resolve,
  stripAnyTelegramPrefix,
  stripRuntimePrefix,
  telegramAliasSet,
}
