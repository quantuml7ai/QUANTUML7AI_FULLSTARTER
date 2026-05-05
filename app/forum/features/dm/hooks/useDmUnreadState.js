import { useEffect, useMemo } from 'react'

function safeResolveDmId(resolveProfileAccountIdFn, value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  try {
    return String(resolveProfileAccountIdFn?.(raw) || raw || '').trim()
  } catch {
    return raw
  }
}

function readDialogSeenTs(dialog, dmSeenMap, meId, resolveProfileAccountIdFn) {
  const last = dialog?.lastMessage || null
  const ids = new Set()
  const add = (value) => {
    const raw = String(value || '').trim()
    if (!raw) return
    ids.add(raw)
    const normalized = safeResolveDmId(resolveProfileAccountIdFn, raw)
    if (normalized) ids.add(normalized)
  }
  add(dialog?.userId)

  const me = String(meId || '').trim()
  const fromRaw = String(last?.fromCanonical || last?.from || '').trim()
  const toRaw = String(last?.toCanonical || last?.to || '').trim()
  const from = safeResolveDmId(resolveProfileAccountIdFn, fromRaw)
  const to = safeResolveDmId(resolveProfileAccountIdFn, toRaw)
  if (from && from !== me) add(fromRaw || from)
  if (to && to !== me) add(toRaw || to)

  let seenTs = 0
  for (const id of ids) seenTs = Math.max(seenTs, Number(dmSeenMap?.[id] || 0))
  return seenTs
}

export default function useDmUnreadState({
  mounted,
  dmDialogs,
  dmSeenMap,
  dmDeletedMap,
  meId,
  resolveProfileAccountIdFn,
  dmDeletedKey,
  setDmDeletedMap,
}) {
  const dmUnreadCount = useMemo(() => {
    if (!mounted) return 0
    let n = 0
    for (const dialog of (dmDialogs || [])) {
      const uid = String(dialog?.userId || '')
      const last = dialog?.lastMessage || null
      if (!uid || !last) continue
      const lastTs = Number(last.ts || 0)
      const deletedAt = Number(dmDeletedMap?.[uid] || 0)
      if (deletedAt && (!lastTs || lastTs <= deletedAt)) continue
      const seenTs = readDialogSeenTs(dialog, dmSeenMap, meId, resolveProfileAccountIdFn)
      const lastFromRaw = String(last?.fromCanonical || last?.from || '')
      const lastFrom = String(resolveProfileAccountIdFn(lastFromRaw) || lastFromRaw || '').trim()
      if (lastFrom && lastFrom !== String(meId) && lastTs > seenTs) n++
    }
    return n
  }, [mounted, dmDialogs, dmSeenMap, dmDeletedMap, meId, resolveProfileAccountIdFn])

  useEffect(() => {
    if (!dmDeletedKey) return
    if (!dmDialogs || !dmDialogs.length) return
    if (!dmDeletedMap || !Object.keys(dmDeletedMap || {}).length) return
    let changed = false
    const next = { ...(dmDeletedMap || {}) }
    for (const dialog of dmDialogs) {
      const uid = String(dialog?.userId || '')
      if (!uid) continue
      const deletedAt = Number(next?.[uid] || 0)
      if (!deletedAt) continue
      const lastTs = Number(dialog?.lastMessage?.ts || 0)
      if (lastTs && lastTs > deletedAt) {
        delete next[uid]
        changed = true
      }
    }
    if (changed) {
      setDmDeletedMap(next)
      try {
        localStorage.setItem(dmDeletedKey, JSON.stringify(next))
      } catch {}
    }
  }, [dmDialogs, dmDeletedMap, dmDeletedKey, setDmDeletedMap])

  return { dmUnreadCount }
}
