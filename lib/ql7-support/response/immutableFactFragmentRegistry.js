import crypto from 'node:crypto'

export const QL7_SUPPORT_IMMUTABLE_FACT_FRAGMENT_VERSION = '5.1.1'

const hash = (value) => crypto
  .createHash('sha256')
  .update(String(value ?? ''))
  .digest('hex')

export function registerQl7SupportImmutableFactFragments(rows = []) {
  const dedupe = new Map()

  for (const sourceRow of Array.isArray(rows) ? rows : []) {
    const text = String(sourceRow?.text || '').trim()
    const sourceId = String(sourceRow?.sourceId || '').trim()
    if (!text || !sourceId) continue

    const fragmentId = String(
      sourceRow?.fragmentId ||
      `fact:${hash(`${sourceId}:${text}`)}`,
    )
    if (dedupe.has(fragmentId)) continue

    dedupe.set(fragmentId, Object.freeze({
      fragmentId,
      text,
      textHash: hash(text),
      sourceId,
      sourceReceiptHash: String(sourceRow?.sourceReceiptHash || ''),
      noveltyExemption: 'exact-fragment-only',
      mutationAllowed: false,
      reason: String(sourceRow?.reason || 'verified-fact-fragment'),
      registryVersion: QL7_SUPPORT_IMMUTABLE_FACT_FRAGMENT_VERSION,
    }))
  }

  return Object.freeze([...dedupe.values()])
}
