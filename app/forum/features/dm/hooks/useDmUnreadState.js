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


function dialogMatchesActiveThread(dialog, dmWithUserId, meId, resolveProfileAccountIdFn) {
  const targetRaw = String(dmWithUserId || '').trim()
  if (!targetRaw) return false
  const target = safeResolveDmId(resolveProfileAccountIdFn, targetRaw)
  const last = dialog?.lastMessage || null
  const ids = new Set([
    dialog?.userId,
    last?.fromCanonical,
    last?.toCanonical,
    last?.from,
    last?.to,
  ].map((v) => String(v || '').trim()).filter(Boolean))
  const me = String(meId || '').trim()
  const from = safeResolveDmId(resolveProfileAccountIdFn, last?.fromCanonical || last?.from || '')
  const to = safeResolveDmId(resolveProfileAccountIdFn, last?.toCanonical || last?.to || '')
  if (me && from && to) {
    if (from === me) ids.add(to)
    if (to === me) ids.add(from)
  }
  return ids.has(targetRaw) || (!!target && ids.has(target))
}

function countUnreadIncomingMessages(messages, { seenTs, deletedAt, meId, peerId, resolveProfileAccountIdFn }) {
  const list = Array.isArray(messages) ? messages : []
  const me = String(meId || '').trim()
  const peerRaw = String(peerId || '').trim()
  const peer = safeResolveDmId(resolveProfileAccountIdFn, peerRaw)
  const seen = Number(seenTs || 0)
  const deleted = Number(deletedAt || 0)
  const countedIds = new Set()
  let n = 0
  for (const message of list) {
    const ts = Number(message?.ts || 0)
    if (!ts || ts <= seen || (deleted && ts <= deleted)) continue
    const fromRaw = String(message?.fromCanonical || message?.from || '').trim()
    const toRaw = String(message?.toCanonical || message?.to || '').trim()
    const from = safeResolveDmId(resolveProfileAccountIdFn, fromRaw)
    const to = safeResolveDmId(resolveProfileAccountIdFn, toRaw)
    const toMe = !!me && (to === me || toRaw === me)
    const fromPeer = !peerRaw && !peer
      ? from !== me && fromRaw !== me
      : (from === peer || fromRaw === peerRaw || (!!peer && fromRaw === peer))
    if (!toMe || !fromPeer) continue
    const id = String(message?.id || '').trim()
    if (id) {
      if (countedIds.has(id)) continue
      countedIds.add(id)
    }
    n += 1
  }
  return n
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
  dmWithUserId,
  dmThreadItems,
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
      const seenTs = Math.max(
        readDialogSeenTs(dialog, dmSeenMap, meId, resolveProfileAccountIdFn),
        Number(dialog?.lastSeenTs || 0),
      )
      const activeThread = dialogMatchesActiveThread(dialog, dmWithUserId, meId, resolveProfileAccountIdFn)
      const serverUnreadCount = Number(dialog?.unreadCount || 0)
      if (activeThread) {
        const loadedThreadItems = Array.isArray(dmThreadItems) ? dmThreadItems : []
        if (loadedThreadItems.length > 0) {
          n += countUnreadIncomingMessages(loadedThreadItems, {
            seenTs,
            deletedAt,
            meId,
            peerId: uid,
            resolveProfileAccountIdFn,
          })
          continue
        }

        // On dialog open the active thread can be selected before its messages are loaded.
        // Do not hide the badge during that loading gap; keep the server unread total
        // until visible incoming rows are actually observed and marked as seen.
        if (serverUnreadCount > 0 && lastTs > seenTs) {
          n += serverUnreadCount
          continue
        }
      }
      if (lastTs <= seenTs) continue
      if (serverUnreadCount > 0) {
        n += serverUnreadCount
        continue
      }
      const lastFromRaw = String(last?.fromCanonical || last?.from || '')
      const lastFrom = String(resolveProfileAccountIdFn(lastFromRaw) || lastFromRaw || '').trim()
      if (lastFrom && lastFrom !== String(meId) && lastTs > seenTs) n++
    }
    return n
  }, [mounted, dmDialogs, dmSeenMap, dmDeletedMap, meId, resolveProfileAccountIdFn, dmWithUserId, dmThreadItems])

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
