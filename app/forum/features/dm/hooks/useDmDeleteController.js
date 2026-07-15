import { useCallback, useRef, useState } from 'react'
import { dedupeDmDialogs, dialogMatchesUser } from '../utils/dmLoaders'

export default function useDmDeleteController({
  meId,
  dmBlockedMap,
  dmBlockedKey,
  setDmBlockedMap,
  dmDialogs,
  setDmDialogs,
  dmThreadItems,
  dmWithUserId,
  setDmWithUserId,
  dmDeletedMap,
  dmDeletedKey,
  setDmDeletedMap,
  dmDeletedMsgMap,
  dmDeletedMsgKey,
  setDmDeletedMsgMap,
  setDmThreadItems,
  loadDmDialogs,
  t,
  toast,
}) {
  const [dmDeletePopover, setDmDeletePopover] = useState(null)
  const [dmDeleteForAll, setDmDeleteForAll] = useState(false)
  const dmDeleteForAllRef = useRef(false)

  const setDmDeleteForAllTracked = useCallback((next) => {
    const resolved = typeof next === 'function' ? next(dmDeleteForAllRef.current) : next
    const value = !!resolved
    dmDeleteForAllRef.current = value
    setDmDeleteForAll(value)
  }, [])

  const persistMap = useCallback((key, value) => {
    try {
      if (key) localStorage.setItem(key, JSON.stringify(value || {}))
    } catch {}
  }, [])

  const persistBlockedMap = useCallback((value) => {
    persistMap(dmBlockedKey, value)
  }, [dmBlockedKey, persistMap])

  const persistDeletedDialogsMap = useCallback((value) => {
    persistMap(dmDeletedKey, value)
  }, [dmDeletedKey, persistMap])

  const persistDeletedMessagesMap = useCallback((value) => {
    persistMap(dmDeletedMsgKey, value)
  }, [dmDeletedMsgKey, persistMap])

  const clearDmLocalCaches = useCallback((uid = '') => {
    const id = String(uid || '').trim()
    try {
      if (!meId || typeof localStorage === 'undefined') return
      localStorage.removeItem(`dm:dialogs:${meId}`)
      if (id) localStorage.removeItem(`dm:thread:thr:${meId}:${id}`)
    } catch {}
  }, [meId])

  const toggleDmBlock = useCallback(async (uid, nextBlock) => {
    const id = String(uid || '').trim()
    if (!id || !meId) return
    const prevMap = { ...(dmBlockedMap || {}) }
    const optimisticMap = { ...prevMap }
    if (nextBlock) optimisticMap[id] = 1
    else delete optimisticMap[id]
    persistBlockedMap(optimisticMap)
    setDmBlockedMap(optimisticMap)
    try {
      const url = nextBlock ? '/api/dm/block' : '/api/dm/unblock'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forum-user-id': String(meId) },
        body: JSON.stringify({ userId: id }),
      })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'dm_block_failed')
      try {
        loadDmDialogs?.(null, { force: true, refresh: true, throttleMs: 0 })
      } catch {}
    } catch {
      persistBlockedMap(prevMap)
      setDmBlockedMap(prevMap)
    }
  }, [meId, dmBlockedMap, persistBlockedMap, setDmBlockedMap, loadDmDialogs])

  const removeDmDialogFromState = useCallback((uid) => {
    const id = String(uid || '').trim()
    if (!id) return
    setDmDialogs((prev) =>
      dedupeDmDialogs(
        (prev || []).filter((dialog) => !dialogMatchesUser(dialog, id, meId)),
        meId,
      )
    )
    if (String(dmWithUserId || '') === id) setDmWithUserId('')
  }, [dmWithUserId, meId, setDmDialogs, setDmWithUserId])

  const deleteDmDialogLocal = useCallback((uid, ts = Date.now()) => {
    const id = String(uid || '').trim()
    if (!id) return
    const next = { ...(dmDeletedMap || {}) }
    next[id] = Number(ts || Date.now())
    persistDeletedDialogsMap(next)
    setDmDeletedMap(next)
    removeDmDialogFromState(id)
    clearDmLocalCaches(id)
  }, [clearDmLocalCaches, dmDeletedMap, persistDeletedDialogsMap, removeDmDialogFromState, setDmDeletedMap])

  const deleteDmMessageLocal = useCallback((msgId, uid = '') => {
    const id = String(msgId || '').trim()
    if (!id) return
    const peerId = String(uid || dmWithUserId || '').trim()
    const next = { ...(dmDeletedMsgMap || {}) }
    next[id] = 1
    persistDeletedMessagesMap(next)
    setDmDeletedMsgMap(next)
    if (peerId) {
      const replacement = (Array.isArray(dmThreadItems) ? dmThreadItems : [])
        .filter((msg) => String(msg?.id || '') !== id)
        .filter((msg) => !next[String(msg?.id || '')])
        .slice()
        .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0))[0] || null
      setDmDialogs((prev) =>
        dedupeDmDialogs(
          (prev || [])
            .flatMap((dialog) => {
              if (!dialogMatchesUser(dialog, peerId, meId)) return [dialog]
              const last = dialog?.lastMessage || null
              if (!last || String(last?.id || '') !== id) return [dialog]
              if (!replacement) return []
              return [{ ...dialog, userId: peerId, lastMessage: { ...replacement } }]
            }),
          meId,
        )
      )
    }
    setDmThreadItems((prev) => (prev || []).filter((msg) => String(msg?.id || '') !== id))
    clearDmLocalCaches(peerId)
  }, [clearDmLocalCaches, dmDeletedMsgMap, dmThreadItems, dmWithUserId, meId, persistDeletedMessagesMap, setDmDeletedMsgMap, setDmDialogs, setDmThreadItems])

  const deleteDmDialogServer = useCallback(async (uid) => {
    const id = String(uid || '').trim()
    if (!id) return false
    if (!meId) throw new Error('missing_user_id')
    const res = await fetch('/api/dm/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forum-user-id': String(meId) },
      body: JSON.stringify({
        action: 'dialog',
        with: id,
        userId: id,
        peer: id,
        deleteForAll: true,
      }),
    })
    const j = await res.json().catch(() => null)
    if (!res.ok || !j?.ok) throw new Error(j?.error || 'dm_delete_failed')
    return true
  }, [meId])

  const deleteDmMessageServer = useCallback(async (msgId, uid = '') => {
    const id = String(msgId || '').trim()
    const peerId = String(uid || '').trim()
    if (!id) return false
    if (!meId) throw new Error('missing_user_id')
    const payload = {
      action: 'message',
      messageId: id,
      id,
      deleteForAll: true,
    }
    if (peerId) {
      payload.with = peerId
      payload.userId = peerId
    }
    const res = await fetch('/api/dm/delete', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forum-user-id': String(meId) },
      body: JSON.stringify(payload),
    })
    const j = await res.json().catch(() => null)
    if (!res.ok || !j?.ok) throw new Error(j?.error || 'dm_delete_failed')
    return true
  }, [meId])

  const openDmDeletePopover = useCallback((kind, payload, e) => {
    try {
      e?.preventDefault?.()
      e?.stopPropagation?.()
    } catch {}
    let rect = null
    try {
      const b = e?.currentTarget?.getBoundingClientRect?.()
      if (b) {
        rect = {
          top: b.top,
          left: b.left,
          right: b.right,
          bottom: b.bottom,
          width: b.width,
          height: b.height,
        }
      }
    } catch {}
    // Default to "delete for all" for both dialog/message.
    // User can still uncheck in the popover.
    setDmDeleteForAllTracked(true)
    setDmDeletePopover({ kind, rect, ...payload })
  }, [setDmDeleteForAllTracked])

  const closeDmDeletePopover = useCallback(() => {
    setDmDeletePopover(null)
    setDmDeleteForAllTracked(false)
  }, [setDmDeleteForAllTracked])

  const confirmDmDelete = useCallback(async (forAllOverride) => {
    const info = dmDeletePopover
    if (!info) return
    const kind = String(info.kind || '').trim()
    // Defensive against fast checkbox->confirm race:
    // stale false from render must never override fresh true from tracked ref.
    let forAll = !!(dmDeleteForAllRef.current || forAllOverride === true)
    // Dialog delete must remain server-authoritative.
    // Local-only dialog removal causes cross-device divergence.
    if (kind === 'dialog') forAll = true
    try {
      if (kind === 'dialog') {
        const uid = String(info.uid || '').trim()
        if (!uid) return
        if (forAll) {
          await deleteDmDialogServer(uid)
          deleteDmDialogLocal(uid, Date.now())
          if (String(dmWithUserId || '') === uid) {
            setDmThreadItems([])
            setDmWithUserId('')
          }
          try {
            loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 })
          } catch {}
        } else {
          deleteDmDialogLocal(uid)
        }
      } else if (kind === 'message') {
        const msgId = String(info.msgId || '').trim()
        const uid = String(info.uid || '').trim()
        if (!msgId) return
        if (forAll && String(msgId).startsWith('tmp_dm_')) forAll = false
        if (forAll) {
          await deleteDmMessageServer(msgId, uid)
          deleteDmMessageLocal(msgId, uid)
          try {
            loadDmDialogs(null, { force: true, refresh: true, throttleMs: 0 })
          } catch {}
        } else {
          deleteDmMessageLocal(msgId, uid)
        }
      }
    } catch {
      try {
        toast?.err?.(t('forum_delete_failed'))
      } catch {}
    } finally {
      closeDmDeletePopover()
    }
  }, [
    dmDeletePopover,
    deleteDmDialogServer,
    deleteDmMessageServer,
    deleteDmDialogLocal,
    deleteDmMessageLocal,
    loadDmDialogs,
    dmWithUserId,
    closeDmDeletePopover,
    t,
    toast,
    setDmThreadItems,
    setDmWithUserId,
  ])

  return {
    dmDeletePopover,
    setDmDeletePopover,
    dmDeleteForAll,
    setDmDeleteForAll: setDmDeleteForAllTracked,
    toggleDmBlock,
    openDmDeletePopover,
    closeDmDeletePopover,
    confirmDmDelete,
  }
}
