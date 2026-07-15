export function normalizeDmDeletedMap(raw) {
  const out = {}
  const now = Date.now()
  if (!raw || typeof raw !== 'object') return out
  for (const [key, value] of Object.entries(raw)) {
    if (!key) continue
    const n = Number(value || 0)
    if (Number.isFinite(n) && n > 1e11) out[key] = n
    else if (value) out[key] = now
  }
  return out
}
