import { useCallback, useEffect, useMemo, useState } from 'react'
import { normalizeDmDeletedMap } from '../utils/deletedMap'

export default function useDmStorageMaps({ meId, resolveProfileAccountIdFn }) {
  const seenDmKey = useMemo(
    () => (meId ? `seenDM:${meId}` : null),
    [meId]
  )
  const dmBlockedKey = useMemo(
    () => (meId ? `dm:blocked:${meId}` : null),
    [meId]
  )
  const dmDeletedKey = useMemo(
    () => (meId ? `dm:deleted:${meId}` : null),
    [meId]
  )
  const dmDeletedMsgKey = useMemo(
    () => (meId ? `dm:deleted_msg:${meId}` : null),
    [meId]
  )

  const [dmSeenMap, setDmSeenMap] = useState({})
  const [dmBlockedMap, setDmBlockedMap] = useState({})
  const [dmDeletedMap, setDmDeletedMap] = useState({})
  const [dmDeletedMsgMap, setDmDeletedMsgMap] = useState({})

  const normalizeDeletedDialogKeys = useCallback((raw) => {
    const next = normalizeDmDeletedMap(raw)
    const out = {}
    for (const [key, value] of Object.entries(next)) {
      const rawId = String(key || '').trim()
      if (!rawId) continue
      const canonicalId = String(resolveProfileAccountIdFn?.(rawId) || rawId || '').trim()
      if (!canonicalId) continue
      out[canonicalId] = Math.max(Number(out[canonicalId] || 0), Number(value || 0))
    }
    return out
  }, [resolveProfileAccountIdFn])

  useEffect(() => {
    if (!seenDmKey) {
      setDmSeenMap({})
      return
    }
    try {
      const raw = JSON.parse(localStorage.getItem(seenDmKey) || '{}') || {}
      setDmSeenMap((raw && typeof raw === 'object') ? raw : {})
    } catch {
      setDmSeenMap({})
    }
  }, [seenDmKey])

  const markDmSeen = useCallback((uid, lastTs) => {
    if (!seenDmKey) return
    const rawId = String(uid || '').trim()
    const id = String(resolveProfileAccountIdFn(rawId) || rawId || '').trim()
    const ts = Number(lastTs || 0)
    if (!id || !ts) return
    setDmSeenMap((prev) => {
      const next = { ...(prev || {}) }
      if (Number(next[id] || 0) >= ts) return prev
      next[id] = ts
      try {
        localStorage.setItem(seenDmKey, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [seenDmKey, resolveProfileAccountIdFn])

  useEffect(() => {
    if (!dmBlockedKey) {
      setDmBlockedMap({})
      return
    }
    try {
      const raw = JSON.parse(localStorage.getItem(dmBlockedKey) || '{}') || {}
      setDmBlockedMap((raw && typeof raw === 'object') ? raw : {})
    } catch {
      setDmBlockedMap({})
    }
  }, [dmBlockedKey])

  useEffect(() => {
    if (!dmDeletedKey) {
      setDmDeletedMap({})
      return
    }
    try {
      const raw = JSON.parse(localStorage.getItem(dmDeletedKey) || '{}') || {}
      const next = normalizeDeletedDialogKeys(raw)
      setDmDeletedMap(next)
      try {
        localStorage.setItem(dmDeletedKey, JSON.stringify(next))
      } catch {}
    } catch {
      setDmDeletedMap({})
    }
  }, [dmDeletedKey, normalizeDeletedDialogKeys])

  useEffect(() => {
    if (!dmDeletedMsgKey) {
      setDmDeletedMsgMap({})
      return
    }
    try {
      const raw = JSON.parse(localStorage.getItem(dmDeletedMsgKey) || '{}') || {}
      setDmDeletedMsgMap((raw && typeof raw === 'object') ? raw : {})
    } catch {
      setDmDeletedMsgMap({})
    }
  }, [dmDeletedMsgKey])

  return {
    seenDmKey,
    dmBlockedKey,
    dmDeletedKey,
    dmDeletedMsgKey,
    dmSeenMap,
    setDmSeenMap,
    markDmSeen,
    dmBlockedMap,
    setDmBlockedMap,
    dmDeletedMap,
    setDmDeletedMap,
    dmDeletedMsgMap,
    setDmDeletedMsgMap,
  }
}
