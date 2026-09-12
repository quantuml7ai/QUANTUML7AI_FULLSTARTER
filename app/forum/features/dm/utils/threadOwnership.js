const text = (value) => String(value ?? '').trim()
const integer = (value, fallback = 0) => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : fallback

export function buildDmThreadKey({accountId = '', conversationKind = 'peer_dm', conversationId = ''} = {}) {
  const account = text(accountId)
  const kind = text(conversationKind) === 'system_support' ? 'system_support' : 'peer_dm'
  const conversation = text(conversationId)
  return Object.freeze({accountId: account, conversationKind: kind, conversationId: conversation, key: `${account}\u001f${kind}\u001f${conversation}`})
}

export function advanceDmThreadOwner(current = {}, input = {}) {
  const nextKey = buildDmThreadKey(input)
  const priorKey = buildDmThreadKey(current)
  const priorGeneration = integer(current?.generation, 0)
  if (priorKey.key === nextKey.key) return Object.freeze({...nextKey, generation: priorGeneration})
  return Object.freeze({...nextKey, generation: priorGeneration + 1})
}

export function captureDmThreadOwner(current = {}, input = {}) {
  const requested = buildDmThreadKey(input)
  const owner = buildDmThreadKey(current)
  return Object.freeze({...requested, generation: integer(current?.generation, 0), ownershipMatchesAtCapture: requested.key === owner.key})
}

export function isDmThreadOwnerCurrent(current = {}, token = {}) {
  if (!token || token.ownershipMatchesAtCapture !== true) return false
  const owner = buildDmThreadKey(current)
  const captured = buildDmThreadKey(token)
  return owner.key === captured.key && integer(current?.generation, 0) === integer(token?.generation, -1)
}

export function auditDmThreadOwnership() {
  let owner = advanceDmThreadOwner({}, {accountId: 'a', conversationKind: 'system_support', conversationId: 'ql7-support'})
  const support = captureDmThreadOwner(owner, owner)
  owner = advanceDmThreadOwner(owner, {accountId: 'a', conversationKind: 'peer_dm', conversationId: 'peer-b'})
  const peer = captureDmThreadOwner(owner, owner)
  const ok = !isDmThreadOwnerCurrent(owner, support) && isDmThreadOwnerCurrent(owner, peer)
  return Object.freeze({ok, supportInvalidated: !isDmThreadOwnerCurrent(owner, support), currentPeerAccepted: isDmThreadOwnerCurrent(owner, peer)})
}
