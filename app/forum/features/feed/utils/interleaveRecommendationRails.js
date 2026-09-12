function isRecommendationSlot(slot) {
  return String(slot?.type || '') === 'recommendation_rail'
}

function isAdSlot(slot) {
  return String(slot?.type || '') === 'ad'
}

function isItemSlot(slot) {
  return String(slot?.type || '') === 'item'
}

export default function interleaveRecommendationRails(slots, every, opts = {}) {
  const normalizedEvery = Math.max(0, Number(every || 0) || 0)
  const list = Array.isArray(slots) ? slots : []
  if (!list.length) return []
  if (!normalizedEvery) return list.slice()

  const shouldSkip =
    typeof opts.isSkippable === 'function'
      ? opts.isSkippable
      : (slot) => !slot?.item?.id

  const out = []
  let contentCount = 0
  let railIndex = 0
  let pendingRecommendation = false

  const tryInsertRecommendation = (itemSlot, nextOriginalSlot) => {
    if (!pendingRecommendation) return false
    if (!isItemSlot(itemSlot) || shouldSkip(itemSlot)) return false

    const prevOutSlot = out[out.length - 1]
    if (isRecommendationSlot(prevOutSlot)) return false
    if (isAdSlot(prevOutSlot)) return false
    if (isAdSlot(nextOriginalSlot)) return false

    const anchorKey = String(itemSlot?.key || itemSlot?.item?.id || contentCount || railIndex)
    out.push({
      type: 'recommendation_rail',
      key: `rec:${anchorKey}:${railIndex}`,
      railIndex,
      afterItemCount: contentCount,
      anchorKey,
    })
    railIndex += 1
    pendingRecommendation = false
    return true
  }

  for (let idx = 0; idx < list.length; idx += 1) {
    const slot = list[idx]
    out.push(slot)

    if (!isItemSlot(slot) || shouldSkip(slot)) continue

    contentCount += 1
    if (contentCount >= normalizedEvery && (contentCount % normalizedEvery) === 0) {
      pendingRecommendation = true
    }

    tryInsertRecommendation(slot, list[idx + 1] || null)
  }

  return out
}
