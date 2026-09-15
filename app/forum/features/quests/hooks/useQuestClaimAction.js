import { useCallback } from 'react'

function normalizeTaskId(value) {
  const raw = String(value ?? '')
  const match = raw.match(/(\d+)$/)
  return match ? String(Number(match[1])) : raw
}

export default function useQuestClaimAction({
  auth,
  requireAuthStrict,
  openAuth,
  normalizeCardId,
  quests,
  vipActive,
  getCardTotalTasks,
  writeQuestProg,
  toast,
}) {
  return useCallback(async (claimFx) => {
    const clientCardId = String(claimFx?.cardId || '')
    if (!clientCardId) return false

    try {
      let uid = auth?.accountId || auth?.asherId || ''
      if (!uid) {
        const ok = await (typeof requireAuthStrict === 'function' ? requireAuthStrict() : openAuth?.())
        if (!ok) return false
        uid = auth?.accountId || auth?.asherId || ''
        if (!uid) return false
      }
      uid = String(uid).replace(/[^\x20-\x7E]/g, '')

      const claimingStore = typeof window !== 'undefined'
        ? (window.__claimingRef || (window.__claimingRef = new Set()))
        : null
      const claimKey = `${uid}::${clientCardId}`
      if (claimingStore?.has(claimKey)) return false
      claimingStore?.add(claimKey)

      try {
        const serverCardId = normalizeCardId(clientCardId)
        if (!serverCardId || serverCardId === '0') return false
        const questCard = quests?.find((q) => q.id === clientCardId)
        if (!questCard || !questCard.rewardKey) return false

        const postTask = async (taskNum) => {
          const r = await fetch('/api/quest/progress', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-forum-user': uid,
              'x-forum-vip': vipActive ? '1' : '0',
            },
            cache: 'no-store',
            body: JSON.stringify({
              cardId: serverCardId,
              taskId: taskNum,
              accountId: uid,
            }),
          })
          return r.ok
        }

        const progRes = await fetch('/api/quest/progress', {
          method: 'GET',
          headers: {
            'x-forum-user': uid,
            'x-forum-vip': vipActive ? '1' : '0',
          },
          cache: 'no-store',
        })
        let prog = {}
        try { prog = await progRes.json() } catch {}

        const serverCard = prog?.progress?.[serverCardId] || {}
        const serverDoneRaw = Array.isArray(serverCard.done) ? serverCard.done : []
        const serverDone = new Set(serverDoneRaw.map(normalizeTaskId))
        const totalTasks = getCardTotalTasks(clientCardId)
        const allIds = Array.from({ length: totalTasks }, (_, i) => String(i + 1))
        const missing = allIds.filter((id) => !serverDone.has(id))
        for (const id of missing) {
          try { await postTask(id) } catch {}
        }

        const res = await fetch('/api/quest/progress', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-forum-user': uid,
            'x-forum-vip': vipActive ? '1' : '0',
          },
          cache: 'no-store',
          body: JSON.stringify({
            cardId: serverCardId,
            claim: true,
            rewardKey: questCard.rewardKey,
            accountId: uid,
          }),
        })
        let json = null
        try { json = await res.json() } catch {}

        if ((res.ok && json?.ok) || res.status === 409 || json?.error === 'already_claimed') {
          const allNumIds = Array.from({ length: getCardTotalTasks(clientCardId) }, (_, i) => String(i + 1))
          writeQuestProg((prev) => {
            const card = { ...(prev[clientCardId] || {}) }
            card.claimed = true
            card.claimTs = Date.now()
            if (!Array.isArray(card.done) || card.done.length < allNumIds.length) {
              card.done = allNumIds.slice()
            } else {
              card.done = card.done.map(normalizeTaskId)
            }
            if (!card.claimReadyTs) card.claimReadyTs = Date.now()
            return { ...prev, [clientCardId]: card }
          })
          if (json?.awarded != null) {
            try { toast.show({ type: 'ok', text: `+${Number(json.awarded).toFixed(10)} QCoin` }) } catch {}
          }
          return true
        }

        const msg = json?.error || `http_${res?.status || 0}`
        try { toast.show({ type: 'warn', text: msg }) } catch {}
        console.warn('[claim] status=', res?.status, 'json=', json)
        return false
      } finally {
        claimingStore?.delete(claimKey)
      }
    } catch (error) {
      console.error('[claim] unexpected', error)
      try { toast.show({ type: 'warn', text: 'client_error' }) } catch {}
      return false
    }
  }, [
    auth?.accountId,
    auth?.asherId,
    getCardTotalTasks,
    normalizeCardId,
    openAuth,
    quests,
    requireAuthStrict,
    toast,
    vipActive,
    writeQuestProg,
  ])
}
