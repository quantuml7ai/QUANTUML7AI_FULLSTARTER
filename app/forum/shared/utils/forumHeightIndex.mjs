function clampIndex(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

export function buildForumHeightPrefix(values = []) {
  const list = Array.isArray(values) ? values : []
  const prefix = new Array(list.length + 1)
  prefix[0] = 0
  for (let index = 0; index < list.length; index += 1) {
    const height = Number(list[index] || 0)
    prefix[index + 1] = prefix[index] + (Number.isFinite(height) && height > 0 ? height : 0)
  }
  return prefix
}

export function findForumWindowStartIndex(prefix, offset, total = null) {
  const p = Array.isArray(prefix) ? prefix : []
  const count = Math.max(0, Math.min(
    Number.isFinite(Number(total)) ? Number(total) : Math.max(0, p.length - 1),
    Math.max(0, p.length - 1),
  ))
  if (!count) return 0
  const target = Math.max(0, Number(offset || 0) || 0)
  let low = 0
  let high = count
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2)
    if (Number(p[mid + 1] || 0) < target) low = mid + 1
    else high = mid
  }
  return Math.min(count, low)
}

export function findForumWindowEndExclusive(prefix, offset, total = null, start = 0) {
  const p = Array.isArray(prefix) ? prefix : []
  const count = Math.max(0, Math.min(
    Number.isFinite(Number(total)) ? Number(total) : Math.max(0, p.length - 1),
    Math.max(0, p.length - 1),
  ))
  if (!count) return 0
  const minStart = clampIndex(Math.round(Number(start || 0) || 0), 0, count)
  const target = Math.max(0, Number(offset || 0) || 0)
  let low = minStart
  let high = count
  while (low < high) {
    const mid = low + Math.floor((high - low) / 2)
    if (Number(p[mid] || 0) < target) low = mid + 1
    else high = mid
  }
  return Math.min(count, Math.max(minStart, low))
}

export function buildForumWindowFromPrefix(prefix, start, end, total = null) {
  const p = Array.isArray(prefix) ? prefix : []
  const count = Math.max(0, Math.min(
    Number.isFinite(Number(total)) ? Number(total) : Math.max(0, p.length - 1),
    Math.max(0, p.length - 1),
  ))
  const safeStart = clampIndex(Math.round(Number(start || 0) || 0), 0, count)
  const safeEnd = clampIndex(Math.round(Number(end || 0) || 0), safeStart, count)
  const totalHeight = Number(p[count] || 0)
  return {
    start: safeStart,
    end: safeEnd,
    top: Number(p[safeStart] || 0),
    bottom: Math.max(0, totalHeight - Number(p[safeEnd] || 0)),
  }
}
