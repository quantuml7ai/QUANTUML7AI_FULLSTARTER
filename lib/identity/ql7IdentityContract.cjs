// Canonical Redis->Mongo identity contract.
//
// The Redis baseline did not treat every numeric-looking id as one global user.
// It resolved exact ids through a narrow order: TG runtime keys first for bare
// numeric Telegram ids, then profile aliases. Mongo callers use this module to
// keep that behavior while storing permanent data in Mongo.

const profilePrimary = require('../mongo/profile-primary.cjs')
const canonicalUserId = require('./canonical-user-id.cjs')

const TG_RUNTIME_PREFIXES = ['tguid:', 'tg:']
const TG_ALIAS_PREFIXES = ['telegram:', 'telegramid:', 'telegram:id:', 'tguid:', 'tg:', 'tg:uid:']
let testProfileResolver = null

function str(value) {
  return String(value ?? '').trim()
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
  return canonicalUserId.normalizeTelegramId(raw) || str(raw)
}

function telegramAliasSet(raw) {
  const exact = canonicalUserId.normalizeTelegramId(raw)
  if (!exact) return []
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
  const canonicalSyntax = canonicalUserId.normalizePrincipalSyntax(rawInputId)
  const order = []

  for (const value of [rawInputId, exactEtalonUid, canonicalSyntax]) {
    if (value) order.push(value)
  }

  // Transitional READ compatibility for pre-compaction Mongo only.
  const walletId = canonicalUserId.normalizeWalletId(rawInputId)
  if (walletId) {
    order.push(walletId)
    order.push(walletId.toLowerCase())
    order.push(`wallet:${walletId.toLowerCase()}`)
  }
  order.push(...telegramAliasSet(rawInputId))

  return unique(order)
}

async function listVerifiedAliases(canonicalAccountId, seed = []) {
  const canonical = str(canonicalAccountId)
  const aliases = []
  if (canonical) aliases.push(canonical)
  for (const value of seed) aliases.push(value)
  if (!canonical || typeof profilePrimary.getLinkedIdentityIds !== 'function') return unique(aliases)
  const linked = await profilePrimary.getLinkedIdentityIds(canonical).catch(() => [])
  aliases.push(...linked)
  return unique(aliases)
}

function chooseDomainId({ rawInputId = '', exactEtalonUid = '', canonicalAccountId = '' } = {}) {
  return str(canonicalAccountId)
    || canonicalUserId.normalizePrincipalSyntax(exactEtalonUid || rawInputId)
}

async function resolve(raw, options = {}) {
  const mode = str(options.mode || 'generic')
  const source = str(options.source || '')
  const rawInputId = str(raw)
  const exactEtalonUid = stripRuntimePrefix(rawInputId)
  const canonicalSyntax = canonicalUserId.normalizePrincipalSyntax(rawInputId)
  const lookupOrder = buildLookupOrder(rawInputId)
  const conflictWarnings = []
  let canonicalAccountId = ''

  for (const candidate of lookupOrder) {
    let mapped = ''
    try {
      mapped = await (testProfileResolver || profilePrimary.resolveCanonicalAccountId)(candidate)
    } catch (error) {
      if (error?.code === 'IDENTITY_LINK_CONFLICT') {
        conflictWarnings.push({
          type: 'identity_link_conflict',
          candidate,
          reason: str(error?.details?.reason || 'ambiguous_identity'),
        })
      }
      continue
    }
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

  if (!canonicalAccountId) canonicalAccountId = canonicalSyntax || exactEtalonUid
  const verifiedAliases = await listVerifiedAliases(canonicalAccountId, lookupOrder)
  const aliasSet = unique([
    ...lookupOrder,
    canonicalSyntax,
    ...telegramAliasSet(rawInputId),
    ...verifiedAliases,
  ])
  const domainId = chooseDomainId({ mode, rawInputId, exactEtalonUid, canonicalAccountId })
  const conflicted = conflictWarnings.length > 0

  return {
    rawInputId,
    exactEtalonUid,
    canonicalSyntax,
    canonicalAccountId,
    mode,
    source,
    aliasSet,
    profileLookupOrder: unique([exactEtalonUid, rawInputId, canonicalAccountId, ...verifiedAliases]),
    qcoinLookupOrder: unique([domainId, canonicalAccountId, exactEtalonUid, ...verifiedAliases]),
    forumLookupOrder: unique([canonicalAccountId, exactEtalonUid, rawInputId, ...verifiedAliases]),
    telegramLookupOrder: telegramAliasSet(rawInputId),
    qcoinUid: domainId,
    paymentAccountId: domainId,
    vipEntitlementId: domainId,
    adsOwnerId: domainId,
    metamarketOwnerId: domainId,
    battlecoinAccountId: domainId,
    conflictWarnings,
    conflicted,
    mutationAllowed: !conflicted,
  }
}

function __setTestProfileResolver(resolver) {
  testProfileResolver = typeof resolver === 'function' ? resolver : null
}

module.exports = {
  __setTestProfileResolver,
  TG_ALIAS_PREFIXES,
  TG_RUNTIME_PREFIXES,
  buildLookupOrder,
  resolve,
  stripAnyTelegramPrefix,
  stripRuntimePrefix,
  telegramAliasSet,
}
