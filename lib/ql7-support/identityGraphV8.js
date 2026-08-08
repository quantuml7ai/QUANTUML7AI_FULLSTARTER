import crypto from 'node:crypto'
import profilePrimary from '../mongo/profile-primary.cjs'

function s(value) { return String(value ?? '').trim() }
function norm(value) { return s(value).toLowerCase() }
function hashValue(value) { return crypto.createHash('sha256').update(s(value)).digest('hex') }
function mask(value) {
  const x = s(value)
  return x.length > 12 ? `${x.slice(0, 5)}...${x.slice(-5)}` : (x ? `${x.slice(0, 2)}***` : '')
}
function unique(values = []) { return Array.from(new Set(values.map(s).filter(Boolean))) }
function canonicalCandidate(value) {
  const x = s(value)
  return !!x
    && !/^0x[a-f0-9]{40}$/iu.test(x)
    && !/^(?:telegram:|tg:|tguid:)/iu.test(x)
    && !/^\d{6,15}$/u.test(x)
}

const COLLECTIONS = ['account_aliases', 'dm_aliases', 'profile_aliases', 'telegram_links']

export async function buildQl7IdentityGraphV8({
  database,
  actor = {},
  extraAliases = [],
  maxNodes = 48,
  maxDepth = 2,
} = {}) {
  const root = s(actor.canonicalAccountId)
  const seeds = unique([root, ...(actor.aliases || []), ...extraAliases])
  const nodes = []
  const edges = []
  const seen = new Set()
  let resolvedCanonical = canonicalCandidate(root) ? root : ''

  const rememberCanonical = (value) => {
    const candidate = s(value)
    if (!resolvedCanonical && canonicalCandidate(candidate)) resolvedCanonical = candidate
  }
  const add = (type, value, source, verified = true) => {
    const normalizedValue = norm(value)
    if (!normalizedValue || seen.has(normalizedValue) || nodes.length >= maxNodes) return
    seen.add(normalizedValue)
    nodes.push({
      type,
      value: s(value),
      normalizedValue,
      source,
      verified,
      confidence: verified ? 1 : 0.55,
    })
  }

  for (const value of seeds) {
    add(
      /^0x[a-f0-9]{40}$/iu.test(value) ? 'wallet' : (/^(?:telegram:|tg:|tguid:)/iu.test(value) ? 'telegram' : 'account'),
      value,
      'verified_actor',
      true,
    )
  }

  let frontier = nodes.map((node) => node.value)
  for (let depth = 0; depth < maxDepth && frontier.length; depth += 1) {
    const next = []
    for (const value of frontier) {
      const canonical = await profilePrimary.resolveCanonicalAccountId(value).catch(() => '')
      rememberCanonical(canonical)
      if (canonical && !seen.has(norm(canonical))) {
        add('account', canonical, 'profile_primary', true)
        edges.push({
          from: mask(value),
          to: mask(canonical),
          relation: 'resolved_to',
          source: 'profile_primary',
          verified: true,
        })
        next.push(canonical)
      }

      const aliases = await profilePrimary.listAliasesForAccount(canonical || value).catch(() => [])
      for (const row of aliases.slice(0, 20)) {
        rememberCanonical(row?.canonicalAccountId || row?.accountId)
        for (const item of [row?.accountId, row?.canonicalAccountId, row?.alias, row?.aliasId, row?.aliasValue]) {
          if (item && !seen.has(norm(item))) {
            add('legacy_alias', item, 'profile_primary', true)
            next.push(item)
          }
        }
      }

      if (database?.collection) {
        for (const name of COLLECTIONS) {
          const rows = await database.collection(name).find({
            $or: [
              { accountId: value },
              { canonicalAccountId: value },
              { alias: value },
              { wallet: value },
              { walletAddress: value },
              { telegramId: value },
            ],
          }).limit(12).toArray().catch(() => [])
          for (const row of rows) {
            rememberCanonical(row.canonicalAccountId || row.accountId || row.userId)
            for (const item of [
              row.accountId,
              row.canonicalAccountId,
              row.alias,
              row.aliasId,
              row.wallet,
              row.walletAddress,
              row.telegramId,
              row.userId,
            ]) {
              if (item && !seen.has(norm(item))) {
                add(
                  /^0x/iu.test(s(item)) ? 'wallet' : (/^(?:telegram:|tg:)|telegram/iu.test(s(item)) ? 'telegram' : 'legacy_alias'),
                  item,
                  name,
                  true,
                )
                next.push(item)
              }
            }
          }
        }
      }
    }
    frontier = unique(next)
  }

  const lookupIds = unique(nodes.map((node) => node.value))
  const canonicalAccountId = resolvedCanonical || root || lookupIds[0] || ''
  const graphHashInput = lookupIds.map(norm).sort().join('\0')
  return Object.freeze({
    version: 'v8',
    graphId: hashValue(graphHashInput).slice(0, 24),
    canonicalAccountId,
    canonicalAccountHash: hashValue(canonicalAccountId),
    verifiedActorType: s(actor.authMode) || 'internal_session',
    verifiedRootId: mask(root),
    nodes: Object.freeze(nodes.map((node) => ({ ...node, valueMasked: mask(node.value), value: undefined }))),
    edges: Object.freeze(edges),
    lookupIds: Object.freeze(lookupIds),
    lookupHash: hashValue(graphHashInput),
    rejectedForeignIds: Object.freeze([]),
    generatedAt: new Date().toISOString(),
    readOnly: true,
  })
}

export function publicQl7IdentityGraphProjectionV8(graph = {}) {
  return {
    graphId: s(graph.graphId),
    canonicalAccountIdMasked: mask(graph.canonicalAccountId),
    canonicalAccountHash: s(graph.canonicalAccountHash),
    lookupHash: s(graph.lookupHash),
    aliases: (graph.nodes || []).map((node) => ({
      type: node.type,
      valueMasked: node.valueMasked,
      source: node.source,
      verified: node.verified,
    })).slice(0, 20),
    generatedAt: s(graph.generatedAt),
    readOnly: true,
  }
}
