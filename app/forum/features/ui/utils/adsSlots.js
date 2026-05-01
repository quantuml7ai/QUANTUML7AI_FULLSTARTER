'use client'

export function debugAdsSlots(label, slots) {
  void label
  return slots
}

export function pickAdUrlForSlot({
  adConf,
  clientId,
  slotKey,
  slotKind,
  adSessionRef,
  resolveCurrentAdUrl,
  AdsCoordinator,
}) {
  if (!adConf) return null
  const stableSlotKey = `${String(slotKind || 'slot').trim() || 'slot'}:${String(slotKey || '').trim() || 'slot'}`
  const now = Date.now()
  const rotateMin = Number(adConf.ROTATE_MIN || 1)
  const periodMs = Math.max(1, rotateMin) * 60_000
  const bucket = Math.floor(now / periodMs)

  const sess = adSessionRef.current
  if (sess.bucket !== bucket) {
    sess.bucket = bucket
    sess.used = new Set()
    sess.bySlot = new Map()
  }

  if (sess.bySlot && sess.bySlot.has(stableSlotKey)) {
    const stable = sess.bySlot.get(stableSlotKey)
    if (stable) return stable
  }

  let url = resolveCurrentAdUrl(
    adConf,
    clientId,
    now,
    stableSlotKey,
    AdsCoordinator,
  )

  const links = (
    Array.isArray(adConf.LINKS) && adConf.LINKS.length
      ? adConf.LINKS
      : []
  ).filter(Boolean)

  if (url && sess.used.has(url) && links.length > 1) {
    const alt = links.find((candidate) => !sess.used.has(candidate))
    if (alt) url = alt
  }

  if (!url) return null

  sess.used.add(url)
  if (!sess.bySlot) sess.bySlot = new Map()
  sess.bySlot.set(stableSlotKey, url)
  return url
}
