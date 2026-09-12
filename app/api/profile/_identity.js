// app/api/profile/_identity.js
import profilePrimary from '../../../lib/mongo/profile-primary.cjs'
import identityContract from '../../../lib/identity/ql7IdentityContract.cjs'

const stripPrefix = (raw) => {
  return identityContract.stripRuntimePrefix(raw)
}

export async function writeCanonicalAliases(accountId, rawCandidates = []) {
  const canonical = String(accountId || '').trim()
  if (!canonical) return 0
  return profilePrimary.writeCanonicalAliases(canonical, rawCandidates)
}

export async function resolveCanonicalAccountId(raw) {
  const identity = await identityContract.resolve(raw, {
    mode: 'profile-read',
    source: 'app/api/profile/_identity.js:resolveCanonicalAccountId',
  })
  return identity.canonicalAccountId || identity.exactEtalonUid || ''
}

export async function resolveCanonicalAccountIds(rawIds) {
  const input = Array.isArray(rawIds) ? rawIds : []
  const cleaned = input
    .map((id) => stripPrefix(id))
    .filter(Boolean)

  if (!cleaned.length) return { ids: [], aliases: {} }
  const aliases = {}
  const ids = []
  await Promise.all(input.map(async (raw) => {
    const identity = await identityContract.resolve(raw, {
      mode: 'profile-read',
      source: 'app/api/profile/_identity.js:resolveCanonicalAccountIds',
    }).catch(() => null)
    const source = String(raw || '').trim()
    const cleanedSource = stripPrefix(source)
    const mapped = String(identity?.canonicalAccountId || identity?.exactEtalonUid || cleanedSource || '').trim()
    if (mapped) ids.push(mapped)
    if (source && mapped && mapped !== source) aliases[source] = mapped
    if (cleanedSource && mapped && mapped !== cleanedSource) aliases[cleanedSource] = mapped
  }))
  return { ids: Array.from(new Set(ids.length ? ids : cleaned)), aliases }
}
