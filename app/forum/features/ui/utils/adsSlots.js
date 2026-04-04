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
  const now = Date.now()
  const rotateMin = Number(adConf.ROTATE_MIN || 1)
  const periodMs = Math.max(1, rotateMin) * 60_000
  const bucket = Math.floor(now / periodMs)

  const sess = adSessionRef.current
  if (sess.bucket !== bucket) {
    sess.bucket = bucket
    sess.bySlot = new Map()
  }

  if (sess.bySlot && sess.bySlot.has(slotKey)) {
    const stable = sess.bySlot.get(slotKey)
    if (stable) return stable
  }

  const url = resolveCurrentAdUrl(
    adConf,
    clientId,
    now,
    slotKey,
    AdsCoordinator,
  )

  if (!url) return null

  if (!sess.bySlot) sess.bySlot = new Map()
  sess.bySlot.set(slotKey, url)
  return url
}
