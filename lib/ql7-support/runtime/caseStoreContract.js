export const QL7_SUPPORT_CASE_COLLECTION = 'ql7_support_cases'

function str(value) {
  return String(value ?? '').trim()
}

export function redactQl7SupportSecrets(text = '') {
  let out = str(text)
  const replacements = [
    [/\b(mongodb(?:\+srv)?:\/\/)[^\s]+/giu, '$1[redacted-mongo-uri]'],
    [/\b(redis:\/\/)[^\s]+/giu, '$1[redacted-redis-uri]'],
    [/\b(bearer)\s+[^\s,;]{3,}/giu, '$1 [redacted-token]'],
    [/\b(0x[a-f0-9]{64})\b/giu, '[secret-redacted]'],
    [/\b([a-z0-9+/]{32,}={0,2})\b/giu, (m) => (m.length >= 48 ? '[secret-redacted]' : m)],
    [/\b(seed phrase|mnemonic|private key|smtp_pass|redis token|mongo uri)\s*[:=]\s*[^\n\r]+/giu, '$1: [secret-redacted]'],
  ]
  for (const [pattern, replacement] of replacements) out = out.replace(pattern, replacement)
  return out
}

export function createQl7SupportCaseId(userId = '', topic = '', messageId = '') {
  const uid = str(userId).toLowerCase() || 'user'
  const tp = str(topic).toLowerCase() || 'general'
  const mid = str(messageId) || String(Date.now())
  return `ql7case:${uid}:${tp}:${mid}`
}

export function assessQl7SupportCaseMemoryProjection({
  projectedHash = '',
  projectedVersion = 0,
  memoryBeforeHash = '',
  memoryBeforeVersion = 0,
  memoryAfterHash = '',
  memoryAfterVersion = 0,
} = {}) {
  const projected = Math.max(0, Number(projectedVersion || 0))
  const before = Math.max(0, Number(memoryBeforeVersion || 0))
  const after = Math.max(0, Number(memoryAfterVersion || 0))
  const projectedDigest = str(projectedHash)
  const beforeDigest = str(memoryBeforeHash)
  const afterDigest = str(memoryAfterHash)

  if (projected === after && projectedDigest && projectedDigest === afterDigest) {
    return Object.freeze({ ok: true, disposition: 'already_applied', repairRequired: false })
  }
  if (projected > before) {
    return Object.freeze({ ok: false, disposition: 'projection_ahead', repairRequired: false })
  }
  if (projected === before) {
    const missingGenesisHash = before === 0 && !projectedDigest
    if (!missingGenesisHash && projectedDigest !== beforeDigest) {
      return Object.freeze({ ok: false, disposition: 'same_version_hash_divergence', repairRequired: false })
    }
    return Object.freeze({ ok: true, disposition: 'advance', repairRequired: false })
  }
  return Object.freeze({ ok: true, disposition: 'stale_projection_repair', repairRequired: true })
}
